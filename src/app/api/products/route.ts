import { NextRequest } from 'next/server';
import {
  successResponse,
  createdResponse,
  withErrorHandler,
  parseRequestBody,
  parseQueryParams,
  getPaginationParams,
  createPaginatedResponse,
  ApiError,
} from '@/lib/api-utils';
import {
  getProducts,
  createProduct,
  countProducts,
  searchProducts,
} from '@/lib/products';
import { CreateProductSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const searchParams = parseQueryParams(request);
    const { page, limit, skip } = getPaginationParams(searchParams);
    
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const filters: Record<string, unknown> = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (inStock === 'true') {
      filters.inStock = true;
    }

    let products;
    let total;

    if (search) {
      const results = await searchProducts(search, {
        ...filters,
        skip,
        limit,
        sortBy,
        sortOrder,
      });
      products = results.products;
      total = results.total;
    } else {
      [products, total] = await Promise.all([
        getProducts({
          ...filters,
          skip,
          limit,
          sortBy,
          sortOrder,
        }),
        countProducts(filters),
      ]);
    }

    return createPaginatedResponse(products, total, page, limit);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseRequestBody(request, CreateProductSchema);
    
    const product = await createProduct(body);

    if (!product) {
      throw ApiError.internal('Failed to create product');
    }

    return createdResponse(product);
  });
}
