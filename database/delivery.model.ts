import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Single-row delivery configuration (id is always "default"). Admins edit this
 * from /admin/settings/delivery; checkout and Paystack read from it.
 */
export const deliverySettings = pgTable("delivery_settings", {
  id: text("id").primaryKey().default("default"),
  // Fee added to the cart total for a street-address delivery.
  doorstepFeeNgn: numeric("doorstep_fee_ngn", { precision: 12, scale: 2 })
    .notNull()
    .default("2000.00"),
  // Fee for collecting at a branch; usually 0.
  branchPickupFeeNgn: numeric("branch_pickup_fee_ngn", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  // Pickup branches customers can choose from.
  branchLocations: text("branch_locations")
    .array()
    .notNull()
    .default(["Lagos Branch", "Enugu Branch", "Abuja Branch"]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DeliverySettingsRow = typeof deliverySettings.$inferSelect;
export type NewDeliverySettings = typeof deliverySettings.$inferInsert;
