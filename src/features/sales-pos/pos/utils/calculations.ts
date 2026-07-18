import { CartItem, AppliedCoupon, AppliedGiftCard, AppliedService, PaymentMethod, OrderSummary } from '../types/pos.types';

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Pay Later (and similar) stores lineTotal but sale-order API needs per-unit fixed discount.
 * Reconstructs discountValue so calculateLineTotal(q, unitPrice, 'fixed', value) ≈ lineTotal.
 */
export function inferFixedDiscountPerUnit(
  quantity: number,
  unitPrice: number,
  lineTotal: number,
): number {
  const subtotal = r2(quantity * unitPrice);
  const lt = r2(Number(lineTotal));
  const lineDiscount = Math.max(0, r2(subtotal - lt));
  if (quantity <= 0) return 0;
  return r2(lineDiscount / quantity);
}

/** Actual amount charged per unit for this line (after product discount). */
export function getEffectiveUnitPrice(lineTotal: number, quantity: number): number {
  if (!quantity || quantity <= 0) return 0;
  return r2(lineTotal / quantity);
}

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountType?: 'fixed' | 'percentage',
  discountValue?: number
): number {
  const subtotal = r2(quantity * unitPrice);
  
  if (!discountType || !discountValue || discountValue <= 0) {
    return subtotal;
  }
  
  // Fixed amount is per unit (same as ProductCard: sellingPrice - discountValue per piece)
  if (discountType === 'fixed') {
    const lineDiscount = r2(discountValue * quantity);
    return r2(Math.max(0, subtotal - lineDiscount));
  } else {
    const discountAmount = r2((subtotal * discountValue) / 100);
    return r2(Math.max(0, subtotal - discountAmount));
  }
}

export function calculateSubtotal(cart: CartItem[]): number {
  return r2(cart.reduce((sum, item) => sum + item.lineTotal, 0));
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: AppliedCoupon | null
): number {
  if (!coupon) return 0;
  
  if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
    return 0;
  }
  
  if (coupon.discountType === 'fixed') {
    return r2(Math.min(coupon.discount, subtotal));
  } else {
    let discountAmount = r2((subtotal * coupon.discount) / 100);
    
    if (coupon.maximumDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
    }
    
    return r2(Math.min(discountAmount, subtotal));
  }
}

export function calculateGiftCardDiscount(
  grandTotal: number,
  giftCard: AppliedGiftCard | null
): number {
  if (!giftCard) return 0;
  
  // Can only apply up to the gift card balance or grand total, whichever is smaller
  return Math.min(giftCard.balance, grandTotal);
}

export function calculateServicesTotal(services: AppliedService[]): number {
  return r2(services.reduce((sum, service) => sum + service.price, 0));
}

export function calculateOrderSummary(
  cart: CartItem[],
  coupon: AppliedCoupon | null,
  giftCard: AppliedGiftCard | null,
  services: AppliedService[],
  taxPercent: number = 0,
  shippingCost: number = 0,
  payments: PaymentMethod[] = [],
  orderDiscountAmount: number = 0,
  vipDiscountPercent: number = 0,
  redeemPoints: number = 0,
  pointRedemptionRate: number = 1,
): OrderSummary {
  const subtotal = calculateSubtotal(cart);
  const servicesTotal = calculateServicesTotal(services);
  const totalBeforeDiscounts = r2(subtotal + servicesTotal);
  const orderDisc = r2(Math.min(Math.max(0, orderDiscountAmount), totalBeforeDiscounts));
  const afterOrderDisc = r2(totalBeforeDiscounts - orderDisc);

  const couponDiscount = calculateCouponDiscount(afterOrderDisc, coupon);
  const totalAfterCoupon = r2(afterOrderDisc - couponDiscount);

  const vipDiscount = vipDiscountPercent > 0
    ? r2((totalAfterCoupon * vipDiscountPercent) / 100)
    : 0;
  const totalAfterVip = r2(totalAfterCoupon - vipDiscount);

  const giftCardDiscount = calculateGiftCardDiscount(totalAfterVip, giftCard);
  const totalAfterGiftCard = r2(totalAfterVip - giftCardDiscount);

  const pointsDiscount = redeemPoints > 0
    ? r2(Math.min(redeemPoints * pointRedemptionRate, totalAfterGiftCard))
    : 0;
  const totalAfterPoints = r2(totalAfterGiftCard - pointsDiscount);

  const taxAmount = r2((totalAfterPoints * taxPercent) / 100);
  const grandTotal = r2(Math.max(0, totalAfterPoints + taxAmount + shippingCost));

  const totalPaid = r2(payments.reduce((sum, payment) => sum + payment.amount, 0));
  const dueAmount = r2(Math.max(0, grandTotal - totalPaid));
  const changeAmount = r2(Math.max(0, totalPaid - grandTotal));

  return {
    subtotal,
    orderDiscountAmount: orderDisc,
    couponDiscount,
    giftCardDiscount,
    vipDiscount,
    pointsDiscount,
    taxAmount,
    shippingCost,
    grandTotal,
    totalPaid,
    dueAmount,
    changeAmount,
    redeemPoints,
  };
}

export function generateOrderNumber(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

