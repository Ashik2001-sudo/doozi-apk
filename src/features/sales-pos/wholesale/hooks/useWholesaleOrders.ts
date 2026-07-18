import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBranches } from '@/hooks/branch/useBranches';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { filterAccountsByUserBranchAccess } from '@/utils/account-branch-access.utils';
import {
  AccountOption,
  StatusFilter,
  WholesaleOrder,
  WholesaleStats,
} from '../types';

const LIMIT = 20;

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function useWholesaleOrders() {
  const { branches, userAccessibleBranches, selectedBranchId } = useBranches();
  const branchList = userAccessibleBranches.length > 0 ? userAccessibleBranches : branches;

  const [branchId, setBranchId] = useState(selectedBranchId || '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  const requestRef = useRef(0);
  const branchInitRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!branchInitRef.current && selectedBranchId) {
      branchInitRef.current = true;
      setBranchId(selectedBranchId);
    }
  }, [selectedBranchId]);

  const selectBranch = useCallback((id: string) => {
    branchInitRef.current = true;
    setBranchId(id);
  }, []);

  const fetchOrders = useCallback(
    async (targetPage = 1, append = false) => {
      const seq = ++requestRef.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (branchId) params.set('branchId', branchId);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (statusFilter !== 'all') params.set('fulfillmentStatus', statusFilter);
        params.set('page', String(targetPage));
        params.set('limit', String(LIMIT));
        const res = await authorizedFetch(`${API_BASE_URL}/wholesale-orders?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'Failed to load wholesale orders');
        }
        const data = await res.json();
        if (seq !== requestRef.current) return;
        const items = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
            ? data.data
            : [];
        setOrders((prev) => (append ? [...prev, ...items] : items));
        setPage(Number(data.page ?? targetPage));
        setTotal(Number(data.total ?? items.length));
        setTotalPages(Math.max(1, Number(data.pages ?? data.totalPages ?? 1)));
      } catch (err) {
        if (seq !== requestRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load orders');
        if (!append) setOrders([]);
      } finally {
        if (seq === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [branchId, debouncedSearch, statusFilter],
  );

  useEffect(() => {
    void fetchOrders(1, false);
  }, [fetchOrders]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/accounts/selection`);
        const json = await res.json();
        const list = Array.isArray(json) ? json : json?.data ?? [];
        setAccounts(filterAccountsByUserBranchAccess(Array.isArray(list) ? list : []));
      } catch {
        setAccounts([]);
      }
    })();
  }, []);

  const accountsForBranch = useCallback(
    (bid?: string) => {
      const target = bid || branchId;
      if (!target) return accounts;
      return accounts.filter((a) => {
        const ab = String(a.branch?.id ?? a.branchId ?? '');
        return !ab || ab === String(target);
      });
    },
    [accounts, branchId],
  );

  const stats: WholesaleStats = useMemo(() => {
    let pendingItems = 0;
    let soldItems = 0;
    let loadedValue = 0;
    for (const o of orders) {
      if (isToday(o.orderDate)) loadedValue += Number(o.grandTotal) || 0;
      for (const it of o.items || []) {
        const s = (it.status || 'pending').toLowerCase();
        if (s === 'pending') pendingItems += 1;
        else if (s === 'sold' || s === 'sold_out') soldItems += 1;
      }
    }
    return { totalOrders: total || orders.length, pendingItems, soldItems, loadedValue };
  }, [orders, total]);

  const refresh = useCallback(() => fetchOrders(1, false), [fetchOrders]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loadingMore && !loading) {
      void fetchOrders(page + 1, true);
    }
  }, [page, totalPages, loadingMore, loading, fetchOrders]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return {
    branchList,
    branchId,
    selectBranch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    orders,
    setOrders,
    page,
    total,
    totalPages,
    loading,
    loadingMore,
    error,
    expandedId,
    toggleExpand,
    accounts,
    accountsForBranch,
    stats,
    fetchOrders,
    refresh,
    loadMore,
  };
}

export type UseWholesaleOrders = ReturnType<typeof useWholesaleOrders>;
