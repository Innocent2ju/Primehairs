import type Stripe from "stripe";

export type SessionVerdict = "paid" | "needs_review" | "awaiting_payment";

/** What our database says the customer must pay. */
export interface ExpectedPayment {
  orderId: string;
  totalCents: number;
  currency: string;
}

type SessionPaymentFields = Pick<
  Stripe.Checkout.Session,
  "payment_status" | "amount_total" | "currency" | "client_reference_id"
>;

/**
 * Decides whether a Checkout Session retrieved from Stripe pays for our order.
 * A session that reports "paid" but doesn't match the order's amount, currency
 * or ID is flagged for review instead of being trusted.
 */
export function evaluateSession(
  session: SessionPaymentFields,
  expected: ExpectedPayment
): SessionVerdict {
  if (session.payment_status !== "paid") return "awaiting_payment";

  const matchesOrder =
    session.client_reference_id === expected.orderId &&
    session.amount_total === expected.totalCents &&
    session.currency === expected.currency;

  return matchesOrder ? "paid" : "needs_review";
}
