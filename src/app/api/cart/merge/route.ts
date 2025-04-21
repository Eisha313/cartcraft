import { NextRequest } from 'next/server';
import { getCartSession } from '@/lib/cart-session';
import { mergeGuestCartWithUserCart } from '@/lib/cart-operations';
import { createApiResponse, createErrorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await getCartSession(request);
    
    if (!userId) {
      return createErrorResponse('User must be authenticated to merge carts', 401);
    }
    
    const result = await mergeGuestCartWithUserCart(sessionId, userId);
    
    if (!result.success) {
      return createErrorResponse(result.error || 'Failed to merge carts', 400);
    }
    
    return createApiResponse({
      message: 'Carts merged successfully',
      cart: result.cart,
    });
  } catch (error) {
    console.error('Error merging carts:', error);
    return createErrorResponse('Failed to merge carts', 500);
  }
}
