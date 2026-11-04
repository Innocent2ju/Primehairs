const DECIMAL_AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/** Converts a Postgres numeric string such as "189.99" to integer cents without float maths. */
export function toCents(amount: string): number {
  const match = DECIMAL_AMOUNT.exec(amount.trim());
  if (!match) throw new Error(`Invalid money amount: "${amount}"`);

  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
