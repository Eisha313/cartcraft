import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateCartSession,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  generateGuestId,
} from '@/lib/cart-session';
import { CartSessionIdentifier, AddToCartInput, UpdateCartItemInput } from '@/types/cart';
import { createApiResponse, createErrorResponse, ApiStatusCode } from '@/lib/api-utils';
import { cookies } from 'next/headers';

const GUEST_ID_COOKIE = 'cartcraft_guest_id';
const USER_ID_HEADER = 'x-user-id';

async function getSessionIdentifier(request: NextRequest): Promise<CartSessionIdentifier> {
  const userId = request.headers.get(USER_ID_HEADER);
  
  if (userId) {
    return { type: 'authenticated', id: userId };
  }

  const cookieStore = await cookies();
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value;

  if (!guestId) {
    guestId = generateGuestId();
  }

  return { type: 'guest', id: guestId };
}

function setGuestCookie(response: NextResponse, guestId: string): void {
  response.cookies.set(GUEST_ID_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function GET(request: NextRequest) {
  try {
    const identifier = await getSessionIdentifier(request);
    const cart = await getOrCreateCartSession(identifier);

    const response = NextResponse.json(
      createApiResponse(cart, 'Cart retrieved successfully')
    );

    if (identifier.type === 'guest') {
      setGuestCookie(response, identifier.id);
    }

    return response;
  } catch (error) {
    console.error('Error getting cart:', error);
    return NextResponse.json(
      createErrorResponse('Failed to retrieve cart', ApiStatusCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const identifier = await getSessionIdentifier(request);
    const body = await request.json();

    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'add':
        const addInput: AddToCartInput = {
          productId: data.productId,
          variantId: data.variantId,
          quantity: data.quantity || 1,
        };
        result = await addToCart(identifier, addInput);
        break;

      case 'update':
        const updateInput: UpdateCartItemInput = {
          productId: data.productId,
          variantId: data.variantId,
          quantity: data.quantity,
        };
        result = await updateCartItem(identifier, updateInput);
        break;

      case 'remove':
        result = await removeFromCart(identifier, {
          productId: data.productId,
          variantId: data.variantId,
        });
        break;

      case 'clear':
        result = await clearCart(identifier);
        break;

      default:
        return NextResponse.json(
          createErrorResponse('Invalid action', ApiStatusCode.BAD_REQUEST),
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse(result.error || 'Operation failed', ApiStatusCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      createApiResponse(result.cart, `Cart ${action} successful`)
    );

    if (identifier.type === 'guest') {
      setGuestCookie(response, identifier.id);
    }

    return response;
  } catch (error) {
    console.error('Error processing cart action:', error);
    return NextResponse.json(
      createErrorResponse('Failed to process cart action', ApiStatusCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identifier = await getSessionIdentifier(request);
    const result = await clearCart(identifier);

    if (!result.success) {
      return NextResponse.json(
        createErrorResponse(result.error || 'Failed to clear cart', ApiStatusCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      createApiResponse(result.cart, 'Cart cleared successfully')
    );

    if (identifier.type === 'guest') {
      setGuestCookie(response, identifier.id);
    }

    return response;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      createErrorResponse('Failed to clear cart', ApiStatusCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
