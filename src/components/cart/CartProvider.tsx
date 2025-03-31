'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  maxQuantity?: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  isOpen: false,
  isLoading: false,
  error: null,
  sessionId: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + action.payload.quantity;
        const maxQty = action.payload.maxQuantity ?? Infinity;
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.min(newQuantity, maxQty) }
              : item
          ),
          error: null,
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload],
        error: null,
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        error: null,
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity < 0) {
        return { ...state, error: 'Quantity cannot be negative' };
      }
      if (action.payload.quantity === 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
          error: null,
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        error: null,
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [], error: null };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'LOAD_CART':
      return { ...state, items: action.payload ?? [], error: null };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  clearError: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function generateSessionId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getStoredSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem('cartcraft_session_id');
  } catch (error) {
    console.warn('Failed to read session ID from localStorage:', error);
    return null;
  }
}

function setStoredSessionId(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem('cartcraft_session_id', sessionId);
  } catch (error) {
    console.warn('Failed to store session ID in localStorage:', error);
  }
}

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem('cartcraft_items');
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid cart data in localStorage, resetting');
      return [];
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to parse cart from localStorage:', error);
    return [];
  }
}

function setStoredCart(items: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem('cartcraft_items', JSON.stringify(items ?? []));
  } catch (error) {
    console.warn('Failed to store cart in localStorage:', error);
  }
}

export interface CartProviderProps {
  children: ReactNode;
  persistToDatabase?: boolean;
}

export function CartProvider({ children, persistToDatabase = false }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    let sessionId = getStoredSessionId();
    if (!sessionId) {
      sessionId = generateSessionId();
      setStoredSessionId(sessionId);
    }
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });

    const storedItems = getStoredCart();
    if (storedItems.length > 0) {
      dispatch({ type: 'LOAD_CART', payload: storedItems });
    }
  }, []);

  useEffect(() => {
    if (state.sessionId) {
      setStoredCart(state.items);
    }
  }, [state.items, state.sessionId]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    if (!item.id || !item.name || typeof item.price !== 'number') {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid item data' });
      return;
    }
    dispatch({
      type: 'ADD_ITEM',
      payload: { ...item, quantity: item.quantity ?? 1 },
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    if (!id) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid item ID' });
      return;
    }
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!id) {
      dispatch({ type: 'SET_ERROR', payload: 'Invalid item ID' });
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, []);

  const setCartOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: isOpen });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const totalItems = state.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0),
    0
  );

  const value: CartContextValue = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    setCartOpen,
    clearError,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
