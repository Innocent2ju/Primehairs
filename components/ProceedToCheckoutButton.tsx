"use client";

import React, { useState } from "react";
import { ArrowRight, ShoppingBag, Check } from "lucide-react";
import posthog from "posthog-js";

interface ProceedToCheckoutButtonProps {
  totalPrice?: number;
  disabled?: boolean;
  onCheckout?: () => void;
  className?: string;
}

export default function ProceedToCheckoutButton({
  totalPrice = 0,
  disabled = false,
  onCheckout,
  className = "",
}: ProceedToCheckoutButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || isProcessing) return;

    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.capture("checkout_proceed_clicked", {
        total_price: totalPrice,
      });
    }

    if (onCheckout) {
      onCheckout();
      return;
    }

    // Default checkout action: simulate proceeding to checkout
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      setTimeout(() => {
        setIsCompleted(false);
        console.log(
          `Proceeding to checkout with total: $${totalPrice.toFixed(
            2
          )}. Checkout gateway integration is ready for connection.`
        );
      }, 300);
    }, 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`w-full bg-gold hover:bg-gold/90 active:scale-[0.99] text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Proceed to checkout"
    >
      {isCompleted ? (
        <>
          <Check size={18} className="stroke-[2.5]" />
          <span>Ready for Checkout</span>
        </>
      ) : isProcessing ? (
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <span>Processing...</span>
        </span>
      ) : (
        <>
          <ShoppingBag size={18} />
          <span>Proceed to Checkout</span>
          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}
