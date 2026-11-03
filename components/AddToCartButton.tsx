"use client";

import React, { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "./CartProvider";
import posthog from "posthog-js";

interface MinimalProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  inStock?: boolean;
  stock?: number;
  category?: string;
  derivedStock?: {
    inStock: boolean;
    quantity: number;
  };
}

interface AddToCartButtonProps {
  product: MinimalProduct;
  quantity?: number;
  compact?: boolean;
  className?: string;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  compact = false,
  className = "",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const isInStock =
    product.derivedStock !== undefined
      ? product.derivedStock.inStock
      : product.inStock !== false;

  const maxStock =
    product.derivedStock?.quantity ?? product.stock ?? undefined;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock || isAdded) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        stock: maxStock,
      },
      quantity
    );

    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.capture("product_added_to_cart", {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity,
      });
    }

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!isInStock}
        title={isInStock ? "Add to cart" : "Sold out"}
        className={`inline-flex items-center justify-center p-2 rounded-lg bg-gold/15 text-gold hover:bg-gold hover:text-black border border-gold/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        aria-label={`Add ${product.name} to cart`}
      >
        {isAdded ? (
          <Check size={16} className="stroke-[2.5]" />
        ) : (
          <ShoppingBag size={16} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={!isInStock}
      className={`w-full py-3.5 px-6 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
        isInStock
          ? "bg-gold hover:bg-gold/90 text-black active:scale-[0.99] shadow-lg"
          : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
      } ${className}`}
    >
      {isAdded ? (
        <>
          <Check size={18} className="stroke-[2.5]" />
          <span>Added to Cart!</span>
        </>
      ) : isInStock ? (
        <>
          <ShoppingBag size={18} />
          <span>Add to Cart</span>
        </>
      ) : (
        <span>Out of Stock</span>
      )}
    </button>
  );
}
