import { Suspense } from "react";
import type { Metadata } from "next";
import AccountDetails, { AccountDetailsSkeleton } from "@/components/account/AccountDetails";

export const metadata: Metadata = { title: "My account | Prime Hairs" };

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountDetailsSkeleton />}>
      <AccountDetails />
    </Suspense>
  );
}
