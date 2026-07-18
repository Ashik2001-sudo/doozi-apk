import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/config';

export interface SaleOrderStats {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  monthlySales: number;
  monthlyRevenue: number;
}

export interface RecentOrder {
  id: string;
  invoiceNo: string;
  orderNo: string;
  grandTotal: number;
  orderDate: string;
  orderStatus: string;
  customerName?: string;
}

export function useDashboardStats(branchId?: string) {
  const [saleStats, setSaleStats] = useState<SaleOrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = branchId ? `?branchId=${branchId}` : '';
      const [statsRes, ordersRes] = await Promise.all([
        apiFetch<SaleOrderStats>(`/sale-orders/stats${q}`),
        apiFetch<{ orders?: RecentOrder[]; data?: RecentOrder[] }>(
          `/sale-orders?page=1&limit=8${branchId ? `&branchId=${branchId}` : ''}`,
        ),
      ]);
      setSaleStats(statsRes.data ?? null);
      const orders = ordersRes.data;
      const list = Array.isArray(orders)
        ? orders
        : (orders as { orders?: RecentOrder[] })?.orders ?? [];
      setRecentOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { saleStats, recentOrders, loading, error, refetch };
}
