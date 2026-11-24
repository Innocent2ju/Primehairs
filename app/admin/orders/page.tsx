import { MapPin, Store, Truck } from "lucide-react";

import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import {
  isAdminOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin/order-status";
import { listAdminCheckouts } from "@/lib/admin/queries";
import { formatNaira } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

export default async function AdminOrdersPage() {
  const rows = await listAdminCheckouts();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
        <Store className="size-10 text-gold" />
        <h2 className="mt-4 font-playfair text-xl font-bold text-white">
          No orders yet
        </h2>
        <p className="mt-1 text-sm text-light-gray/60">
          Paid checkouts from the storefront will land here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map(({ checkout, lineCount, lineTotalNgn }) => {
        const status = isAdminOrderStatus(checkout.orderStatus)
          ? checkout.orderStatus
          : "processed";

        return (
          <article
            key={checkout.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A]/80"
          >
            <header className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-gold">
                    {checkout.orderNumber}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      checkout.deliveryType === "doorstep"
                        ? "border-sky-400/30 text-sky-300"
                        : "border-purple-400/30 text-purple-300",
                    )}
                  >
                    {checkout.deliveryType === "doorstep" ? (
                      <Truck className="mr-1 inline size-3" aria-hidden="true" />
                    ) : (
                      <MapPin className="mr-1 inline size-3" aria-hidden="true" />
                    )}
                    {checkout.deliveryType}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-light-gray/40">
                    {checkout.paymentStatus}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">
                  {checkout.customerName}
                </p>
                <p className="text-[11px] text-light-gray/60">
                  {checkout.customerEmail}
                </p>
                <p className="text-[11px] text-light-gray/60">
                  {checkout.deliveryType === "branch" ? "Pickup: " : "Address: "}
                  {checkout.address}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                <OrderStatusSelect checkoutId={checkout.id} status={status} />
                <p className="text-lg font-bold text-gold">
                  {formatNaira(lineTotalNgn)}
                </p>
                <p className="text-[11px] text-light-gray/50">
                  {lineCount} item{lineCount === 1 ? "" : "s"}
                </p>
                <p className="text-[11px] text-light-gray/50">
                  Ref:{" "}
                  <span className="font-mono">{checkout.paymentReference}</span>
                </p>
                <p className="text-[11px] text-light-gray/50">
                  {formatDate(checkout.createdAt)}
                </p>
              </div>
            </header>
          </article>
        );
      })}
    </div>
  );
}
