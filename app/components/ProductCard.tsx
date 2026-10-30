"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { StorefrontProduct } from "@/lib/data/products";

interface ProductCardProps {
  product?: StorefrontProduct;
  wig?: StorefrontProduct;
}

export default function ProductCard({ product, wig }: ProductCardProps) {
  const item = (product ?? wig)!;
  if (!item) return null;

  return (
    <Link
      href={`/products/${item.slug}`}
      id="product-card"
      onClick={() => {
        if (
          process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
          posthog.capture("product_card_selected", {
            product_id: item.id,
            product_slug: item.slug,
            product_category: item.category,
            product_price: item.price,
            in_stock: item.inStock,
          });
        }
      }}
    >
      <Image
        src={item.image}
        alt={item.name}
        width={400}
        height={300}
        className="poster"
      />
      <h4 className="title">{item.name}</h4>
      <p>{item.category}</p>
      <div className="price-stock">
        <span className="text-gold font-semibold">
          ${item.price.toFixed(2)}
        </span>
        <span className={`pill ${!item.inStock ? "opacity-70" : ""}`}>
          {item.derivedStock ? item.derivedStock.label : item.inStock ? "In Stock" : "Sold Out"}
        </span>
      </div>
    </Link>
  );
}
