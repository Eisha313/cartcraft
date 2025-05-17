import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  parseRequestBody,
  ApiError,
} from '@/lib/api-utils';
import { getCart, addItemToCart, updateCartItemQuantity, removeItemFromCart, clearCart } from '@/lib/cart-operations';
import { z } from 'zod';

const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  variantId: z.string().optional(),
});

const UpdateCartSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
});

const RemoveFromCartSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

function getSessionId(request: NextRequest): string | null {
  return request.headers.get('x-session-id') || request.cookies.get('session_id')?.value || null;
}

function getUserId(request: NextRequest): string | undefined {
  return request.headers.get('x-user-id') || undefined;
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }
    const userId = getUserId(request);
    const cart = await getCart(sessionId, userId);
    return successResponse(cart);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }
    const userId = getUserId(request);
    const body = await parseRequestBody(request, AddToCartSchema);

    const result = await addItemToCart(sessionId, body.productId, body.quantity, userId);

    if (!result.success) {
      throw ApiError.unprocessable(result.error || 'Failed to add item to cart');
    }

    return successResponse(result.cart);
  });
}

export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }
    const userId = getUserId(request);
    const body = await parseRequestBody(request, UpdateCartSchema);

    const result = await updateCartItemQuantity(sessionId, body.itemId, body.quantity, userId);

    if (!result.success) {
      throw ApiError.notFound('Cart item');
    }

    return successResponse(result.cart);
  });
}

export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      throw ApiError.badRequest('Session ID is required');
    }
    const userId = getUserId(request);
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const clearAll = url.searchParams.get('clear') === 'true';

    if (clearAll) {
      const result = await clearCart(sessionId, userId);
      return successResponse(result.cart);
    }

    if (!itemId) {
      throw ApiError.badRequest('Item ID is required');
    }

    const result = await removeItemFromCart(sessionId, itemId, userId);

    if (!result.success) {
      throw ApiError.notFound('Cart item');
    }

    return successResponse(result.cart);
  });
}
