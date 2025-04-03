import { NextRequest } from 'next/server';
import { 
  successResponse, 
  createdResponse, 
  errorResponse, 
  paginationMeta,
  parseRequestBody,
  ApiError 
} from '@/lib/api-utils';
import { 
  productCreateSchema, 
  paginationSchema,
  parseQueryParams 
} from '@/lib/validation';
import { ProductService } from '@/lib/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination
    const pagination = parseQueryParams(searchParams, paginationSchema) ?? { page: 1, limit: 20 };
    
    // Parse filters
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.get('isActive');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') as 'name' | 'price' | 'createdAt' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    const filters = {
      category,
      search,
      isActive: isActive ? isActive === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };

    const { products, total } = await ProductService.list({
      ...pagination,
      ...filters,
      sortBy,
      sortOrder,
    });

    return successResponse(
      products,
      paginationMeta(pagination.page, pagination.limit, total)
    );
  } catch (error) {
    return errorResponse(error, 'Failed to fetch products');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request, productCreateSchema);
    
    // Check for duplicate SKU
    const existingProduct = await ProductService.findBySku(body.sku);
    if (existingProduct) {
      throw ApiError.conflict(`Product with SKU '${body.sku}' already exists`);
    }

    const product = await ProductService.create(body);
    
    return createdResponse(product);
  } catch (error) {
    return errorResponse(error, 'Failed to create product');
  }
}
