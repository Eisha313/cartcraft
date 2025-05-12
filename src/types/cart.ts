export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image?: string;
  addedAt: Date;
}

export interface Cart {
  _id?: any;
  sessionId: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartSession {
  _id?: string;
  sessionId: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
  discountCode?: string;
  discountAmount?: number;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CartOperationResult {
  success: boolean;
  cart?: CartSession;
  error?: string;
}

export interface AddToCartInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface RemoveFromCartInput {
  productId: string;
  variantId?: string;
}

export type CartSessionType = 'guest' | 'authenticated';

export interface CartSessionIdentifier {
  type: CartSessionType;
  id: string;
}
