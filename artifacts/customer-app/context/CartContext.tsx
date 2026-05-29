import React, { createContext, useContext, useState } from "react";

export interface CartItem {
  productId: string;
  name: string;
  pricePaise: number;
  quantity: number;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  vendorId: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { vendorId: string }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalPaise: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const addItem = ({ vendorId: vid, ...item }: Omit<CartItem, "quantity"> & { vendorId: string }) => {
    if (vendorId && vendorId !== vid) {
      setItems([{ ...item, quantity: 1 }]);
      setVendorId(vid);
      return;
    }
    setVendorId(vid);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setItems([]);
    setVendorId(null);
  };

  const totalPaise = items.reduce((sum, i) => sum + i.pricePaise * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, vendorId, addItem, removeItem, updateQuantity, clearCart, totalPaise, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
