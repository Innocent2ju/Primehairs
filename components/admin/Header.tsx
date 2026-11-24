"use client";

import { usePathname } from "next/navigation";

import type { AdminIdentity } from "@/lib/admin/auth";

const TITLES: ReadonlyArray<{ match: RegExp; title: string; subtitle: string }> = [
  {
    match: /^\/admin\/products\/new\/?$/,
    title: "Add Product",
    subtitle: "Create a new piece for the storefront",
  },
  {
    match: /^\/admin\/products\/[^/]+\/edit\/?$/,
    title: "Edit Product",
    subtitle: "Update pricing, images and available options",
  },
  {
    match: /^\/admin\/products\/?$/,
    title: "Products",
    subtitle: "Everything currently listed in the store",
  },
  {
    match: /^\/admin\/orders\/?$/,
    title: "Orders",
    subtitle: "Payments, deliveries and fulfilment",
  },
  {
    match: /^\/admin\/settings\/delivery\/?$/,
    title: "Delivery Settings",
    subtitle: "Fees and pickup branches used at checkout",
  },
  {
    match: /^\/admin\/?$/,
    title: "Overview",
    subtitle: "A quick read on how the store is doing",
  },
];

const titleFor = (pathname: string) =>
  TITLES.find((entry) => entry.match.test(pathname)) ?? {
    title: "Admin",
    subtitle: "Prime Hairs back office",
  };

export default function AdminHeader({ admin }: { admin: AdminIdentity }) {
  const pathname = usePathname() ?? "/admin";
  const { title, subtitle } = titleFor(pathname);
  const initials = (admin.name || admin.email || "A")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1A1A1A]/95 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="font-playfair text-xl font-bold text-white sm:text-2xl">
            {title}
          </h1>
          <p className="text-xs text-light-gray/60">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{admin.name}</p>
            <p className="text-[11px] text-light-gray/60">{admin.email}</p>
          </div>
          {admin.image ? (
            <img
              src={admin.image}
              alt={`${admin.name} account photo`}
              className="size-10 rounded-full border border-gold/40 object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold">
              {initials}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
