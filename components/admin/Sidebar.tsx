"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS: ReadonlyArray<{
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/settings/delivery", label: "Delivery", icon: Truck },
  { href: "/", label: "View Storefront", icon: Store, exact: true },
];

export default function AdminSidebar() {
  const pathname = usePathname() ?? "/admin";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#1A1A1A] md:h-screen md:w-64 md:border-b-0 md:border-r md:sticky md:top-0">
      <div className="px-6 py-6">
        <Link href="/admin" className="font-playfair text-xl font-bold italic text-gold">
          Prime Hairs
        </Link>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-light-gray/50">
          Admin
        </p>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-auto shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full",
                active
                  ? "bg-gold text-black"
                  : "text-light-gray hover:bg-white/5 hover:text-gold",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden px-6 py-6 text-[11px] leading-relaxed text-light-gray/40 md:block">
        Manage the catalogue, fulfil orders and keep an eye on revenue.
      </div>
    </aside>
  );
}
