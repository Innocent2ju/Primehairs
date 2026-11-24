"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import type { ProductAttribute } from "@/database";
import { useCart } from "@/context/cart-context";
import { type DeliveryType } from "@/lib/delivery-settings";

const ATTRIBUTE_LABELS: Record<ProductAttribute, string> = {
  hairType: "Hair Type",
  hairVolume: "Hair Volume",
  density: "Density",
  colors: "Color",
  hairLength: "Length",
  laceType: "Lace Type",
  closureSizes: "Closure Size",
};

interface ReceiptItem {
  name: string;
  quantity: number;
  unitPriceKobo: number;
  attributes?: Partial<Record<ProductAttribute, string>>;
}

interface Receipt {
  orderNumber: string;
  deliveryType: DeliveryType;
  address: string;
  itemsSubtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  items: ReceiptItem[];
}

interface VerifyResponse {
  status?: string;
  orderNumber?: string;
  deliveryType?: DeliveryType;
  address?: string;
  itemsSubtotalKobo?: number;
  deliveryFeeKobo?: number;
  totalKobo?: number;
  items?: ReceiptItem[];
  message?: string;
}

type VerificationState =
  | { status: "verifying" }
  | { status: "success"; receipt: Receipt }
  | { status: "failed"; message: string };

const formatKobo = (value: number): string =>
  `₦${(value / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatAttributes = (
  attributes?: Partial<Record<ProductAttribute, string>>,
): string =>
  Object.entries(attributes ?? {})
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(
      ([key, value]) =>
        `${ATTRIBUTE_LABELS[key as ProductAttribute] ?? key}: ${value}`,
    )
    .join(" • ");

export default function CheckoutCallbackPage() {
  const { clearCart } = useCart();
  const [state, setState] = useState<VerificationState>({
    status: "verifying",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const reference =
        params.get("reference") ?? params.get("trxref") ?? "";

      if (!reference) {
        setState({
          status: "failed",
          message: "This payment link is missing its reference.",
        });
        return;
      }

      setState({ status: "verifying" });

      try {
        const response = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const payload = (await response
          .json()
          .catch(() => null)) as VerifyResponse | null;

        if (cancelled) return;

        if (
          response.ok &&
          payload?.status === "success" &&
          payload.orderNumber &&
          payload.deliveryType &&
          typeof payload.address === "string" &&
          typeof payload.totalKobo === "number" &&
          Array.isArray(payload.items)
        ) {
          clearCart();
          setState({
            status: "success",
            receipt: {
              orderNumber: payload.orderNumber,
              deliveryType: payload.deliveryType,
              address: payload.address,
              itemsSubtotalKobo: payload.itemsSubtotalKobo ?? 0,
              deliveryFeeKobo: payload.deliveryFeeKobo ?? 0,
              totalKobo: payload.totalKobo,
              items: payload.items,
            },
          });
          return;
        }

        setState({
          status: "failed",
          message:
            payload?.message ??
            "We could not confirm this payment. Please contact support if you were charged.",
        });
      } catch {
        if (!cancelled) {
          setState({
            status: "failed",
            message:
              "We could not reach the server. Check your connection and try again.",
          });
        }
      }
    };

    void verify();

    return () => {
      cancelled = true;
    };
  }, [attempt, clearCart]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-gold/25 bg-[#1A1A1A]/95 p-8 shadow-2xl backdrop-blur-xl">
        {state.status === "verifying" ? (
          <div className="text-center">
            <Loader2
              className="mx-auto size-10 animate-spin text-gold"
              aria-hidden="true"
            />
            <h1 className="mt-5 font-playfair text-2xl font-bold">
              Confirming your payment
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Please keep this page open while we verify the transaction.
            </p>
          </div>
        ) : null}

        {state.status === "success" ? (
          <div>
            <div className="text-center">
              <CheckCircle2
                className="mx-auto size-10 text-green-500"
                aria-hidden="true"
              />
              <h1 className="mt-4 font-playfair text-2xl font-bold">
                Payment successful
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Your order has been placed. We&apos;ve sent the details to your
                email.
              </p>
              <p className="mt-4 inline-block rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-bold tracking-wider text-gold">
                {state.receipt.orderNumber}
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Receipt
              </h2>

              <ul className="mt-3 flex flex-col divide-y divide-white/10">
                {state.receipt.items.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="font-semibold text-white">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-semibold text-gold">
                        {formatKobo(item.unitPriceKobo * item.quantity)}
                      </span>
                    </div>
                    {formatAttributes(item.attributes) ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                        {formatAttributes(item.attributes)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-gray-500">
                      {item.quantity} × {formatKobo(item.unitPriceKobo)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Items Subtotal</dt>
                  <dd className="text-white">
                    {formatKobo(state.receipt.itemsSubtotalKobo)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Delivery Fee</dt>
                  <dd className="text-white">
                    {state.receipt.deliveryFeeKobo === 0
                      ? "Free"
                      : formatKobo(state.receipt.deliveryFeeKobo)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                  <dt className="font-semibold text-white">Total Paid</dt>
                  <dd className="font-bold text-gold">
                    {formatKobo(state.receipt.totalKobo)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {state.receipt.deliveryType === "branch"
                  ? "Branch Pickup"
                  : "Doorstep Delivery"}
              </p>
              <p className="mt-1 text-white">{state.receipt.address}</p>
            </div>

            <Link
              href="/products"
              className="mt-6 flex w-full items-center justify-center rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300"
            >
              Continue shopping
            </Link>
          </div>
        ) : null}

        {state.status === "failed" ? (
          <div className="text-center">
            <XCircle className="mx-auto size-10 text-red-500" aria-hidden="true" />
            <h1 className="mt-5 font-playfair text-2xl font-bold">
              Payment not confirmed
            </h1>
            <p className="mt-2 text-sm text-gray-400">{state.message}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300"
            >
              Check again
            </button>
            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              Back to shop
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
