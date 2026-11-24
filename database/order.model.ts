import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./product.model";

// Snapshot of what the customer picked, frozen at order time so later product
// edits cannot rewrite the history of an existing order.
export type OrderProductDetails = {
  hairType: string;
  texture: string;
  density: string;
  color: string;
  length: string;
  price: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Cascade delete: an order has no meaning without its product.
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    productDetails: jsonb("product_details")
      .$type<OrderProductDetails>()
      .notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_product_id_idx").on(t.productId),
    // Cheap structural guard; deliverability is still the app's job.
    check(
      "orders_email_format",
      sql`${t.email} ~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`,
    ),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
