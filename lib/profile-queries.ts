import { desc, sql } from "drizzle-orm";

import { checkouts } from "@/database";
import { db } from "@/lib/drizzleconnect";

// Only customer-facing fields are selected: no gateway reference, no internal
// notes, and never another customer's rows.
export interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: Date;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "processed" | "shipped" | "delivered" | "cancelled";
  deliveryType: "doorstep" | "branch";
  address: string;
}

/**
 * Orders for one customer, matched by email (checkouts are created with the
 * email the customer typed at payment). Newest first.
 */
export async function getCustomerOrders(
  email: string,
): Promise<CustomerOrder[]> {
  const normalized = email.trim().toLowerCase();

  if (!normalized) return [];

  const rows = await db
    .select({
      id: checkouts.id,
      orderNumber: checkouts.orderNumber,
      createdAt: checkouts.createdAt,
      paymentStatus: checkouts.paymentStatus,
      orderStatus: checkouts.orderStatus,
      deliveryType: checkouts.deliveryType,
      address: checkouts.address,
    })
    .from(checkouts)
    .where(sql`lower(${checkouts.customerEmail}) = ${normalized}`)
    .orderBy(desc(checkouts.createdAt));

  return rows;
}
