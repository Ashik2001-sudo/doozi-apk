import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch, getUserData } from '@/lib/config';
import { filterAccountsByUserBranchAccess } from '@/utils/account-branch-access.utils';
import { getTodayLocalDate } from '@/utils/date.utils';
import { formatCurrency } from '../../../utils/formatters';
import type { PaymentMethod } from '../../../types/pos.types';
import type { CompleteOrderModalProps, PaymentRow, AccountOption, TermsAndCondition } from '../complete-order-modal.types';
import {
  buildInvoiceDataFromOrder,
  getCustomerAdvanceBalance,
  rowsToPaymentMethods,
  syncRowsToPayments,
} from '../complete-order-modal.utils';

export function useCompleteOrderModal(props: CompleteOrderModalProps) {
  const {
    visible,
    onClose,
    customer,
    payments,
    orderSummary,
    onRemovePayment,
    onReplacePayments,
    onConfirm,
    branchId,
    cart,
  } = props;

  const customerId = customer?.id ?? null;
  const customerAdvanceBalance = getCustomerAdvanceBalance(customer);

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([{ id: '1', accountId: '', amount: '' }]);
  const [advanceApplied, setAdvanceApplied] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<string>('due');
  const [responsiblePerson, setResponsiblePerson] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [employees, setEmployees] = useState<Array<{ id: string; fullName: string }>>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Record<string, unknown> | null>(null);
  const [selectedTcId, setSelectedTcId] = useState<string>('');
  const [tcItems, setTcItems] = useState<TermsAndCondition[]>([]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    setEmployeesLoading(true);
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/employees?page=1&limit=100`);
      const result = await res.json();
      const employeesData = result.data || result.employees || [];
      const mappedEmployees = Array.isArray(employeesData)
        ? employeesData
            .filter((emp: { fullName?: string; name?: string }) => emp.fullName || emp.name)
            .map((emp: { id: string; fullName?: string; name?: string }) => ({
              id: emp.id,
              fullName: emp.fullName || emp.name || '',
            }))
        : [];
      setEmployees(mappedEmployees);
    } catch {
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, [isAdmin]);

  const fetchTcItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      params.append('usageType', 'sale');
      const res = await authorizedFetch(`${API_BASE_URL}/terms-and-conditions?${params}`);
      if (!res.ok) return;
      const result = await res.json();
      setTcItems(Array.isArray(result.data) ? result.data : []);
    } catch {
      setTcItems([]);
    }
  }, [branchId]);

  useEffect(() => {
    if (visible) {
      const userData = getUserData<{ role?: string; name?: string }>();
      const userRole = userData?.role?.toLowerCase() || '';
      const isEmployee = userRole === 'employee';
      const isAdminUser = !isEmployee;
      setIsAdmin(isAdminUser);
      if (isEmployee && userData?.name) {
        setResponsiblePerson(userData.name);
      } else if (isAdminUser) {
        setResponsiblePerson('');
      }
      setPaymentDate(getTodayLocalDate());
    }
  }, [visible]);

  useEffect(() => {
    if (visible && isAdmin) void fetchEmployees();
  }, [visible, isAdmin, fetchEmployees]);

  useEffect(() => {
    if (visible) void fetchTcItems();
  }, [visible, fetchTcItems]);

  useEffect(() => {
    if (tcItems.length > 0 && !selectedTcId) {
      setSelectedTcId(tcItems[tcItems.length - 1].id);
    }
  }, [tcItems, selectedTcId]);

  useEffect(() => {
    const totalFromRowsCalc = paymentRows.reduce(
      (s, r) => s + (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0),
      0,
    );
    const displayReceiveCalc =
      (onReplacePayments ? totalFromRowsCalc : orderSummary.totalPaid) + advanceApplied;
    if (displayReceiveCalc >= orderSummary.grandTotal) {
      setPaymentStatus('paid');
    } else if (displayReceiveCalc > 0) {
      setPaymentStatus('partial');
    } else {
      setPaymentStatus('due');
    }
  }, [paymentRows, orderSummary, advanceApplied, onReplacePayments]);

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/accounts/selection`);
      const result = await res.json();
      const data = Array.isArray(result) ? result : (result?.data ?? result ?? []);
      const list = Array.isArray(data) ? data : [];
      setAccounts(filterAccountsByUserBranchAccess(list));
    } catch {
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) void fetchAccounts();
  }, [visible, fetchAccounts]);

  useEffect(() => {
    if (!visible || accountsLoading) return;
    setPaymentRows((prev) =>
      prev.map((row) => {
        if (!row.accountId) return row;
        return accounts.some((a) => a.id === row.accountId) ? row : { ...row, accountId: '' };
      }),
    );
  }, [visible, accounts, accountsLoading]);

  useEffect(() => {
    if (!visible) return;
    if (payments.length > 0) {
      setPaymentRows(
        payments.map((p, i) => ({
          id: String(Date.now() + i),
          accountId: p.transactionId ?? '',
          amount: p.amount,
        })),
      );
    } else {
      setPaymentRows([{ id: String(Date.now()), accountId: '', amount: '' }]);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) {
      setAdvanceApplied(0);
      setPaymentStatus('due');
      setResponsiblePerson('');
      setPaymentDate('');
      setPaymentNote('');
      setSelectedTcId('');
    }
  }, [visible]);

  const defaultCashAccountId = useMemo(() => {
    if (!accounts || accounts.length === 0) return '';
    const branchCash = accounts.find(
      (a) =>
        (a.accountType ?? '').toLowerCase() === 'cash' &&
        a.branch?.id &&
        branchId &&
        String(a.branch.id) === String(branchId),
    );
    if (branchCash) return branchCash.id;
    const anyCash = accounts.find((a) => (a.accountType ?? '').toLowerCase() === 'cash');
    return anyCash?.id ?? '';
  }, [accounts, branchId]);

  useEffect(() => {
    if (!visible || !defaultCashAccountId) return;
    setPaymentRows((prev) => {
      if (!prev || prev.length === 0) {
        return [{ id: String(Date.now()), accountId: defaultCashAccountId, amount: '' as const }];
      }
      const first = prev[0];
      if (first.accountId) return prev;
      return [{ ...first, accountId: defaultCashAccountId }, ...prev.slice(1)];
    });
  }, [visible, defaultCashAccountId]);

  const handleAddRow = () => {
    const newRows = [...paymentRows, { id: String(Date.now()), accountId: '', amount: '' as const }];
    setPaymentRows(newRows);
    if (onReplacePayments) syncRowsToPayments(newRows, onReplacePayments);
  };

  const handleRemoveRow = (id: string) => {
    if (paymentRows.length <= 1) return;
    const newRows = paymentRows.filter((r) => r.id !== id);
    setPaymentRows(newRows);
    if (onReplacePayments) {
      syncRowsToPayments(newRows, onReplacePayments);
    } else {
      const idx = paymentRows.findIndex((r) => r.id === id);
      if (idx >= 0) onRemovePayment(idx);
    }
  };

  const handleRowChange = (id: string, field: 'accountId' | 'amount', value: string | number) => {
    const newRows: PaymentRow[] = paymentRows.map((r) => {
      if (r.id !== id) return r;
      if (field === 'accountId') {
        const newAccountId = value as string;
        const selectedAccount = accounts.find((a) => a.id === newAccountId);
        const accountType = selectedAccount?.accountType?.toLowerCase() || '';
        const isCashAccount = accountType === 'cash';
        const currentAmount = typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0;
        if (!isCashAccount && currentAmount > orderSummary.grandTotal) {
          Alert.alert(
            'Amount reset',
            `Non-cash accounts cannot exceed ${formatCurrency(orderSummary.grandTotal)}.`,
          );
          return { ...r, accountId: newAccountId, amount: '' };
        }
        return { ...r, accountId: newAccountId };
      }
      const amt: number | '' =
        value === '' ? '' : typeof value === 'number' ? value : Number(value) || 0;
      if (amt !== '' && typeof amt === 'number' && amt > 0) {
        const selectedAccount = accounts.find((a) => a.id === r.accountId);
        const accountType = selectedAccount?.accountType?.toLowerCase() || '';
        const isCashAccount = accountType === 'cash';
        if (!isCashAccount && amt > orderSummary.grandTotal) {
          Alert.alert(
            'Limit exceeded',
            `Online/Bank accounts cannot receive more than ${formatCurrency(orderSummary.grandTotal)}.`,
          );
          return r;
        }
      }
      return { ...r, amount: amt };
    });
    setPaymentRows(newRows);
    if (onReplacePayments) syncRowsToPayments(newRows, onReplacePayments);
  };

  const fillGrandTotal = () => {
    if (!paymentRows.length) return;
    const first = paymentRows[0];
    if (!first.accountId) {
      Alert.alert('Select account', 'Please select a payment account first.');
      return;
    }
    handleRowChange(first.id, 'amount', orderSummary.grandTotal);
  };

  const fillRemaining = () => {
    if (!paymentRows.length) return;
    const first = paymentRows[0];
    if (!first.accountId) {
      Alert.alert('Select account', 'Please select a payment account first.');
      return;
    }
    const currentAmt = typeof first.amount === 'number' ? first.amount : Number(first.amount) || 0;
    const otherRowsTotal = paymentRows
      .slice(1)
      .reduce((s, r) => s + (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0), 0);
    const remaining = Math.max(0, orderSummary.grandTotal - advanceApplied - otherRowsTotal - currentAmt);
    if (remaining <= 0) return;
    handleRowChange(first.id, 'amount', currentAmt + remaining);
  };

  const applyQuickAmount = (fraction: number) => {
    if (!paymentRows.length) return;
    const first = paymentRows[0];
    if (!first.accountId) {
      Alert.alert('Select account', 'Please select a payment account first.');
      return;
    }
    const amt = Math.round(orderSummary.grandTotal * fraction * 100) / 100;
    handleRowChange(first.id, 'amount', amt);
  };

  const totalFromRows = paymentRows.reduce(
    (s, r) => s + (typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0),
    0,
  );
  const displayReceive = (onReplacePayments ? totalFromRows : orderSummary.totalPaid) + advanceApplied;
  const displayChange = Math.max(0, displayReceive - orderSummary.grandTotal);
  const displayDue = Math.max(0, orderSummary.grandTotal - displayReceive);

  const handleConfirm = async () => {
    if (!isAdmin && !responsiblePerson) {
      Alert.alert('Required', 'Responsible person is required');
      return;
    }

    const effectivePayments = rowsToPaymentMethods(paymentRows, accounts);
    // Same as seller-admin: allow empty payments (full due / advance-only for registered customers).
    // Walk-in full-pay is still enforced inside completeOrder.

    if (onReplacePayments) onReplacePayments(effectivePayments);

    const result = await onConfirm({
      advanceApplied,
      payments: effectivePayments,
      paymentStatus,
      responsiblePerson,
      paymentDate,
      paymentNote,
      termsAndConditionId: selectedTcId || undefined,
    });

    if (result.success) {
      if (result.orderData) {
        const selectedTc = tcItems.find((tc) => tc.id === selectedTcId);
        setInvoiceData(
          buildInvoiceDataFromOrder({
            orderData: result.orderData,
            customer,
            orderSummary,
            cart,
            displayReceive,
            displayChange,
            displayDue,
            advanceApplied,
            effectivePayments,
            paymentStatus,
            responsiblePerson,
            termsAndConditions: selectedTc?.description || undefined,
          }),
        );
        setShowInvoiceModal(true);
      } else {
        onClose();
      }
    } else if (result.message) {
      Alert.alert('Order failed', result.message);
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    onClose();
  };

  return {
    ...props,
    customerId,
    customerAdvanceBalance,
    accounts,
    accountsLoading,
    paymentRows,
    advanceApplied,
    setAdvanceApplied,
    paymentStatus,
    responsiblePerson,
    setResponsiblePerson,
    paymentDate,
    setPaymentDate,
    paymentNote,
    setPaymentNote,
    employees,
    employeesLoading,
    isAdmin,
    showInvoiceModal,
    invoiceData,
    selectedTcId,
    setSelectedTcId,
    tcItems,
    displayReceive,
    displayChange,
    displayDue,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    fillGrandTotal,
    fillRemaining,
    applyQuickAmount,
    handleConfirm,
    closeInvoiceModal,
  };
}

export type CompleteOrderModalState = ReturnType<typeof useCompleteOrderModal>;
