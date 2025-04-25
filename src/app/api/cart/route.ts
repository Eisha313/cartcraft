import { NextRequest } from 'next/server';
import {
  successResponse,
  errorResponse,
  withErrorHandler,
  parseRequestBody,
  ApiError,
} from '@/lib/api-utils';
import { getCartSession, createCartSession } from '@/lib/cart-session';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/cart-operations';
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

async function getOrCreateSession(request: NextRequest): Promise<string> {
  let session = await getCartSession(request);
  if (!session) {
    session = await createCartSession();
  }
  return session.id;
}

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = await getOrCreateSession(request);
    const cart = await getCart(sessionId);
    return successResponse(cart);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = await getOrCreateSession(request);
    const body = await parseRequestBody(request, AddToCartSchema);
    
    const cart = await addToCart(sessionId, {
      productId: body.productId,
      quantity: body.quantity,
      variantId: body.variantId,
    });

    if (!cart) {
      throw ApiError.unprocessable('Failed to add item to cart');
    }

    return successResponse(cart);
  });
}

export async function PUT(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = await getOrCreateSession(request);
    const body = await parseRequestBody(request, UpdateCartSchema);
    
    const cart = await updateCartItem(sessionId, body.itemId, body.quantity);

    if (!cart) {
      throw ApiError.notFound('Cart item');
    }

    return successResponse(cart);
  });
}

export async function DELETE(request: NextRequest) {
  return withErrorHandler(async () => {
    const sessionId = await getOrCreateSession(request);
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const clearAll = url.searchParams.get('clear') === 'true';

    if (clearAll) {
      const cart = await clearCart(sessionId);
      return successResponse(cart);
    }

    if (!itemId) {
      throw ApiError.badRequest('Item ID is required');
    }

    const cart = await removeFromCart(sessionId, itemId);

    if (!cart) {
      throw ApiError.notFound('Cart item');
    }

    return successResponse(cart);
  });
}
