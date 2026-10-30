import { getCategoriesWithFoldedProducts } from "@/lib/data/products";
import ProductCard from "@/app/components/ProductCard";

export default async function ProductsPage() {
  const foldedCategories = await getCategoriesWithFoldedProducts();
  const totalProducts = foldedCategories.reduce(
    (acc, cat) => acc + cat.products.length,
    0
  );

  return (
    <section>
      <h1 className="text-center">All Products</h1>
      <p className="text-center mt-4 text-light-gray text-sm">
        {totalProducts} products across {foldedCategories.length} categories
      </p>

      {foldedCategories.map((cat) => (
        <div key={cat.id} className="mt-14 space-y-6">
          <div className="flex items-baseline justify-between">
            <h3>{cat.name}</h3>
            {cat.description && (
              <p className="text-xs text-light-gray hidden sm:block">
                {cat.description}
              </p>
            )}
          </div>
          <div className="products-grid">
            {cat.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
