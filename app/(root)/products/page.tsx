import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { products, type Product } from "@/database";
import { db } from "@/lib/drizzleconnect";
import { getProductRatingStatsMap } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Shop | Prime Hairs",
  description: "Human hair wigs, bundles and extensions from Prime Hairs.",
};

export default async function ProductsPage() {
  "use cache";
  cacheLife({ stale: 10800, revalidate: 10800 });

  const allProducts: Product[] = await db.select().from(products);
  const ratingStats = await getProductRatingStatsMap();

  return (
    <section>
      <h1 className="text-center">Shop the Collection</h1>
      <p className="mt-5 text-center">
        Human hair wigs, extension bundles and closures, ready to ship.
      </p>

      {allProducts.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <p className="text-light-gray">
            No products are listed yet. Check back shortly.
          </p>
          <Link href="/" className="text-sm text-gold hover:text-amber-300">
            Back to home
          </Link>
        </div>
      ) : (
        <div className="products-grid mt-10">
          {allProducts.map((product) => (
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
      )}
    </section>
  );
}
