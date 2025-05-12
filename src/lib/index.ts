/**
 * CartCraft Library
 *
 * A lightweight shopping cart widget library for embedding customizable
 * e-commerce functionality into any Next.js application.
 *
 * @packageDocumentation
 */

// Database
export { clientPromise, getDatabase, getMongoClient, isConnected, closeConnection } from './mongodb';

// Stripe Integration
export { stripe, STRIPE_CONFIG, formatAmountForStripe, formatAmountFromStripe } from './stripe';

// Configuration
export { defaultCartConfig, createCartConfig, cn, formatPrice } from './cart-config';
export { config, formatCurrency } from './config';
export { env, isDevelopment, isProduction, isTest } from './env';

// Products & Inventory
export {
  createProduct,
  getProductById,
  getProductBySku,
  listProducts,
  updateProduct,
  deleteProduct,
  updateInventory,
  reserveInventory,
  releaseInventory,
  commitInventory,
  getStockStatus,
  getStockStatusById,
} from './products';

export {
  getInventoryItem,
  getStockStatus as getInventoryStockStatus,
  getBulkStockStatus,
  initializeInventory,
  updateStock,
  reserveStock,
  releaseReservation,
  confirmSale,
  getLowStockItems,
  checkInventory,
} from './inventory';

// Cart Operations
export {
  generateGuestId,
  generateSessionId,
  createCartSession,
  getCartSession,
  getOrCreateCartSession,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeGuestCartToUser,
  applyDiscountToCart,
} from './cart-session';

export {
  getCart,
  createCart,
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart as clearCartDirect,
  mergeGuestCartWithUserCart,
  recalculateCartTotals,
} from './cart-operations';

// Discounts
export {
  createDiscountCode,
  getDiscountByCode,
  getDiscountById,
  updateDiscountCode,
  deleteDiscountCode,
  listDiscountCodes,
  validateDiscountCode,
  calculateDiscount,
  applyDiscountToCart as applyDiscountToCartTotals,
  incrementDiscountUsage,
} from './discounts';

// Validation
export {
  validateObjectId,
  parseQueryParams as parseValidationQueryParams,
  formatValidationErrors,
  productCreateSchema,
  productUpdateSchema,
  inventoryUpdateSchema,
  reserveStockSchema,
  paginationSchema,
  objectIdSchema,
} from './validation';

// API Utilities
export {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  withErrorHandler,
  parseRequestBody,
  parseQueryParams,
  getPaginationParams,
  createPaginatedResponse,
  createApiResponse,
  createErrorResponse,
  createSuccessResponse,
  ApiError,
} from './api-utils';
