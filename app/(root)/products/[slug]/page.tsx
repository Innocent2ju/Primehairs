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
{ cache: "no-store" }
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
{/* Breadcrumbs */}
<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-8">
<ol className="flex items-center gap-2">
<li className="flex items-center gap-2">
<Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
<ChevronRight className="size-4" aria-hidden="true" />
</li>
<li className="flex items-center gap-2">
<Link href="/products" className="hover:text-amber-400 transition-colors">Products</Link>
<ChevronRight className="size-4" aria-hidden="true" />
</li>
<li>
<span aria-current="page" className="text-white truncate max-w-[200px]">{title}</span>
</li>
</ol>
</nav>

<article className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

{/* Left Column: Image Gallery + Description & Overview (Big Screens) */}
<div className="lg:col-span-7 flex flex-col gap-8">
<ProductGallery name={title} variants={galleryImages} />

<div className="hidden lg:flex flex-col gap-6 pt-6 border-t border-white/10">
<div>
<h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Description</h2>
<p className="text-sm text-gray-300 leading-relaxed">{description}</p>
</div>
{overview && (
<div>
<h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Overview</h2>
<p className="text-sm text-gray-300 leading-relaxed">{overview}</p>
</div>
)}
</div>
</div>

{/* Right Column: Title, Mobile Description/Overview, and Purchase Box */}
<div className="lg:col-span-5 flex flex-col gap-6">
<div className="flex flex-col gap-3">
<span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">100% Raw Human Hair</span>
<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{title}</h1>
<ProductRatingSummary slug={slug} count={ratingStats.count} highestStars={ratingStats.highestStars} />
</div>

{/* Mobile Description & Overview */}
<div className="flex lg:hidden flex-col gap-4 text-sm text-gray-300 border-y border-white/10 py-4">
<p>{description}</p>
{overview && <p className="text-gray-400">{overview}</p>}
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

const Breadcrumbs = ({ slug }: { slug: string }) => (
<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-8">
<ol className="flex items-center gap-2">
<li className="flex items-center gap-2">
<Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
<ChevronRight className="size-4" aria-hidden="true" />
</li>
<li className="flex items-center gap-2">
<Link href="/products" className="hover:text-amber-400 transition-colors">Products</Link>
<ChevronRight className="size-4" aria-hidden="true" />
</li>
<li>
<span className="text-white truncate max-w-[200px]">{slug}</span>
</li>
</ol>
</nav>
);

const ProductDetailsPage = ({ params }: ProductPageProps) => (
<div className="min-h-screen text-white px-4 py-8 md:px-12 lg:px-24">
{/* Static skeleton: safe to prerender, replaced once the slug resolves. */}
<Suspense
fallback={
<>
<Breadcrumbs slug=" " />
<div role="status" className="text-center py-20 text-amber-400 animate-pulse">Loading...</div>
</>
}
>
{/* params and the product fetch both resolve inside this boundary. */}
<ProductLoader params={params} />
</Suspense>
</div>
);

const ProductLoader = async ({ params }: ProductPageProps) => {
const { slug } = await params;
return <ProductDetails slug={slug} />;
};

export default ProductDetailsPage;
