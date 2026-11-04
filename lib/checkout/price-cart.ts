import type { CartLine } from "./parse-cart-input";

/** A product row as read from the database, with its price already in cents. */
export interface CatalogEntry {
  productId: number;
  slug: string;
  name: string;
  unitPriceCents: number;
  available: number;
}

export interface PricedLine {
  productId: number;
  slug: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
}

export interface StockShortage {
  productId: number;
  available: number;
}

export type PricedCart =
  | { ok: true; lines: PricedLine[]; totalCents: number }
  | { ok: false; shortages: StockShortage[] };

/**
 * Prices a cart using only database values. Unknown products count as zero stock,
 * so a cart line for a deleted product is reported as a shortage.
 */
export function priceCart(cart: CartLine[], catalog: CatalogEntry[]): PricedCart {
  const catalogById = new Map(catalog.map((entry) => [entry.productId, entry]));
  const shortages: StockShortage[] = [];
  const lines: PricedLine[] = [];

  for (const { productId, quantity } of cart) {
    const entry = catalogById.get(productId);
    const available = entry?.available ?? 0;

    if (!entry || available < quantity) {
      shortages.push({ productId, available });
      continue;
    }

    lines.push({
      productId,
      slug: entry.slug,
      productName: entry.name,
      unitPriceCents: entry.unitPriceCents,
      quantity,
    });
  }

  if (shortages.length > 0) return { ok: false, shortages };

  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  return { ok: true, lines, totalCents };
}
