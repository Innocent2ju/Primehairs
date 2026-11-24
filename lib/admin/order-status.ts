/**
 * Shared order-status vocabulary. This module has no `"use client"` directive
 * so both Server Components and Client Components can import the real values
 * instead of client-reference proxies.
 */
export const ADMIN_ORDER_STATUSES = [
  "processed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export const ORDER_STATUS_OPTIONS: ReadonlyArray<{
  value: AdminOrderStatus;
  label: string;
}> = [
  { value: "processed", label: "Processed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const isAdminOrderStatus = (
  value: unknown,
): value is AdminOrderStatus =>
  typeof value === "string" &&
  (ADMIN_ORDER_STATUSES as readonly string[]).includes(value);
