import { sql } from "drizzle-orm";
import {
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "processed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", ["doorstep", "branch"]);

export const checkouts = pgTable(
  "checkouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Human-facing reference shown to the customer (e.g. PH-4F2A9C).
    orderNumber: text("order_number").notNull().unique(),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    // Gateway reference; unique so a webhook retry cannot create a second checkout.
    paymentReference: text("payment_reference").notNull().unique(),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    orderStatus: orderStatusEnum("order_status")
      .notNull()
      .default("processed"),
    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    // Delivery address, or the pickup branch location when deliveryType is "branch".
    address: text("address").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "checkouts_email_format",
      sql`${t.customerEmail} ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`,
    ),
  ],
);

export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;
