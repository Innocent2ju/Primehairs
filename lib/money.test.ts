import { describe, expect, it } from "vitest";
import { formatCents, toCents } from "./money";

describe("toCents", () => {
  it.each([
    ["189.99", 18999],
    ["0.10", 10],
    ["0.1", 10],
    ["1", 100],
    ["1234.5", 123450],
    [" 12.00 ", 1200],
  ])("converts %s to %i cents", (amount, cents) => {
    expect(toCents(amount)).toBe(cents);
  });

  it.each(["", "abc", "-1.00", "1.234", "1e3", "1,000.00"])("rejects %s", (amount) => {
    expect(() => toCents(amount)).toThrow();
  });
});

describe("formatCents", () => {
  it("formats cents as a currency string", () => {
    expect(formatCents(18999, "usd")).toBe("$189.99");
  });
});
