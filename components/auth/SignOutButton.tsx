"use client";

import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { isProtectedPath, ROUTES } from "@/lib/routes";

/** Signs out and keeps the visitor browsing. Leaves account/admin pages for the home page. */
export default function SignOutButton() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await authClient.signOut();

    if (isProtectedPath(pathname)) router.push(ROUTES.home);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="text-light-gray hover:text-gold transition-colors cursor-pointer"
    >
      Sign out
    </button>
  );
}
