"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

export interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
  stock?: number;
}

export interface AddItemInput {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity?: number;
  category?: string;
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: AddItemInput, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "primehairs_cart_items";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize cart from localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save cart to localStorage when it changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [items, isHydrated]);

  const addItem = useCallback((item: AddItemInput, addQty: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantity + addQty;
        // Check max stock if available
        const maxStock = item.stock ?? currentItem.stock;
        const cappedQty = maxStock ? Math.min(newQty, maxStock) : newQty;

        updated[existingIndex] = {
          ...currentItem,
          quantity: cappedQty,
        };
        return updated;
      }

      const initialQty = item.quantity ?? addQty;
      const maxStock = item.stock;
      const cappedQty = maxStock ? Math.min(initialQty, maxStock) : initialQty;

      return [
        ...prevItems,
        {
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          image: item.image,
          quantity: cappedQty,
          category: item.category,
          stock: item.stock,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const maxStock = item.stock;
          const cappedQty = maxStock ? Math.min(quantity, maxStock) : quantity;
          return { ...item, quantity: cappedQty };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isHydrated,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isHydrated,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
