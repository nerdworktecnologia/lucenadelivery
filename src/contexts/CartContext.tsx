import { createContext, useContext, useState, ReactNode } from "react";
import { ProductAddon } from "@/types/orders";

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  addons: ProductAddon[];
  notes: string;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => setItems((prev) => [...prev, item]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateQuantity = (index: number, qty: number) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    );

  const clearCart = () => setItems([]);

  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.price + item.addons.reduce((s, a) => s + a.price, 0)) *
        item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};
