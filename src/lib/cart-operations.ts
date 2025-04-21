import { ObjectId, Collection } from 'mongodb';
import { getMongoClient } from './mongodb';
import { Cart, CartItem } from '@/types/cart';
import { getProductById, updateProductStock } from './products';
import { validateDiscountCode, applyDiscount } from './discounts';

const CART_COLLECTION = 'carts';

async function getCartCollection(): Promise<Collection<Cart>> {
  const client = await getMongoClient();
  return client.db().collection<Cart>(CART_COLLECTION);
}

export interface CartOperationResult {
  success: boolean;
  cart?: Cart;
  error?: string;
}

export async function getCart(sessionId: string, userId?: string): Promise<Cart | null> {
  const collection = await getCartCollection();
  
  const query = userId 
    ? { $or: [{ userId }, { sessionId }] }
    : { sessionId };
  
  return collection.findOne(query);
}

export async function createCart(sessionId: string, userId?: string): Promise<Cart> {
  const collection = await getCartCollection();
  
  const newCart: Cart = {
    _id: new ObjectId(),
    sessionId,
    userId,
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await collection.insertOne(newCart);
  return newCart;
}

export async function getOrCreateCart(sessionId: string, userId?: string): Promise<Cart> {
  const existingCart = await getCart(sessionId, userId);
  if (existingCart) return existingCart;
  return createCart(sessionId, userId);
}

export async function addItemToCart(
  sessionId: string,
  productId: string,
  quantity: number,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const product = await getProductById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    
    if (product.stock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }
    
    const cart = await getOrCreateCart(sessionId, userId);
    const collection = await getCartCollection();
    
    const existingItemIndex = cart.items.findIndex(
      item => item.productId === productId
    );
    
    if (existingItemIndex >= 0) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return { success: false, error: 'Insufficient stock for requested quantity' };
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      const newItem: CartItem = {
        productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images?.[0],
      };
      cart.items.push(newItem);
    }
    
    const updatedCart = recalculateCartTotals(cart);
    
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          items: updatedCart.items,
          subtotal: updatedCart.subtotal,
          total: updatedCart.total,
          updatedAt: new Date()
        } 
      }
    );
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return { success: false, error: 'Failed to add item to cart' };
  }
}

export async function updateCartItemQuantity(
  sessionId: string,
  productId: string,
  quantity: number,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(sessionId, userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
    
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex < 0) {
      return { success: false, error: 'Item not found in cart' };
    }
    
    if (quantity <= 0) {
      return removeItemFromCart(sessionId, productId, userId);
    }
    
    const product = await getProductById(productId);
    if (!product) {
      return { success: false, error: 'Product no longer available' };
    }
    
    if (product.stock < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }
    
    cart.items[itemIndex].quantity = quantity;
    const updatedCart = recalculateCartTotals(cart);
    
    const collection = await getCartCollection();
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          items: updatedCart.items,
          subtotal: updatedCart.subtotal,
          total: updatedCart.total,
          updatedAt: new Date()
        } 
      }
    );
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error: 'Failed to update cart item' };
  }
}

export async function removeItemFromCart(
  sessionId: string,
  productId: string,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(sessionId, userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
    
    cart.items = cart.items.filter(item => item.productId !== productId);
    const updatedCart = recalculateCartTotals(cart);
    
    const collection = await getCartCollection();
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          items: updatedCart.items,
          subtotal: updatedCart.subtotal,
          total: updatedCart.total,
          updatedAt: new Date()
        } 
      }
    );
    
    return { success: true, cart: updatedCart };
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return { success: false, error: 'Failed to remove item from cart' };
  }
}

export async function clearCart(
  sessionId: string,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(sessionId, userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
    
    const collection = await getCartCollection();
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          items: [],
          subtotal: 0,
          discount: 0,
          discountCode: undefined,
          total: 0,
          updatedAt: new Date()
        } 
      }
    );
    
    return { 
      success: true, 
      cart: { ...cart, items: [], subtotal: 0, discount: 0, total: 0 } 
    };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: 'Failed to clear cart' };
  }
}

export async function applyDiscountToCart(
  sessionId: string,
  discountCode: string,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(sessionId, userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
    
    const discountResult = await validateDiscountCode(discountCode, cart.subtotal);
    if (!discountResult.valid) {
      return { success: false, error: discountResult.error || 'Invalid discount code' };
    }
    
    const discount = discountResult.discount!;
    const discountAmount = applyDiscount(discount, cart.subtotal);
    
    cart.discountCode = discountCode;
    cart.discount = discountAmount;
    cart.total = Math.max(0, cart.subtotal - discountAmount);
    
    const collection = await getCartCollection();
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          discountCode: cart.discountCode,
          discount: cart.discount,
          total: cart.total,
          updatedAt: new Date()
        } 
      }
    );
    
    return { success: true, cart };
  } catch (error) {
    console.error('Error applying discount:', error);
    return { success: false, error: 'Failed to apply discount' };
  }
}

export async function removeDiscountFromCart(
  sessionId: string,
  userId?: string
): Promise<CartOperationResult> {
  try {
    const cart = await getCart(sessionId, userId);
    if (!cart) {
      return { success: false, error: 'Cart not found' };
    }
    
    cart.discountCode = undefined;
    cart.discount = 0;
    cart.total = cart.subtotal;
    
    const collection = await getCartCollection();
    await collection.updateOne(
      { _id: cart._id },
      { 
        $set: { 
          discountCode: null,
          discount: 0,
          total: cart.total,
          updatedAt: new Date()
        } 
      }
    );
    
    return { success: true, cart };
  } catch (error) {
    console.error('Error removing discount:', error);
    return { success: false, error: 'Failed to remove discount' };
  }
}

export function recalculateCartTotals(cart: Cart): Cart {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  const total = Math.max(0, subtotal - (cart.discount || 0));
  
  return {
    ...cart,
    subtotal,
    total,
  };
}

export async function mergeGuestCartWithUserCart(
  sessionId: string,
  userId: string
): Promise<CartOperationResult> {
  try {
    const collection = await getCartCollection();
    
    const [guestCart, userCart] = await Promise.all([
      collection.findOne({ sessionId, userId: { $exists: false } }),
      collection.findOne({ userId }),
    ]);
    
    if (!guestCart) {
      if (userCart) {
        return { success: true, cart: userCart };
      }
      return { success: true, cart: await createCart(sessionId, userId) };
    }
    
    if (!userCart) {
      await collection.updateOne(
        { _id: guestCart._id },
        { $set: { userId, updatedAt: new Date() } }
      );
      return { success: true, cart: { ...guestCart, userId } };
    }
    
    // Merge items from guest cart into user cart
    for (const guestItem of guestCart.items) {
      const existingIndex = userCart.items.findIndex(
        item => item.productId === guestItem.productId
      );
      
      if (existingIndex >= 0) {
        userCart.items[existingIndex].quantity += guestItem.quantity;
      } else {
        userCart.items.push(guestItem);
      }
    }
    
    const mergedCart = recalculateCartTotals(userCart);
    
    await Promise.all([
      collection.updateOne(
        { _id: userCart._id },
        { 
          $set: { 
            items: mergedCart.items,
            subtotal: mergedCart.subtotal,
            total: mergedCart.total,
            updatedAt: new Date()
          } 
        }
      ),
      collection.deleteOne({ _id: guestCart._id }),
    ]);
    
    return { success: true, cart: mergedCart };
  } catch (error) {
    console.error('Error merging carts:', error);
    return { success: false, error: 'Failed to merge carts' };
  }
}
