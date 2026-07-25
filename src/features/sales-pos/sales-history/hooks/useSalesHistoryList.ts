import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { useBranches } from '@/hooks/branch/useBranches';
import type { SalesHistoryListItem } from '../types';

export type SaleTypeFilter = '' | 'pos' | 'wholesale' | 'quick_sell';

export type SalesHistoryFilters = {
  search: string;
  branchId: string;
  orderStatus: string;
  paymentStatus: string;
  orderType: SaleTypeFilter;
};

export const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All status' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'due', label: 'Due' },
] as const;

export const SALE_TYPE_OPTIONS: { value: SaleTypeFilter; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'pos', label: 'POS' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'quick_sell', label: 'Quick Sell' },
];

function unwrapList(payload: unknown): SalesHistoryListItem[] {
  if (Array.isArray(payload)) return payload as SalesHistoryListItem[];
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as SalesHistoryListItem[];
    if (Array.isArray(o.orders)) return o.orders as SalesHistoryListItem[];
    if (Array.isArray(o.items)) return o.items as SalesHistoryListItem[];
  }
  return [];
}

const LIMIT = 30;

export function useSalesHistoryList() {
  const { userAccessibleBranches, selectedBranchId } = useBranches();

  const [filters, setFilters] = useState<SalesHistoryFilters>(() => ({
    search: '',
    branchId: selectedBranchId || '',
    orderStatus: '',
    paymentStatus: '',
    orderType: '',
  }));
  const [searchInput, setSearchInput] = useState('');
  const [orders, setOrders] = useState<SalesHistoryListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAccessibleBranches.length) return;
    setFilters((prev) => {
      if (prev.branchId && userAccessibleBranches.some((b) => b.id === prev.branchId)) {
        return prev;
      }
      const next =
        selectedBranchId && userAccessibleBranches.some((b) => b.id === selectedBranchId)
          ? selectedBranchId
          : userAccessibleBranches[0].id;
      return { ...prev, branchId: next };
    });
  }, [userAccessibleBranches, selectedBranchId]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput.trim()) return prev;
        return { ...prev, search: searchInput.trim() };
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const updateFilter = useCallback(<K extends keyof SalesHistoryFilters>(key: K, value: SalesHistoryFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const fetchOrders = useCallback(
    async (targetPage = 1, append = false, opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else if (append) setLoadingMore(true);
      else if (targetPage === 1) setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        const searchQuery = filters.search?.trim() || '';
        if (searchQuery) params.set('search', searchQuery);
        if (filters.branchId) params.set('branchId', filters.branchId);
        if (filters.orderStatus) params.set('orderStatus', filters.orderStatus);
        if (filters.paymentStatus) params.set('paymentStatus', filters.paymentStatus);
        if (filters.orderType) params.set('orderType', filters.orderType);
        params.set('page', String(targetPage));
        params.set('limit', String(LIMIT));

        const res = await authorizedFetch(`${API_BASE_URL}/sale-orders?${params}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || 'Failed to load sales');

        const list = unwrapList(json?.data ?? json).map((o) => ({
          ...o,
          orderType:
            o.orderType === 'wholesale'
              ? 'wholesale'
              : o.orderType === 'quick_sell'
                ? 'quick_sell'
                : o.orderType || 'pos',
        }));

        setOrders((prev) => (append ? [...prev, ...list] : list));
        setPage(Number(json.page ?? targetPage));
        setTotal(Number(json.total ?? list.length));
        setTotalPages(Math.max(1, Number(json.totalPages ?? json.pages ?? 1)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load sales');
        if (!append) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    void fetchOrders(1, false);
  }, [fetchOrders]);

  const refresh = useCallback(async () => {
    await fetchOrders(1, false, { refresh: true });
  }, [fetchOrders]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || page >= totalPages) return;
    void fetchOrders(page + 1, true);
  }, [loading, loadingMore, page, totalPages, fetchOrders]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setFilters((prev) => ({
      search: '',
      branchId: prev.branchId,
      orderStatus: '',
      paymentStatus: '',
      orderType: '',
    }));
    setPage(1);
  }, []);

  return {
    orders,
    filters,
    searchInput,
    setSearchInput,
    updateFilter,
    clearFilters,
    branches: userAccessibleBranches,
    loading,
    loadingMore,
    refreshing,
    error,
    total,
    page,
    totalPages,
    refresh,
    loadMore,
  };
}
