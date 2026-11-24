'use cache'

import { db } from "@/lib/drizzleconnect";
import { products, type Product } from "@/database";
import { getProductRatingStatsMap } from "@/lib/reviews";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Suspense } from "react";
import type { Metadata } from "next";

import { buildPageMetadata, SITE_DEFAULT_TITLE } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: SITE_DEFAULT_TITLE,
  description:
    "Shop 100% raw human hair wigs, bundles and extensions at PrimeHairs. Pre-plucked lace, seamless closures and luxury textures, delivered across Nigeria.",
  path: "/",
  absoluteTitle: true,
  keywords: [
    "raw hair wigs",
    "human hair bundles",
    "hair extensions",
    "luxury wigs Nigeria",
    "PrimeHairs",
  ],
});

async function FeaturedProducts() {
    'use cache'
    cacheLife({ stale: 10800, revalidate: 10800 });

    const featuredProducts: Product[] = await db.select().from(products);
    const ratingStats = await getProductRatingStatsMap();

    return (
        <div className="products-grid mt-10">
            {featuredProducts.map((product) => (
                <ProductCard
                    key={product.id}
                    title={product.title}
                    image={product.image}
                    slug={product.slug}
                    basePrice={product.basePrice}
                    reviewCount={ratingStats[product.id]?.count ?? 0}
                    highestStars={ratingStats[product.id]?.highestStars ?? null}
                />
            ))}
        </div>
    );
}

function ProductSkeleton() {
    return (
        <div
            className="products-grid mt-10"
            aria-label="Loading featured products"
            aria-busy="true"
        >
            {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col gap-3 animate-pulse">
                    <div className="h-[180px] w-full rounded-lg bg-charcoal sm:h-[240px] md:h-[300px]" />
                    <div className="h-4 w-3/4 rounded bg-charcoal" />
                    <div className="h-3 w-1/2 rounded bg-charcoal" />
                    <div className="h-4 w-1/3 rounded bg-charcoal" />
                </div>
            ))}
        </div>
    );
}

export default async function Page() {
    cacheLife({ stale: 10800, revalidate: 10800 });

    return (
        <section>
            <h1 className="text-center">The Online Store for Raw Hair Wigs & Bundles</h1>
            <p className="text-center mt-5">Human hairs, extension bundles, wigs and hair products in one place !</p>

            <section className="mt-20 space-y-7" aria-labelledby="featured-heading">
                <h2 id="featured-heading">Featured Products</h2>
                <Suspense fallback={<ProductSkeleton />}>
                    <FeaturedProducts />
                </Suspense>
            </section>

            <Link
                href="/products"
                className="block text-sm text-light-gray hover:text-gold transition-colors text-center mt-10"
            >
                View all products
            </Link>
        </section>
    );
}