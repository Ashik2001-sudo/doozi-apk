import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import type { OrderPaymentRecord, SaleOrderDetail } from '../types';
import { normalizePaymentRow, unwrapPaymentRows } from '../utils';

export function useOrderDetail(orderId: string) {
  const [order, setOrder] = useState<SaleOrderDetail | null>(null);
  const [payments, setPayments] = useState<OrderPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (id: string, o?: SaleOrderDetail | null) => {
    try {
      if (o?.orderType === 'wholesale' && o.retailerId && o.wholesaleOrderId) {
        const res = await authorizedFetch(
          `${API_BASE_URL}/retailers/${o.retailerId}/transactions?type=payment`,
        );
        if (!res.ok) return [];
        const json = await res.json().catch(() => ({}));
        const top = json?.data ?? json;
        const rows = unwrapPaymentRows(top).filter(
          (t) => String(t.wholesaleOrderId ?? '') === String(o.wholesaleOrderId),
        );
        return rows.map(normalizePaymentRow);
      }
      const res = await authorizedFetch(`${API_BASE_URL}/sale-orders/${id}/payments`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => ({}));
      const top = json?.data ?? json;
      return unwrapPaymentRows(top).map(normalizePaymentRow);
    } catch {
      return [];
    }
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!orderId) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/sale-orders/${orderId}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message || 'Order not found');
        }
        const data = (json?.data ?? json) as SaleOrderDetail;
        setOrder(data);
        const payRows = await fetchPayments(orderId, data);
        setPayments(payRows);
      } catch (e) {
        setOrder(null);
        setPayments([]);
        setError(e instanceof Error ? e.message : 'Failed to load order');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId, fetchPayments],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load({ silent: true });
  }, [load]);

  return {
    order,
    setOrder,
    payments,
    setPayments,
    loading,
    refreshing,
    error,
    refresh,
    reload: load,
  };
}
