import { and, eq, sql } from "drizzle-orm";
import { orderItems, orders, products, stocks, type OrderStatus } from "@/db/schema";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db-transaction";

export type ReleaseReason = Extract<OrderStatus, "cancelled" | "expired" | "payment_failed">;

type PendingOrderUpdate = Partial<Omit<typeof orders.$inferInsert, "id" | "userId">>;

/** Every transition starts from "pending", so repeated or late calls change nothing. */
async function updatePendingOrder(orderId: string, values: PendingOrderUpdate): Promise<boolean> {
  const updated = await db
    .update(orders)
    .set(values)
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
    .returning({ id: orders.id });

  return updated.length > 0;
}

export function attachCheckoutSession(orderId: string, checkoutSessionId: string) {
  return updatePendingOrder(orderId, { stripeCheckoutSessionId: checkoutSessionId });
}

export function markOrderPaid(orderId: string, paymentIntentId: string | null) {
  return updatePendingOrder(orderId, {
    status: "paid",
    paidAt: new Date(),
    stripePaymentIntentId: paymentIntentId,
  });
}

export function flagOrderForReview(orderId: string) {
  return updatePendingOrder(orderId, { status: "needs_review" });
}

/**
 * Ends a pending order and returns its reserved stock. Returns the slugs of the
 * restocked products, or an empty list when the order was no longer pending.
 */
export function releasePendingOrder(orderId: string, reason: ReleaseReason): Promise<string[]> {
  return withTransaction(async (tx) => {
    const released = await tx
      .update(orders)
      .set({ status: reason })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning({ id: orders.id });

    if (released.length === 0) return [];

    const items = await tx
      .select({ productId: orderItems.productId, quantity: orderItems.quantity, slug: products.slug })
      .from(orderItems)
      .innerJoin(products, eq(products.id, orderItems.productId))
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await tx
        .update(stocks)
        .set({ quantity: sql`${stocks.quantity} + ${item.quantity}`, updatedAt: new Date() })
        .where(eq(stocks.productId, item.productId));
    }

    return items.map((item) => item.slug);
  });
}
