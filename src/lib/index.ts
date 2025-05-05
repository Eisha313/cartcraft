/**
 * CartCraft Library Exports
 * 
 * This module provides the main entry points for CartCraft functionality.
 * Use these utilities to interact with the cart system programmatically.
 * 
 * @packageDocumentation
 */

// Database connection
export { clientPromise, getDatabase, getCollection } from './mongodb';

// Stripe integration
export {
  stripe,
  createCheckoutSession,
  createPaymentIntent,
  constructWebhookEvent,
} from './stripe';

// Product management
export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from './products';

// Inventory management
export {
  getInventory,
  updateInventory,
  reserveInventory,
  releaseInventory,
  checkAvailability,
} from './inventory';

// Discount system
export {
  validateDiscountCode,
  applyDiscount,
  createDiscountCode,
  deactivateDiscountCode,
  getActiveDiscounts,
} from './discounts';

// Cart operations
export {
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  calculateCartTotals,
  applyDiscountToCart,
} from './cart-operations';

// Cart session management
export {
  getOrCreateCartSession,
  getCartBySessionId,
  mergeGuestCart,
  associateCartWithUser,
} from './cart-session';

// Configuration
export { config } from './config';
export { cartConfig, type CartConfig } from './cart-config';
export { env } from './env';

// Utilities
export {
  apiResponse,
  apiError,
  withErrorHandler,
  parseQueryParams,
} from './api-utils';

export {
  validateProduct,
  validateCartItem,
  validateDiscountCode as validateDiscountInput,
  ValidationError,
} from './validation';
