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
  listProducts,
  createProduct,
} from '@/lib/products';
import { productCreateSchema } from '@/lib/validation';
import { ProductFilter } from '@/types/product';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const searchParams = parseQueryParams(request);
    const { page, limit } = getPaginationParams(searchParams);

    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const inStock = searchParams.get('inStock');

    const filter: ProductFilter = {};

    if (category) {
      filter.category = category;
    }

    if (inStock === 'true') {
      filter.inStock = true;
    }

    if (search) {
      filter.search = search;
    }

    const result = await listProducts(filter, page, limit);

    return createPaginatedResponse(result.products, result.total, page, limit);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const body = await parseRequestBody(request, productCreateSchema);

    const product = await createProduct(body as any);

    if (!product) {
      throw ApiError.internal('Failed to create product');
    }

    return createdResponse(product);
  });
}
