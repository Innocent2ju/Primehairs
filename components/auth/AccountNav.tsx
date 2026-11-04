import Link from "next/link";
import { getSession } from "@/lib/session";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

const linkClass = "text-light-gray hover:text-gold transition-colors";

/** Reads the session, so it must be rendered inside a <Suspense> boundary. */
export default async function AccountNav() {
  const session = await getSession();

  if (!session) {
    return (
      <Link href={ROUTES.signIn} className={linkClass}>
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {session.user.role === USER_ROLES.admin && (
        <Link href={ROUTES.admin} className={linkClass}>
          Admin
        </Link>
      )}
      <Link href={ROUTES.account} className={linkClass}>
        Account
      </Link>
    </div>
  );
}
