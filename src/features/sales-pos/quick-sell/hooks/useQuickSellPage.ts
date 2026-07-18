import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch, getUserData } from '@/lib/config';
import { useBranches } from '@/hooks/branch/useBranches';
import { filterAccountsByUserBranchAccess } from '@/utils/account-branch-access.utils';
import { POSCustomer } from '@/features/sales-pos/pos/types/pos.types';
import {
  derivePaymentMethodFromBreakdown,
  pickCustomerPreviousDueForInvoice,
} from '@/lib/invoice-print';
import { useQuickSells } from './useQuickSells';
import { useProductAttributes } from './useProductAttributes';
import type {
  AccountOption,
  AssignSupplierPayload,
  CreateQuickSellPayload,
  QuickSellOrder,
  QuickSellPaymentRow,
  SupplierOption,
} from '../types';
import { formatTaka, parsePaymentRowsTotal } from '../utils/formatters';

export type QuickSellVariantRow = {
  attributeId: string;
  attributeValueId: string;
};

type TcItem = { id: string; name: string; status: string; description?: string };

export function useQuickSellPage() {
  const {
    branches,
    userAccessibleBranches,
    selectedBranchId,
    setSelectedBranchId,
  } = useBranches();

  const branchList =
    userAccessibleBranches?.length > 0 ? userAccessibleBranches : branches;

  const qs = useQuickSells();

  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'assigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add sell modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addBranchId, setAddBranchId] = useState('');
  const [addCustomer, setAddCustomer] = useState<POSCustomer | null>(null);
  const [addProductName, setAddProductName] = useState('');
  const [addVariantRows, setAddVariantRows] = useState<QuickSellVariantRow[]>([
    { attributeId: '', attributeValueId: '' },
  ]);
  const [addQuantity, setAddQuantity] = useState(1);

  const { attributes, loading: attributesLoading } = useProductAttributes(
    addBranchId || filterBranchId || null,
  );
  const [addUnitPrice, setAddUnitPrice] = useState(0);
  const [addHasImei, setAddHasImei] = useState(false);
  const [addImeiList, setAddImeiList] = useState<string[]>([]);
  const [addCurrentImeiInput, setAddCurrentImeiInput] = useState('');
  const [addPaymentRows, setAddPaymentRows] = useState<QuickSellPaymentRow[]>([
    { id: '1', accountId: '', amount: '' },
  ]);
  const [addAdvanceApplied, setAddAdvanceApplied] = useState(0);
  const [addEmployeeId, setAddEmployeeId] = useState<string | null>(null);
  const [addTcId, setAddTcId] = useState('');

  // Assign supplier
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<QuickSellOrder | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignSupplierId, setAssignSupplierId] = useState('');
  const [assignUnitPrice, setAssignUnitPrice] = useState(0);
  const [assignPaymentRows, setAssignPaymentRows] = useState<QuickSellPaymentRow[]>([
    { id: '1', accountId: '', amount: '' },
  ]);
  const [assignAdvanceApplied, setAssignAdvanceApplied] = useState(0);
  const [supplierAdvanceBalance, setSupplierAdvanceBalance] = useState(0);

  // Shared lookups
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; fullName: string; employeeId?: string }>>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [tcItems, setTcItems] = useState<TcItem[]>([]);
  const [isEmployeeUser, setIsEmployeeUser] = useState(false);
  const [currentUserEmployeeId, setCurrentUserEmployeeId] = useState<string | null>(null);

  // Invoice
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Record<string, unknown> | null>(null);

  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    const user = getUserData<{ role?: string; id?: string; name?: string }>();
    const role = (user?.role || '').toLowerCase();
    const isEmp = role === 'employee';
    setIsEmployeeUser(isEmp);
    // Seller-admin: employee JWT `id` is the Employee PK (not employee code)
    if (isEmp) setCurrentUserEmployeeId(user?.id || null);
  }, []);

  useEffect(() => {
    if (!filterBranchId && (selectedBranchId || branchList[0]?.id)) {
      setFilterBranchId(selectedBranchId || branchList[0]?.id || '');
    }
  }, [filterBranchId, selectedBranchId, branchList]);

  const refreshList = useCallback(() => {
    qs.goToPage(1);
    void qs.fetchQuickSells(
      filterBranchId || undefined,
      filterStatus === 'all' ? undefined : filterStatus,
      undefined,
      undefined,
      1,
    );
  }, [qs, filterBranchId, filterStatus]);

  useEffect(() => {
    refreshList();
  }, [filterBranchId, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (qs.loading || !qs.hasMore) return;
    void qs.fetchQuickSells(
      filterBranchId || undefined,
      filterStatus === 'all' ? undefined : filterStatus,
      undefined,
      undefined,
      qs.page + 1,
      { append: true },
    );
  }, [qs, filterBranchId, filterStatus]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/accounts/selection`);
        const json = await res.json();
        const data = Array.isArray(json) ? json : json?.data ?? [];
        setAccounts(filterAccountsByUserBranchAccess(Array.isArray(data) ? data : []));
      } catch {
        setAccounts([]);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/employees?page=1&limit=100`);
        const json = await res.json();
        const raw = json.data || json.employees || [];
        setEmployees(
          Array.isArray(raw)
            ? raw
                .filter((e: { fullName?: string; name?: string }) => e.fullName || e.name)
                .map((e: { id: string; fullName?: string; name?: string; employeeId?: string }) => ({
                  id: e.id,
                  fullName: e.fullName || e.name || '',
                  employeeId: e.employeeId,
                }))
            : [],
        );
      } catch {
        setEmployees([]);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/suppliers?page=1&limit=200`);
        const json = await res.json();
        const raw = json.data ?? json.items ?? json;
        setSuppliers(Array.isArray(raw) ? raw : []);
      } catch {
        setSuppliers([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!addBranchId && !filterBranchId) return;
    const branchId = addBranchId || filterBranchId;
    void (async () => {
      try {
        const params = new URLSearchParams();
        params.append('branchId', branchId);
        params.append('usageType', 'sale');
        const res = await authorizedFetch(`${API_BASE_URL}/terms-and-conditions?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const list: TcItem[] = Array.isArray(json.data) ? json.data : [];
        setTcItems(list);
        const active = list.filter((t) => t.status === 'active');
        const last = active[active.length - 1] || list[list.length - 1];
        setAddTcId(last?.id || '');
      } catch {
        setTcItems([]);
        setAddTcId('');
      }
    })();
  }, [addBranchId, filterBranchId]);

  const accessibleAccounts = useMemo(
    () => filterAccountsByUserBranchAccess(accounts),
    [accounts],
  );

  const addSaleTotal = (addUnitPrice || 0) * (addQuantity || 0);
  const addPaymentFromRows = parsePaymentRowsTotal(addPaymentRows);
  const addPaymentTotal = addPaymentFromRows + addAdvanceApplied;
  const addCustomerAdvanceBalance = Number(addCustomer?.advanceBalance) || 0;
  const addMaxAdvanceApplicable = Math.max(
    0,
    Math.min(addCustomerAdvanceBalance, addSaleTotal - addPaymentFromRows),
  );

  const updateAddAdvanceApplied = useCallback(
    (rawValue: string | number) => {
      const parsed = rawValue === '' ? 0 : Math.max(0, Number(rawValue) || 0);
      setAddAdvanceApplied(
        Math.min(
          Math.round(parsed * 100) / 100,
          Math.round(addMaxAdvanceApplicable * 100) / 100,
        ),
      );
    },
    [addMaxAdvanceApplicable],
  );

  const updateAddPaymentAmount = useCallback(
    (rowId: string, rawValue: string) => {
      setAddPaymentRows((rows) => {
        const otherPayments = rows.reduce((sum, row) => {
          if (row.id === rowId) return sum;
          return sum + (parseFloat(String(row.amount)) || 0);
        }, 0);
        const maxForRow = Math.max(
          0,
          Math.round((addSaleTotal - addAdvanceApplied - otherPayments) * 100) / 100,
        );
        const parsed = Math.max(0, parseFloat(rawValue) || 0);
        const cappedAmount =
          rawValue === '' ? '' : Math.min(Math.round(parsed * 100) / 100, maxForRow);

        return rows.map((row) =>
          row.id === rowId ? { ...row, amount: cappedAmount } : row,
        );
      });
    },
    [addAdvanceApplied, addSaleTotal],
  );

  // If quantity, unit price, or advance changes after payment entry, keep
  // the combined received amount capped at the current sale total.
  useEffect(() => {
    setAddPaymentRows((rows) => {
      let remaining = Math.max(0, addSaleTotal - addAdvanceApplied);
      let changed = false;
      const cappedRows = rows.map((row) => {
        if (row.amount === '') return row;
        const current = Math.max(0, parseFloat(String(row.amount)) || 0);
        const capped = Math.min(current, Math.round(remaining * 100) / 100);
        remaining = Math.max(0, remaining - capped);
        if (capped === current) return row;
        changed = true;
        return { ...row, amount: capped };
      });
      return changed ? cappedRows : rows;
    });
  }, [addAdvanceApplied, addSaleTotal]);

  useEffect(() => {
    setAddAdvanceApplied((current) => Math.min(current, addMaxAdvanceApplicable));
  }, [addMaxAdvanceApplicable]);

  const addDefaultCashAccountId = useMemo(() => {
    if (!accessibleAccounts.length) return '';
    const branchCash = accessibleAccounts.find(
      (a) =>
        (a.accountType ?? '').toLowerCase() === 'cash' &&
        addBranchId &&
        String(a.branch?.id ?? a.branchId ?? '') === String(addBranchId),
    );
    if (branchCash) return branchCash.id;
    return accessibleAccounts.find((a) => (a.accountType ?? '').toLowerCase() === 'cash')?.id ?? '';
  }, [accessibleAccounts, addBranchId]);

  useEffect(() => {
    if (!showAddModal || !addDefaultCashAccountId) return;
    setAddPaymentRows((prev) => {
      if (!prev.length) {
        return [{ id: String(Date.now()), accountId: addDefaultCashAccountId, amount: '' }];
      }
      if (prev[0].accountId) return prev;
      return [{ ...prev[0], accountId: addDefaultCashAccountId }, ...prev.slice(1)];
    });
  }, [showAddModal, addDefaultCashAccountId]);

  const assignGrandTotal = (Number(assignUnitPrice) || 0) * (assigningOrder?.quantity || 1);
  const assignPaidFromRows = parsePaymentRowsTotal(assignPaymentRows);
  const assignDueAuto = Math.max(0, assignGrandTotal - assignPaidFromRows - assignAdvanceApplied);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return qs.orders;
    return qs.orders.filter((o) => {
      const hay = [
        o.orderNo,
        o.invoiceNo,
        o.productName,
        o.attribute,
        o.customer?.name,
        o.customer?.phone,
        o.supplier?.name,
        o.supplier?.companyName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [qs.orders, searchTerm]);

  const handleOpenAddModal = () => {
    const branch = filterBranchId || selectedBranchId || branchList[0]?.id || '';
    setAddBranchId(branch);
    setAddCustomer(null);
    setAddProductName('');
    setAddVariantRows([{ attributeId: '', attributeValueId: '' }]);
    setAddQuantity(1);
    setAddUnitPrice(0);
    setAddHasImei(false);
    setAddImeiList([]);
    setAddCurrentImeiInput('');
    setAddPaymentRows([{ id: String(Date.now()), accountId: '', amount: '' }]);
    setAddAdvanceApplied(0);
    setAddEmployeeId(isEmployeeUser && currentUserEmployeeId ? currentUserEmployeeId : null);
    setShowAddModal(true);
  };

  const buildVariantDisplayString = () => {
    const parts: string[] = [];
    addVariantRows.forEach((row) => {
      if (!row.attributeId || !row.attributeValueId) return;
      const attr = attributes.find((a) => String(a.id) === String(row.attributeId));
      const val = attr?.values?.find((v) => String(v.id) === String(row.attributeValueId));
      if (attr && val) parts.push(`${attr.name}: ${val.displayName || val.value}`);
    });
    return parts.join(', ');
  };

  const handleAddVariantRow = () => {
    setAddVariantRows((prev) => [...prev, { attributeId: '', attributeValueId: '' }]);
  };

  const handleRemoveVariantRow = (index: number) => {
    setAddVariantRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: 'attributeId' | 'attributeValueId',
    value: string,
  ) => {
    setAddVariantRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: String(value) };
      if (field === 'attributeId') next[index].attributeValueId = '';
      return next;
    });
  };

  const addImei = () => {
    const v = addCurrentImeiInput.trim();
    if (!v) return;
    if (addImeiList.includes(v)) {
      Alert.alert('Duplicate', 'This IMEI/Serial is already added');
      return;
    }
    if (addImeiList.length >= addQuantity) {
      Alert.alert('Limit', `Only ${addQuantity} IMEI/Serial allowed`);
      return;
    }
    setAddImeiList((prev) => [...prev, v]);
    setAddCurrentImeiInput('');
  };

  const handleSubmitAddSell = async () => {
    if (!addBranchId) {
      Alert.alert('Required', 'Select branch');
      return;
    }
    if (addQuantity < 1) {
      Alert.alert('Invalid', 'Quantity must be at least 1');
      return;
    }
    if (addHasImei && addImeiList.length !== addQuantity) {
      Alert.alert(
        'IMEI required',
        `Enter exactly ${addQuantity} IMEI/Serial (entered: ${addImeiList.length})`,
      );
      return;
    }
    if (!addProductName.trim()) {
      Alert.alert('Required', 'Enter product name');
      return;
    }
    if (addUnitPrice < 0) {
      Alert.alert('Invalid', 'Unit price must be 0 or more');
      return;
    }
    const total = addSaleTotal;
    if (total <= 0) {
      Alert.alert('Invalid', 'Total must be greater than 0');
      return;
    }
    if (!addCustomer && Math.abs(addPaymentTotal - total) > 0.01) {
      Alert.alert(
        'Payment required',
        'Walk-in customer must pay full amount. Payment total must match sale total.',
      );
      return;
    }
    if (addCustomer && addPaymentTotal > total + 0.01) {
      Alert.alert('Invalid', 'Payment total cannot exceed sale total');
      return;
    }
    if (!addCustomer && addPaymentFromRows + addAdvanceApplied < 0.01) {
      Alert.alert('Payment required', 'Add payment (account + amount)');
      return;
    }

    setAddSubmitting(true);
    const payments = addPaymentRows
      .filter((r) => r.accountId && (parseFloat(String(r.amount)) || 0) > 0)
      .map((r) => ({ accountId: r.accountId, amount: parseFloat(String(r.amount)) || 0 }));

    const attribute = buildVariantDisplayString() || undefined;

    const payload: CreateQuickSellPayload = {
      customerId: addCustomer?.id,
      productName: addProductName.trim(),
      attribute,
      quantity: addQuantity,
      sellingPrice: addUnitPrice,
      branchId: addBranchId,
      accountId: payments[0]?.accountId,
      serialNumbers: addHasImei ? addImeiList : undefined,
      payments: payments.length ? payments : undefined,
      advanceApplied: addAdvanceApplied > 0 ? addAdvanceApplied : undefined,
      assignedEmployeeId: addEmployeeId || currentUserEmployeeId || undefined,
      termsAndConditionId: addTcId || undefined,
    };

    const created = await qs.createQuickSell(payload);
    setAddSubmitting(false);

    if (!created) {
      Alert.alert('Failed', qs.error || 'Failed to create quick sell');
      return;
    }

    setShowAddModal(false);
    refreshList();

    const grandTotal = Number(created.totalAmount) || addSaleTotal;
    const displayReceive = addPaymentTotal;
    const dueAmount = Math.max(0, grandTotal - displayReceive);
    const displayChange = Math.max(0, Math.round((displayReceive - grandTotal) * 100) / 100);
    const invoicePaidAmount = Math.min(displayReceive, grandTotal);
    const paymentStatus = dueAmount <= 0 ? 'paid' : displayReceive > 0 ? 'partial' : 'due';
    const productDisplayName = `${addProductName.trim()}${attribute ? ` (${attribute})` : ''}`;
    const serialNumbers = addHasImei ? addImeiList : undefined;
    const selectedTc = tcItems.find((t) => t.id === addTcId);
    const user = getUserData<{ name?: string }>();

    const effectivePayments = addPaymentRows
      .filter((r) => r.accountId && (parseFloat(String(r.amount)) || 0) > 0)
      .map((r) => {
        const amt = parseFloat(String(r.amount)) || 0;
        const acc = accessibleAccounts.find((a) => a.id === r.accountId);
        const accountType = (acc?.accountType ?? '').toLowerCase();
        let paymentType: string = 'cash';
        if (accountType === 'card' || accountType === 'credit_card') paymentType = 'card';
        else if (
          accountType === 'mobile_banking' ||
          accountType === 'mobile' ||
          accountType === 'bkash' ||
          accountType === 'nagad'
        ) {
          paymentType = 'mobile_banking';
        } else if (
          accountType === 'bank' ||
          accountType === 'bank_account' ||
          accountType === 'bank_transfer'
        ) {
          paymentType = 'bank_transfer';
        }
        const accountName = (acc?.accountName || acc?.name || '').trim();
        return {
          type: paymentType,
          amount: amt,
          transactionId: r.accountId,
          accountName: accountName || undefined,
          accountType: acc?.accountType,
        };
      });
    if (addAdvanceApplied > 0) {
      effectivePayments.push({ type: 'advance', amount: addAdvanceApplied } as never);
    }

    const previousDueForInvoice = pickCustomerPreviousDueForInvoice(addCustomer ?? null);
    const breakdownForMethod =
      effectivePayments.length > 0
        ? effectivePayments
        : invoicePaidAmount > 0
          ? [{ type: 'cash', amount: invoicePaidAmount }]
          : undefined;

    setInvoiceData({
      saleOrderId: created.saleOrderId || undefined,
      invoiceNo: created.invoiceNo || created.orderNo || '—',
      orderNo: created.orderNo || '—',
      date: created.createdAt || new Date().toISOString(),
      branchName: branchList.find((b) => b.id === addBranchId)?.name || created.branch?.name || '—',
      barcode: created.invoiceNo || created.orderNo || '—',
      customerName: addCustomer?.name || 'Walk-in Customer',
      customerPhone: addCustomer?.phone,
      customerAddress: addCustomer?.address,
      items: [
        {
          productName: productDisplayName,
          sku: 'QUICK-SALE',
          quantity: addQuantity,
          unitPrice: addUnitPrice,
          discountValue: 0,
          discountType: 'fixed',
          total: grandTotal,
          serialNumbers,
          imeiNumbers: serialNumbers,
        },
      ],
      subtotal: grandTotal,
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      grandTotal,
      paidAmount: invoicePaidAmount,
      receivedAmount: displayReceive,
      changeAmount: displayChange > 0 ? displayChange : undefined,
      dueAmount,
      previousDue: previousDueForInvoice,
      advanceApplied: addAdvanceApplied > 0 ? addAdvanceApplied : undefined,
      paymentStatus,
      paymentMethod: derivePaymentMethodFromBreakdown(breakdownForMethod),
      paymentsBreakdown:
        effectivePayments.length > 0
          ? effectivePayments
          : invoicePaidAmount > 0
            ? [{ type: 'cash', amount: invoicePaidAmount }]
            : undefined,
      responsiblePerson:
        created.assignedEmployee?.fullName?.trim() ||
        (addEmployeeId ? employees.find((e) => e.id === addEmployeeId)?.fullName : undefined) ||
        (currentUserEmployeeId ? user?.name?.trim() : undefined) ||
        undefined,
      termsAndConditions: selectedTc?.description,
      orderType: 'quick_sell',
    });
    setShowInvoiceModal(true);
  };

  const handleOpenAssignModal = (order: QuickSellOrder) => {
    if (order.status !== 'pending') return;
    setAssigningOrder(order);
    setAssignSupplierId('');
    setAssignUnitPrice(0);
    setAssignPaymentRows([{ id: String(Date.now()), accountId: '', amount: '' }]);
    setAssignAdvanceApplied(0);
    setSupplierAdvanceBalance(0);
    setShowAssignModal(true);
  };

  const loadSupplierAdvance = async (supplierId: string) => {
    setAssignSupplierId(supplierId);
    setAssignAdvanceApplied(0);
    if (!supplierId) {
      setSupplierAdvanceBalance(0);
      return;
    }
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/suppliers/${supplierId}/stats`);
      if (!res.ok) {
        setSupplierAdvanceBalance(0);
        return;
      }
      const json = await res.json();
      const data = json.data ?? json;
      setSupplierAdvanceBalance(Number(data.advanceBalance ?? data.advance ?? 0) || 0);
    } catch {
      setSupplierAdvanceBalance(0);
    }
  };

  const handleSubmitAssignSupplier = async () => {
    if (!assigningOrder) return;
    if (!assignSupplierId) {
      Alert.alert('Required', 'Select supplier');
      return;
    }
    if (!Number.isFinite(Number(assignUnitPrice)) || Number(assignUnitPrice) <= 0) {
      Alert.alert('Invalid', 'Unit price must be greater than 0');
      return;
    }
    const payments = assignPaymentRows
      .filter((r) => r.accountId && (parseFloat(String(r.amount)) || 0) > 0)
      .map((r) => ({ accountId: r.accountId, amount: parseFloat(String(r.amount)) || 0 }));
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    if (paid > assignGrandTotal + 0.01) {
      Alert.alert('Invalid', 'Payment total cannot exceed grand total');
      return;
    }
    for (const r of assignPaymentRows) {
      if (!r.accountId) continue;
      const amt = parseFloat(String(r.amount)) || 0;
      if (amt <= 0) continue;
      const acc = accessibleAccounts.find((a) => a.id === r.accountId);
      const bal = Math.max(0, Number(acc?.currentBalance) || 0);
      if (amt > bal + 0.001) {
        Alert.alert(
          'Balance exceeded',
          `Amount cannot exceed account balance (${formatTaka(bal)})`,
        );
        return;
      }
    }

    setAssignSubmitting(true);
    const payload: AssignSupplierPayload = {
      supplierId: assignSupplierId,
      unitPrice: Number(assignUnitPrice),
      paidAmountToSupplier: paid,
      dueAmountToSupplier: assignDueAuto,
      payments: payments.length ? payments : undefined,
      applyAdvance: assignAdvanceApplied > 0,
      advanceApplied: assignAdvanceApplied > 0 ? assignAdvanceApplied : undefined,
    };
    const updated = await qs.assignSupplier(assigningOrder.id, payload);
    setAssignSubmitting(false);
    if (updated) {
      setShowAssignModal(false);
      setAssigningOrder(null);
      refreshList();
      Alert.alert('Success', 'Supplier assigned');
    } else {
      Alert.alert('Failed', qs.error || 'Failed to assign supplier');
    }
  };

  const handleReturn = (order: QuickSellOrder) => {
    if (order.status !== 'pending') return;
    Alert.alert(
      'Return Quick Sell',
      `Return ${order.productName}? Payments and advance will be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setActionBusyId(order.id);
              const updated = await qs.returnQuickSell(order.id);
              setActionBusyId(null);
              if (updated) {
                refreshList();
                Alert.alert('Returned', 'Quick sell returned successfully');
              } else {
                Alert.alert('Failed', qs.error || 'Failed to return');
              }
            })();
          },
        },
      ],
    );
  };

  const handleRevertAssign = (order: QuickSellOrder) => {
    if (order.status !== 'assigned') return;
    Alert.alert(
      'Revert Assignment',
      'Undo supplier assignment? Purchase, payment & advance will be reversed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revert',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setActionBusyId(order.id);
              const updated = await qs.revertQuickSellAssign(order.id);
              setActionBusyId(null);
              if (updated) {
                refreshList();
                Alert.alert('Reverted', 'Supplier assignment reverted');
              } else {
                Alert.alert('Failed', qs.error || 'Failed to revert');
              }
            })();
          },
        },
      ],
    );
  };

  const fillFullPayment = () => {
    if (!addPaymentRows.length) return;
    const first = addPaymentRows[0];
    if (!first.accountId) {
      Alert.alert('Select account', 'Select a payment account first');
      return;
    }
    setAddPaymentRows([{ ...first, amount: addSaleTotal }, ...addPaymentRows.slice(1).map((r) => ({ ...r, amount: '' as const }))]);
    setAddAdvanceApplied(0);
  };

  return {
    branchList,
    selectedBranchId,
    setSelectedBranchId,
    filterBranchId,
    setFilterBranchId,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    orders: filteredOrders,
    loading: qs.loading,
    error: qs.error,
    stats: qs.stats,
    page: qs.page,
    total: qs.total,
    totalPages: qs.totalPages,
    hasMore: qs.hasMore,
    refreshList,
    loadMore,
    showAddModal,
    setShowAddModal,
    handleOpenAddModal,
    addSubmitting,
    addBranchId,
    setAddBranchId,
    addCustomer,
    setAddCustomer,
    addProductName,
    setAddProductName,
    attributes,
    attributesLoading,
    addVariantRows,
    handleAddVariantRow,
    handleRemoveVariantRow,
    handleVariantChange,
    addQuantity,
    setAddQuantity,
    addUnitPrice,
    setAddUnitPrice,
    addHasImei,
    setAddHasImei,
    addImeiList,
    setAddImeiList,
    addCurrentImeiInput,
    setAddCurrentImeiInput,
    addImei,
    addPaymentRows,
    setAddPaymentRows,
    updateAddPaymentAmount,
    addAdvanceApplied,
    setAddAdvanceApplied,
    addMaxAdvanceApplicable,
    updateAddAdvanceApplied,
    addEmployeeId,
    setAddEmployeeId,
    addTcId,
    setAddTcId,
    addSaleTotal,
    addPaymentTotal,
    addCustomerAdvanceBalance,
    employees,
    isEmployeeUser,
    tcItems,
    accessibleAccounts,
    handleSubmitAddSell,
    fillFullPayment,
    showAssignModal,
    setShowAssignModal,
    assigningOrder,
    handleOpenAssignModal,
    assignSubmitting,
    assignSupplierId,
    loadSupplierAdvance,
    assignUnitPrice,
    setAssignUnitPrice,
    assignPaymentRows,
    setAssignPaymentRows,
    assignAdvanceApplied,
    setAssignAdvanceApplied,
    assignGrandTotal,
    assignDueAuto,
    supplierAdvanceBalance,
    suppliers,
    handleSubmitAssignSupplier,
    handleReturn,
    handleRevertAssign,
    actionBusyId,
    showInvoiceModal,
    setShowInvoiceModal,
    invoiceData,
    setInvoiceData,
    formatTaka,
  };
}

export type QuickSellPageState = ReturnType<typeof useQuickSellPage>;
