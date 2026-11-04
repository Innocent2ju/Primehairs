export const CHECKOUT_CURRENCY = "usd";

export const MAX_CART_LINES = 20;
export const MAX_QUANTITY_PER_LINE = 25;

/** Stripe requires expires_at to be at least 30 minutes after session creation. */
export const CHECKOUT_SESSION_TTL_MS = 31 * 60 * 1000;

/** Tags sessions in the Stripe Dashboard; Stripe asks for an 8-letter random suffix. */
export const CHECKOUT_INTEGRATION_IDENTIFIER = "primehairs-checkout-kqvzmrta";
