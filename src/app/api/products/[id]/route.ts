import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoClient } from '@/lib/mongodb';
import { Product } from '@/types/product';
import { successResponse, errorResponse } from '@/lib/api-utils';

interface RouteParams {
  params: { id: string };
}

function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid product ID format', 400);
    }

    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection('products');

    const product = await collection.findOne({ _id: new ObjectId(id) });

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ ...product, id: product._id.toString() });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return errorResponse('Failed to fetch product', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid product ID format', 400);
    }

    const body = await request.json();

    // Validate update fields
    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return errorResponse('Invalid price value', 400);
    }

    if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0)) {
      return errorResponse('Invalid stock value', 400);
    }

    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection('products');

    // Check for duplicate SKU if updating
    if (body.sku) {
      const existing = await collection.findOne({
        sku: body.sku,
        _id: { $ne: new ObjectId(id) }
      });
      if (existing) {
        return errorResponse('Product with this SKU already exists', 409);
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include allowed fields
    const allowedFields = [
      'name', 'description', 'price', 'currency', 'images',
      'category', 'tags', 'stock', 'sku', 'isActive', 'metadata'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ ...result, id: result._id.toString() });
  } catch (error) {
    console.error('Failed to update product:', error);
    return errorResponse('Failed to update product', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!isValidObjectId(id)) {
      return errorResponse('Invalid product ID format', 400);
    }

    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection('products');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ success: true, deletedId: id });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return errorResponse('Failed to delete product', 500);
  }
}
