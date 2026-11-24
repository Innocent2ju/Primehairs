import Link from "next/link";

import ProductRatingSummary from "@/components/ProductRatingSummary";

interface Props {
  title: string;
  image: string;
  slug: string;
  basePrice: string | number;
  category?: string;
  /** Real review count for this product; 0 when it has none. */
  reviewCount?: number;
  /** Highest star rating (1–5) or null when there are no reviews. */
  highestStars?: number | null;
}

const ProductCard = ({
  title,
  image,
  slug,
  basePrice,
  category,
  reviewCount = 0,
  highestStars = null,
}: Props) => {
  return (
    <div id="product-card" className="relative">
      {/* Overlay keeps the whole card clickable without nesting links. */}
      <Link
        href={`/products/${slug}`}
        className="absolute inset-0 z-0"
        aria-label={`View ${title}`}
      />
      <img src={image} alt={title} className="poster" />
      <h3 className="title">{title}</h3>
      <ProductRatingSummary
        slug={slug}
        count={reviewCount}
        highestStars={highestStars}
        className="relative z-10"
      />
      <p>{category}</p>
      <div className="price-stock">
        <p>₦{Number(basePrice).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ProductCard;
