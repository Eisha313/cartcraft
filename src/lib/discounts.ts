import { getDatabase } from './mongodb';
import { DiscountCode, DiscountRule, DiscountValidationResult, AppliedDiscount, CartWithDiscount, DiscountType } from '@/types/discount';
import { ObjectId, Collection } from 'mongodb';

const COLLECTION_NAME = 'discount_codes';

async function getDiscountCollection(): Promise<Collection<DiscountCode>> {
  const db = await getDatabase();
  return db.collection<DiscountCode>(COLLECTION_NAME);
}

export async function createDiscountCode(discount: Omit<DiscountCode, '_id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<DiscountCode> {
  const collection = await getDiscountCollection();
  
  // Check for duplicate code
  const existing = await collection.findOne({ code: discount.code.toUpperCase() });
  if (existing) {
    throw new Error('Discount code already exists');
  }

  const now = new Date();
  const newDiscount: DiscountCode = {
    ...discount,
    code: discount.code.toUpperCase(),
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newDiscount as any);
  return { ...newDiscount, _id: result.insertedId.toString() };
}

export async function getDiscountByCode(code: string): Promise<DiscountCode | null> {
  const collection = await getDiscountCollection();
  const discount = await collection.findOne({ code: code.toUpperCase() });
  
  if (!discount) return null;
  
  return {
    ...discount,
    _id: discount._id?.toString(),
  };
}

export async function getDiscountById(id: string): Promise<DiscountCode | null> {
  const collection = await getDiscountCollection();
  const discount = await collection.findOne({ _id: new ObjectId(id) });
  
  if (!discount) return null;
  
  return {
    ...discount,
    _id: discount._id?.toString(),
  };
}

export async function updateDiscountCode(
  id: string,
  updates: Partial<Omit<DiscountCode, '_id' | 'createdAt'>>
): Promise<DiscountCode | null> {
  const collection = await getDiscountCollection();
  
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };

  if (updates.code) {
    updateData.code = updates.code.toUpperCase();
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  return {
    ...result,
    _id: result._id?.toString(),
  };
}

export async function deleteDiscountCode(id: string): Promise<boolean> {
  const collection = await getDiscountCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function listDiscountCodes(options?: {
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ discounts: DiscountCode[]; total: number }> {
  const collection = await getDiscountCollection();
  const { activeOnly = false, limit = 50, offset = 0 } = options || {};

  const filter: any = {};
  if (activeOnly) {
    filter.isActive = true;
  }

  const [discounts, total] = await Promise.all([
    collection.find(filter).skip(offset).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    discounts: discounts.map(d => ({ ...d, _id: d._id?.toString() })),
    total,
  };
}

export async function validateDiscountCode(
  code: string,
  cartTotal: number,
  userId?: string
): Promise<DiscountValidationResult> {
  const discount = await getDiscountByCode(code);

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  if (!discount.isActive) {
    return { valid: false, error: 'This discount code is no longer active' };
  }

  const now = new Date();
  
  if (discount.startDate && now < new Date(discount.startDate)) {
    return { valid: false, error: 'This discount code is not yet valid' };
  }

  if (discount.endDate && now > new Date(discount.endDate)) {
    return { valid: false, error: 'This discount code has expired' };
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, error: 'This discount code has reached its usage limit' };
  }

  // Check user usage limit if applicable
  if (discount.userUsageLimit && userId) {
    const userUsage = await getUserDiscountUsage(code, userId);
    if (userUsage >= discount.userUsageLimit) {
      return { valid: false, error: 'You have already used this discount code the maximum number of times' };
    }
  }

  // Check minimum purchase requirement
  for (const rule of discount.rules) {
    if (rule.minimumPurchase && cartTotal < rule.minimumPurchase) {
      const minPurchase = (rule.minimumPurchase / 100).toFixed(2);
      return { valid: false, error: `Minimum purchase of $${minPurchase} required` };
    }
  }

  return { valid: true, discount };
}

export function calculateDiscount(
  rules: DiscountRule[],
  cartTotal: number,
  shippingCost: number,
  productTotals?: Map<string, number>
): AppliedDiscount[] {
  const appliedDiscounts: AppliedDiscount[] = [];

  for (const rule of rules) {
    let discountAmount = 0;
    let applicableTotal = cartTotal;

    // Calculate applicable total based on product restrictions
    if (productTotals && (rule.applicableProductIds?.length || rule.excludedProductIds?.length)) {
      applicableTotal = 0;
      productTotals.forEach((total, productId) => {
        const isApplicable = !rule.applicableProductIds?.length || rule.applicableProductIds.includes(productId);
        const isExcluded = rule.excludedProductIds?.includes(productId);
        
        if (isApplicable && !isExcluded) {
          applicableTotal += total;
        }
      });
    }

    switch (rule.type) {
      case 'percentage':
        discountAmount = Math.round(applicableTotal * (rule.value / 100));
        if (rule.maximumDiscount) {
          discountAmount = Math.min(discountAmount, rule.maximumDiscount);
        }
        appliedDiscounts.push({
          code: '',
          type: 'percentage',
          amount: discountAmount,
          description: `${rule.value}% off`,
        });
        break;

      case 'fixed_amount':
        discountAmount = Math.min(rule.value, applicableTotal);
        appliedDiscounts.push({
          code: '',
          type: 'fixed_amount',
          amount: discountAmount,
          description: `$${(rule.value / 100).toFixed(2)} off`,
        });
        break;

      case 'free_shipping':
        if (shippingCost > 0) {
          appliedDiscounts.push({
            code: '',
            type: 'free_shipping',
            amount: shippingCost,
            description: 'Free shipping',
          });
        }
        break;
    }
  }

  return appliedDiscounts;
}

export function applyDiscountToCart(
  subtotal: number,
  shippingCost: number,
  discount: DiscountCode,
  productTotals?: Map<string, number>
): CartWithDiscount {
  const appliedDiscounts = calculateDiscount(
    discount.rules,
    subtotal,
    shippingCost,
    productTotals
  ).map(d => ({ ...d, code: discount.code }));

  const totalDiscount = appliedDiscounts.reduce((sum, d) => {
    if (d.type === 'free_shipping') return sum;
    return sum + d.amount;
  }, 0);

  const freeShipping = appliedDiscounts.some(d => d.type === 'free_shipping');
  const finalShipping = freeShipping ? 0 : shippingCost;

  return {
    subtotal,
    discounts: appliedDiscounts,
    totalDiscount,
    shippingCost: finalShipping,
    total: Math.max(0, subtotal - totalDiscount + finalShipping),
  };
}

export async function incrementDiscountUsage(code: string, userId?: string): Promise<void> {
  const collection = await getDiscountCollection();
  
  await collection.updateOne(
    { code: code.toUpperCase() },
    { 
      $inc: { usageCount: 1 },
      $set: { updatedAt: new Date() }
    }
  );

  // Track user usage if userId provided
  if (userId) {
    const db = await getDatabase();
    await db.collection('discount_usage').insertOne({
      code: code.toUpperCase(),
      userId,
      usedAt: new Date(),
    });
  }
}

async function getUserDiscountUsage(code: string, userId: string): Promise<number> {
  const db = await getDatabase();
  return db.collection('discount_usage').countDocuments({
    code: code.toUpperCase(),
    userId,
  });
}
