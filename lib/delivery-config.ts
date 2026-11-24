import "server-only";

import { eq } from "drizzle-orm";

import { deliverySettings } from "@/database";
import {
  DEFAULT_DELIVERY_SETTINGS,
  type DeliverySettings,
} from "@/lib/delivery-settings";
import { db } from "@/lib/drizzleconnect";

const SETTINGS_ID = "default";

const toNumber = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/**
 * Reads the admin-managed delivery configuration. Falls back to sensible
 * defaults until the singleton row exists or the table has not been migrated.
 */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const [row] = await db
      .select()
      .from(deliverySettings)
      .where(eq(deliverySettings.id, SETTINGS_ID))
      .limit(1);

    if (!row) return DEFAULT_DELIVERY_SETTINGS;

    return {
      doorstepFeeNgn: toNumber(
        row.doorstepFeeNgn,
        DEFAULT_DELIVERY_SETTINGS.doorstepFeeNgn,
      ),
      branchPickupFeeNgn: toNumber(
        row.branchPickupFeeNgn,
        DEFAULT_DELIVERY_SETTINGS.branchPickupFeeNgn,
      ),
      branchLocations:
        row.branchLocations.length > 0
          ? row.branchLocations
          : DEFAULT_DELIVERY_SETTINGS.branchLocations,
      updatedAt: row.updatedAt.toISOString(),
    };
  } catch {
    return DEFAULT_DELIVERY_SETTINGS;
  }
}
