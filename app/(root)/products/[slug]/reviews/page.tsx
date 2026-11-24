import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Metadata } from "next";

import ProductRatingSummary from "@/components/ProductRatingSummary";
import ReviewForm from "@/components/ReviewForm";
import ReviewerHoverCard from "@/components/ReviewerHoverCard";
import { products } from "@/database";
import { auth } from "@/lib/auth";
import { db } from "@/lib/drizzleconnect";
import {
  createProductReview,
  getProductRatingStatsBySlug,
  getProductReviewsBySlug,
  type ReviewActionResult,
} from "@/lib/reviews";
import { buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

interface ProductReviewsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductReviewsPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();

  const [product] = await db
    .select({ title: products.title, image: products.image })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    return buildPageMetadata({
      title: "Product Reviews",
      description:
        "Read verified customer reviews for PrimeHairs raw hair wigs, bundles and extensions.",
      path: `/products/${slug}/reviews`,
    });
  }

  const stats = await getProductRatingStatsBySlug(slug);
  const ratingSummary =
    stats.count > 0
      ? `Rated up to ${stats.highestStars ?? 0} out of 5 by ${stats.count} ${
          stats.count === 1 ? "customer" : "customers"
        }.`
      : "Be the first to share your experience.";

  return buildPageMetadata({
    title: `${product.title} Reviews`,
    description: `${ratingSummary} Read verified customer reviews for ${product.title} at PrimeHairs.`,
    path: `/products/${slug}/reviews`,
    image: product.image,
    imageAlt: `${product.title} reviews — PrimeHairs`,
    keywords: [
      `${product.title} reviews`,
      slug.replace(/-/g, " "),
      "raw hair wig reviews",
    ],
  });
}

const formatDate = (value: Date): string =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

const StarRow = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star
        key={value}
        aria-hidden="true"
        className={cn(
          "size-4",
          value <= rating ? "fill-gold text-gold" : "text-light-gray/25",
        )}
      />
    ))}
  </span>
);

const ProductReviewsContent = async ({ params }: ProductReviewsPageProps) => {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) notFound();

  const [stats, productReviews, session] = await Promise.all([
    getProductRatingStatsBySlug(slug),
    getProductReviewsBySlug(slug),
    auth.getSession(),
  ]);

  const sessionUser = session.data?.user;
  const reviewer = sessionUser?.email
    ? {
        name: sessionUser.name?.trim() || sessionUser.email,
        email: sessionUser.email,
      }
    : null;

  // Binds this page's slug to the verified mutation helper; the reviewer's
  // identity is read from the session inside createProductReview.
  async function submitReview(
    _state: ReviewActionResult,
    formData: FormData,
  ): Promise<ReviewActionResult> {
    "use server";

    return createProductReview({
      slug,
      rating: Number(formData.get("rating")),
      comment: String(formData.get("comment") ?? ""),
    });
  }

  return (
    <div className="min-h-screen px-4 py-8 text-white md:px-12 lg:px-24">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-sm text-gray-400"
      >
        <ol className="flex items-center gap-2">
          <li className="flex items-center gap-2">
            <Link href="/" className="transition-colors hover:text-amber-400">
              Home
            </Link>
            <ChevronRight className="size-4" aria-hidden="true" />
          </li>
          <li className="flex items-center gap-2">
            <Link
              href="/products"
              className="transition-colors hover:text-amber-400"
            >
              Products
            </Link>
            <ChevronRight className="size-4" aria-hidden="true" />
          </li>
          <li className="flex items-center gap-2">
            <Link
              href={`/products/${slug}`}
              className="max-w-[200px] truncate transition-colors hover:text-amber-400"
            >
              {product.title}
            </Link>
            <ChevronRight className="size-4" aria-hidden="true" />
          </li>
          <li>
            <span aria-current="page" className="text-white">
              Reviews
            </span>
          </li>
        </ol>
      </nav>

      <header className="flex flex-col gap-6 rounded-2xl border border-gold/20 bg-[#1A1A1A]/80 p-6 sm:flex-row sm:items-center">
        <img
          src={product.image}
          alt={`${product.title} product photo`}
          className="h-28 w-28 shrink-0 rounded-lg object-cover"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {product.title}
          </h1>
          <ProductRatingSummary
            slug={slug}
            count={stats.count}
            highestStars={stats.highestStars}
          />
        </div>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ReviewForm action={submitReview} reviewer={reviewer} />
        </div>

        <section className="flex flex-col gap-4 lg:col-span-8">
          <h2 className="text-xl font-semibold text-white">
            {stats.count === 0
              ? "No reviews yet"
              : `${stats.count} ${stats.count === 1 ? "review" : "reviews"}`}
          </h2>

          {productReviews.length === 0 ? (
            <p className="text-sm text-light-gray/70">
              Be the first to review this product.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {productReviews.map((review) => (
                <li
                  key={review.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1A1A1A]/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <StarRow rating={review.rating} />
                      <ReviewerHoverCard
                        name={review.reviewerName}
                        maskedEmail={review.maskedEmail}
                        orderCount={review.orderCount}
                        signupDate={
                          review.signupDate
                            ? review.signupDate.toISOString()
                            : null
                        }
                      />
                    </div>
                    <time
                      dateTime={review.createdAt.toISOString()}
                      className="text-xs text-light-gray/60"
                    >
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm leading-relaxed text-light-gray">
                    {review.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/products/${slug}`}
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 px-6 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <ChevronLeft className="size-4" />
            Back to product
          </Link>
        </section>
      </div>
    </div>
  );
};

export default function ProductReviewsPage({ params }: ProductReviewsPageProps) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="min-h-screen px-4 py-20 text-center text-amber-400 animate-pulse md:px-12 lg:px-24"
        >
          Loading reviews...
        </div>
      }
    >
      <ProductReviewsContent params={params} />
    </Suspense>
  );
}
