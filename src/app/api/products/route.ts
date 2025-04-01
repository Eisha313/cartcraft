import { NextRequest } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { Product } from '@/types/product';
import {
  parsePaginationParams,
  parseFilters,
  parseSortParams,
  createPaginatedResponse,
  apiSuccess,
  apiError,
} from '@/lib/api-utils';
import { Filter } from 'mongodb';

function buildProductQuery(filters: Record<string, string | string[]>): Filter<Product> {
  const query: Filter<Product> = { isActive: true };

  if (filters.category) {
    query.category = filters.category as string;
  }

  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice as string);
      if (!isNaN(minPrice)) {
        (query.price as Record<string, number>).$gte = minPrice;
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice as string);
      if (!isNaN(maxPrice)) {
        (query.price as Record<string, number>).$lte = maxPrice;
      }
    }
  }

  if (filters.inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  if (filters.search) {
    const searchRegex = { $regex: filters.search as string, $options: 'i' };
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { sku: searchRegex },
    ];
  }

  if (filters.tags && Array.isArray(filters.tags)) {
    query.tags = { $in: filters.tags };
  }

  return query;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const filters = parseFilters(searchParams);
    const sort = parseSortParams(searchParams);

    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection<Product>('products');

    const query = buildProductQuery(filters);

    const [products, total] = await Promise.all([
      collection
        .find(query)
        .sort({ [sort.field]: sort.order })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .toArray(),
      collection.countDocuments(query),
    ]);

    const response = createPaginatedResponse(products, total, pagination);
    return apiSuccess(response);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return apiError(
      'FETCH_ERROR',
      'Failed to fetch products',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || typeof body.name !== 'string') {
      return apiError('VALIDATION_ERROR', 'Product name is required', 400);
    }

    if (typeof body.price !== 'number' || body.price < 0) {
      return apiError('VALIDATION_ERROR', 'Valid price is required', 400);
    }

    if (typeof body.stock !== 'number' || body.stock < 0) {
      return apiError('VALIDATION_ERROR', 'Valid stock quantity is required', 400);
    }

    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection<Product>('products');

    // Check for duplicate SKU if provided
    if (body.sku) {
      const existing = await collection.findOne({ sku: body.sku });
      if (existing) {
        return apiError('DUPLICATE_SKU', 'Product with this SKU already exists', 409);
      }
    }

    const now = new Date();
    const product: Omit<Product, 'id'> = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      price: body.price,
      currency: body.currency || 'USD',
      images: body.images || [],
      category: body.category || 'uncategorized',
      tags: body.tags || [],
      stock: body.stock,
      sku: body.sku || `SKU-${Date.now()}`,
      isActive: body.isActive !== false,
      metadata: body.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(product as Product);

    return apiSuccess(
      { ...product, id: result.insertedId.toString() },
      201
    );
  } catch (error) {
    console.error('Failed to create product:', error);
    return apiError(
      'CREATE_ERROR',
      'Failed to create product',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
