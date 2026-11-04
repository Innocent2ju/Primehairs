import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "./config";

export interface CartLine {
  productId: number;
  quantity: number;
}

const ALLOWED_KEYS = new Set(["productId", "quantity"]);

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const line = value as Record<string, unknown>;
  const hasOnlyAllowedKeys = Object.keys(line).every((key) => ALLOWED_KEYS.has(key));

  return (
    hasOnlyAllowedKeys &&
    isPositiveInteger(line.productId) &&
    isPositiveInteger(line.quantity) &&
    line.quantity <= MAX_QUANTITY_PER_LINE
  );
}

/**
 * Validates the untrusted cart payload sent by the browser. Only product IDs and
 * quantities are accepted; prices, names and stock always come from the database.
 * Returns null when the payload is invalid.
 */
export function parseCartInput(input: unknown): CartLine[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CART_LINES) {
    return null;
  }
  if (!input.every(isCartLine)) return null;

  const productIds = new Set(input.map((line) => line.productId));
  if (productIds.size !== input.length) return null;

  return input.map(({ productId, quantity }) => ({ productId, quantity }));
}
