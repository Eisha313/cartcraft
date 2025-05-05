/**
 * CartCraft Library
 * 
 * A lightweight shopping cart widget library for embedding customizable
 * e-commerce functionality into any Next.js application.
 * 
 * @packageDocumentation
 */

// Database
export { clientPromise, getDatabase, getCollection } from './mongodb';

// Stripe Integration
export { stripe, createCheckoutSession, createPaymentIntent, constructWebhookEvent } from './stripe';

// Configuration
export { getCartConfig, defaultCartConfig } from './cart-config';
export { config } from './config';
export { env } from './env';

// Products & Inventory
export { ProductService } from './products';
export { InventoryService } from './inventory';

// Cart Operations
export { CartSessionManager } from './cart-session';
export { CartOperations } from './cart-operations';

// Discounts
export { DiscountService } from './discounts';

// Validation
export {
  validateProduct,
  validateCartItem,
  validateDiscount,
  validateEmail,
  validateObjectId,
  sanitizeString,
  type ValidationResult,
} from './validation';

// API Utilities
export {
  successResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
  unauthorizedResponse,
  withErrorHandler,
} from './api-utils';
