import { NextRequest, NextResponse } from 'next/server';
import { getBulkStockStatus, getLowStockItems } from '@/lib/inventory';
import { createApiResponse, createErrorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productIds = searchParams.get('productIds');
    const lowStock = searchParams.get('lowStock');
    const threshold = searchParams.get('threshold');
    
    // Get low stock items
    if (lowStock === 'true') {
      const thresholdValue = threshold ? parseInt(threshold, 10) : undefined;
      const items = await getLowStockItems(thresholdValue);
      return createApiResponse({
        items,
        count: items.length,
      });
    }
    
    // Get bulk stock status
    if (productIds) {
      const ids = productIds.split(',').map(id => id.trim()).filter(Boolean);
      
      if (ids.length === 0) {
        return createErrorResponse('No valid product IDs provided', 400);
      }
      
      if (ids.length > 100) {
        return createErrorResponse('Maximum 100 product IDs allowed per request', 400);
      }
      
      const statusMap = await getBulkStockStatus(ids);
      const statuses = Object.fromEntries(statusMap);
      
      return createApiResponse({
        statuses,
        found: statusMap.size,
        requested: ids.length,
      });
    }
    
    return createErrorResponse('Provide productIds or lowStock=true parameter', 400);
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return createErrorResponse('Failed to get inventory', 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { productIds } = body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return createErrorResponse('productIds array is required', 400);
    }
    
    if (productIds.length > 100) {
      return createErrorResponse('Maximum 100 product IDs allowed per request', 400);
    }
    
    const statusMap = await getBulkStockStatus(productIds);
    const statuses = Object.fromEntries(statusMap);
    
    return createApiResponse({
      statuses,
      found: statusMap.size,
      requested: productIds.length,
    });
  } catch (error) {
    console.error('Failed to get bulk inventory:', error);
    return createErrorResponse('Failed to get bulk inventory', 500);
  }
}
