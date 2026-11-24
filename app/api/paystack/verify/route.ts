import { NextResponse } from "next/server";

import {
  finalizeTransaction,
  isReference,
  PaymentVerificationError,
  PaystackError,
  verifyTransaction,
} from "@/lib/paystack";

const fail = (message: string, status: number) =>
  NextResponse.json({ status: "failed", message }, { status });

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const reference =
    body && typeof body === "object" && typeof (body as { reference?: unknown }).reference === "string"
      ? (body as { reference: string }).reference.trim()
      : "";

  if (!reference || !isReference(reference)) {
    return fail("A valid payment reference is required.", 400);
  }

  try {
    const transaction = await verifyTransaction(reference);

    if (transaction.reference !== reference) {
      return fail("Payment reference mismatch.", 400);
    }

    if (transaction.status !== "success") {
      return NextResponse.json(
        {
          status: transaction.status || "failed",
          message: "Payment has not been completed yet.",
        },
        { status: 402 },
      );
    }

    const { checkout, metadata, alreadyProcessed } =
      await finalizeTransaction(transaction);

    return NextResponse.json({
      status: "success",
      orderNumber: checkout.orderNumber,
      alreadyProcessed,
      deliveryType: checkout.deliveryType,
      address: checkout.address,
      itemsSubtotalKobo: metadata.itemsSubtotalKobo,
      deliveryFeeKobo: metadata.deliveryFeeKobo,
      totalKobo: transaction.amount,
      items: metadata.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPriceKobo: item.unitPriceKobo,
        attributes: item.attributes,
      })),
    });
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      return fail(error.message, 400);
    }

    if (error instanceof PaystackError) {
      return fail(error.message, error.status);
    }

    console.error("Paystack verify error:", error);

    return fail("Could not verify the payment. Please try again.", 500);
  }
}
