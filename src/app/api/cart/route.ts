import { NextRequest, NextResponse } from 'next/server';
import { getCartSession } from '@/lib/cart-session';
import {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
  applyDiscountToCart,
  removeDiscountFromCart,
} from '@/lib/cart-operations';
import { createApiResponse, createErrorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { sessionId, userId } = await getCartSession(request);
    const cart = await getOrCreateCart(sessionId, userId);
    
    return createApiResponse(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return createErrorResponse('Failed to fetch cart', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await getCartSession(request);
    const body = await request.json();
    const { action, productId, quantity, discountCode } = body;
    
    let result;
    
    switch (action) {
      case 'add':
        if (!productId || typeof quantity !== 'number' || quantity <= 0) {
          return createErrorResponse('Invalid product ID or quantity', 400);
        }
        result = await addItemToCart(sessionId, productId, quantity, userId);
        break;
        
      case 'update':
        if (!productId || typeof quantity !== 'number') {
          return createErrorResponse('Invalid product ID or quantity', 400);
        }
        result = await updateCartItemQuantity(sessionId, productId, quantity, userId);
        break;
        
      case 'remove':
        if (!productId) {
          return createErrorResponse('Product ID is required', 400);
        }
        result = await removeItemFromCart(sessionId, productId, userId);
        break;
        
      case 'clear':
        result = await clearCart(sessionId, userId);
        break;
        
      case 'apply_discount':
        if (!discountCode) {
          return createErrorResponse('Discount code is required', 400);
        }
        result = await applyDiscountToCart(sessionId, discountCode, userId);
        break;
        
      case 'remove_discount':
        result = await removeDiscountFromCart(sessionId, userId);
        break;
        
      default:
        return createErrorResponse('Invalid action', 400);
    }
    
    if (!result.success) {
      return createErrorResponse(result.error || 'Operation failed', 400);
    }
    
    return createApiResponse(result.cart);
  } catch (error) {
    console.error('Error processing cart action:', error);
    return createErrorResponse('Failed to process cart action', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId, userId } = await getCartSession(request);
    const result = await clearCart(sessionId, userId);
    
    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to clear cart', 400);
    }
    
    return createApiResponse({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return createErrorResponse('Failed to clear cart', 500);
  }
}
