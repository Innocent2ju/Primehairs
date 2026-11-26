import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { products, type Product } from "@/database";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import ProductRatingSummary from "@/components/ProductRatingSummary";
import { db } from "@/lib/drizzleconnect";
import { getProductRatingStatsBySlug } from "@/lib/reviews";
import { buildPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface ProductDetailsProps {
  slug: string;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.trim().toLowerCase();

  const [product] = await db
    .select({
      title: products.title,
      description: products.description,
      image: products.image,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) {
    return buildPageMetadata({
      title: "Product Not Found",
      description:
        "This product is no longer available at PrimeHairs. Browse raw hair wigs, bundles and extensions in our shop.",
      path: `/products/${slug}`,
    });
  }

  return buildPageMetadata({
    title: product.title,
    description: product.description,
    path: `/products/${slug}`,
    image: product.image,
    imageAlt: `${product.title} — raw human hair wig from PrimeHairs`,
    keywords: [
      product.title,
      slug.replace(/-/g, " "),
      "raw hair wig",
      "human hair bundles",
      "hair extensions",
    ],
  });
}

const ProductDetails = async ({ slug }: ProductDetailsProps) => {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${slug}`,
    { cache: "no-store" },
  );

  if (!request.ok) {
    notFound();
  }

  // Exact destructuring pattern straight from request.json()
  const {
    title,
    description,
    overview,
    image,
    basePrice,
    variants = [],
    hairType,
    hairVolume,
    density,
    colors,
    hairLength,
    laceType,
    closureSizes,
    attributePricing,
  }: Product = await request.json();

  // Real review stats straight from the reviews table (no fallback rating).
  const ratingStats = await getProductRatingStatsBySlug(slug);

  // The main image leads the gallery; duplicates in variants are dropped.
  const galleryImages = [image, ...(variants || []).filter((v) => v !== image)];

  return (
    <>
      <article className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Image Gallery + Description & Overview (Big Screens) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <ProductGallery name={title} variants={galleryImages} />

          <div className="hidden lg:flex flex-col gap-7 pt-6 border-t border-white/[0.06]">
            <div className="space-y-2.5">
              <h2 className="text-xs uppercase mb-2 text-neutral-400">
                Description
              </h2>
              <p className="text-sm text-neutral-300/85 leading-7">
                {description}
              </p>
            </div>
            {overview && (
              <div className="space-y-2.5 pt-6 border-t border-white/[0.06]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Overview
                </h2>
                <p className="text-sm text-neutral-300/85 leading-7">
                  {overview}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Title, Mobile Description/Overview, and Purchase Box */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-3 justify-center ">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              {title}
            </h1>
            <ProductRatingSummary
              slug={slug}
              count={ratingStats.count}
              highestStars={ratingStats.highestStars}
            />
          </div>

          {/* Mobile Description & Overview */}
          <div className="flex lg:hidden flex-col gap-5 text-sm text-neutral-300/85 border-y border-white/[0.06] py-5">
            <p className="text-v leading-7">{description}</p>
            {overview && (
              <p className="text-neutral-400 leading-7">{overview}</p>
            )}
          </div>

          <ProductPurchaseBox
            productId={slug}
            productName={title}
            productImage={image}
            basePrice={basePrice}
            attributePricing={attributePricing}
            attributes={{
              hairType,
              hairVolume,
              density,
              colors,
              hairLength,
              laceType,
              closureSizes,
            }}
          />
        </div>
      </article>
    </>
  );
};

const ProductDetailsPage = ({ params }: ProductPageProps) => (
  <div className="min-h-screen text-white px-5 py-8 sm:px-8 md:px-12 lg:px-16">
    <div className="mx-auto w-full max-w-7xl">
      {/* Static skeleton: safe to prerender, replaced once the slug resolves. */}
      <Suspense
        fallback={
          <>
            <div
              role="status"
              aria-busy="true"
              className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 animate-pulse"
            >
              {/* Product Image Gallery Skeleton */}
              <div className="space-y-4">
                <div className="aspect-square w-full rounded-2xl bg-neutral-800/80" />
                <div className="grid grid-cols-4 gap-4">
                  <div className="aspect-square rounded-lg bg-neutral-800/80" />
                  <div className="aspect-square rounded-lg bg-neutral-800/80" />
                  <div className="aspect-square rounded-lg bg-neutral-800/80" />
                  <div className="aspect-square rounded-lg bg-neutral-800/80" />
                </div>
              </div>

              {/* Product Info Skeleton */}
              <div className="flex flex-col space-y-6">
                {/* Category / Brand badge */}
                <div className="h-4 w-24 rounded bg-neutral-800/80" />

                {/* Title */}
                <div className="space-y-3">
                  <div className="h-8 w-3/4 rounded-lg bg-neutral-800/80" />
                  <div className="h-8 w-1/2 rounded-lg bg-neutral-800/80" />
                </div>

                {/* Price & Rating */}
                <div className="flex items-center space-x-4 pt-2">
                  <div className="h-7 w-28 rounded-md bg-neutral-800/80" />
                  <div className="h-5 w-32 rounded-md bg-neutral-800/80" />
                </div>

                {/* Description lines */}
                <div className="space-y-2.5 pt-4">
                  <div className="h-4 w-full rounded bg-neutral-800/80" />
                  <div className="h-4 w-full rounded bg-neutral-800/80" />
                  <div className="h-4 w-5/6 rounded bg-neutral-800/80" />
                  <div className="h-4 w-2/3 rounded bg-neutral-800/80" />
                </div>

                {/* Variant / Size Selector */}
                <div className="space-y-3 pt-4">
                  <div className="h-4 w-20 rounded bg-neutral-800/80" />
                  <div className="flex gap-3">
                    <div className="h-10 w-14 rounded-lg bg-neutral-800/80" />
                    <div className="h-10 w-14 rounded-lg bg-neutral-800/80" />
                    <div className="h-10 w-14 rounded-lg bg-neutral-800/80" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <div className="h-12 flex-1 rounded-xl bg-neutral-800/80" />
                  <div className="h-12 w-12 rounded-xl bg-neutral-800/80" />
                </div>
              </div>
            </div>
          </>
        }
      >
        {/* params and the product fetch both resolve inside this boundary. */}
        <ProductLoader params={params} />
      </Suspense>
    </div>
  </div>
);

const ProductLoader = async ({ params }: ProductPageProps) => {
  const { slug } = await params;
  return <ProductDetails slug={slug} />;
};

export default ProductDetailsPage;