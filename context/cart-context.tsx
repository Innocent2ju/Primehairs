"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ProductAttribute } from "@/database";

export interface CartItem {
  lineKey: string;
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedAttributes: Partial<Record<ProductAttribute, string>>;
}

export interface AddItemInput {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedAttributes?: Partial<Record<ProductAttribute, string>>;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (input: AddItemInput) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const STORAGE_KEY = "primehairs:cart:v1";
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 99;

const CartContext = createContext<CartContextValue | null>(null);

const clampQuantity = (value: number): number => {
  if (!Number.isFinite(value)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.round(value)));
};

const normalizeAttributes = (
  attributes?: Partial<Record<ProductAttribute, string>>,
): Partial<Record<ProductAttribute, string>> => {
  if (!attributes) return {};

  return Object.fromEntries(
    Object.entries(attributes).filter(
      ([, value]) => typeof value === "string" && value.length > 0,
    ),
  ) as Partial<Record<ProductAttribute, string>>;
};

const buildLineKey = (
  productId: string,
  attributes: Partial<Record<ProductAttribute, string>>,
): string => {
  const signature = Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("|");

  return signature ? `${productId}::${signature}` : productId;
};

const isStoredCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.lineKey === "string" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0 &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= MIN_QUANTITY &&
    (item.selectedAttributes === undefined ||
      (typeof item.selectedAttributes === "object" &&
        item.selectedAttributes !== null))
  );
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(
            parsed.filter(isStoredCartItem).map((item) => ({
              ...item,
              selectedAttributes: normalizeAttributes(item.selectedAttributes),
            })),
          );
        }
      }
    } catch {
      // Corrupt storage must never block the app from mounting.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private mode or quota errors leave the in-memory cart usable.
    }
  }, [items, isHydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((current) => !current), []);

  const addItem = useCallback((input: AddItemInput) => {
    const selectedAttributes = normalizeAttributes(input.selectedAttributes);
    const lineKey = buildLineKey(input.productId, selectedAttributes);
    const quantity = clampQuantity(input.quantity);
    const unitPrice =
      Number.isFinite(input.unitPrice) && input.unitPrice > 0
        ? input.unitPrice
        : 0;

    setItems((current) => {
      const index = current.findIndex((item) => item.lineKey === lineKey);

      if (index === -1) {
        return [
          ...current,
          {
            lineKey,
            productId: input.productId,
            name: input.name,
            image: input.image,
            unitPrice,
            quantity,
            selectedAttributes,
          },
        ];
      }

      const next = [...current];
      next[index] = {
        ...next[index],
        quantity: clampQuantity(next[index].quantity + quantity),
      };
      return next;
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((current) => current.filter((item) => item.lineKey !== lineKey));
  }, []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    const nextQuantity = clampQuantity(quantity);

    setItems((current) =>
      current.map((item) =>
        item.lineKey === lineKey ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { totalItems, subtotal } = useMemo(
    () =>
      items.reduce(
        (totals, item) => ({
          totalItems: totals.totalItems + item.quantity,
          subtotal: totals.subtotal + item.unitPrice * item.quantity,
        }),
        { totalItems: 0, subtotal: 0 },
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal: Math.round(subtotal * 100) / 100,
    }),
    [
      items,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
};
