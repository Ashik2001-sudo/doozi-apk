import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import type { ProductAttribute } from '@/types/product.types';

export function useProductAttributes(branchId?: string | null) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      const qs = params.toString();
      const url = qs
        ? `${API_BASE_URL}/product-attributes?${qs}`
        : `${API_BASE_URL}/product-attributes`;
      const res = await authorizedFetch(url);
      if (!res.ok) throw new Error('Failed to fetch product attributes');
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.attributes)
            ? data.attributes
            : [];
      setAttributes(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attributes');
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void fetchAttributes();
  }, [fetchAttributes]);

  return { attributes, loading, error, refetch: fetchAttributes };
}
