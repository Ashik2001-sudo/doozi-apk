import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { POSProduct } from '@/features/sales-pos/pos/types/pos.types';
import { parseImageField } from '@/features/sales-pos/pos/utils/formatters';
import { useRealtimeSocket } from '@/contexts/RealtimeSocketContext';

/** Same page size as seller-admin POS — first chunk, then scroll loads more. */
const POS_PAGE_SIZE = 20;

type PosApiPayload = {
  products?: any[];
  data?: { products?: any[]; pagination?: { pages?: number; page?: number } };
  pagination?: { pages?: number; page?: number };
};

function parsePosResponse(json: PosApiPayload | any[]) {
  if (Array.isArray(json)) {
    return { list: json, pages: 1, page: 1 };
  }
  const list = json.products ?? json.data?.products ?? [];
  const pagination = json.pagination ?? json.data?.pagination;
  return {
    list: Array.isArray(list) ? list : [],
    pages: Number(pagination?.pages ?? 0),
    page: Number(pagination?.page ?? 1),
  };
}

/** Lean list row — drop bulky unused fields; serial picker fetches IMEIs on demand. */
function normalizeProduct(raw: any): POSProduct {
  const variants = (raw.variants || []).map((variant: any) => {
    const embedded =
      variant.prices?.[0] ??
      (variant.price?.sellingPrice != null ? variant.price : null);
    const serialRows = variant.serialNumbers;
    const availableSerialCount = Array.isArray(serialRows) ? serialRows.length : 0;
    return {
      id: variant.id,
      productId: variant.productId ?? raw.id,
      sku: variant.sku,
      stockQuantity: Number(variant.stockQuantity ?? 0),
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
      // Keep tiny arrays only (exact scan hits); otherwise count for stock filter.
      serialNumbers: availableSerialCount > 0 && availableSerialCount <= 8 ? serialRows : [],
      availableSerialCount,
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    images: parseImageField(raw.images),
    hasSerialNumber: !!raw.hasSerialNumber,
    sellerBrand: raw.sellerBrand ? { name: raw.sellerBrand.name } : undefined,
    brand: raw.brand ? { name: raw.brand.name } : undefined,
    status: raw.status || 'active',
    productType: raw.productType === 'variable' ? 'variable' : 'single',
    variants,
  } as POSProduct;
}

export function useProducts(
  branchId: string | null,
  categoryId: string | null,
  searchTerm: string,
) {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { socket } = useRealtimeSocket();

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastLoadedPageRef = useRef(0);
  const loadingMoreInFlightRef = useRef(false);
  const hasMoreRef = useRef(false);
  const searchTermRef = useRef(searchTerm);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  const fetchProducts = useCallback(
    async (opts?: { append?: boolean; silent?: boolean }) => {
      if (!branchId) {
        setProducts([]);
        setHasMore(false);
        hasMoreRef.current = false;
        lastLoadedPageRef.current = 0;
        setError(null);
        return;
      }

      const append = opts?.append === true;
      const silent = opts?.silent === true;
      const nextPage = append ? lastLoadedPageRef.current + 1 : 1;

      if (!append) {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        lastLoadedPageRef.current = 0;
        setHasMore(false);
        hasMoreRef.current = false;
      } else {
        if (!hasMoreRef.current || loadingMoreInFlightRef.current) return;
        if (!abortControllerRef.current) {
          abortControllerRef.current = new AbortController();
        }
        loadingMoreInFlightRef.current = true;
        setLoadingMore(true);
      }

      const signal = abortControllerRef.current.signal;
      let clearLoadingOnFinish = true;

      try {
        const q = searchTermRef.current.trim();
        const params = new URLSearchParams({
          branchId,
          page: String(nextPage),
          limit: String(POS_PAGE_SIZE),
        });
        if (categoryId && !q) params.set('categoryId', categoryId);
        if (q) params.set('search', q);

        const regularFetch = authorizedFetch(`${API_BASE_URL}/products/pos?${params}`, {
          signal,
        });

        // Serial-first lookup only on first page (same as seller-admin).
        let serialFetch: Promise<Response> | null = null;
        if (q && !append) {
          const sp = new URLSearchParams({ serial: q, branchId });
          serialFetch = authorizedFetch(`${API_BASE_URL}/products/pos/by-serial?${sp}`, {
            signal,
          });
        }

        const [regularRes, serialRes] = await Promise.all([
          regularFetch,
          serialFetch ?? Promise.resolve(null),
        ]);

        if (!regularRes.ok) {
          const errJson = await regularRes.json().catch(() => ({}));
          throw new Error(errJson?.message || `Failed to load products (${regularRes.status})`);
        }

        const regularJson = await regularRes.json();
        const { list: regularList, pages, page: currentPage } = parsePosResponse(regularJson);
        const totalPages = Math.max(0, pages);
        const resolvedPage = currentPage || nextPage;

        let serialList: any[] = [];
        if (serialRes?.ok) {
          const serialData = await serialRes.json().catch(() => ({}));
          serialList = serialData.products || [];
        }

        const seenIds = new Set<string>();
        const merged: any[] = [];
        for (const p of [...serialList, ...regularList]) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            merged.push(p);
          }
        }

        const normalized = merged.map(normalizeProduct);
        lastLoadedPageRef.current = resolvedPage;
        const more =
          totalPages > 0
            ? resolvedPage < totalPages
            : normalized.length >= POS_PAGE_SIZE;
        setHasMore(more);
        hasMoreRef.current = more;

        if (append) {
          setProducts((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            const additions = normalized.filter((p) => !ids.has(p.id));
            return additions.length ? [...prev, ...additions] : prev;
          });
        } else {
          setProducts(normalized);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          clearLoadingOnFinish = false;
          return;
        }
        if (!append) setProducts([]);
        if (!silent) setError(e instanceof Error ? e.message : 'Failed to load products');
      } finally {
        if (append) {
          loadingMoreInFlightRef.current = false;
          setLoadingMore(false);
        } else if (!silent && clearLoadingOnFinish) {
          setLoading(false);
        }
      }
    },
    [branchId, categoryId],
  );

  // Debounced first page when branch / category / search changes (seller-admin parity).
  useEffect(() => {
    if (!branchId) {
      abortControllerRef.current?.abort();
      setProducts([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      hasMoreRef.current = false;
      lastLoadedPageRef.current = 0;
      setError(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => void fetchProducts({ append: false }), 300);
    return () => {
      clearTimeout(t);
      abortControllerRef.current?.abort();
    };
  }, [branchId, categoryId, searchTerm, fetchProducts]);

  useEffect(() => {
    if (!socket || !branchId) return;
    const handler = () => void fetchProducts({ append: false, silent: true });
    socket.on('sale:created', handler);
    socket.on('sale:updated', handler);
    socket.on('sale:deleted', handler);
    return () => {
      socket.off('sale:created', handler);
      socket.off('sale:updated', handler);
      socket.off('sale:deleted', handler);
    };
  }, [socket, branchId, fetchProducts]);

  const loadMore = useCallback(() => {
    if (!branchId || !hasMore || loading || loadingMore || loadingMoreInFlightRef.current) return;
    void fetchProducts({ append: true, silent: true });
  }, [branchId, hasMore, loading, loadingMore, fetchProducts]);

  // Optimistic update: Update stock quantities instantly without refetching (same as seller-admin)
  const updateStockOptimistically = useCallback(
    (updates: Array<{ variantId: string; quantity: number }>) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          let changed = false;
          const variants = product.variants.map((variant) => {
            const update = updates.find((u) => u.variantId === variant.id);
            if (!update) return variant;
            changed = true;
            return {
              ...variant,
              stockQuantity: Math.max(0, variant.stockQuantity - update.quantity),
            };
          });
          return changed ? { ...product, variants } : product;
        }),
      );
    },
    [],
  );

  return {
    products,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchProducts({ append: false }),
    updateStockOptimistically,
  };
}
