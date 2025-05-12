import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import {
  CartSession,
  CartItem,
  CartOperationResult,
  AddToCartInput,
  UpdateCartItemInput,
  RemoveFromCartInput,
  CartSessionIdentifier,
} from '@/types/cart';
import { getProductById } from './products';
import { checkInventory } from './inventory';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION_NAME = 'cart_sessions';
const GUEST_SESSION_EXPIRY_DAYS = 30;
const AUTH_SESSION_EXPIRY_DAYS = 90;

async function getCollection(): Promise<Collection<CartSession>> {
  const db = await getDatabase();
  return db.collection<CartSession>(COLLECTION_NAME);
}

export function generateGuestId(): string {
  return `guest_${uuidv4()}`;
}

export function generateSessionId(): string {
  return `session_${uuidv4()}`;
}

function calculateExpiryDate(isAuthenticated: boolean): Date {
  const days = isAuthenticated ? AUTH_SESSION_EXPIRY_DAYS : GUEST_SESSION_EXPIRY_DAYS;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

function calculateCartTotals(items: CartItem[], discountAmount: number = 0): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, total };
}

export async function createCartSession(
  identifier: CartSessionIdentifier
): Promise<CartSession> {
  const collection = await getCollection();
  const now = new Date();
  
  const session: CartSession = {
    sessionId: generateSessionId(),
    ...(identifier.type === 'authenticated' ? { userId: identifier.id } : { guestId: identifier.id }),
    items: [],
    subtotal: 0,
    total: 0,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(identifier.type === 'authenticated'),
  };

  const result = await collection.insertOne(session as any);
  return { ...session, _id: result.insertedId.toString() };
}

export async function getCartSession(
  identifier: CartSessionIdentifier
): Promise<CartSession | null> {
  const collection = await getCollection();
  
  const query = identifier.type === 'authenticated'
    ? { userId: identifier.id }
    : { guestId: identifier.id };

  const session = await collection.findOne({
    ...query,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: { $exists: false } },
    ],
  });

  return session;
}

export async function getOrCreateCartSession(
  identifier: CartSessionIdentifier
): Promise<CartSession> {
  let session = await getCartSession(identifier);
  
  if (!session) {
    session = await createCartSession(identifier);
  }

  return session;
}

export async function addToCart(
  identifier: CartSessionIdentifier,
  input: AddToCartInput
): Promise<CartOperationResult> {
  try {
    const product = await getProductById(input.productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const inventoryCheck = await checkInventory(input.productId, input.quantity);
    if (!inventoryCheck.available) {
      return {
        success: false,
        error: `Insufficient stock. Only ${inventoryCheck.currentStock} available.`,
      };
    }

    const session = await getOrCreateCartSession(identifier);
    const collection = await getCollection();

    const existingItemIndex = session.items.findIndex(
      (item) =>
        item.productId === input.productId &&
        item.variantId === input.variantId
    );

    let updatedItems: CartItem[];

    if (existingItemIndex >= 0) {
      updatedItems = [...session.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + input.quantity,
      };
    } else {
      const newItem: CartItem = {
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        price: product.price,
        name: product.name,
        image: product.images?.[0]?.url,
        addedAt: new Date(),
      };
      updatedItems = [...session.items, newItem];
    }

    const { subtotal, total } = calculateCartTotals(updatedItems, session.discountAmount);

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          items: updatedItems,
          subtotal,
          total,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: 'Failed to add item to cart' };
  }
}

