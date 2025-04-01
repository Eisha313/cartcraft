export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImage[];
  sku: string;
  barcode?: string;
  inventory: ProductInventory;
  category?: string;
  tags: string[];
  metadata: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
}

export interface ProductInventory {
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  reservedQuantity: number;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  images?: Omit<ProductImage, 'isPrimary'>[];
  sku: string;
  barcode?: string;
  inventory?: Partial<ProductInventory>;
  category?: string;
  tags?: string[];
  metadata?: Record<string, string>;
  isActive?: boolean;
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  _id: string;
}

export interface ProductFilter {
  category?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface InventoryUpdate {
  productId: string;
  quantity: number;
  type: 'set' | 'increment' | 'decrement';
  reason?: string;
}

export interface StockStatus {
  productId: string;
  sku: string;
  available: number;
  reserved: number;
  total: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  allowBackorder: boolean;
}
