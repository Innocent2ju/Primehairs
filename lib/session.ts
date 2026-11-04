import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

/** Reads and validates the session against the database. Returns null when signed out. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Use in customer pages, Server Actions and Route Handlers that need a signed-in user. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect(ROUTES.signIn);

  return session.user;
}

/** Use in every admin page, Server Action and Route Handler. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== USER_ROLES.admin) redirect(ROUTES.home);

  return user;
}
