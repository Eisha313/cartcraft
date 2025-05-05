/**
 * CartCraft Type Definitions
 * 
 * This module exports all public types for the CartCraft library.
 * Import types from this module for type-safe integration.
 * 
 * @example
 * ```typescript
 * import type { Product, Cart, DiscountCode } from 'cartcraft/types';
 * ```
 */

// Product types
export type {
  Product,
  ProductVariant,
  ProductImage,
  ProductCategory,
  CreateProductInput,
  UpdateProductInput,
  ProductQuery,
} from './product';

// Cart types
export type {
  Cart,
  CartItem,
  CartSession,
  CartTotals,
  AddToCartInput,
  UpdateCartItemInput,
  CartWithTotals,
} from './cart';

// Discount types
export type {
  DiscountCode,
  DiscountType,
  DiscountRule,
  PercentageDiscount,
  FixedAmountDiscount,
  FreeShippingDiscount,
  DiscountValidationResult,
  CreateDiscountInput,
  AppliedDiscount,
} from './discount';
