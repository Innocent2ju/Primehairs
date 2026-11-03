"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";
import ProceedToCheckoutButton from "./ProceedToCheckoutButton";

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    isHydrated,
  } = useCart();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const displayCount = isHydrated ? totalItems : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-full text-light-gray hover:text-gold transition-colors focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
        aria-expanded={isOpen}
        aria-label={`Shopping Cart, ${displayCount} items`}
      >
        <ShoppingBag size={20}  />
        <span className="font-medium text-sm">Cart</span>

        {displayCount > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center animate-in fade-in zoom-in duration-200">
            {displayCount > 99 ? "99+" : displayCount}
          </span>
        )}
      </button>

      {/* Responsive Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-label="Cart Overview"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-gold" />
              <h3 className="text-base font-semibold text-white">Your Cart</h3>
              {displayCount > 0 && (
                <span className="text-xs text-light-gray/70">
                  ({displayCount} {displayCount === 1 ? "item" : "items"})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-light-gray hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close cart dropdown"
            >
              <X size={18} />
            </button>
          </div>

          {/* Selected Goods List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-white/5 px-4 py-2">
            {!isHydrated || items.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-light-gray/40">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    Your cart is empty
                  </p>
                  <p className="text-light-gray/60 text-xs mt-1">
                    Explore our luxury hair collection to add items.
                  </p>
                </div>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 text-xs text-gold hover:underline font-medium"
                >
                  Browse Products →
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center gap-3 group"
                >
                  {/* Item Image Thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-medium text-white truncate hover:text-gold transition-colors block"
                      title={item.name}
                    >
                      {item.name}
                    </Link>

                    <div className="text-xs text-light-gray/70 mt-0.5">
                      ${Number(item.price).toFixed(2)} each
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center border border-white/10 rounded-md bg-black/30">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-6 h-6 flex items-center justify-center text-light-gray hover:text-gold transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.stock !== undefined &&
                            item.quantity >= item.stock
                          }
                          className="w-6 h-6 flex items-center justify-center text-light-gray hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-xs font-semibold text-gold ml-auto">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Item Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-light-gray/50 hover:text-red-400 p-1 rounded transition-colors self-start cursor-pointer"
                    aria-label={`Remove ${item.name} from cart`}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Total Prices Underneath & Checkout Button */}
          {items.length > 0 && (
            <div className="border-t border-white/10 bg-[#121212] p-4 space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-light-gray font-medium">Subtotal</span>
                <span className="text-white font-semibold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-base font-bold text-white">Total</span>
                <span className="text-xl font-bold text-gold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Proceed to checkout client button */}
              <ProceedToCheckoutButton
                totalPrice={totalPrice}
                disabled={items.length === 0}
                onCheckout={() => {
                  setIsOpen(false);
                  alert(
                    `Proceeding to checkout with ${totalItems} items ($${totalPrice.toFixed(
                      2
                    )})`
                  );
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
