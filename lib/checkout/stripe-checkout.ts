import type Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";
import { buildLineItems } from "@/lib/checkout/build-line-items";
import { CHECKOUT_INTEGRATION_IDENTIFIER } from "@/lib/checkout/config";
import { evaluateSession } from "@/lib/checkout/evaluate-session";
import { ROUTES } from "@/lib/routes";
import { getStripe } from "@/lib/stripe";
import { findOrderByCheckoutSession, findPendingOrdersForUser } from "@/lib/orders/queries";
import type { ReservedOrder } from "@/lib/orders/reserve-order";
import { flagOrderForReview, markOrderPaid, releasePendingOrder } from "@/lib/orders/transitions";

export function createCheckoutSession(order: ReservedOrder, customerEmail: string) {
  const appUrl = getAppUrl();

  return getStripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: buildLineItems(order.lines, order.currency),
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      customer_email: customerEmail,
      expires_at: Math.floor(order.expiresAt.getTime() / 1000),
      integration_identifier: CHECKOUT_INTEGRATION_IDENTIFIER,
      success_url: `${appUrl}${ROUTES.checkoutSuccess}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${ROUTES.checkoutCancel}?order_id=${order.id}`,
    },
    { idempotencyKey: `checkout-order-${order.id}` }
  );
}

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const { payment_intent: paymentIntent } = session;
  if (!paymentIntent) return null;
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

/** Applies a session retrieved from Stripe to its order. Safe to call repeatedly. */
async function syncPaidSession(session: Stripe.Checkout.Session): Promise<void> {
  const order = await findOrderByCheckoutSession(session.id);
  if (!order || order.status !== "pending") return;

  const verdict = evaluateSession(session, {
    orderId: order.id,
    totalCents: order.totalCents,
    currency: order.currency,
  });

  if (verdict === "paid") {
    await markOrderPaid(order.id, getPaymentIntentId(session));
  } else if (verdict === "needs_review") {
    console.error(`Checkout session ${session.id} does not match order ${order.id}`);
    await flagOrderForReview(order.id);
  }
}

/**
 * Confirms payment by asking Stripe for the session. The browser reaching the
 * success page proves nothing on its own; only Stripe's payment_status does.
 */
export async function confirmCheckoutSession(checkoutSessionId: string): Promise<void> {
  const session = await getStripe().checkout.sessions.retrieve(checkoutSessionId);
  await syncPaidSession(session);
}

interface OpenCheckout {
  id: string;
  stripeCheckoutSessionId: string | null;
  expiresAt: Date;
}

/**
 * Ends a checkout the customer left, and returns the slugs whose stock was released.
 * If Stripe reports the session as paid, the order is confirmed instead.
 */
export async function cancelOpenCheckout(order: OpenCheckout): Promise<string[]> {
  if (!order.stripeCheckoutSessionId) {
    const reason = order.expiresAt <= new Date() ? "expired" : "cancelled";
    return releasePendingOrder(order.id, reason);
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);

  if (session.status === "complete") {
    await syncPaidSession(session);
    return [];
  }
  if (session.status === "expired") {
    return releasePendingOrder(order.id, "expired");
  }

  // Throws if the customer paid in the meantime, which leaves the order pending.
  await stripe.checkout.sessions.expire(session.id);
  return releasePendingOrder(order.id, "cancelled");
}

/**
 * Ends the customer's previous checkouts before a new one reserves stock.
 * Orders still waiting for their Stripe session are skipped, because another
 * request may be creating that session right now.
 */
export async function cancelOpenCheckoutsForUser(userId: string): Promise<string[]> {
  const now = new Date();
  const openCheckouts = (await findPendingOrdersForUser(userId)).filter(
    (order) => order.stripeCheckoutSessionId !== null || order.expiresAt <= now
  );

  const results = await Promise.allSettled(openCheckouts.map(cancelOpenCheckout));

  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    console.error(`Could not cancel checkout for order ${openCheckouts[index].id}`, result.reason);
    return [];
  });
}
