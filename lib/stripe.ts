import Stripe from "stripe";

let stripeClient: Stripe | undefined;

/** Server-only Stripe client. Uses the API version pinned by the installed SDK. */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not set");

  stripeClient = new Stripe(apiKey);
  return stripeClient;
}
