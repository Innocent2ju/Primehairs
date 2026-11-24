/**
 * Delivery shapes and pure helpers. Deliberately free of database imports so
 * client components can use it; the persisted values come from
 * `lib/delivery-config.ts` on the server.
 */
export type DeliveryType = "doorstep" | "branch";

export interface DeliverySettings {
  doorstepFeeNgn: number;
  branchPickupFeeNgn: number;
  branchLocations: string[];
  updatedAt: string | null;
}

export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  doorstepFeeNgn: 2000,
  branchPickupFeeNgn: 0,
  branchLocations: ["Lagos Branch", "Enugu Branch", "Abuja Branch"],
  updatedAt: null,
};

export const deliveryFeeFor = (
  settings: Pick<DeliverySettings, "doorstepFeeNgn" | "branchPickupFeeNgn">,
  deliveryType: DeliveryType,
): number =>
  deliveryType === "doorstep"
    ? settings.doorstepFeeNgn
    : settings.branchPickupFeeNgn;
