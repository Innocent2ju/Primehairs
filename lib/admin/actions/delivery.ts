"use server";

import { revalidatePath } from "next/cache";

import { deliverySettings } from "@/database";
import { NotAdminError, requireAdmin } from "@/lib/admin/auth";
import { parseNaira } from "@/lib/admin/types";
import { db } from "@/lib/drizzleconnect";

const SETTINGS_ID = "default";
const MAX_LOCATIONS = 20;
const MAX_LOCATION_LENGTH = 80;

export interface DeliverySettingsInput {
  doorstepFeeNgn: string;
  branchPickupFeeNgn: string;
  branchLocations: string[];
}

export type DeliverySettingsActionState =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const cleanLocations = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const locations: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") continue;

    const location = entry.trim().slice(0, MAX_LOCATION_LENGTH);

    if (!location) continue;

    const key = location.toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    locations.push(location);

    if (locations.length >= MAX_LOCATIONS) break;
  }

  return locations;
};

export async function updateDeliverySettings(
  input: DeliverySettingsInput,
): Promise<DeliverySettingsActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotAdminError) {
      return { status: "error", message: "You are not authorized." };
    }
    throw error;
  }

  const doorstepFee = parseNaira(String(input.doorstepFeeNgn ?? ""));
  const branchFee = parseNaira(String(input.branchPickupFeeNgn ?? ""));
  const locations = cleanLocations(input.branchLocations);

  if (doorstepFee === null) {
    return {
      status: "error",
      message: "Enter a valid doorstep delivery fee (e.g. 2000.00).",
    };
  }

  if (branchFee === null) {
    return {
      status: "error",
      message: "Enter a valid branch pickup fee (use 0 for free pickup).",
    };
  }

  if (locations.length === 0) {
    return {
      status: "error",
      message: "Add at least one pickup branch.",
    };
  }

  try {
    await db
      .insert(deliverySettings)
      .values({
        id: SETTINGS_ID,
        doorstepFeeNgn: doorstepFee.toFixed(2),
        branchPickupFeeNgn: branchFee.toFixed(2),
        branchLocations: locations,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: deliverySettings.id,
        set: {
          doorstepFeeNgn: doorstepFee.toFixed(2),
          branchPickupFeeNgn: branchFee.toFixed(2),
          branchLocations: locations,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("updateDeliverySettings failed:", error);
    return {
      status: "error",
      message: "Could not save delivery settings. Please try again.",
    };
  }

  revalidatePath("/admin/settings/delivery");
  revalidatePath("/checkout");
  revalidatePath("/");

  return { status: "success", message: "Delivery settings saved." };
}
