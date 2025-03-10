'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Cart item interface matching our MongoDB schema
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CartDiscount {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  amount: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: CartDiscount | null;
  total: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<boolean>;
  removeDiscount: () => void;
  checkout: () => Promise<string | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_KEY = 'cartcraft_session_id';

// Get or create session ID for guest users
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<CartDiscount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - (discount?.amount || 0));

  // Load cart from server on mount
  useEffect(() => {
    const sid = getSessionId();
    setSessionId(sid);
    
    async function loadCart() {
      try {
        const response = await fetch(`/api/cart?sessionId=${sid}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
          if (data.discountCode) {
            setDiscount(data.discount);
          }
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCart();
  }, []);

  // Sync cart to server
  const syncCart = useCallback(async (newItems: CartItem[]) => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, items: newItems }),
      });
    } catch (error) {
      console.error('Failed to sync cart:', error);
    }
  }, [sessionId]);

  const addItem = useCallback(async (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      let newItems: CartItem[];
      
      if (existing) {
        newItems = prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newItems = [...prev, { ...item, quantity }];
      }
      
      syncCart(newItems);
      return newItems;
    });
  }, [syncCart]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(productId);
    }
    
    setItems((prev) => {
      const newItems = prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      syncCart(newItems);
      return newItems;
    });
  }, [syncCart]);

  const removeItem = useCallback(async (productId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.productId !== productId);
      syncCart(newItems);
      return newItems;
    });
  }, [syncCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    setDiscount(null);
    await syncCart([]);
  }, [syncCart]);

  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiscount(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [subtotal]);

  const removeDiscount = useCallback(() => {
    setDiscount(null);
  }, []);

  const checkout = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          items,
          discountCode: discount?.code,
        }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        return url;
      }
      return null;
    } catch {
      return null;
    }
  }, [sessionId, items, discount]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        total,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyDiscount,
        removeDiscount,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartProvider;