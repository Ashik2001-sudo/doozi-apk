import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import type {
  AssignSupplierPayload,
  CreateQuickSellPayload,
  QuickSellOrder,
  QuickSellStats,
} from '../types';

export function useQuickSells() {
  const [orders, setOrders] = useState<QuickSellOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<QuickSellStats | null>(null);
  const locallyCreatedIdsRef = useRef<Set<string>>(new Set());

  const fetchQuickSells = useCallback(
    async (
      branchId?: string,
      status?: string,
      startDate?: string,
      endDate?: string,
      pageParam?: number,
      opts?: { append?: boolean },
    ) => {
      setLoading(true);
      setError(null);
      const p = pageParam ?? page;
      const append = !!opts?.append;
      try {
        const params = new URLSearchParams();
        if (branchId) params.set('branchId', branchId);
        if (status) params.set('status', status);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        params.set('page', String(p));
        params.set('limit', String(limit));
        const res = await authorizedFetch(`${API_BASE_URL}/quick-sells?${params}`);
        if (!res.ok) throw new Error('Failed to fetch quick sells');
        const json = await res.json();
        if (json.items !== undefined) {
          const items = Array.isArray(json.items) ? json.items : [];
          setOrders((prev) => (append ? [...prev, ...items] : items));
          setTotal(Number(json.total ?? 0));
          setPage(Number(json.page ?? p));
          if (json.stats) setStats(json.stats);
        } else {
          const data = json.data ?? json;
          const items = Array.isArray(data) ? data : [];
          setOrders((prev) => (append ? [...prev, ...items] : items));
          setTotal(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch quick sells');
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [page, limit],
  );

  const createQuickSell = useCallback(
    async (payload: CreateQuickSellPayload): Promise<QuickSellOrder | null> => {
      setError(null);
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/quick-sells`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to create quick sell');
        const created = (json.data ?? json) as QuickSellOrder;
        if (created?.id) locallyCreatedIdsRef.current.add(created.id);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create quick sell');
        return null;
      }
    },
    [],
  );

  const assignSupplier = useCallback(
    async (id: string, payload: AssignSupplierPayload): Promise<QuickSellOrder | null> => {
      setError(null);
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/quick-sells/${id}/assign-supplier`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Failed to assign supplier');
        return json.data ?? json;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign supplier');
        return null;
      }
    },
    [],
  );

  const returnQuickSell = useCallback(async (id: string): Promise<QuickSellOrder | null> => {
    setError(null);
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/quick-sells/${id}/return`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to return quick sell');
      return json.data ?? json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return quick sell');
      return null;
    }
  }, []);

  const revertQuickSellAssign = useCallback(async (id: string): Promise<QuickSellOrder | null> => {
    setError(null);
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/quick-sells/${id}/revert-assign`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to revert supplier assignment');
      return json.data ?? json;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revert supplier assignment');
      return null;
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const hasMore = page < totalPages;

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  return {
    orders,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    hasMore,
    stats,
    fetchQuickSells,
    createQuickSell,
    assignSupplier,
    returnQuickSell,
    revertQuickSellAssign,
    setPage,
    goToPage,
  };
}
