import { z } from 'zod';

// Common validation schemas
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const priceSchema = z.number().nonnegative('Price must be non-negative');

export const quantitySchema = z.number().int().nonnegative('Quantity must be a non-negative integer');

export const skuSchema = z.string().min(1, 'SKU is required').max(50, 'SKU must be 50 characters or less');

export const emailSchema = z.string().email('Invalid email format');

export const urlSchema = z.string().url('Invalid URL format').optional();

// Product validation
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  price: priceSchema,
  compareAtPrice: priceSchema.optional(),
  sku: skuSchema,
  images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').default([]),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export const productUpdateSchema = productCreateSchema.partial();

// Inventory validation
export const inventoryUpdateSchema = z.object({
  quantity: quantitySchema,
  operation: z.enum(['set', 'increment', 'decrement']).default('set'),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  trackInventory: z.boolean().optional(),
});

export const reserveStockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  sessionId: z.string().min(1, 'Session ID is required'),
  expiresInMinutes: z.number().int().positive().max(60).default(15),
});

// Validation helper functions
export function validateObjectId(id: string): boolean {
  return objectIdSchema.safeParse(id).success;
}

export function parseQueryParams<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> | null {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  const result = schema.safeParse(params);
  return result.success ? result.data : null;
}

export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return errors;
}

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
