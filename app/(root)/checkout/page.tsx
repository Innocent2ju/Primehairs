import { Suspense } from "react";
import type { Metadata } from "next";

import { getDeliverySettings } from "@/lib/delivery-config";
import { buildPageMetadata } from "@/lib/seo";
import CheckoutForm from "./checkout-form";

export const metadata: Metadata = buildPageMetadata({
  title: "Checkout",
  description:
    "Complete your PrimeHairs order with secure online payment and nationwide delivery options.",
  path: "/checkout",
});

const CheckoutLoader = async () => {
  const settings = await getDeliverySettings();
  return <CheckoutForm settings={settings} />;
};

const CheckoutFallback = () => (
  <div className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-white">
    <p role="status" className="animate-pulse text-sm uppercase tracking-[0.3em] text-gold">
      Loading checkout…
    </p>
  </div>
);

export default function CheckoutPage() {
  // Delivery fees and branches are admin-managed, so the form renders from the
  // current database row on each request.
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutLoader />
    </Suspense>
  );
}
