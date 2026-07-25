import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/config';

export interface SaleOrderStats {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  monthlySales: number;
  monthlyRevenue: number;
  yearlySales?: number;
  yearlyRevenue?: number;
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

type DashboardPayload = {
  saleStats?: SaleOrderStats | null;
  recentOrders?: RecentOrder[];
};

function toLocalYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Same source as seller-admin dashboard: GET /reports/dashboard
 * (not /sale-orders/stats — that endpoint no longer returns today/month fields).
 */
export function useDashboardStats(branchId?: string) {
  const [saleStats, setSaleStats] = useState<SaleOrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set('branchId', branchId);
      const today = toLocalYmd();
      params.set('startDate', today);
      params.set('endDate', today);

      const res = await apiFetch<DashboardPayload>(`/reports/dashboard?${params.toString()}`);
      const payload = (res.data ?? res) as DashboardPayload;
      const stats = payload?.saleStats ?? null;

      setSaleStats(
        stats
          ? {
              totalSales: Number(stats.totalSales) || 0,
              totalRevenue: Number(stats.totalRevenue) || 0,
              todaySales: Number(stats.todaySales) || 0,
              todayRevenue: Number(stats.todayRevenue) || 0,
              monthlySales: Number(stats.monthlySales) || 0,
              monthlyRevenue: Number(stats.monthlyRevenue) || 0,
              yearlySales: Number(stats.yearlySales) || 0,
              yearlyRevenue: Number(stats.yearlyRevenue) || 0,
            }
          : null,
      );
      setRecentOrders(Array.isArray(payload?.recentOrders) ? payload.recentOrders : []);
    } catch (e) {
      setSaleStats(null);
      setRecentOrders([]);
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
