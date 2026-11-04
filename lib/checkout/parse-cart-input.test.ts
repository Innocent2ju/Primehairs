import { describe, expect, it } from "vitest";
import { MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "./config";
import { parseCartInput } from "./parse-cart-input";

describe("parseCartInput", () => {
  it("accepts product IDs and quantities", () => {
    expect(
      parseCartInput([
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ])
    ).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 3, quantity: 1 },
    ]);
  });

  it("rejects client-supplied prices and other extra fields", () => {
    expect(parseCartInput([{ productId: 1, quantity: 1, price: 0.01 }])).toBeNull();
    expect(parseCartInput([{ productId: 1, quantity: 1, total: 1 }])).toBeNull();
  });

  it.each([
    ["not an array", { productId: 1, quantity: 1 }],
    ["an empty cart", []],
    ["a null line", [null]],
    ["an array line", [[1, 1]]],
    ["a zero quantity", [{ productId: 1, quantity: 0 }]],
    ["a negative quantity", [{ productId: 1, quantity: -1 }]],
    ["a fractional quantity", [{ productId: 1, quantity: 1.5 }]],
    ["a string quantity", [{ productId: 1, quantity: "1" }]],
    ["an oversized quantity", [{ productId: 1, quantity: MAX_QUANTITY_PER_LINE + 1 }]],
    ["an invalid product ID", [{ productId: 0, quantity: 1 }]],
    ["a missing product ID", [{ quantity: 1 }]],
    [
      "duplicate product IDs",
      [
        { productId: 1, quantity: 1 },
        { productId: 1, quantity: 2 },
      ],
    ],
  ])("rejects %s", (_label, input) => {
    expect(parseCartInput(input)).toBeNull();
  });

  it("rejects carts with too many lines", () => {
    const lines = Array.from({ length: MAX_CART_LINES + 1 }, (_, index) => ({
      productId: index + 1,
      quantity: 1,
    }));
    expect(parseCartInput(lines)).toBeNull();
  });
});
