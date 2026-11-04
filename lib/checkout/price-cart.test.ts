import { describe, expect, it } from "vitest";
import { priceCart, type CatalogEntry } from "./price-cart";

const catalog: CatalogEntry[] = [
  { productId: 1, slug: "body-wave", name: "Body Wave", unitPriceCents: 18999, available: 5 },
  { productId: 2, slug: "bob", name: "Bob", unitPriceCents: 13999, available: 1 },
];

describe("priceCart", () => {
  it("uses database prices and computes the total in cents", () => {
    const result = priceCart(
      [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      catalog
    );

    expect(result).toEqual({
      ok: true,
      totalCents: 18999 * 2 + 13999,
      lines: [
        { productId: 1, slug: "body-wave", productName: "Body Wave", unitPriceCents: 18999, quantity: 2 },
        { productId: 2, slug: "bob", productName: "Bob", unitPriceCents: 13999, quantity: 1 },
      ],
    });
  });

  it("allows buying the exact remaining stock", () => {
    expect(priceCart([{ productId: 2, quantity: 1 }], catalog).ok).toBe(true);
  });

  it("reports every line that exceeds available stock", () => {
    expect(
      priceCart(
        [
          { productId: 1, quantity: 6 },
          { productId: 2, quantity: 2 },
        ],
        catalog
      )
    ).toEqual({
      ok: false,
      shortages: [
        { productId: 1, available: 5 },
        { productId: 2, available: 1 },
      ],
    });
  });

  it("treats unknown products as out of stock", () => {
    expect(priceCart([{ productId: 99, quantity: 1 }], catalog)).toEqual({
      ok: false,
      shortages: [{ productId: 99, available: 0 }],
    });
  });
});
