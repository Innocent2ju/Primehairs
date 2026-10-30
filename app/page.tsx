import { getLatestProducts } from "@/lib/data/products";
import ProductCard from "@/app/components/ProductCard";
import Link from "next/link";

export default async function Page() {
  const products = await getLatestProducts();

  return (
    <section>
      <h1 className="text-center">The Online Store for Hair Wigs & Bundles</h1>
      <p className="text-center mt-5">
        Human hairs, extension bundles, wigs and hair products in one place!
      </p>

      <div className="mt-20 space-y-7">
        <div className="flex items-center justify-between">
          <h3>Featured Products</h3>
          <Link href="/products">
            <p className="text-sm text-light-gray hover:text-gold transition-colors">
              View all products
            </p>
          </Link>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
