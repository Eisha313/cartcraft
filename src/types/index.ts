/**
 * CartCraft Type Definitions
 *
 * This module exports all TypeScript types and interfaces used throughout
 * the CartCraft library. Import types from this module for type-safe
 * integration with your application.
 *
 * @example
 * ```typescript
 * import type { Product, CartItem, DiscountCode } from 'cartcraft/types';
 * ```
 *
 * @packageDocumentation
 */

// Product Types
export type {
  /** Core product definition with pricing and metadata */
  Product,
  /** Input for creating a new product */
  ProductCreateInput,
  /** Input for updating an existing product */
  ProductUpdateInput,
  /** Product image information */
  ProductImage,
  /** Product inventory tracking */
  ProductInventory,
  /** Filter options for product listing */
  ProductFilter,
  /** Paginated product list response */
  ProductListResponse,
  /** Inventory update operation */
  InventoryUpdate,
  /** Stock availability status */
  StockStatus,
} from './product';

// Cart Types
export type {
  /** Individual item in a shopping cart */
  CartItem,
  /** Complete shopping cart session with items and metadata */
  CartSession,
  /** Result of a cart operation */
  CartOperationResult,
  /** Input for adding an item to cart */
  AddToCartInput,
  /** Input for updating a cart item */
  UpdateCartItemInput,
  /** Input for removing an item from cart */
  RemoveFromCartInput,
  /** Cart session type identifier */
  CartSessionType,
  /** Cart session identifier with type and id */
  CartSessionIdentifier,
} from './cart';

// Discount Types
export type {
  /** Discount code configuration */
  DiscountCode,
  /** Types of discount rules available */
  DiscountType,
  /** Discount rule definition */
  DiscountRule,
  /** Result of discount validation */
  DiscountValidationResult,
  /** Applied discount on a cart */
  AppliedDiscount,
  /** Cart totals with discount applied */
  CartWithDiscount,
} from './discount';
