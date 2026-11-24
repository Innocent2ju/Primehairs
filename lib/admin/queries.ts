import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { checkouts, orders, products, type Product } from "@/database";
import { db } from "@/lib/drizzleconnect";

/**
 * Server-side reads for admin pages. Authorisation runs in the admin layout
 * before any page renders; these helpers only shape queries.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listAdminProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.title));
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  return product ?? null;
}

export interface AdminCheckoutRow {
  checkout: typeof checkouts.$inferSelect;
  lineCount: number;
  lineTotalNgn: number;
}

const linePrice = sql<number>`coalesce(sum((nullif(${orders.productDetails} ->> 'price', ''))::numeric), 0)::float8`;

/**
 * Checkouts joined with the order lines written for the same customer.
 * `orders` has no checkout foreign key, so the customer email is the join key.
 */
export async function listAdminCheckouts(
  limit?: number,
): Promise<AdminCheckoutRow[]> {
  const base = db
    .select({
      checkout: checkouts,
      lineCount: sql<number>`count(${orders.id})::int`,
      lineTotalNgn: linePrice,
    })
    .from(checkouts)
    .leftJoin(
      orders,
      and(
        eq(sql`lower(${orders.email})`, sql`lower(${checkouts.customerEmail})`),
        eq(checkouts.paymentStatus, "paid"),
      ),
    )
    .groupBy(checkouts.id)
    .orderBy(desc(checkouts.createdAt));

  if (limit) return base.limit(limit);
  return base;
}

export interface AdminMetricSummary {
  revenueNgn: number;
  totalOrders: number;
  doorstepOrders: number;
  branchOrders: number;
  totalProducts: number;
  recentOrders: typeof checkouts.$inferSelect[];
}

export async function getAdminMetrics(): Promise<AdminMetricSummary> {
  const [deliveries] = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      doorstepOrders: sql<number>`count(*) filter (where ${checkouts.deliveryType} = 'doorstep')::int`,
      branchOrders: sql<number>`count(*) filter (where ${checkouts.deliveryType} = 'branch')::int`,
    })
    .from(checkouts)
    .where(eq(checkouts.paymentStatus, "paid"));

  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);

  const [revenue] = await db
    .select({ total: sql<number>`coalesce(sum((nullif(${orders.productDetails} ->> 'price', ''))::numeric), 0)::float8` })
    .from(orders)
    .innerJoin(
      checkouts,
      and(
        eq(sql`lower(${checkouts.customerEmail})`, sql`lower(${orders.email})`),
        eq(checkouts.paymentStatus, "paid"),
      ),
    );

  const recentOrders = await db
    .select()
    .from(checkouts)
    .orderBy(desc(checkouts.createdAt))
    .limit(6);

  return {
    revenueNgn: Number.isFinite(revenue?.total) ? revenue.total : 0,
    totalOrders: deliveries?.totalOrders ?? 0,
    doorstepOrders: deliveries?.doorstepOrders ?? 0,
    branchOrders: deliveries?.branchOrders ?? 0,
    totalProducts: productCount?.count ?? 0,
    recentOrders,
  };
}

export async function getOrderLinesForEmails(
  emails: readonly string[],
): Promise<Map<string, Array<typeof orders.$inferSelect>>> {
  const unique = [...new Set(emails.filter(Boolean))];
  const grouped = new Map<string, Array<typeof orders.$inferSelect>>();

  if (unique.length === 0) return grouped;

  const rows = await db
    .select()
    .from(orders)
    .where(inArray(orders.email, unique))
    .orderBy(desc(orders.createdAt));

  for (const row of rows) {
    const bucket = grouped.get(row.email) ?? [];
    bucket.push(row);
    grouped.set(row.email, bucket);
  }

  return grouped;
}
