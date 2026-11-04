import { and, eq } from "drizzle-orm";
import { orders } from "@/db/schema";
import { db } from "@/lib/db";

export function findPendingOrdersForUser(userId: string) {
  return db
    .select({
      id: orders.id,
      stripeCheckoutSessionId: orders.stripeCheckoutSessionId,
      expiresAt: orders.expiresAt,
    })
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, "pending")));
}

export function findOrderForUser(orderId: string, userId: string) {
  return db.query.orders.findFirst({
    columns: { id: true, status: true, stripeCheckoutSessionId: true },
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
  });
}

export function findOrderByCheckoutSession(checkoutSessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeCheckoutSessionId, checkoutSessionId),
  });
}

/** Scoped to the signed-in user, so one customer can't view another's order. */
export function findOrderSummaryForUser(checkoutSessionId: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.stripeCheckoutSessionId, checkoutSessionId), eq(orders.userId, userId)),
    with: { items: true },
  });
}
