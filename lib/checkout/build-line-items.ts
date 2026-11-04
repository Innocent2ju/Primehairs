import type Stripe from "stripe";
import type { PricedLine } from "./price-cart";

type OrderLine = Pick<PricedLine, "productName" | "unitPriceCents" | "quantity">;

/** Builds Stripe line items from the order snapshot, so Stripe charges exactly what we stored. */
export function buildLineItems(
  lines: OrderLine[],
  currency: string
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency,
      unit_amount: line.unitPriceCents,
      product_data: { name: line.productName },
    },
  }));
}
