import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import { wigs } from "@/lib/constants";

export const generateStaticParams = () =>
  wigs.map(({ slug }) => ({ slug }));

const ProductPage = async ({ params }: PageProps<"/products/[slug]">) => {
  const { slug } = await params;
  const product = wigs.find((wig) => wig.slug === slug);

  if (!product) notFound();

  const variants = product.variants?.length ? product.variants : [product.image];

  return (
    <section className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14">
      <ProductGallery name={product.name} variants={variants} />

      <div className="flex flex-col gap-5 md:py-4">
        <span className="pill w-fit">{product.category}</span>

        <h1 className="text-left max-sm:text-4xl">{product.name}</h1>

        <p className="text-3xl font-semibold text-gold">
          ${product.price.toFixed(2)}
        </p>

        <p className="text-sm font-light leading-relaxed text-light-gray">
          {product.description}
        </p>

        <div className="glass flex items-center justify-between rounded-md px-4 py-3">
          <span className="text-sm font-medium text-white">Stock</span>
          <span className="flex items-center gap-2 text-sm font-light text-light-gray">
            <span
              className={`h-2 w-2 rounded-full ${
                product.inStock ? "bg-gold" : "bg-red-500"
              }`}
            />
            {product.inStock ? `${product.stock} in stock` : "Sold out"}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ProductPage;