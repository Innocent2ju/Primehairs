import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MapPin, Package, Truck } from "lucide-react";

import { auth } from "@/lib/auth";
import {
  getCustomerOrders,
  type CustomerOrder,
} from "@/lib/profile-queries";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  title: "My Profile",
  description:
    "View your PrimeHairs account details and track your hair orders — wigs, bundles and extensions.",
  path: "/my-profile",
});

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const paymentBadge: Record<CustomerOrder["paymentStatus"], string> = {
  paid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
};

const orderBadge: Record<CustomerOrder["orderStatus"], string> = {
  processed: "border-gold/30 bg-gold/10 text-gold",
  shipped: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  delivered: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default async function MyProfilePage() {
  const { data } = await auth.getSession();
  const user = data?.user;

  if (!user?.id) redirect("/sign-in");

  const email = user.email ?? "";
  const name = user.name?.trim() || email || "Customer";
  const orders = await getCustomerOrders(email);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="rounded-2xl border border-gold/20 bg-[#1A1A1A]/80 p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-gold">
          My Profile
        </p>
        <h1 className="mt-3 text-3xl">{name}</h1>
        <p className="mt-2 text-sm text-light-gray/70">{email}</p>
      </header>

      <section className="mt-10" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-xl">
          Your orders
        </h2>

        {orders.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
            <Package className="size-10 text-gold" aria-hidden="true" />
            <p className="mt-4 text-sm text-light-gray/70">
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-sm font-bold text-gold">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-light-gray/60">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        orderBadge[order.orderStatus],
                      )}
                    >
                      {order.orderStatus}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        paymentBadge[order.paymentStatus],
                      )}
                    >
                      payment: {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 text-sm text-light-gray/70">
                  {order.deliveryType === "doorstep" ? (
                    <Truck
                      className="mt-0.5 size-4 shrink-0 text-gold"
                      aria-hidden="true"
                    />
                  ) : (
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-gold"
                      aria-hidden="true"
                    />
                  )}
                  <span>
                    <span className="text-light-gray/50">
                      {order.deliveryType === "branch"
                        ? "Pickup branch: "
                        : "Delivery to: "}
                    </span>
                    <span className="text-light-gray">{order.address}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
