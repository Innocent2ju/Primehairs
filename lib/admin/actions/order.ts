"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { checkouts } from "@/database";
import { NotAdminError, requireAdmin } from "@/lib/admin/auth";
import {
  isAdminOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin/order-status";
import { db } from "@/lib/drizzleconnect";

export type OrderStatusResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateOrderStatus(
  checkoutId: string,
  status: AdminOrderStatus,
): Promise<OrderStatusResult> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotAdminError) {
      return { status: "error", message: "You are not authorized." };
    }
    throw error;
  }

  if (!UUID_PATTERN.test(checkoutId)) {
    return {
      status: "error",
      message: "This order could not be found. Refresh the page and try again.",
    };
  }

  if (!isAdminOrderStatus(status)) {
    return { status: "error", message: "Choose a valid order status." };
  }

  try {
    const [updated] = await db
      .update(checkouts)
      .set({ orderStatus: status })
      .where(eq(checkouts.id, checkoutId))
      .returning({ id: checkouts.id });

    if (!updated) {
      return {
        status: "error",
        message: "This order no longer exists. Refresh the page.",
      };
    }
  } catch (error) {
    console.error("updateOrderStatus failed:", error);
    return {
      status: "error",
      message: "The order could not be updated. Please try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  return { status: "success", message: `Order marked as ${status}.` };
}
