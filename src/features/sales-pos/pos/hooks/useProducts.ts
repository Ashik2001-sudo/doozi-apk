import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { POSProduct } from '@/features/sales-pos/pos/types/pos.types';
import { parseImageField } from '@/features/sales-pos/pos/utils/formatters';
import { useRealtimeSocket } from '@/contexts/RealtimeSocketContext';

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

function normalizeProduct(raw: any): POSProduct {
  const variants = (raw.variants || []).map((variant: any) => {
    const embedded =
      variant.prices?.[0] ??
      (variant.price?.sellingPrice != null ? variant.price : null);
    return {
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
      serialNumbers: variant.serialNumbers || [],
    };
  });

  return {
    ...raw,
    images: parseImageField(raw.images),
    hasSerialNumber: !!raw.hasSerialNumber,
    variants,
  };
}

export function useProducts(
  branchId: string | null,
  categoryId: string | null,
  searchTerm: string,
) {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { socket } = useRealtimeSocket();

  const fetchProducts = useCallback(
    async (pageNum = 1, append = false) => {
      if (!branchId) {
        setProducts([]);
        setError(null);
        return;
      }
      setLoading(true);
      if (!append) setError(null);
      try {
        const q = searchTerm.trim();
        const params = new URLSearchParams({
          branchId,
          page: String(pageNum),
          limit: '20',
        });
        if (categoryId && !q) params.set('categoryId', categoryId);
        if (q) params.set('search', q);

        const regularFetch = authorizedFetch(`${API_BASE_URL}/products/pos?${params}`);

        let serialFetch: Promise<Response> | null = null;
        if (q && !append) {
          const sp = new URLSearchParams({ serial: q, branchId });
          serialFetch = authorizedFetch(`${API_BASE_URL}/products/pos/by-serial?${sp}`);
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
        setProducts((prev) => (append ? [...prev, ...normalized] : normalized));
        setHasMore(pages > 0 ? currentPage < pages : normalized.length >= 20);
        setPage(pageNum);
      } catch (e) {
        if (!append) setProducts([]);
        setError(e instanceof Error ? e.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    },
    [branchId, categoryId, searchTerm],
  );

  useEffect(() => {
    const t = setTimeout(() => void fetchProducts(1, false), 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => {
    if (!socket || !branchId) return;
    const handler = () => void fetchProducts(1, false);
    socket.on('sale:created', handler);
    socket.on('sale:updated', handler);
    return () => {
      socket.off('sale:created', handler);
      socket.off('sale:updated', handler);
    };
  }, [socket, branchId, fetchProducts]);

  const loadMore = () => {
    if (!loading && hasMore) void fetchProducts(page + 1, true);
  };

  // Optimistic update: Update stock quantities instantly without refetching (same as seller-admin)
  const updateStockOptimistically = useCallback(
    (updates: Array<{ variantId: string; quantity: number }>) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) => ({
          ...product,
          variants: product.variants.map((variant) => {
            const update = updates.find((u) => u.variantId === variant.id);
            if (update) {
              return {
                ...variant,
                stockQuantity: Math.max(0, variant.stockQuantity - update.quantity),
              };
            }
            return variant;
          }),
        })),
      );
    },
    [],
  );

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchProducts(1, false),
    updateStockOptimistically,
  };
}
