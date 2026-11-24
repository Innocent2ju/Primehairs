import Link from "next/link";
import { ChevronRight, Package, Plus } from "lucide-react";

import ProductActions from "@/components/admin/ProductActions";
import ProductsFlashToast from "@/components/admin/ProductsFlashToast";
import { listAdminProducts } from "@/lib/admin/queries";
import { ADMIN_ATTRIBUTE_FIELDS, formatNaira } from "@/lib/admin/types";

const countAttributes = (product: {
  hairType: string[];
  hairVolume: string[];
  density: string[];
  colors: string[];
  hairLength: string[];
  laceType: string[];
  closureSizes: string[];
}): number =>
  ADMIN_ATTRIBUTE_FIELDS.reduce(
    (total, { key }) => total + (product[key]?.length ?? 0),
    0,
  );

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const params = await searchParams;
  const products = await listAdminProducts();

  const created = params.created === "1";
  const updated = params.updated === "1";

  return (
    <div className="flex flex-col gap-6">
      <ProductsFlashToast created={created} updated={updated} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-light-gray/60">
          {products.length} product{products.length === 1 ? "" : "s"} in the
          catalogue.
        </p>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-amber-300"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
          <Package className="size-10 text-gold" aria-hidden="true" />
          <h2 className="mt-4 font-playfair text-xl font-bold text-white">
            No products yet
          </h2>
          <p className="mt-1 text-sm text-light-gray/60">
            Add your first piece to open the storefront.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-black hover:bg-amber-300"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add New Product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#1A1A1A]/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-light-gray/50">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Product</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Base Price</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Attributes</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Pricing Rules</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="align-middle">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="size-12 shrink-0 rounded-lg border border-white/10 object-cover"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/products/${product.slug}`}
                            className="block truncate font-medium text-white hover:text-gold"
                          >
                            {product.title}
                          </Link>
                          <p className="truncate text-[11px] text-light-gray/50">
                            /{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gold">
                      {formatNaira(Number(product.basePrice))}
                    </td>
                    <td className="px-5 py-3.5 text-light-gray">
                      {countAttributes(product)}
                    </td>
                    <td className="px-5 py-3.5 text-light-gray">
                      {product.attributePricing.length}
                    </td>
                    <td className="px-5 py-3.5">
                      <ProductActions
                        productId={product.id}
                        productName={product.title}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-light-gray/50"
      >
        <ol className="flex items-center gap-2">
          <li className="flex items-center gap-2">
            <Link href="/admin" className="hover:text-gold">
              Overview
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
          </li>
          <li>
            <span aria-current="page" className="text-light-gray">
              Products
            </span>
          </li>
        </ol>
      </nav>
    </div>
  );
}
