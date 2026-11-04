/** The trusted public origin for Stripe redirect URLs. Never derived from request headers. */
export function getAppUrl(): string {
  const appUrl = process.env.APP_URL ?? process.env.BETTER_AUTH_URL;
  if (!appUrl) throw new Error("APP_URL (or BETTER_AUTH_URL) is not set");

  return appUrl.replace(/\/+$/, "");
}
