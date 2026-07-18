import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { CartItem, POSProduct, POSProductVariant } from '../types/pos.types';
import { getBatchForAddOne, getBatchInfoForSerialFromApi } from './batch-selection';
import { parseImageField } from './formatters';

function isSerialAlreadyInCart(cart: CartItem[], serial: string): boolean {
  const target = String(serial).trim().toLowerCase();
  if (!target) return false;
  return cart.some((item) =>
    (item.serialNumbers || []).some((s) => String(s).trim().toLowerCase() === target),
  );
}

function normalizeVariant(
  product: any,
  variant: any,
): { product: POSProduct; variant: POSProductVariant } {
  const embedded =
    variant?.prices?.[0] ??
    (variant?.price?.sellingPrice != null ? variant.price : null);
  return {
    product: {
      ...product,
      images: parseImageField(product.images),
      hasSerialNumber: !!product.hasSerialNumber,
      variants: product.variants || [],
    },
    variant: {
      ...variant,
      images: parseImageField(variant.images),
      attributes: (variant.attributes || []).map((attr: any) => ({
        attributeName: attr.name || attr.attributeName || '',
        attributeValue: attr.value || attr.attributeValue || '',
      })),
      price: {
        sellingPrice: Number(embedded?.sellingPrice ?? 0),
        discountType: embedded?.discountType,
        discountValue: embedded?.discountValue ? Number(embedded.discountValue) : 0,
      },
    },
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await authorizedFetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
  retries = 1,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Network request failed');
}

type AddFn = (
  product: POSProduct,
  variant: POSProductVariant,
  serialNumbers?: string[],
  batchNumber?: string,
  batchNumbers?: string[],
  serialBatchMap?: Record<string, string>,
) => { success: boolean; message?: string };

async function addNonSerialWithFifoBatch(opts: {
  product: POSProduct;
  variant: POSProductVariant;
  cart: CartItem[];
  branchId: string | null;
  addToCart: AddFn;
}): Promise<{ handled: boolean; message?: string }> {
  const existingCartItem = opts.cart.find(
    (c) => c.productId === opts.product.id && c.variantId === opts.variant.id,
  );
  const { batchNumber, batchNumbers, hasBatches } = await getBatchForAddOne(
    opts.product.id,
    opts.variant.id,
    existingCartItem,
    opts.branchId,
  );
  if (hasBatches && batchNumbers.length === 0) {
    return { handled: true, message: 'No stock available in any batch' };
  }
  const result = opts.addToCart(
    opts.product,
    opts.variant,
    undefined,
    batchNumber,
    batchNumbers.length > 0 ? batchNumbers : undefined,
  );
  return { handled: true, message: result.success ? undefined : result.message };
}

/**
 * Mirrors seller-admin ProductGrid.tryAddByEnter —
 * IMEI → SKU (FIFO batch) → API serial → API SKU → batch barcode.
 */
export async function tryAddByEnter(opts: {
  query: string;
  products: POSProduct[];
  cart: CartItem[];
  branchId: string | null;
  addToCart: AddFn;
  onSelectSerial?: (product: POSProduct, variant: POSProductVariant) => void;
}): Promise<{ handled: boolean; message?: string }> {
  const query = opts.query.trim();
  if (!query) return { handled: false };
  const exact = query.toLowerCase();

  // 1) Exact IMEI in loaded products
  const matches: Array<{ product: POSProduct; variant: POSProductVariant; serial: string }> = [];
  for (const product of opts.products) {
    if (!product.hasSerialNumber) continue;
    for (const variant of product.variants || []) {
      const serialRows = ((variant as any).serialNumbers ?? []) as Array<
        string | { serialNumber?: string }
      >;
      for (const row of serialRows) {
        const serial = typeof row === 'string' ? row : row?.serialNumber;
        if (serial && serial.toLowerCase() === exact) {
          matches.push({ product, variant, serial });
        }
      }
    }
  }

  if (matches.length === 1) {
    const hit = matches[0];
    if (isSerialAlreadyInCart(opts.cart, hit.serial)) {
      return { handled: true, message: 'This IMEI/serial is already in the cart' };
    }
    if (!opts.branchId) return { handled: true, message: 'Please select a branch first' };
    const batch = await getBatchInfoForSerialFromApi(
      hit.product.id,
      hit.variant.id,
      opts.branchId,
      hit.serial,
    );
    const result = opts.addToCart(
      hit.product,
      hit.variant,
      [hit.serial],
      batch.batchNumber,
      batch.batchNumbers.length ? batch.batchNumbers : undefined,
      Object.keys(batch.serialBatchMap).length ? batch.serialBatchMap : undefined,
    );
    return { handled: true, message: result.success ? undefined : result.message };
  }
  if (matches.length > 1) {
    return { handled: true, message: 'Multiple exact IMEI matches found. Please select manually.' };
  }

  // 2) Exact SKU — non-serial only (same as seller-admin); FIFO batch assign
  const skuMatches: Array<{ product: POSProduct; variant: POSProductVariant }> = [];
  for (const product of opts.products) {
    if (product.hasSerialNumber) continue;
    for (const variant of product.variants || []) {
      if ((variant.sku || '').toLowerCase() === exact) {
        skuMatches.push({ product, variant });
      }
    }
  }
  if (skuMatches.length === 1) {
    const hit = skuMatches[0];
    return addNonSerialWithFifoBatch({
      product: hit.product,
      variant: hit.variant,
      cart: opts.cart,
      branchId: opts.branchId,
      addToCart: opts.addToCart,
    });
  }
  if (skuMatches.length > 1) {
    return { handled: true, message: 'Multiple exact SKU matches found. Please select manually.' };
  }

  if (!opts.branchId) {
    return { handled: true, message: 'Please select a branch first' };
  }

  try {
    // 3) API by-serial (timeout + 1 retry)
    const sp = new URLSearchParams({ serial: query, branchId: opts.branchId });
    const serialRes = await fetchWithRetry(
      `${API_BASE_URL}/products/pos/by-serial?${sp}`,
      {},
      5000,
      1,
    );
    if (serialRes.ok) {
      const serialData = await serialRes.json().catch(() => ({}));
      const serialProducts = Array.isArray(serialData?.products) ? serialData.products : [];
      const serialApiMatches: Array<{ product: any; variant: any; serial: string }> = [];
      for (const product of serialProducts) {
        if (!product?.hasSerialNumber) continue;
        for (const variant of product?.variants || []) {
          const rows = (variant?.serialNumbers || []) as Array<string | { serialNumber?: string }>;
          for (const row of rows) {
            const serial = typeof row === 'string' ? row : row?.serialNumber;
            if (serial && String(serial).trim().toLowerCase() === exact) {
              serialApiMatches.push({ product, variant, serial: String(serial) });
            }
          }
        }
      }
      if (serialApiMatches.length === 1) {
        const hit = serialApiMatches[0];
        if (isSerialAlreadyInCart(opts.cart, hit.serial)) {
          return { handled: true, message: 'This IMEI/serial is already in the cart' };
        }
        const { product, variant } = normalizeVariant(hit.product, hit.variant);
        const batch = await getBatchInfoForSerialFromApi(
          product.id,
          variant.id,
          opts.branchId,
          hit.serial,
        );
        const result = opts.addToCart(
          product,
          variant,
          [hit.serial],
          batch.batchNumber,
          batch.batchNumbers.length ? batch.batchNumbers : undefined,
          Object.keys(batch.serialBatchMap).length ? batch.serialBatchMap : undefined,
        );
        return { handled: true, message: result.success ? undefined : result.message };
      }
      if (serialApiMatches.length > 1) {
        return { handled: true, message: 'Multiple exact IMEI matches found. Please select manually.' };
      }
    }

    // 4) API SKU search — non-serial only + FIFO batch
    const skuParams = new URLSearchParams({
      branchId: opts.branchId,
      search: query,
      page: '1',
      limit: '20',
    });
    const skuRes = await fetchWithRetry(
      `${API_BASE_URL}/products/pos?${skuParams}`,
      {},
      5000,
      1,
    );
    if (skuRes.ok) {
      const skuData = await skuRes.json().catch(() => ({}));
      const skuProducts: any[] = skuData?.products || skuData?.data?.products || [];
      const skuApiMatches: Array<{ product: any; variant: any }> = [];
      for (const product of skuProducts) {
        if (product?.hasSerialNumber) continue;
        for (const variant of product?.variants || []) {
          if (String(variant?.sku || '').trim().toLowerCase() === exact) {
            skuApiMatches.push({ product, variant });
          }
        }
      }
      if (skuApiMatches.length === 1) {
        const hit = skuApiMatches[0];
        const normalized = normalizeVariant(hit.product, hit.variant);
        return addNonSerialWithFifoBatch({
          product: normalized.product,
          variant: normalized.variant,
          cart: opts.cart,
          branchId: opts.branchId,
          addToCart: opts.addToCart,
        });
      }
      if (skuApiMatches.length > 1) {
        return { handled: true, message: 'Multiple exact SKU matches found. Please select manually.' };
      }
    }

    // 5) Batch barcode / batch number
    const batchParams = new URLSearchParams({ code: query, branchId: opts.branchId });
    const batchRes = await fetchWithRetry(
      `${API_BASE_URL}/products/pos/by-batch?${batchParams}`,
      {},
      5000,
      1,
    );
    if (batchRes.ok) {
      const batchData = await batchRes.json().catch(() => ({}));
      if (batchData?.ambiguous) {
        return { handled: true, message: 'Multiple batch matches found. Please select manually.' };
      }
      if (batchData?.match) {
        const m = batchData.match;
        const { product, variant } = normalizeVariant(m.product || m, m.variant || m.variants?.[0]);
        const batchNumber = String(m.batchNumber || m.batch?.batchNumber || '');
        const availableQuantity = Number(m.availableQuantity ?? m.batch?.availableQuantity ?? 0);

        if (product.hasSerialNumber) {
          opts.onSelectSerial?.(product, variant);
          return {
            handled: true,
            message: opts.onSelectSerial
              ? undefined
              : 'Select an IMEI/serial before adding this product',
          };
        }

        if (!batchNumber) {
          return { handled: true, message: 'Batch match is missing batch number' };
        }

        const existingCartItem = opts.cart.find(
          (c) => c.productId === product.id && c.variantId === variant.id,
        );
        const usedFromBatch = (existingCartItem?.batchNumbers || []).filter(
          (b) => b === batchNumber,
        ).length;
        if (usedFromBatch >= availableQuantity) {
          return { handled: true, message: 'No stock left in this batch' };
        }

        const result = opts.addToCart(product, variant, undefined, batchNumber, [batchNumber]);
        return { handled: true, message: result.success ? undefined : result.message };
      }
    }
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') {
      return { handled: true, message: 'Network slow. Please press Enter again.' };
    }
    return { handled: true, message: 'Lookup failed. Try again.' };
  }

  return { handled: true, message: 'No exact IMEI, SKU, or batch barcode match found.' };
}

/** Same FIFO batch path as seller-admin product card click. */
export async function addProductLikeSellerAdmin(opts: {
  product: POSProduct;
  variant: POSProductVariant;
  cart: CartItem[];
  branchId: string | null;
  addToCart: AddFn;
  onSelectSerial?: (product: POSProduct, variant: POSProductVariant) => void;
}): Promise<{ success: boolean; message?: string }> {
  if (opts.product.hasSerialNumber) {
    opts.onSelectSerial?.(opts.product, opts.variant);
    return { success: true };
  }
  if ((opts.variant.stockQuantity ?? 0) <= 0) {
    return { success: false, message: `${opts.product.name} has no stock` };
  }
  const result = await addNonSerialWithFifoBatch({
    product: opts.product,
    variant: opts.variant,
    cart: opts.cart,
    branchId: opts.branchId,
    addToCart: opts.addToCart,
  });
  return { success: !result.message, message: result.message };
}

export function alertAddResult(result: { success: boolean; message?: string }) {
  if (!result.success && result.message) {
    Alert.alert('Cannot add', result.message);
  }
}
