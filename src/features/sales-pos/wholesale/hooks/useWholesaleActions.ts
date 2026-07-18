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

  const sellAccounts = useMemo(
    () => accountsForBranch(sellItem?.order.branch?.id),
    [accountsForBranch, sellItem],
  );

  const openSellOut = useCallback(
    (order: WholesaleOrder, item: SellTarget['item']) => {
      const accs = accountsForBranch(order.branch?.id);
      const cash = accs.find((a) => (a.accountType || '').toLowerCase() === 'cash');
      setSellItem({ order, item });
      setSellPrice(String(item.unitPrice ?? 0));
      setSellAdvance(0);
      setSellRows([{ id: String(Date.now()), accountId: cash?.id || '', amount: '' }]);
    },
    [accountsForBranch],
  );

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

  const setSellRowAmount = useCallback((id: string, amount: number | '') => {
    setSellRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount } : r)));
  }, []);

  const setSellRowAccount = useCallback((id: string, accountId: string) => {
    setSellRows((prev) => prev.map((r) => (r.id === id ? { ...r, accountId } : r)));
    setAccountPickerId(null);
  }, []);

  const payFull = useCallback(() => {
    setSellRows((prev) => {
      if (!prev[0]?.accountId) return prev;
      return [
        { ...prev[0], amount: Math.round(sellItemTotal * 100) / 100 },
        ...prev.slice(1).map((r) => ({ ...r, amount: '' as const })),
      ];
    });
    setSellAdvance(0);
  }, [sellItemTotal]);

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
    if (paid > sellItemTotal + 0.01) {
      Alert.alert('Invalid', `Payment cannot exceed item total (${money(sellItemTotal)})`);
      return;
    }
    setSellBusy(true);
    try {
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
      await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${sellItem.order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      setSellItem(null);
      await refresh();
    } catch (err) {
      Alert.alert('Sell out failed', err instanceof Error ? err.message : 'Failed');
    } finally {
      setSellBusy(false);
    }
  }, [sellItem, sellPaid, sellItemTotal, sellPrice, sellRows, sellAdvance, refresh]);

  const openReturn = useCallback((order: WholesaleOrder, item: ReturnTarget['item']) => {
    setReturnTarget({ order, item });
  }, []);
  const closeReturn = useCallback(() => setReturnTarget(null), []);

  const confirmReturn = useCallback(async () => {
    if (!returnTarget) return;
    const { order, item } = returnTarget;
    const hasSerials = Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0;
    setReturnBusy(true);
    try {
      const res = await authorizedFetch(
        `${API_BASE_URL}/wholesale-orders/items/${item.id}/return`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hasSerials ? {} : { quantity: item.quantity }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Return failed');
      const updated: WholesaleOrder = body.data ?? body;
      const newStatus = getOrderStatusFromItems(updated.items || [], updated);
      await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      setReturnTarget(null);
      await refresh();
    } catch (err) {
      Alert.alert('Return failed', err instanceof Error ? err.message : 'Failed');
    } finally {
      setReturnBusy(false);
    }
  }, [returnTarget, refresh]);

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
    setSellRowAmount,
    setSellRowAccount,
    payFull,
    applyAdvance,
    confirmSellOut,
    // return
    returnTarget,
    returnBusy,
    openReturn,
    closeReturn,
    confirmReturn,
  };
}

export type UseWholesaleActions = ReturnType<typeof useWholesaleActions>;
