import { desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { orders, products, reviews } from "@/database";
import { auth } from "@/lib/auth";
import { user } from "@/lib/auth-schema";
import { db } from "@/lib/drizzleconnect";

/** 0 when the product has no reviews; highestStars is null in that case. */
export interface ProductRatingStats {
  count: number;
  highestStars: number | null;
}

/** A review plus the reviewer details the UI needs, all read server-side. */
export interface ReviewWithReviewer {
  id: string;
  rating: number;
  reviewerName: string;
  maskedEmail: string;
  comment: string;
  createdAt: Date;
  orderCount: number;
  signupDate: Date | null;
}

export type ReviewActionResult =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const MAX_COMMENT_LENGTH = 2000;

const normalizeSlug = (slug: string): string => slug.trim().toLowerCase();

/**
 * Keeps only the first character of the local part: `ada.lovelace@gmail.com`
 * becomes `a****@gmail.com`. Emails without an `@` keep just their first char.
 */
export function maskReviewerEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.lastIndexOf("@");
  const firstCharacter = trimmed.charAt(0);

  if (atIndex <= 0) return `${firstCharacter}****`;

  return `${firstCharacter}****@${trimmed.slice(atIndex + 1)}`;
}

/** Review count and highest rating for one product, by its uuid. */
export async function getProductRatingStatsByProductId(
  productId: string,
): Promise<ProductRatingStats> {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      highestStars: sql<number | null>`max(${reviews.rating})::int`,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId));

  const count = row?.count ?? 0;

  return {
    count,
    highestStars: count > 0 ? (row?.highestStars ?? null) : null,
  };
}

/** Review count and highest rating for one product, looked up by slug. */
export async function getProductRatingStatsBySlug(
  slug: string,
): Promise<ProductRatingStats> {
  const normalized = normalizeSlug(slug);

  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      highestStars: sql<number | null>`max(${reviews.rating})::int`,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(products.slug, normalized));

  const count = row?.count ?? 0;

  return {
    count,
    highestStars: count > 0 ? (row?.highestStars ?? null) : null,
  };
}

/** Stats for every reviewed product, keyed by product uuid (product lists). */
export async function getProductRatingStatsMap(): Promise<
  Record<string, ProductRatingStats>
> {
  const rows = await db
    .select({
      productId: reviews.productId,
      count: sql<number>`count(*)::int`,
      highestStars: sql<number | null>`max(${reviews.rating})::int`,
    })
    .from(reviews)
    .groupBy(reviews.productId);

  const stats: Record<string, ProductRatingStats> = {};

  for (const row of rows) {
    stats[row.productId] = {
      count: row.count,
      highestStars: row.count > 0 ? row.highestStars : null,
    };
  }

  return stats;
}

/**
 * Reviews for one product by slug, newest first, enriched with the reviewer's
 * order count (matched by email) and signup date from the auth `user` table.
 */
export async function getProductReviewsBySlug(
  slug: string,
): Promise<ReviewWithReviewer[]> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return [];

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, normalized))
    .limit(1);

  if (!product) return [];

  // The auth `user` table is unique on email, so the left join cannot duplicate rows.
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      reviewerName: reviews.reviewerName,
      reviewerEmail: reviews.reviewerEmail,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      signupDate: user.createdAt,
    })
    .from(reviews)
    .leftJoin(user, sql`lower(${user.email}) = lower(${reviews.reviewerEmail})`)
    .where(eq(reviews.productId, product.id))
    .orderBy(desc(reviews.createdAt));

  const emails = Array.from(
    new Set(
      rows
        .map((row) => row.reviewerEmail.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const orderCounts = new Map<string, number>();

  if (emails.length > 0) {
    const counts = await db
      .select({
        email: sql<string>`lower(${orders.email})`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(inArray(sql`lower(${orders.email})`, emails))
      .groupBy(sql`lower(${orders.email})`);

    for (const entry of counts) {
      orderCounts.set(entry.email, entry.orderCount);
    }
  }

  return rows.map((row) => {
    const email = row.reviewerEmail.trim().toLowerCase();

    return {
      id: row.id,
      rating: row.rating,
      reviewerName: row.reviewerName,
      maskedEmail: maskReviewerEmail(row.reviewerEmail),
      comment: row.comment,
      createdAt: row.createdAt,
      orderCount: orderCounts.get(email) ?? 0,
      signupDate: row.signupDate ?? null,
    };
  });
}

/**
 * Creates a review for the signed-in Neon Auth user. The product uuid is
 * resolved from the slug in the database and the reviewer identity is taken
 * from the session, so the client cannot spoof either.
 */
export async function createProductReview(input: {
  slug: string;
  rating: number;
  comment: string;
}): Promise<ReviewActionResult> {
  const { data } = await auth.getSession();
  const authUser = data?.user;

  if (!authUser?.id || !authUser.email) {
    return { status: "error", message: "Please sign in to leave a review." };
  }

  const rating = Math.trunc(Number(input.rating));

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", message: "Choose a star rating from 1 to 5." };
  }

  const comment = input.comment.trim();

  if (!comment) {
    return { status: "error", message: "Please write a short review." };
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    return {
      status: "error",
      message: `Keep your review under ${MAX_COMMENT_LENGTH} characters.`,
    };
  }

  const slug = normalizeSlug(input.slug);

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    return { status: "error", message: "This product no longer exists." };
  }

  const reviewerEmail = authUser.email.trim().toLowerCase();
  const reviewerName = authUser.name?.trim() || reviewerEmail;

  await db.insert(reviews).values({
    productId: product.id,
    rating,
    reviewerName,
    reviewerEmail,
    comment,
  });

  revalidatePath(`/products/${slug}`);
  revalidatePath(`/products/${slug}/reviews`);

  return { status: "success", message: "Thanks! Your review has been posted." };
}
