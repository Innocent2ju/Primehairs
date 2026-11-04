import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { orderItems, orders, products, stocks } from "@/db/schema";
import { CHECKOUT_CURRENCY } from "@/lib/checkout/config";
import type { CartLine } from "@/lib/checkout/parse-cart-input";
import {
  priceCart,
  type CatalogEntry,
  type PricedLine,
  type StockShortage,
} from "@/lib/checkout/price-cart";
import type { Transaction } from "@/lib/db-transaction";
import { toCents } from "@/lib/money";

export interface ReservedOrder {
  id: string;
  totalCents: number;
  currency: string;
  expiresAt: Date;
  lines: PricedLine[];
}

export type ReserveOrderResult =
  | { ok: true; order: ReservedOrder }
  | { ok: false; shortages: StockShortage[] };

interface ReserveOrderInput {
  userId: string;
  cart: CartLine[];
  expiresAt: Date;
}

/** Reads trusted prices and stock, locking the stock rows until the transaction ends. */
async function lockCatalog(tx: Transaction, productIds: number[]): Promise<CatalogEntry[]> {
  const rows = await tx
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      available: stocks.quantity,
    })
    .from(products)
    .innerJoin(stocks, eq(stocks.productId, products.id))
    .where(inArray(products.id, productIds))
    .orderBy(products.id)
    .for("update", { of: stocks });

  return rows.map(({ price, ...row }) => ({ ...row, unitPriceCents: toCents(price) }));
}

async function decrementStock(tx: Transaction, lines: PricedLine[]): Promise<void> {
  for (const line of lines) {
    const updated = await tx
      .update(stocks)
      .set({ quantity: sql`${stocks.quantity} - ${line.quantity}`, updatedAt: new Date() })
      .where(and(eq(stocks.productId, line.productId), gte(stocks.quantity, line.quantity)))
      .returning({ productId: stocks.productId });

    if (updated.length === 0) {
      throw new Error(`Stock for product ${line.productId} changed while it was locked`);
    }
  }
}

/**
 * Revalidates stock, reserves it and creates a pending order with a price snapshot.
 * Nothing is written when any line is short of stock.
 */
export async function reserveOrder(
  tx: Transaction,
  { userId, cart, expiresAt }: ReserveOrderInput
): Promise<ReserveOrderResult> {
  const catalog = await lockCatalog(tx, cart.map((line) => line.productId));
  const pricedCart = priceCart(cart, catalog);
  if (!pricedCart.ok) return pricedCart;

  await decrementStock(tx, pricedCart.lines);

  const [order] = await tx
    .insert(orders)
    .values({ userId, currency: CHECKOUT_CURRENCY, totalCents: pricedCart.totalCents, expiresAt })
    .returning({ id: orders.id });

  await tx.insert(orderItems).values(
    pricedCart.lines.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      productName: line.productName,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    }))
  );

  return {
    ok: true,
    order: {
      id: order.id,
      totalCents: pricedCart.totalCents,
      currency: CHECKOUT_CURRENCY,
      expiresAt,
      lines: pricedCart.lines,
    },
  };
}
