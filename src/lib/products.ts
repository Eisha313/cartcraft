import { ObjectId, Collection } from 'mongodb';
import { getMongoClient } from './mongodb';
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilter,
  ProductListResponse,
  InventoryUpdate,
  StockStatus,
} from '@/types/product';

const COLLECTION_NAME = 'products';

async function getProductsCollection(): Promise<Collection> {
  const client = await getMongoClient();
  const db = client.db();
  return db.collection(COLLECTION_NAME);
}

export async function createProduct(input: ProductCreateInput): Promise<Product> {
  const collection = await getProductsCollection();
  
  const now = new Date();
  const product = {
    ...input,
    currency: input.currency || 'USD',
    images: (input.images || []).map((img, index) => ({
      ...img,
      isPrimary: index === 0,
    })),
    inventory: {
      quantity: input.inventory?.quantity ?? 0,
      lowStockThreshold: input.inventory?.lowStockThreshold ?? 5,
      trackInventory: input.inventory?.trackInventory ?? true,
      allowBackorder: input.inventory?.allowBackorder ?? false,
      reservedQuantity: 0,
    },
    tags: input.tags || [],
    metadata: input.metadata || {},
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(product);
  
  return {
    ...product,
    _id: result.insertedId.toString(),
  } as Product;
}

export async function getProductById(id: string): Promise<Product | null> {
  const collection = await getProductsCollection();
  
  try {
    const product = await collection.findOne({ _id: new ObjectId(id) });
    if (!product) return null;
    
    return {
      ...product,
      _id: product._id.toString(),
    } as Product;
  } catch {
    return null;
  }
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const collection = await getProductsCollection();
  
  const product = await collection.findOne({ sku });
  if (!product) return null;
  
  return {
    ...product,
    _id: product._id.toString(),
  } as Product;
}

export async function listProducts(
  filter: ProductFilter = {},
  page: number = 1,
  pageSize: number = 20
): Promise<ProductListResponse> {
  const collection = await getProductsCollection();
  
  const query: Record<string, unknown> = {};
  
  if (filter.category) {
    query.category = filter.category;
  }
  
  if (filter.tags && filter.tags.length > 0) {
    query.tags = { $in: filter.tags };
  }
  
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    query.price = {};
    if (filter.minPrice !== undefined) {
      (query.price as Record<string, number>).$gte = filter.minPrice;
    }
    if (filter.maxPrice !== undefined) {
      (query.price as Record<string, number>).$lte = filter.maxPrice;
    }
  }
  
  if (filter.inStock) {
    query.$expr = {
      $gt: [
        { $subtract: ['$inventory.quantity', '$inventory.reservedQuantity'] },
        0,
      ],
    };
  }
  
  if (filter.isActive !== undefined) {
    query.isActive = filter.isActive;
  }
  
  if (filter.search) {
    query.$or = [
      { name: { $regex: filter.search, $options: 'i' } },
      { description: { $regex: filter.search, $options: 'i' } },
      { sku: { $regex: filter.search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * pageSize;
  
  const [products, total] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments(query),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      _id: p._id.toString(),
    })) as Product[],
    total,
    page,
    pageSize,
    hasMore: skip + products.length < total,
  };
}

export async function updateProduct(input: ProductUpdateInput): Promise<Product | null> {
  const collection = await getProductsCollection();
  
  const { _id, ...updates } = input;
  
  try {
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!result) return null;
    
    return {
      ...result,
      _id: result._id.toString(),
    } as Product;
  } catch {
    return null;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const collection = await getProductsCollection();
  
  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  } catch {
    return false;
  }
}

export async function updateInventory(update: InventoryUpdate): Promise<StockStatus | null> {
  const collection = await getProductsCollection();
  
  try {
    let updateOp: Record<string, unknown>;
    
    switch (update.type) {
      case 'set':
        updateOp = { $set: { 'inventory.quantity': update.quantity, updatedAt: new Date() } };
        break;
      case 'increment':
        updateOp = { $inc: { 'inventory.quantity': update.quantity }, $set: { updatedAt: new Date() } };
        break;
      case 'decrement':
        updateOp = { $inc: { 'inventory.quantity': -update.quantity }, $set: { updatedAt: new Date() } };
        break;
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(update.productId) },
      updateOp,
      { returnDocument: 'after' }
    );

    if (!result) return null;

    return getStockStatus(result as unknown as Product);
  } catch {
    return null;
  }
}

export async function reserveInventory(
  productId: string,
  quantity: number
): Promise<boolean> {
  const collection = await getProductsCollection();
  
  try {
    const result = await collection.updateOne(
      {
        _id: new ObjectId(productId),
        $expr: {
          $gte: [
            { $subtract: ['$inventory.quantity', '$inventory.reservedQuantity'] },
            quantity,
          ],
        },
      },
      {
        $inc: { 'inventory.reservedQuantity': quantity },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount === 1;
  } catch {
    return false;
  }
}

export async function releaseInventory(
  productId: string,
  quantity: number
): Promise<boolean> {
  const collection = await getProductsCollection();
  
  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $inc: { 'inventory.reservedQuantity': -quantity },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount === 1;
  } catch {
    return false;
  }
}

export async function commitInventory(
  productId: string,
  quantity: number
): Promise<boolean> {
  const collection = await getProductsCollection();
  
  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $inc: {
          'inventory.quantity': -quantity,
          'inventory.reservedQuantity': -quantity,
        },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount === 1;
  } catch {
    return false;
  }
}

export function getStockStatus(product: Product): StockStatus {
  const available = product.inventory.quantity - product.inventory.reservedQuantity;
  
  return {
    productId: product._id,
    sku: product.sku,
    available: Math.max(0, available),
    reserved: product.inventory.reservedQuantity,
    total: product.inventory.quantity,
    isLowStock: available <= product.inventory.lowStockThreshold && available > 0,
    isOutOfStock: available <= 0,
    allowBackorder: product.inventory.allowBackorder,
  };
}

export async function getStockStatusById(productId: string): Promise<StockStatus | null> {
  const product = await getProductById(productId);
  if (!product) return null;
  return getStockStatus(product);
}
