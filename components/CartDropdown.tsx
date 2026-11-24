"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "@/context/cart-context";
import type { ProductAttribute } from "@/database";

const ATTRIBUTE_LABELS: Record<ProductAttribute, string> = {
  hairType: "Hair Type",
  hairVolume: "Hair Volume",
  density: "Density",
  colors: "Color",
  hairLength: "Length",
  laceType: "Lace",
  closureSizes: "Closure Size",
};

const formatAttributes = (
  attributes: Partial<Record<ProductAttribute, string>>,
): string =>
  Object.entries(attributes)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(
      ([key, value]) =>
        `${ATTRIBUTE_LABELS[key as ProductAttribute] ?? key}: ${value}`,
    )
    .join(" • ");

const formatNaira = (value: number): string =>
  `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const CartDropdown = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
  } = useCart();
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) return;
      if (cardRef.current?.contains(target)) return;
      if (target.closest("[data-cart-trigger]")) return;

      closeCart();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Shopping cart"
      aria-modal="false"
      className="absolute right-0 top-full z-50 mt-3 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gold/25 bg-[#1A1A1A]/95 text-white shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="font-playfair text-lg font-bold text-white">
            Shopping Bag
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-wider text-gold">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>

        <button
          type="button"
          onClick={closeCart}
          aria-label="Close cart"
          className="flex size-7 cursor-pointer items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/10"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-gold/20 bg-gold/5 text-gold">
            <ShoppingBag className="size-5" aria-hidden="true" />
          </span>

          <div>
            <p className="text-sm font-semibold text-white">
              Your bag is empty
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Add a piece from the collection to get started.
            </p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="mt-1 cursor-pointer rounded-full border border-gold/30 px-4 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            Continue shopping
          </button>
        </div>
      ) : (
        <>
          <ul className="max-h-[320px] divide-y divide-white/10 overflow-y-auto">
            {items.map((item) => {
              const attributes = formatAttributes(item.selectedAttributes);

              return (
                <li key={item.lineKey} className="flex gap-3 px-4 py-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-xs font-semibold leading-snug text-white">
                        {item.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.lineKey)}
                        aria-label={`Remove ${item.name}`}
                        className="-mr-1 -mt-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-gray-400 transition-colors hover:bg-white/5 hover:text-red-400"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    {attributes ? (
                      <p className="line-clamp-2 text-[11px] leading-snug text-gray-400">
                        {attributes}
                      </p>
                    ) : null}

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gold">
                        {formatNaira(item.unitPrice)}
                      </span>

                      <div className="flex items-center rounded-md border border-white/15 bg-black/30">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.lineKey, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex size-6 cursor-pointer items-center justify-center text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </button>

                        <span
                          aria-live="polite"
                          className="w-6 text-center text-[11px] font-bold text-white"
                        >
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.lineKey, item.quantity + 1)
                          }
                          disabled={item.quantity >= 99}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex size-6 cursor-pointer items-center justify-center text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-400">
                Subtotal
              </span>
              <span
                aria-live="polite"
                className="text-lg font-bold tracking-tight text-gold"
              >
                {formatNaira(subtotal)}
              </span>
            </div>

            <p className="mt-0.5 text-[10px] text-gray-500">
              Shipping &amp; taxes calculated at checkout
            </p>

            <button
              type="button"
              onClick={handleCheckout}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-xs font-bold tracking-wide text-black shadow-md transition-all duration-200 hover:bg-amber-300 focus:outline-none active:scale-[0.99] sm:text-sm"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartDropdown;
