# Better Auth Plan for Primehairs (v1)

This file is the plan only. No code has been changed yet.

**Scope:** sign up, sign in, sign out, persistent sessions, protected customer routes, and an admin role for protected admin routes.

**Out of scope:** social login, password reset, two-factor authentication, and other account features.

---

## What exists today

| Item | State |
|---|---|
| `lib/auth.ts` | `betterAuth` with the Drizzle `pg` adapter and email/password turned on |
| `app/api/auth/[...all]/route.ts` | Route handler in place, wrapped in PostHog logging. It stays as is. |
| `.env.local` | Has `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and `DATABASE_URL` |
| `db/schema.ts` | **No** `user`, `session`, `account` or `verification` tables, so sign-up fails today |
| `nextCookies()` plugin | **Missing.** Auth calls made from Server Actions can't set cookies without it. |
| `next.config.ts` | `cacheComponents: true`. Session reads have to sit inside `<Suspense>`. |
| Next.js 16 | Middleware is now called `proxy.ts` |
| Versions | better-auth 1.7.14, next 16.4.2 |

---

## 1. Database changes

1. Generate the Better Auth tables into their own file:

   ```bash
   npx auth@latest generate --output db/auth-schema.ts
   ```

2. Re-export them from the schema file that `drizzle.config.ts` already reads:

   ```ts
   // db/schema.ts
   export * from "./auth-schema";
   ```

3. Create and apply a migration with the existing scripts. `drizzle-kit push` isn't used, because this repo keeps migration files.

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

### Tables created

| Table | Purpose |
|---|---|
| `user` | Account details, plus one extra `role` column (`text`, not null, default `'customer'`) |
| `session` | One row per signed-in browser |
| `account` | Stores the password hash |
| `verification` | Created by Better Auth, unused in v1 |

### Admin role choice

Recommended: add `role` through `user.additionalFields` with `input: false`. That setting stops users from sending `role: "admin"` in the sign-up request.

The other option is Better Auth's `admin` plugin. It also adds ban fields, impersonation and about a dozen user-management endpoints. That goes beyond protected admin routes, so it can wait until later.

### Making someone an admin

A small script, `db/make-admin.ts`, runs one Drizzle `update(user).set({ role: "admin" })`:

```bash
pnpm tsx db/make-admin.ts you@example.com
```

No API endpoint can grant the admin role.

---

## 2. Better Auth configuration

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true, // signed in right after sign-up
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false, // users can't set their own role
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // rolling refresh once a day
  },
  plugins: [nextCookies()], // must be last
});

export type Session = typeof auth.$Infer.Session;
```

- **Secret and URL:** these come from env vars, so they don't appear in the config.
- **Defaults kept:** rate limiting and CSRF/origin checks.
- **Cookie cache:** off for v1. Every session check reads from the database, so signing out or changing a role takes effect immediately.
- **Client:** `lib/auth-client.ts` exports `createAuthClient()` from `better-auth/react`. It uses `inferAdditionalFields<typeof auth>()` so `role` is typed on the client.
- **To check during implementation:** whether the adapter works with the `neon-http` driver, which doesn't support transactions. The first sign-up will confirm it. If it fails, the adapter's transaction option gets turned off.

---

## 3. Server-side session handling

All session reads go through one server-only file, so pages and actions never call `auth.api` directly:

```ts
// lib/session.ts
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
```

| Flow | How it works |
|---|---|
| Sign up | Client form at `app/(auth)/sign-up/page.tsx` calls `authClient.signUp.email`, shows the returned `error`, then calls `router.push("/account")` and `router.refresh()` |
| Sign in | Client form at `app/(auth)/sign-in/page.tsx` calls `authClient.signIn.email`, the same way |
| Sign out | A small client button calls `authClient.signOut()`, then refreshes the page |
| Persistent sessions | httpOnly, `SameSite=Lax` cookie (Secure over HTTPS). Lasts 7 days and renews once a day while the user is active. |

**Cache Components:** layouts won't await the session at the top level. The part of a page that needs the user goes inside `<Suspense>`. The Navbar's account link or sign-in link becomes a small async component wrapped in `<Suspense>`.

---

## 4. Customer route protection

There are two layers:

1. **`proxy.ts` (fast redirect only).** It uses `getSessionCookie(request)` from `better-auth/cookies` and redirects to `/sign-in` when there's no cookie.
   - Matcher: `["/account/:path*", "/admin/:path*"]`
   - It only checks that a cookie exists, which is quick but not a real check.
2. **Real check on the server.** `app/account/page.tsx` calls `await requireUser()` inside its Suspense-wrapped content. Any Server Action or Route Handler that deals with account data calls `requireUser()` itself. It never relies on the proxy or on the layout.

---

## 5. Admin authorization

- `app/admin/page.tsx` calls `await requireAdmin()`.
- Every admin Server Action or Route Handler starts with `requireAdmin()`. API routes return **403** instead of redirecting.
- The proxy only confirms that a session cookie exists. The role is always checked on the server against the database, because `role` lives in the `user` table and the cookie cache is off.

---

## 6. Verification

There's no test runner yet, and `CLAUDE.md` requires `pnpm test`. The plan adds **Vitest** with a `test` script.

### Unit tests

File: `lib/session.test.ts`, with `auth.api.getSession` and `next/navigation` mocked.

- `requireUser` redirects to `/sign-in` when there's no session.
- `requireUser` returns the user when there is a session.
- `requireAdmin` redirects a customer to `/`.
- `requireAdmin` returns the user for an admin.

### Flow checklist

A manual run against `pnpm dev`. It can become Playwright tests later.

| # | Scenario | Expected |
|---|---|---|
| 1 | Signed out → `/account` or `/admin` | Redirect to `/sign-in` |
| 2 | Sign up with a new email | Signed in, `user.role = 'customer'` in the DB |
| 3 | Sign up with a body that includes `role: "admin"` (via curl) | Role is still `customer` |
| 4 | Sign up with an email that's already taken | Error shown, no new row |
| 5 | Sign in with a wrong password | Generic error |
| 6 | Sign in, restart the browser, visit `/account` | Still signed in |
| 7 | Customer → `/admin` | Redirect to `/` |
| 8 | Run `make-admin`, then visit `/admin` | Page allowed |
| 9 | Sign out → `/account` | Redirect, `session` row deleted |
| 10 | `GET /api/auth/ok` | `{ "status": "ok" }` |

---

## Open decisions

1. **Admin role:** a `role` column (recommended) or the full `admin` plugin?
2. **Email verification:** off in v1? Turning it on needs an email provider, and so does password reset, which is out of scope.
3. **Deployment target:** if this runs on serverless (for example Vercel), the default in-memory rate limiter resets on every instance. In that case, use `rateLimit.storage: "database"`, which adds one more table.
