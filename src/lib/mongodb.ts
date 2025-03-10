import { MongoClient, Db, Collection } from 'mongodb';

// Types for our database collections
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  _id?: string;
  sessionId: string;
  userId?: string;
  items: CartItem[];
  discountCode?: string;
  discountAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  image?: string;
  category?: string;
  active: boolean;
  createdAt: Date;
}

export interface DiscountCode {
  _id?: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
}

export interface Order {
  _id?: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  userId?: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  createdAt: Date;
}

// MongoDB connection singleton
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cartcraft';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db();
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

// Collection accessors with proper typing
export async function getCartsCollection(): Promise<Collection<Cart>> {
  const { db } = await connectToDatabase();
  return db.collection<Cart>('carts');
}

export async function getProductsCollection(): Promise<Collection<Product>> {
  const { db } = await connectToDatabase();
  return db.collection<Product>('products');
}

export async function getDiscountsCollection(): Promise<Collection<DiscountCode>> {
  const { db } = await connectToDatabase();
  return db.collection<DiscountCode>('discounts');
}

export async function getOrdersCollection(): Promise<Collection<Order>> {
  const { db } = await connectToDatabase();
  return db.collection<Order>('orders');
}