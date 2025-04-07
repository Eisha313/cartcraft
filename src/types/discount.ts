export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';

export interface DiscountRule {
  type: DiscountType;
  value: number; // percentage (0-100) or fixed amount in cents
  minimumPurchase?: number; // minimum cart total in cents
  maximumDiscount?: number; // cap for percentage discounts in cents
  applicableProductIds?: string[]; // if empty, applies to all products
  excludedProductIds?: string[]; // products excluded from discount
}

export interface DiscountCode {
  _id?: string;
  code: string;
  description?: string;
  rules: DiscountRule[];
  usageLimit?: number; // max total uses
  usageCount: number;
  userUsageLimit?: number; // max uses per user
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountValidationResult {
  valid: boolean;
  discount?: DiscountCode;
  error?: string;
  calculatedDiscount?: number; // discount amount in cents
}

export interface AppliedDiscount {
  code: string;
  type: DiscountType;
  amount: number; // discount amount in cents
  description?: string;
}

export interface CartWithDiscount {
  subtotal: number;
  discounts: AppliedDiscount[];
  totalDiscount: number;
  shippingCost: number;
  total: number;
}
