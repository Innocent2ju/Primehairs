"use server";

import { CHECKOUT_SESSION_TTL_MS } from "@/lib/checkout/config";
import { parseCartInput } from "@/lib/checkout/parse-cart-input";
import type { StockShortage } from "@/lib/checkout/price-cart";
import {
  cancelOpenCheckoutsForUser,
  createCheckoutSession,
} from "@/lib/checkout/stripe-checkout";
import { revalidateStorefrontStock } from "@/lib/data/revalidate-stock";
import { withTransaction } from "@/lib/db-transaction";
import { reserveOrder } from "@/lib/orders/reserve-order";
import { attachCheckoutSession, releasePendingOrder } from "@/lib/orders/transitions";
import { getSession } from "@/lib/session";

export type StartCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; reason: "unauthenticated" | "invalid_cart" | "checkout_unavailable" }
  | { ok: false; reason: "out_of_stock"; shortages: StockShortage[] };

/**
 * Starts Stripe Checkout for the signed-in customer. The browser sends only
 * product IDs and quantities; prices, totals and stock are read from Postgres.
 */
export async function startCheckout(cartInput: unknown): Promise<StartCheckoutResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "unauthenticated" };

  const cart = parseCartInput(cartInput);
  if (!cart) return { ok: false, reason: "invalid_cart" };

  revalidateStorefrontStock(await cancelOpenCheckoutsForUser(session.user.id));

  const expiresAt = new Date(Date.now() + CHECKOUT_SESSION_TTL_MS);
  const reservation = await withTransaction((tx) =>
    reserveOrder(tx, { userId: session.user.id, cart, expiresAt })
  );
  if (!reservation.ok) {
    return { ok: false, reason: "out_of_stock", shortages: reservation.shortages };
  }

  const { order } = reservation;
  revalidateStorefrontStock(order.lines.map((line) => line.slug));

  try {
    const checkoutSession = await createCheckoutSession(order, session.user.email);
    const attached = await attachCheckoutSession(order.id, checkoutSession.id);
    if (!attached || !checkoutSession.url) {
      throw new Error(`Checkout session ${checkoutSession.id} could not be used for order ${order.id}`);
    }

    return { ok: true, url: checkoutSession.url };
  } catch (error) {
    console.error(`Starting checkout failed for order ${order.id}`, error);
    revalidateStorefrontStock(await releasePendingOrder(order.id, "cancelled"));
    return { ok: false, reason: "checkout_unavailable" };
  }
}
