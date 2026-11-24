import { auth } from "@/lib/auth";

// Visitors may browse the storefront anonymously. Only routes that need an
// account (buying, profile, admin) are protected; the proxy sends anonymous
// users to sign-in when they reach one of these.
export default auth.middleware({
  loginUrl: "/sign-in",
});

export const config = {
  matcher: [
    "/checkout/:path*",
    "/my-profile/:path*",
    "/admin/:path*",
  ],
};
