import { ObjectId, Collection } from 'mongodb';
import { getDatabase } from './mongodb';
import { Product } from '@/types/product';

export interface InventoryItem {
  _id?: ObjectId;
  productId: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  lastUpdated: Date;
  history: InventoryChange[];
}

export interface InventoryChange {
  type: 'restock' | 'sale' | 'reservation' | 'release' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  timestamp: Date;
  reference?: string;
  notes?: string;
}

export interface StockStatus {
  productId: string;
  available: number;
  reserved: number;
  total: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

async function getInventoryCollection(): Promise<Collection<InventoryItem>> {
  const db = await getDatabase();
  return db.collection<InventoryItem>('inventory');
}

export async function getInventoryItem(productId: string): Promise<InventoryItem | null> {
  const collection = await getInventoryCollection();
  return collection.findOne({ productId });
}

export async function getStockStatus(productId: string): Promise<StockStatus | null> {
  const item = await getInventoryItem(productId);
  
  if (!item) {
    return null;
  }
  
  const available = item.quantity - item.reservedQuantity;
  
  return {
    productId: item.productId,
    available: Math.max(0, available),
    reserved: item.reservedQuantity,
    total: item.quantity,
    isLowStock: available <= item.lowStockThreshold && available > 0,
    isOutOfStock: available <= 0,
  };
}

export async function getBulkStockStatus(productIds: string[]): Promise<Map<string, StockStatus>> {
  const collection = await getInventoryCollection();
  const items = await collection.find({ productId: { $in: productIds } }).toArray();
  
  const statusMap = new Map<string, StockStatus>();
  
  for (const item of items) {
    const available = item.quantity - item.reservedQuantity;
    statusMap.set(item.productId, {
      productId: item.productId,
      available: Math.max(0, available),
      reserved: item.reservedQuantity,
      total: item.quantity,
      isLowStock: available <= item.lowStockThreshold && available > 0,
      isOutOfStock: available <= 0,
    });
  }
  
  return statusMap;
}

export async function initializeInventory(
  productId: string,
  sku: string,
  initialQuantity: number,
  lowStockThreshold: number = 10
): Promise<InventoryItem> {
  const collection = await getInventoryCollection();
  
  const existing = await collection.findOne({ productId });
  if (existing) {
    throw new Error(`Inventory already exists for product ${productId}`);
  }
  
  const now = new Date();
  const inventoryItem: InventoryItem = {
    productId,
    sku,
    quantity: initialQuantity,
    reservedQuantity: 0,
    lowStockThreshold,
    lastUpdated: now,
    history: [{
      type: 'restock',
      quantity: initialQuantity,
      previousQuantity: 0,
      timestamp: now,
      notes: 'Initial inventory setup',
    }],
  };
  
  const result = await collection.insertOne(inventoryItem);
  return { ...inventoryItem, _id: result.insertedId };
}

export async function updateStock(
  productId: string,
  quantityChange: number,
  type: InventoryChange['type'],
  reference?: string,
  notes?: string
): Promise<InventoryItem | null> {
  const collection = await getInventoryCollection();
  const now = new Date();
  
  const item = await collection.findOne({ productId });
  if (!item) {
    return null;
  }
  
  const newQuantity = item.quantity + quantityChange;
  if (newQuantity < 0) {
    throw new Error(`Insufficient stock. Available: ${item.quantity}, Requested change: ${quantityChange}`);
  }
  
  const change: InventoryChange = {
    type,
    quantity: quantityChange,
    previousQuantity: item.quantity,
    timestamp: now,
    reference,
    notes,
  };
  
  const result = await collection.findOneAndUpdate(
    { productId },
    {
      $set: { quantity: newQuantity, lastUpdated: now },
      $push: { history: { $each: [change], $slice: -100 } },
    },
    { returnDocument: 'after' }
  );
  
  return result;
}

export async function reserveStock(
  productId: string,
  quantity: number,
  reference?: string
): Promise<boolean> {
  const collection = await getInventoryCollection();
  const now = new Date();
  
  const item = await collection.findOne({ productId });
  if (!item) {
    return false;
  }
  
  const available = item.quantity - item.reservedQuantity;
  if (available < quantity) {
    return false;
  }
  
  const change: InventoryChange = {
    type: 'reservation',
    quantity,
    previousQuantity: item.reservedQuantity,
    timestamp: now,
    reference,
  };
  
  await collection.updateOne(
    { productId },
    {
      $inc: { reservedQuantity: quantity },
      $set: { lastUpdated: now },
      $push: { history: { $each: [change], $slice: -100 } },
    }
  );
  
  return true;
}

export async function releaseReservation(
  productId: string,
  quantity: number,
  reference?: string
): Promise<boolean> {
  const collection = await getInventoryCollection();
  const now = new Date();
  
  const item = await collection.findOne({ productId });
  if (!item || item.reservedQuantity < quantity) {
    return false;
  }
  
  const change: InventoryChange = {
    type: 'release',
    quantity: -quantity,
    previousQuantity: item.reservedQuantity,
    timestamp: now,
    reference,
  };
  
  await collection.updateOne(
    { productId },
    {
      $inc: { reservedQuantity: -quantity },
      $set: { lastUpdated: now },
      $push: { history: { $each: [change], $slice: -100 } },
    }
  );
  
  return true;
}

export async function confirmSale(
  productId: string,
  quantity: number,
  orderId: string
): Promise<boolean> {
  const collection = await getInventoryCollection();
  const now = new Date();
  
  const item = await collection.findOne({ productId });
  if (!item) {
    return false;
  }
  
  const change: InventoryChange = {
    type: 'sale',
    quantity: -quantity,
    previousQuantity: item.quantity,
    timestamp: now,
    reference: orderId,
  };
  
  await collection.updateOne(
    { productId },
    {
      $inc: { 
        quantity: -quantity,
        reservedQuantity: -Math.min(quantity, item.reservedQuantity)
      },
      $set: { lastUpdated: now },
      $push: { history: { $each: [change], $slice: -100 } },
    }
  );
  
  return true;
}

export async function getLowStockItems(threshold?: number): Promise<InventoryItem[]> {
  const collection = await getInventoryCollection();
  
  const query = threshold !== undefined
    ? { $expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, threshold] } }
    : { $expr: { $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, '$lowStockThreshold'] } };
  
  return collection.find(query).toArray();
}
