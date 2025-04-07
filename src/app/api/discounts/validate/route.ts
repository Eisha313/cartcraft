import { NextRequest, NextResponse } from 'next/server';
import { validateDiscountCode, applyDiscountToCart, getDiscountByCode } from '@/lib/discounts';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, shippingCost = 0, userId, productTotals } = body;

    if (!code || typeof code !== 'string') {
      return createErrorResponse('Discount code is required', 400);
    }

    if (typeof cartTotal !== 'number' || cartTotal < 0) {
      return createErrorResponse('Valid cart total is required', 400);
    }

    const validationResult = await validateDiscountCode(code, cartTotal, userId);

    if (!validationResult.valid) {
      return createErrorResponse(validationResult.error || 'Invalid discount code', 400);
    }

    const discount = validationResult.discount!;
    
    // Convert productTotals array to Map if provided
    let productTotalsMap: Map<string, number> | undefined;
    if (productTotals && Array.isArray(productTotals)) {
      productTotalsMap = new Map(productTotals.map((p: { productId: string; total: number }) => [p.productId, p.total]));
    }

    const cartWithDiscount = applyDiscountToCart(
      cartTotal,
      shippingCost,
      discount,
      productTotalsMap
    );

    return createSuccessResponse({
      valid: true,
      discount: {
        code: discount.code,
        description: discount.description,
      },
      cart: cartWithDiscount,
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    return createErrorResponse('Failed to validate discount code', 500);
  }
}
