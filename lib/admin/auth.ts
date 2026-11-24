import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import type { BetterAuthSession, BetterAuthUser } from "@neondatabase/auth/types";
import { auth } from "@/lib/auth";
import { db } from "@/lib/drizzleconnect";

export class NotAdminError extends Error {
  constructor() {
    super("This action requires an admin account.");
    this.name = "NotAdminError";
  }
}

export interface AdminIdentity {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

export interface AdminAccess {
  admin: AdminIdentity;
  session: BetterAuthSession;
  user: BetterAuthUser;
}

export type AdminLookupResult =
  | { status: "anonymous" }
  | ({ status: "admin" } & AdminAccess)
  | { status: "forbidden"; user: AdminIdentity };

const parseAdminEmails = (): ReadonlySet<string> =>
  new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

const isAdminEmail = (email: string): boolean =>
  Boolean(email) && parseAdminEmails().has(email);

/**
 * Reads `user.role` with parameterised SQL, so the auth schema stays untouched
 * and a database without the column reports "no role" instead of throwing.
 */
const hasAdminRole = async (userId: string): Promise<boolean> => {
  try {
    // Identifiers are quoted by Drizzle and userId is bound as a parameter.
    const result = await db.execute<{ role: string | null }>(
      sql`select ${sql.identifier("role")} as role
            from ${sql.identifier("user")}
           where ${sql.identifier("id")} = ${userId}
           limit 1`,
    );

    return result.rows[0]?.role === "admin";
  } catch {
    return false;
  }
};

const toIdentity = (user: BetterAuthUser, email: string): AdminIdentity => ({
  id: user.id,
  email,
  name: user.name || email || "Admin",
  image: user.image || null,
});

/**
 * Resolves the current Neon Auth session and decides whether it may use the
 * admin area. Admins are granted by `ADMIN_EMAILS` (comma separated) or by
 * `user.role === 'admin'` in the database.
 */
export async function getAdminLookup(): Promise<AdminLookupResult> {
  const { data } = await auth.getSession();

  if (!data?.user?.id) return { status: "anonymous" };

  const { session, user } = data;
  const email = (user.email ?? "").trim().toLowerCase();
  const admin = toIdentity(user, email);

  if (isAdminEmail(email) || (await hasAdminRole(user.id))) {
    return { status: "admin", admin, session, user };
  }

  return { status: "forbidden", user: admin };
}

/**
 * Route-level guard: anonymous visitors are sent to sign-in, signed-in
 * non-admins get a 404 so the admin area stays undiscoverable.
 */
export async function requireAdminPage(): Promise<AdminAccess> {
  const lookup = await getAdminLookup();

  if (lookup.status === "anonymous") redirect("/sign-in");
  if (lookup.status === "forbidden") notFound();

  return lookup;
}

/**
 * Guard for server actions and other non-page server code. Throws instead of
 * redirecting so a crafted POST gains nothing and learns nothing.
 */
export async function requireAdmin(): Promise<AdminIdentity> {
  const lookup = await getAdminLookup();

  if (lookup.status !== "admin") throw new NotAdminError();

  return lookup.admin;
}
