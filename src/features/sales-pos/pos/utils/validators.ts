import { CartItem, AppliedCoupon, AppliedGiftCard, PaymentMethod, OrderSummary } from '../types/pos.types';

export function validateStockAvailability(
  cart: CartItem[],
  productId: string,
  variantId: string,
  requestedQuantity: number,
  availableStock: number
): { valid: boolean; message?: string } {
  // Check if item already in cart
  const existingItem = cart.find(
    item => item.productId === productId && item.variantId === variantId
  );
  
  const totalQuantity = (existingItem?.quantity || 0) + requestedQuantity;
  
  if (totalQuantity > availableStock) {
    return {
      valid: false,
      message: `Only ${availableStock} items available in stock`,
    };
  }
  
  return { valid: true };
}

export function validateCoupon(
  coupon: any,
  subtotal: number
): { valid: boolean; message?: string; appliedCoupon?: any } {
  if (!coupon) {
    return { valid: false, message: 'Coupon not found' };
  }
  
  if (!coupon.status) {
    return { valid: false, message: 'Coupon is inactive' };
  }
  
  const now = new Date();
  const startDate = new Date(coupon.startDate);
  const endDate = new Date(coupon.endDate);
  
  if (now < startDate) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }
  
  if (now > endDate) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ${coupon.minimumOrderAmount} required`,
    };
  }
  
  return {
    valid: true,
    appliedCoupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discount: coupon.discount,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscount: coupon.maximumDiscount,
      discountAmount: 0, // Will be calculated
    },
  };
}

export function validateGiftCard(
  giftCard: any,
  grandTotal: number
): { valid: boolean; message?: string; appliedGiftCard?: any } {
  if (!giftCard) {
    return { valid: false, message: 'Gift card not found' };
  }
  
  if (!giftCard.status) {
    return { valid: false, message: 'Gift card is inactive' };
  }
  
  const now = new Date();
  const expiryDate = new Date(giftCard.expiryDate);
  
  if (now > expiryDate) {
    return { valid: false, message: 'Gift card has expired' };
  }
  
  if (giftCard.balance <= 0) {
    return { valid: false, message: 'Gift card has no balance' };
  }
  
  const applicableAmount = Math.min(giftCard.balance, grandTotal);
  
  return {
    valid: true,
    appliedGiftCard: {
      id: giftCard.id,
      code: giftCard.code,
      balance: giftCard.balance,
      appliedAmount: applicableAmount,
      remainingBalance: giftCard.balance - applicableAmount,
    },
  };
}

export function validatePayment(
  payments: PaymentMethod[],
  grandTotal: number
): { valid: boolean; message?: string } {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  if (totalPaid <= 0) {
    return { valid: false, message: 'Please add at least one payment method' };
  }
  
  if (totalPaid < grandTotal) {
    return {
      valid: false,
      message: `Payment amount (${totalPaid}) is less than grand total (${grandTotal})`,
    };
  }
  
  // Validate transaction ID for non-cash payments
  for (const payment of payments) {
    if (payment.type !== 'cash' && !payment.transactionId) {
      return {
        valid: false,
        message: `Transaction ID is required for ${payment.type} payment`,
      };
    }
  }
  
  return { valid: true };
}

export function validateCart(cart: CartItem[]): { valid: boolean; message?: string } {
  if (cart.length === 0) {
    return { valid: false, message: 'Cart is empty' };
  }

  for (const item of cart) {
    if (item.quantity <= 0) {
      return { valid: false, message: `Invalid quantity for ${item.productName}` };
    }

    const serials = item.serialNumbers || [];
    if (serials.length > 0 && serials.length !== item.quantity) {
      return {
        valid: false,
        message: `IMEI count mismatch for ${item.productName}`,
      };
    }

    if (item.quantity > item.stockAvailable) {
      return {
        valid: false,
        message: `Insufficient stock for ${item.productName}`,
      };
    }
  }

  return { valid: true };
}

