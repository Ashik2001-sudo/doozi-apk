import type { CartItem } from '../types/pos.types';
import { getEffectiveUnitPrice } from './calculations';

export type UnderpricedCartLine = {
  productName: string;
  variantName?: string;
  sku: string;
  purchaseUnitPrice: number;
  sellUnitPrice: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Avg purchase cost per unit captured when the line was added to cart. */
export function getPurchaseUnitPrice(item: CartItem): number {
  return r2(item.purchaseUnitPrice ?? 0);
}

/** True when charged per-unit price is strictly below avg purchase cost. */
export function isSellingBelowPurchasePrice(item: CartItem): boolean {
  const purchase = getPurchaseUnitPrice(item);
  const sell = getEffectiveUnitPrice(item.lineTotal, item.quantity);
  return purchase > 0 && sell > 0 && sell < purchase;
}

export function getUnderpricedCartLines(cart: CartItem[]): UnderpricedCartLine[] {
  return cart
    .filter(isSellingBelowPurchasePrice)
    .map((item) => ({
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      purchaseUnitPrice: getPurchaseUnitPrice(item),
      sellUnitPrice: getEffectiveUnitPrice(item.lineTotal, item.quantity),
    }));
}

/** Total loss vs avg purchase cost: (purchase − sell) × qty. */
export function getUnderpricedSaleLoss(cart: CartItem[]): number {
  return r2(
    cart.reduce((sum, item) => {
      if (!isSellingBelowPurchasePrice(item)) return sum;
      const purchase = getPurchaseUnitPrice(item);
      const sell = getEffectiveUnitPrice(item.lineTotal, item.quantity);
      return sum + (purchase - sell) * item.quantity;
    }, 0),
  );
}

export function hasUnderpricedSale(cart: CartItem[]): boolean {
  return getUnderpricedSaleLoss(cart) > 0;
}
