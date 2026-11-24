import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Package,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { getAdminMetrics } from "@/lib/admin/queries";
import { formatNaira } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const isPaidCheckout = (status: string) => status === "paid";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

const MetricCard = ({ label, value, hint, icon: Icon }: MetricCardProps) => (
  <div className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-light-gray/60">
        {label}
      </span>
      <span className="flex size-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
        <Icon className="size-4" aria-hidden="true" />
      </span>
    </div>
    <p className="mt-4 font-playfair text-2xl font-bold text-white sm:text-3xl">
      {value}
    </p>
    <p className="mt-1 text-xs text-light-gray/50">{hint}</p>
  </div>
);

const STATUS_TONE: Record<string, string> = {
  processed: "text-amber-300 border-amber-400/30",
  shipped: "text-sky-300 border-sky-400/30",
  delivered: "text-green-300 border-green-400/30",
  cancelled: "text-red-300 border-red-400/30",
};

export default async function AdminOverviewPage() {
  const metrics = await getAdminMetrics();
  const paidOrders = metrics.totalOrders;
  const averageOrder =
    paidOrders > 0 ? metrics.revenueNgn / paidOrders : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatNaira(metrics.revenueNgn)}
          hint={`${formatNaira(averageOrder)} average paid order`}
          icon={Banknote}
        />
        <MetricCard
          label="Total Orders"
          value={metrics.totalOrders.toLocaleString("en-NG")}
          hint="Paid checkouts"
          icon={Store}
        />
        <MetricCard
          label="Deliveries"
          value={metrics.doorstepOrders.toLocaleString("en-NG")}
          hint={`${metrics.branchOrders.toLocaleString("en-NG")} branch pickups`}
          icon={Truck}
        />
        <MetricCard
          label="Total Products"
          value={metrics.totalProducts.toLocaleString("en-NG")}
          hint="Listed in the catalogue"
          icon={Package}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-playfair text-lg font-bold text-white">
              Recent Orders
            </h2>
            <p className="text-xs text-light-gray/60">
              The latest checkouts, newest first.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gold transition-colors hover:text-amber-300"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </header>

        {metrics.recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-light-gray/60">
            No orders yet. They will appear here as soon as the first payment
            clears.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-light-gray/50">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Delivery</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id} className="text-light-gray">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gold">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-light-gray/50">
                        {order.customerEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="block capitalize">
                        {order.deliveryType}
                      </span>
                      <span className="block max-w-[180px] truncate text-light-gray/50">
                        {order.address}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          STATUS_TONE[order.orderStatus] ??
                            "border-white/20 text-light-gray",
                        )}
                      >
                        {order.orderStatus}
                      </span>
                      {!isPaidCheckout(order.paymentStatus) ? (
                        <span className="ml-2 text-[10px] uppercase text-light-gray/40">
                          {order.paymentStatus}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-light-gray/60">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/admin/products/new"
          className="group flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 transition-colors hover:bg-gold/10"
        >
          <span>
            <span className="block text-sm font-semibold text-white">
              Add a product
            </span>
            <span className="block text-xs text-light-gray/60">
              Upload images and set pricing rules.
            </span>
          </span>
          <ArrowRight
            className="size-4 text-gold transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/admin/orders"
          className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#1A1A1A]/80 px-5 py-4 transition-colors hover:border-gold/40"
        >
          <span>
            <span className="block text-sm font-semibold text-white">
              Fulfil orders
            </span>
            <span className="block text-xs text-light-gray/60">
              Update delivery status for paid checkouts.
            </span>
          </span>
          <ArrowRight className="size-4 text-light-gray transition-transform group-hover:translate-x-1 group-hover:text-gold" />
        </Link>
      </div>
    </div>
  );
}
