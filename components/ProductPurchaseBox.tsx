"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Check, ChevronDown } from "lucide-react";

import type {
  AttributePricingRule,
  Product,
  ProductAttribute,
} from "@/database";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

type SelectableAttributes = Pick<Product, ProductAttribute>;

const ATTRIBUTE_FIELDS: ReadonlyArray<{
  key: ProductAttribute;
  label: string;
}> = [
  { key: "hairType", label: "Hair Type" },
  { key: "hairVolume", label: "Hair Volume" },
  { key: "density", label: "Density" },
  { key: "colors", label: "Color" },
  { key: "hairLength", label: "Hair Length" },
  { key: "laceType", label: "Lace Type" },
  { key: "closureSizes", label: "Closure Size" },
];

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

export type ProductSelection = Partial<Record<ProductAttribute, string>>;

export interface AddToCartPayload {
  selections: ProductSelection;
  quantity: number;
  basePrice: string;
  unitPrice: string;
}

interface ProductPurchaseBoxProps {
  basePrice: string;
  productId: string;
  productName: string;
  productImage: string;
  attributePricing: AttributePricingRule[];
  attributes: SelectableAttributes;
  onAddToCart?: (payload: AddToCartPayload) => void;
}

const toCents = (amount: string): number => {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

const formatPrice = (cents: number): string =>
  `₦${(cents / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ProductPurchaseBox({
  basePrice,
  attributePricing,
  attributes,
  onAddToCart,
  productId,
  productName,
  productImage,
}: ProductPurchaseBoxProps) {
  const [selection, setSelection] = useState<ProductSelection>({});
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem, openCart } = useCart();

  const basePriceCents = toCents(basePrice);

  // Calculate live unit price based on active attribute pricing rules
  const unitPriceCents = useMemo(() => {
    const rulesTotal = attributePricing.reduce(
      (total, rule) =>
        selection[rule.attribute] === rule.value
          ? total + toCents(rule.price)
          : total,
      0,
    );

    return basePriceCents + rulesTotal;
  }, [attributePricing, basePriceCents, selection]);

  const handleSelectChange = (attribute: ProductAttribute, value: string) => {
    setSelection((current) => ({
      ...current,
      [attribute]: value === "" ? undefined : value,
    }));
  };

  const handleAddToCart = () => {
    const selectedAttributes = Object.fromEntries(
      Object.entries(selection).filter(([, value]) => Boolean(value)),
    ) as ProductSelection;

    addItem({
      productId,
      name: productName,
      image: productImage,
      unitPrice: unitPriceCents / 100,
      quantity,
      selectedAttributes,
    });
    openCart();

    const payload: AddToCartPayload = {
      selections: selectedAttributes,
      quantity,
      basePrice,
      unitPrice: (unitPriceCents / 100).toFixed(2),
    };

    onAddToCart?.(payload);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 pb-24 lg:pb-0">
      
      {/* 1. DESKTOP PRICE AT THE TOP (Hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-between py-3 border-b border-white/10">
        <div>
          <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">
            Price
          </span>
          <p className="text-3xl sm:text-4xl font-bold text-amber-400 tracking-tight">
            {formatPrice(unitPriceCents * quantity)}
          </p>
        </div>

        
      </div>

      {/* 2. ATTRIBUTE DROPDOWNS (Short, compact pills in a 2-column grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        {ATTRIBUTE_FIELDS.map(({ key, label }) => {
          const options = attributes[key];
          if (!options || options.length === 0) return null;

          return (
            <div key={key} className="flex flex-col gap-1">
              <label
                htmlFor={key}
                className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
              >
                {label}
              </label>

              <div className="relative">
                <select
                  id={key}
                  value={selection[key] || ""}
                  onChange={(e) => handleSelectChange(key, e.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/15 bg-neutral-900/90 px-2.5 py-1.5 text-xs text-white font-medium focus:border-amber-500 focus:outline-none transition-all cursor-pointer pr-7"
                >
                  <option
                    value=""
                    disabled
                    className="bg-neutral-900 text-gray-400"
                  >
                    Select {label}
                  </option>
                  {options.map((option) => (
                    <option
                      key={option}
                      value={option}
                      className="bg-neutral-900 text-white"
                    >
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. PRICE & QUANTITY / ADD TO CART (Fixed bottom bar on < lg, normal flow on lg+) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-neutral-950/95 px-4 py-3 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.45)] lg:static lg:inset-auto lg:z-auto lg:border-t lg:border-white/10 lg:bg-transparent lg:px-0 lg:pt-3 lg:pb-0 lg:backdrop-blur-none lg:shadow-none">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-2.5 lg:max-w-none lg:gap-3">
          {/* Mobile Price Row */}
          <div className="flex lg:hidden items-center justify-between px-0.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              Total Price
            </span>
            <span className="text-lg font-bold text-amber-400 tabular-nums tracking-tight">
              {formatPrice(unitPriceCents * quantity)}
            </span>
          </div>

          {/* Quantity & Add to Cart Row */}
          <div className="flex flex-row items-center justify-between gap-2.5">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between rounded-lg border border-white/15 p-1 w-28 sm:w-36 bg-neutral-900/70">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(MIN_QUANTITY, current - 1))
                }
                disabled={quantity <= MIN_QUANTITY}
                aria-label="Decrease quantity"
                className="flex items-center justify-center size-8 cursor-pointer rounded text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="size-3.5" aria-hidden="true" />
              </button>

              <span
                aria-live="polite"
                className="text-sm font-bold text-white tabular-nums"
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.min(MAX_QUANTITY, current + 1))
                }
                disabled={quantity >= MAX_QUANTITY}
                aria-label="Increase quantity"
                className="flex items-center justify-center size-8 cursor-pointer rounded text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="size-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={cn(
                "w-36 sm:w-44 lg:flex-1 flex items-center justify-center gap-2 cursor-pointer rounded-lg px-4 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 focus:outline-none shadow-md",
                isAdded
                  ? "bg-green-600 text-white"
                  : "bg-amber-400 text-black hover:bg-amber-300 active:scale-[0.98]",
              )}
            >
              {isAdded ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}