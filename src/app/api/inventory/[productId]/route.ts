import { NextRequest, NextResponse } from 'next/server';
import { 
  getStockStatus, 
  updateStock, 
  reserveStock, 
  releaseReservation,
  initializeInventory,
  getInventoryItem
} from '@/lib/inventory';
import { createApiResponse, createErrorResponse, validateRequestBody } from '@/lib/api-utils';

interface RouteParams {
  params: { productId: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { productId } = params;
    
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    
    if (detailed) {
      const inventory = await getInventoryItem(productId);
      if (!inventory) {
        return createErrorResponse('Inventory not found', 404);
      }
      return createApiResponse(inventory);
    }
    
    const status = await getStockStatus(productId);
    if (!status) {
      return createErrorResponse('Product inventory not found', 404);
    }
    
    return createApiResponse(status);
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return createErrorResponse('Failed to get inventory status', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { productId } = params;
    const body = await request.json();
    
    const validation = validateRequestBody(body, ['sku', 'quantity']);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }
    
    const { sku, quantity, lowStockThreshold } = body;
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return createErrorResponse('Quantity must be a non-negative number', 400);
    }
    
    const inventory = await initializeInventory(
      productId,
      sku,
      quantity,
      lowStockThreshold
    );
    
    return createApiResponse(inventory, 201);
  } catch (error) {
    console.error('Failed to initialize inventory:', error);
    const message = error instanceof Error ? error.message : 'Failed to initialize inventory';
    return createErrorResponse(message, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { productId } = params;
    const body = await request.json();
    
    const { action, quantity, reference, notes } = body;
    
    if (!action || typeof quantity !== 'number') {
      return createErrorResponse('Action and quantity are required', 400);
    }
    
    let success: boolean | null = false;
    
    switch (action) {
      case 'restock':
        const restocked = await updateStock(productId, quantity, 'restock', reference, notes);
        success = restocked !== null;
        break;
        
      case 'adjustment':
        const adjusted = await updateStock(productId, quantity, 'adjustment', reference, notes);
        success = adjusted !== null;
        break;
        
      case 'reserve':
        if (quantity <= 0) {
          return createErrorResponse('Reserve quantity must be positive', 400);
        }
        success = await reserveStock(productId, quantity, reference);
        break;
        
      case 'release':
        if (quantity <= 0) {
          return createErrorResponse('Release quantity must be positive', 400);
        }
        success = await releaseReservation(productId, quantity, reference);
        break;
        
      default:
        return createErrorResponse('Invalid action. Use: restock, adjustment, reserve, or release', 400);
    }
    
    if (!success) {
      return createErrorResponse('Failed to update inventory. Check product exists and has sufficient stock.', 400);
    }
    
    const status = await getStockStatus(productId);
    return createApiResponse(status);
  } catch (error) {
    console.error('Failed to update inventory:', error);
    const message = error instanceof Error ? error.message : 'Failed to update inventory';
    return createErrorResponse(message, 500);
  }
}
