import { getMediaUrl } from '@/lib/config';

export function formatCurrency(amount: number | null | undefined): string {
  const n = amount == null || Number.isNaN(amount) ? 0 : amount;
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

export function resolveProductImageUrl(url: unknown): string {
  if (url == null) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  return getMediaUrl(s);
}

export function getValidImageSrc(src: unknown): string | null {
  const out = resolveProductImageUrl(src);
  return out || null;
}

export function parseImageField(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v)).filter((v) => v.trim() !== '');
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v)).filter((v) => v.trim() !== '');
      }
    } catch {
      // not JSON
    }
    return [trimmed];
  }
  return [];
}

export function getVariantDisplayName(
  attributes?: Array<{ attributeName?: string; attributeValue?: string; name?: string; value?: string }>,
): string {
  if (!attributes?.length) return '';
  return attributes
    .map((attr) => String(attr.value ?? attr.attributeValue ?? '').trim())
    .filter(Boolean)
    .join(' + ');
}

export function getFinalSellingPrice(
  sellingPrice: number,
  discountType?: 'fixed' | 'percentage',
  discountValue?: number,
): number {
  const discount = discountValue ?? 0;
  let final = sellingPrice;
  if (discountType === 'percentage' && discount > 0) {
    final = sellingPrice - (sellingPrice * discount) / 100;
  } else if (discountType === 'fixed' && discount > 0) {
    final = sellingPrice - discount;
  }
  return Math.max(0, final);
}

export function variantHasStock(
  variant: { stockQuantity?: number; serialNumbers?: unknown },
): boolean {
  if ((variant.stockQuantity ?? 0) > 0) return true;
  const serials = variant.serialNumbers;
  return Array.isArray(serials) && serials.length > 0;
}

export function filterInStockProducts<T extends { variants?: Array<{ stockQuantity?: number; serialNumbers?: unknown }> }>(
  products: T[],
): T[] {
  return products
    .map((product) => ({
      ...product,
      variants: (product.variants || []).filter((variant) => variantHasStock(variant)),
    }))
    .filter((product) => (product.variants?.length ?? 0) > 0);
}
