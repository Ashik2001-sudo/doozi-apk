import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import {
  AccountOption,
  getOrderStatusFromItems,
  money,
  PaymentRow,
  ReturnTarget,
  SellTarget,
  WholesaleOrder,
} from '../types';

type Params = {
  accountsForBranch: (branchId?: string) => AccountOption[];
  refresh: () => void | Promise<void>;
};

export function useWholesaleActions({ accountsForBranch, refresh }: Params) {
  // Sell-out state
  const [sellItem, setSellItem] = useState<SellTarget | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sellRows, setSellRows] = useState<PaymentRow[]>([{ id: '1', accountId: '', amount: '' }]);
  const [sellAdvance, setSellAdvance] = useState(0);
  const [sellBusy, setSellBusy] = useState(false);
  const [accountPickerId, setAccountPickerId] = useState<string | null>(null);

  // Return state
  const [returnTarget, setReturnTarget] = useState<ReturnTarget | null>(null);
  const [returnBusy, setReturnBusy] = useState(false);
  const [returnQty, setReturnQty] = useState('');

  const sellAccounts = useMemo(
    () => accountsForBranch(sellItem?.order.branch?.id),
    [accountsForBranch, sellItem],
  );

  const openSellOut = useCallback((order: WholesaleOrder, item: SellTarget['item']) => {
    // Same as seller-admin Edit Item: start with empty account (user must pick).
    setSellItem({ order, item });
    setSellPrice(String(item.unitPrice ?? 0));
    setSellAdvance(0);
    setSellRows([{ id: String(Date.now()), accountId: '', amount: '' }]);
  }, []);

  const closeSellOut = useCallback(() => setSellItem(null), []);

  const sellRowsTotal = useMemo(
    () =>
      sellRows.reduce(
        (s, r) => s + (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0),
        0,
      ),
    [sellRows],
  );
  const sellPaid = sellRowsTotal + sellAdvance;
  const sellItemTotal =
    (Number(sellPrice) || Number(sellItem?.item.unitPrice) || 0) * (sellItem?.item.quantity || 0);

  const addSellRow = useCallback(() => {
    setSellRows((prev) => [...prev, { id: String(Date.now()), accountId: '', amount: '' }]);
  }, []);

  const removeSellRow = useCallback((id: string) => {
    setSellRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const clearAdvance = useCallback(() => setSellAdvance(0), []);

  const setSellRowAmount = useCallback(
    (id: string, amount: number | '') => {
      setSellRows((prev) => {
        if (amount === '') {
          return prev.map((r) => (r.id === id ? { ...r, amount: '' } : r));
        }
        const raw = Number(amount);
        if (!Number.isFinite(raw) || raw < 0) return prev;

        const otherRowsTotal = prev.reduce((sum, r) => {
          if (r.id === id) return sum;
          return sum + (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0);
        }, 0);
        const maxForRow = Math.max(
          0,
          Math.round((sellItemTotal - sellAdvance - otherRowsTotal) * 100) / 100,
        );
        const capped = Math.min(Math.round(raw * 100) / 100, maxForRow);
        return prev.map((r) => (r.id === id ? { ...r, amount: capped } : r));
      });
    },
    [sellAdvance, sellItemTotal],
  );

  const setSellRowAccount = useCallback((id: string, accountId: string) => {
    setSellRows((prev) => prev.map((r) => (r.id === id ? { ...r, accountId } : r)));
    setAccountPickerId(null);
  }, []);

  const payFull = useCallback(() => {
    // Fill remaining after advance (do not clear advance — same idea as seller-admin).
    const remaining = Math.max(0, Math.round((sellItemTotal - sellAdvance) * 100) / 100);
    setSellRows((prev) => {
      if (!prev[0]?.accountId) return prev;
      return [
        { ...prev[0], amount: remaining },
        ...prev.slice(1).map((r) => ({ ...r, amount: '' as const })),
      ];
    });
  }, [sellItemTotal, sellAdvance]);

  const applyAdvance = useCallback(() => {
    setSellAdvance(
      Math.min(
        Number(sellItem?.order.retailer?.advanceBalance || 0),
        Math.max(0, sellItemTotal - sellPaid + sellAdvance),
      ),
    );
  }, [sellItem, sellItemTotal, sellPaid, sellAdvance]);

  const confirmSellOut = useCallback(async () => {
    if (!sellItem) return;
    const paid = sellPaid;
    if (paid < 0) {
      Alert.alert('Invalid', 'Payment cannot be negative');
      return;
    }
    // Same as seller-admin: payment cannot exceed item total
    if (paid > sellItemTotal) {
      Alert.alert('Invalid', `Payment cannot exceed item total (${money(sellItemTotal)})`);
      return;
    }
    setSellBusy(true);
    try {
      // Mirror seller-admin handleEditItemSellOut:
      // 1) optional price PATCH → 2) order payment PATCH → 3) sell-out → 4) orderStatus
      let order = sellItem.order;
      const unitPrice = Number(sellPrice) || 0;
      if (Math.abs(unitPrice - Number(sellItem.item.unitPrice || 0)) > 0.001) {
        const patchRes = await authorizedFetch(
          `${API_BASE_URL}/wholesale-orders/items/${sellItem.item.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitPrice }),
          },
        );
        if (!patchRes.ok) {
          const err = await patchRes.json().catch(() => ({}));
          throw new Error(err.message || 'Price update failed');
        }
        const patchJson = await patchRes.json().catch(() => ({}));
        order = (patchJson.data ?? patchJson) as WholesaleOrder;
      }

      const currentPaid = Number(order.paidAmount) || 0;
      const newPaid = currentPaid + paid;
      const grandTotal = Number(order.grandTotal) || 0;
      const newDue = Math.max(0, grandTotal - newPaid);
      const paymentStatus = newDue <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'due';
      const orderRes = await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus,
        }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.message || 'Payment update failed');
      }

      const payments = sellRows
        .filter((r) => r.accountId && Number(r.amount) > 0)
        .map((r) => ({
          accountId: r.accountId,
          amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
        }));
      const sellBody =
        payments.length > 0 || sellAdvance > 0
          ? { payments, advanceApplied: sellAdvance }
          : { paidAmount: paid };

      const sellRes = await authorizedFetch(
        `${API_BASE_URL}/wholesale-orders/items/${sellItem.item.id}/sell-out`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sellBody),
        },
      );
      const sellJson = await sellRes.json().catch(() => ({}));
      if (!sellRes.ok) throw new Error(sellJson.message || 'Sell out failed');

      const updated: WholesaleOrder = sellJson.data ?? sellJson;
      const newStatus = getOrderStatusFromItems(updated.items || [], updated);
      await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      setSellItem(null);
      setSellAdvance(0);
      setSellRows([{ id: String(Date.now()), accountId: '', amount: '' }]);
      await refresh();
    } catch (err) {
      Alert.alert('Sell out failed', err instanceof Error ? err.message : 'Failed');
    } finally {
      setSellBusy(false);
    }
  }, [sellItem, sellPaid, sellItemTotal, sellPrice, sellRows, sellAdvance, refresh]);

  const openReturn = useCallback((order: WholesaleOrder, item: ReturnTarget['item']) => {
    const status = (item.status || 'pending').toLowerCase();
    if (status !== 'pending') {
      Alert.alert(
        'Return unavailable',
        'Sold-out items cannot be returned from the app. Only pending items can be returned here.',
      );
      return;
    }
    setReturnTarget({ order, item });
    setReturnQty('');
  }, []);
  const closeReturn = useCallback(() => {
    setReturnTarget(null);
    setReturnQty('');
  }, []);

  // Full return when qty is omitted; partial return (non-serial items only) when qty is given.
  // APK: pending items only — sold-out returns are web/admin only.
  const confirmReturn = useCallback(
    async (qty?: number) => {
      if (!returnTarget) return;
      const { order, item } = returnTarget;
      const status = (item.status || 'pending').toLowerCase();
      if (status !== 'pending') {
        Alert.alert(
          'Return unavailable',
          'Sold-out items cannot be returned from the app.',
        );
        return;
      }
      const hasSerials = Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0;
      const maxQty = item.quantity || 0;
      if (qty != null && (!Number.isFinite(qty) || qty < 1 || qty > maxQty)) {
        Alert.alert('Invalid quantity', `Enter a valid return quantity (1 to ${maxQty})`);
        return;
      }
      const effectiveQty = qty ?? (hasSerials ? maxQty : undefined);
      setReturnBusy(true);
      try {
        const res = await authorizedFetch(
          `${API_BASE_URL}/wholesale-orders/items/${item.id}/return`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(effectiveQty != null ? { quantity: effectiveQty } : {}),
          },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || 'Return failed');
        // Sync order status from fresh items (like seller-admin syncOrderStatusFromItems)
        try {
          const orderRes = await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${order.id}`);
          if (orderRes.ok) {
            const orderJson = await orderRes.json().catch(() => ({}));
            const fresh: WholesaleOrder = orderJson.data ?? orderJson;
            const newStatus = getOrderStatusFromItems(fresh.items || [], fresh);
            if (newStatus && newStatus !== (fresh.orderStatus || '')) {
              await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderStatus: newStatus }),
              });
            }
          }
        } catch {
          // non-blocking
        }
        setReturnTarget(null);
        setReturnQty('');
        await refresh();
      } catch (err) {
        Alert.alert('Return failed', err instanceof Error ? err.message : 'Failed');
      } finally {
        setReturnBusy(false);
      }
    },
    [returnTarget, refresh],
  );

  return {
    // sell-out
    sellItem,
    sellPrice,
    setSellPrice,
    sellRows,
    sellAdvance,
    sellBusy,
    sellAccounts,
    sellPaid,
    sellItemTotal,
    accountPickerId,
    setAccountPickerId,
    openSellOut,
    closeSellOut,
    addSellRow,
    removeSellRow,
    setSellRowAmount,
    setSellRowAccount,
    payFull,
    applyAdvance,
    clearAdvance,
    confirmSellOut,
    // return
    returnTarget,
    returnBusy,
    returnQty,
    setReturnQty,
    openReturn,
    closeReturn,
    confirmReturn,
  };
}

export type UseWholesaleActions = ReturnType<typeof useWholesaleActions>;