export async function updateCartItem(
  identifier: CartSessionIdentifier,
  input: UpdateCartItemInput
): Promise<CartOperationResult> {
  try {
    if (input.quantity <= 0) {
      return removeFromCart(identifier, {
        productId: input.productId,
        variantId: input.variantId,
      });
    }

    const inventoryCheck = await checkInventory(input.productId, input.quantity);
    if (!inventoryCheck.available) {
      return {
        success: false,
        error: `Insufficient stock. Only ${inventoryCheck.currentStock} available.`,
      };
    }

    const session = await getCartSession(identifier);
    if (!session) {
      return { success: false, error: 'Cart session not found' };
    }

    const collection = await getCollection();

    const itemIndex = session.items.findIndex(
      (item) =>
        item.productId === input.productId &&
        item.variantId === input.variantId
    );

    if (itemIndex < 0) {
      return { success: false, error: 'Item not found in cart' };
    }

    const updatedItems = [...session.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      quantity: input.quantity,
    };

    const { subtotal, total } = calculateCartTotals(updatedItems, session.discountAmount);

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          items: updatedItems,
          subtotal,
          total,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error: 'Failed to update cart item' };
  }
}

export async function removeFromCart(
  identifier: CartSessionIdentifier,
  input: RemoveFromCartInput
): Promise<CartOperationResult> {
  try {
    const session = await getCartSession(identifier);
    if (!session) {
      return { success: false, error: 'Cart session not found' };
    }

    const collection = await getCollection();

    const updatedItems = session.items.filter(
      (item) =>
        !(item.productId === input.productId && item.variantId === input.variantId)
    );

    const { subtotal, total } = calculateCartTotals(updatedItems, session.discountAmount);

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          items: updatedItems,
          subtotal,
          total,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: 'Failed to remove item from cart' };
  }
}

export async function clearCart(
  identifier: CartSessionIdentifier
): Promise<CartOperationResult> {
  try {
    const session = await getCartSession(identifier);
    if (!session) {
      return { success: false, error: 'Cart session not found' };
    }

    const collection = await getCollection();

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          items: [],
          subtotal: 0,
          total: 0,
          discountCode: undefined,
          discountAmount: undefined,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: 'Failed to clear cart' };
  }
}

export async function mergeGuestCartToUser(
  guestId: string,
  userId: string
): Promise<CartOperationResult> {
  try {
    const guestSession = await getCartSession({ type: 'guest', id: guestId });
    if (!guestSession || guestSession.items.length === 0) {
      return { success: true, cart: await getOrCreateCartSession({ type: 'authenticated', id: userId }) };
    }

    const userSession = await getOrCreateCartSession({ type: 'authenticated', id: userId });
    const collection = await getCollection();

    // Merge items, preferring user cart quantities for duplicates
    const mergedItems = [...userSession.items];
    
    for (const guestItem of guestSession.items) {
      const existingIndex = mergedItems.findIndex(
        (item) =>
          item.productId === guestItem.productId &&
          item.variantId === guestItem.variantId
      );

      if (existingIndex >= 0) {
        mergedItems[existingIndex].quantity += guestItem.quantity;
      } else {
        mergedItems.push(guestItem);
      }
    }

    const { subtotal, total } = calculateCartTotals(mergedItems, userSession.discountAmount);

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: userSession.sessionId },
      {
        $set: {
          items: mergedItems,
          subtotal,
          total,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    // Delete guest session after merge
    await collection.deleteOne({ sessionId: guestSession.sessionId });

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error merging carts:', error);
    return { success: false, error: 'Failed to merge carts' };
  }
}

export async function applyDiscountToCart(
  identifier: CartSessionIdentifier,
  discountCode: string,
  discountAmount: number
): Promise<CartOperationResult> {
  try {
    const session = await getCartSession(identifier);
    if (!session) {
      return { success: false, error: 'Cart session not found' };
    }

    const collection = await getCollection();
    const { subtotal, total } = calculateCartTotals(session.items, discountAmount);

    const updateResult = await collection.findOneAndUpdate(
      { sessionId: session.sessionId },
      {
        $set: {
          discountCode,
          discountAmount,
          subtotal,
          total,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return { success: true, cart: updateResult as CartSession };
  } catch (error) {
    console.error('Error applying discount:', error);
    return { success: false, error: 'Failed to apply discount' };
  }
}
