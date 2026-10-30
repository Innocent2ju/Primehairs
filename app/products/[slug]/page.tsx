import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Tag, Layers, Package } from "lucide-react";
import {
  getProductBySlug,
  getAllProductSlugs,
} from "@/lib/data/products";

export async function generateStaticParams() {
  return await getAllProductSlugs();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Prime Hairs`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const { derivedStock } = product;

  return (
    <section className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-light-gray hover:text-gold transition-colors mb-8"
      >
        ← Back to products
      </Link>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface/50 border border-muted/10">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Multiple images gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border ${
                    img.isPrimary
                      ? "border-gold shadow-sm"
                      : "border-muted/30 hover:border-gold/60"
                  } shrink-0 transition-colors`}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6 justify-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl">{product.name}</h1>

            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-semibold text-gold">
                ${product.price.toFixed(2)}
              </span>
              <span
                className={`pill ${!derivedStock.inStock ? "opacity-70" : ""}`}
              >
                {derivedStock.label}
              </span>
            </div>
          </div>

          <p className="text-light-gray leading-relaxed text-sm">
            {product.description}
          </p>

          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2.5 text-light-gray">
              <Tag size={15} className="text-gold shrink-0" />
              <span>
                Category:{" "}
                <span className="text-white font-medium">
                  {product.category}
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-light-gray">
              <Layers size={15} className="text-gold shrink-0" />
              <span>
                Material:{" "}
                <span className="text-white font-medium">
                  {product.material}
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2.5 text-light-gray">
              <Package size={15} className="text-gold shrink-0" />
              <span>
                Stock:{" "}
                <span className={`font-medium ${derivedStock.colorClass}`}>
                  {derivedStock.label}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
