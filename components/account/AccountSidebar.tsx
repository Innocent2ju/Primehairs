"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS = [{ href: ROUTES.account, label: "Account details", icon: UserRound }] as const;

const linkBaseClass =
  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors";

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#161616] p-2 md:w-60 md:shrink-0 md:flex-col md:items-stretch"
    >
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`${linkBaseClass} ${
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-light-gray hover:bg-white/5 hover:text-gold"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-3 py-2 text-sm md:border-t md:border-white/10 md:pt-3">
        <SignOutButton />
      </div>
    </nav>
  );
}
