import { createHmac, timingSafeEqual } from "node:crypto";

import {
  finalizeTransaction,
  PaystackError,
  PaymentVerificationError,
  verifyTransaction,
} from "@/lib/paystack";

const isValidSignature = (signature: string, expected: string): boolean => {
  const provided = Buffer.from(signature, "utf8");
  const target = Buffer.from(expected, "utf8");

  return (
    provided.length === target.length && timingSafeEqual(provided, target)
  );
};

export async function POST(request: Request): Promise<Response> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    console.error("Paystack webhook received without PAYSTACK_SECRET_KEY.");
    return new Response("Paystack is not configured.", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  if (!signature || !isValidSignature(signature, expected)) {
    return new Response("Invalid signature.", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload.", { status: 400 });
  }

  if (event.event !== "charge.success") {
    return Response.json({ received: true });
  }

  const reference = event.data?.reference;

  if (!reference) {
    return new Response("Missing payment reference.", { status: 400 });
  }

  try {
    // Re-verify with Paystack instead of trusting the webhook body: only the
    // API response carries the metadata and amount we stored at initialize.
    const transaction = await verifyTransaction(reference);

    if (transaction.status === "success") {
      await finalizeTransaction(transaction);
    }
  } catch (error) {
    if (error instanceof PaymentVerificationError) {
      console.error("Paystack webhook rejected payment:", error.message);
      return Response.json({ received: true });
    }

    console.error("Paystack webhook error:", error);

    // Transient failures (network, database) should trigger a Paystack retry.
    return new Response("Webhook processing failed.", {
      status: error instanceof PaystackError ? 502 : 500,
    });
  }

  return Response.json({ received: true });
}
