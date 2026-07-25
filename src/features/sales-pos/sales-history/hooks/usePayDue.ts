import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { filterAccountsByUserBranchAccess } from '@/utils/account-branch-access.utils';
import type { OrderPaymentRecord, PayAccountOption, SaleOrderDetail } from '../types';
import { normalizePaymentRow, unwrapPaymentRows } from '../utils';

type Params = {
  orderId: string;
  order: SaleOrderDetail | null;
  setOrder: Dispatch<SetStateAction<SaleOrderDetail | null>>;
  setPayments: Dispatch<SetStateAction<OrderPaymentRecord[]>>;
  onPaid?: () => void;
};

export function usePayDue({ orderId, order, setOrder, setPayments, onPaid }: Params) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<PayAccountOption[]>([]);

  const openPay = useCallback(() => {
    if (!order) return;
    setAmount(String(Number(order.dueAmount) || ''));
    setAccountId('');
    setNote('');
    setOpen(true);
  }, [order]);

  const closePay = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/accounts/selection`);
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray(json) ? json : json?.data ?? [];
        if (!cancelled) {
          setAccounts(filterAccountsByUserBranchAccess(Array.isArray(list) ? list : []));
        }
      } catch {
        if (!cancelled) setAccounts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const submit = useCallback(async () => {
    if (!order) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount');
      return;
    }
    if (amt > Number(order.dueAmount) + 0.01) {
      Alert.alert('Invalid', 'Amount cannot exceed due');
      return;
    }
    if (!accountId) {
      Alert.alert('Required', 'Select an account');
      return;
    }
    setLoading(true);
    try {
      let res: Response;
      if (order.orderType === 'wholesale' && order.retailerId) {
        res = await authorizedFetch(
          `${API_BASE_URL}/retailers/${order.retailerId}/transactions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment',
              amount: amt,
              accountId,
              wholesaleOrderId: order.wholesaleOrderId || undefined,
              note: note || undefined,
              transactionDate: new Date().toISOString(),
            }),
          },
        );
      } else {
        res = await authorizedFetch(`${API_BASE_URL}/sale-orders/${orderId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amt,
            accountId,
            note: note || undefined,
            transactionDate: new Date().toISOString(),
          }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Failed to record payment');

      const orderRes = await authorizedFetch(`${API_BASE_URL}/sale-orders/${orderId}`);
      const orderJson = await orderRes.json().catch(() => ({}));
      if (orderRes.ok) {
        setOrder((orderJson?.data ?? orderJson) as SaleOrderDetail);
      }

      try {
        if (order.orderType === 'wholesale' && order.retailerId && order.wholesaleOrderId) {
          const payRes = await authorizedFetch(
            `${API_BASE_URL}/retailers/${order.retailerId}/transactions?type=payment`,
          );
          const payJson = await payRes.json().catch(() => ({}));
          const rows = unwrapPaymentRows(payJson?.data ?? payJson)
            .filter((t) => String(t.wholesaleOrderId ?? '') === String(order.wholesaleOrderId))
            .map(normalizePaymentRow);
          setPayments(rows);
        } else {
          const payRes = await authorizedFetch(`${API_BASE_URL}/sale-orders/${orderId}/payments`);
          const payJson = await payRes.json().catch(() => ({}));
          setPayments(unwrapPaymentRows(payJson?.data ?? payJson).map(normalizePaymentRow));
        }
      } catch {
        // ignore payment refresh errors
      }

      setOpen(false);
      onPaid?.();
      Alert.alert('Paid', 'Payment recorded successfully');
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Could not record payment');
    } finally {
      setLoading(false);
    }
  }, [order, amount, accountId, note, orderId, setOrder, setPayments, onPaid]);

  const selectedAccount = accounts.find((a) => a.id === accountId) || null;

  return {
    open,
    openPay,
    closePay,
    amount,
    setAmount,
    accountId,
    setAccountId,
    note,
    setNote,
    loading,
    accounts,
    selectedAccount,
    submit,
  };
}
