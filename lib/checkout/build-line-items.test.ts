import { describe, expect, it } from "vitest";
import { buildLineItems } from "./build-line-items";

describe("buildLineItems", () => {
  it("maps order lines to inline Stripe prices in cents", () => {
    expect(
      buildLineItems([{ productName: "Body Wave", unitPriceCents: 18999, quantity: 2 }], "usd")
    ).toEqual([
      {
        quantity: 2,
        price_data: {
          currency: "usd",
          unit_amount: 18999,
          product_data: { name: "Body Wave" },
        },
      },
    ]);
  });
});
