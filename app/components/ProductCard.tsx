"use client";

import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { Wig } from "@/lib/constants";

export default function ProductCard({ wig }: { wig: Wig }) {
  return (
    <Link
      href={`/products/${wig.slug}`}
      id="product-card"
      onClick={() => {
        if (
          process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
          posthog.capture("product_card_selected", {
            product_id: wig.id,
            product_slug: wig.slug,
            product_category: wig.category,
            product_price: wig.price,
            in_stock: wig.inStock,
          });
        }
      }}
    >
      <Image
        src={wig.image}
        alt={wig.name}
        width={400}
        height={300}
        className="poster"
      />
      <h4 className="title">{wig.name}</h4>
      <p>{wig.category}</p>
      <div className="price-stock">
        <span className="text-gold font-semibold">
          ${wig.price.toFixed(2)}
        </span>
        <span className="pill">
          {wig.inStock ? "In Stock" : "Sold Out"}
        </span>
      </div>
    </Link>
  );
}
