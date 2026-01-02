/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { type CartItem } from "../types";

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("vortex_cart");
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    // Preserve all fields including optional ones (ean, originalPrice, reducedPrice)
    return parsed.map((item: unknown) => {
      const it = item as CartItem;
      return {
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        category: it.category,
        image: it.image,
        ean: it.ean,
        originalPrice: it.originalPrice,
        reducedPrice: it.reducedPrice,
      };
    });
  } catch {
    return [];
  }
}

// Cart persistence handled in App.tsx via utils/cartStorage.ts; local save disabled here

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; quantity: number }
  | { type: "CLEAR" };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const item = action.item;
      const existing = state.find((p) => p.id === item.id);
      if (existing) {
        return state.map((p) =>
          p.id === item.id
            ? { ...p, quantity: (p.quantity || 1) + (item.quantity || 1) }
            : p
        );
      }
      return [...state, { ...item, quantity: item.quantity || 1 }];
    }
    case "REMOVE_ITEM":
      return state.filter((p) => p.id !== action.id);
    case "UPDATE_QTY":
      return state.map((p) =>
        p.id === action.id ? { ...p, quantity: action.quantity } : p
      );
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  // DISABLED: App.tsx handles cart persistence via utils/cartStorage.ts
  // Keeping this active causes conflicts where CartContext overwrites
  // App.tsx's cart data, stripping fields like EAN, originalPrice, reducedPrice
  // useEffect(() => {
  //   saveCart(items);
  // }, [items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: "REMOVE_ITEM", id });
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", id, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0),
    [items]
  );

  const value: CartContextValue = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clearCart, total }),
    [items, addItem, removeItem, updateQty, clearCart, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
