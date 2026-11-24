import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

// The callback page is a Client Component, so its metadata lives here. Nothing
// order-, payment- or customer-specific is exposed in the share tags.
export const metadata: Metadata = buildPageMetadata({
  title: "Order Confirmation",
  description:
    "Confirming your PrimeHairs payment securely. Your order details are verified before anything is shown.",
  path: "/checkout/callback",
});

export default function CheckoutCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
