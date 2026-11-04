export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  account: "/account",
  admin: "/admin",
  products: "/products",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  checkoutCancel: "/checkout/cancel",
  checkoutCancelled: "/checkout/cancelled",
} as const;

export const REDIRECT_PARAM = "redirectTo";

const PROTECTED_PATH_PREFIXES: readonly string[] = [
  ROUTES.account,
  ROUTES.admin,
  ROUTES.checkout,
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Only allow same-site relative paths, to prevent open redirects. */
export function getSafeRedirectPath(value: string | null | undefined): string {
  const isRelativePath =
    !!value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");

  return isRelativePath ? value : ROUTES.home;
}

export function withRedirect(path: string, redirectTo: string): string {
  return `${path}?${REDIRECT_PARAM}=${encodeURIComponent(redirectTo)}`;
}
