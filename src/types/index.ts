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
  CreateProductInput,
  /** Input for updating an existing product */
  UpdateProductInput,
  /** Stock keeping unit for inventory tracking */
  ProductVariant,
  /** Product category for catalog organization */
  ProductCategory,
} from './product';

// Cart Types
export type {
  /** Individual item in a shopping cart */
  CartItem,
  /** Complete shopping cart with items and metadata */
  Cart,
  /** Session data for cart persistence */
  CartSession,
  /** Options for cart operations */
  CartOperationOptions,
  /** Result of a cart operation */
  CartOperationResult,
} from './cart';

// Discount Types
export type {
  /** Discount code configuration */
  DiscountCode,
  /** Types of discount rules available */
  DiscountType,
  /** Result of discount validation */
  DiscountValidationResult,
  /** Input for creating a discount code */
  CreateDiscountInput,
} from './discount';
