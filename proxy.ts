import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { ROUTES, withRedirect } from "@/lib/routes";

/**
 * Fast redirect for signed-out visitors. This only checks that a session cookie
 * exists. Pages and actions still validate the session with requireUser/requireAdmin.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const signInUrl = new URL(withRedirect(ROUTES.signIn, pathname + search), request.url);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*"],
};
