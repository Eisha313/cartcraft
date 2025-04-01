import { NextRequest, NextResponse } from 'next/server';
import {
  createProduct,
  listProducts,
} from '@/lib/products';
import { ProductCreateInput, ProductFilter } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filter: ProductFilter = {};
    
    const category = searchParams.get('category');
    if (category) filter.category = category;
    
    const tags = searchParams.get('tags');
    if (tags) filter.tags = tags.split(',');
    
    const minPrice = searchParams.get('minPrice');
    if (minPrice) filter.minPrice = parseFloat(minPrice);
    
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) filter.maxPrice = parseFloat(maxPrice);
    
    const inStock = searchParams.get('inStock');
    if (inStock) filter.inStock = inStock === 'true';
    
    const isActive = searchParams.get('isActive');
    if (isActive) filter.isActive = isActive === 'true';
    
    const search = searchParams.get('search');
    if (search) filter.search = search;
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '20', 10),
      100
    );

    const result = await listProducts(filter, page, pageSize);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing products:', error);
    return NextResponse.json(
      { error: 'Failed to list products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProductCreateInput;
    
    if (!body.name || !body.price || !body.sku) {
      return NextResponse.json(
        { error: 'Name, price, and SKU are required' },
        { status: 400 }
      );
    }

    if (body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      );
    }

    const product = await createProduct(body);
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
