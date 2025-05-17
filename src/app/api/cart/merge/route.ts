import { NextRequest } from 'next/server';
import { mergeGuestCartWithUserCart } from '@/lib/cart-operations';
import { createApiResponse, createErrorResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId } = body;

    if (!userId) {
      return createErrorResponse('User must be authenticated to merge carts', 401);
    }

    if (!sessionId) {
      return createErrorResponse('Session ID is required', 400);
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
