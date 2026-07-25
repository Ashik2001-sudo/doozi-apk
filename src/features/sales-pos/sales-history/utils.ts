import type { InvoiceData } from '@/features/sales-pos/pos/components/InvoiceModal';
import { derivePaymentMethodFromBreakdown } from '@/lib/invoice-print';
import type { OrderPaymentRecord, SaleItem, SaleOrderDetail } from './types';

export function formatMoney(val: number | string | null | undefined): string {
  const n = Number(val);
  if (!Number.isFinite(n)) return '৳0';
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 2 }).replace(/\.00$/, '')}`;
}

export function formatOrderDate(val: string | null | undefined): string {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(val: string | null | undefined): string {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function saleTypeLabel(orderType?: string | null): string {
  const t = (orderType || '').toLowerCase();
  if (t === 'wholesale') return 'Wholesale';
  if (t === 'quick_sell') return 'Quick Sell';
  return 'POS';
}

export function paymentStatusColor(status?: string | null): string {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return '#059669';
  if (s === 'partial') return '#d97706';
  return '#dc2626';
}

export function orderTypeAccent(orderType?: string | null): [string, string] {
  const t = (orderType || '').toLowerCase();
  if (t === 'wholesale') return ['#0369a1', '#0ea5e9'];
  if (t === 'quick_sell') return ['#b45309', '#f59e0b'];
  return ['#4338ca', '#6366f1'];
}

export function variantLabel(item: SaleItem): string {
  const attrs =
    item.variant?.attributes
      ?.map((a) => a?.value)
      .filter((v): v is string => v != null && String(v).trim() !== '') ?? [];
  if (attrs.length > 0) return attrs.join(', ');
  return item.sku?.trim() ? item.sku : '';
}

export function parseAdvanceFromNotes(notes: string | null | undefined): number | undefined {
  if (!notes || typeof notes !== 'string') return undefined;
  const m = notes.match(/Advance:\s*([\d,.\s]+)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(/,/g, '').replace(/\s/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function mapAccountType(accountTypeRaw: string | undefined): string {
  const t = (accountTypeRaw || 'Cash').toLowerCase().trim();
  if (t === 'cash') return 'cash';
  if (t === 'card') return 'card';
  if (t.includes('mobile') || t === 'bkash' || t === 'nagad' || t.includes('mfs')) {
    return 'mobile_banking';
  }
  if (t.includes('bank')) return 'bank_transfer';
  return 'cash';
}

function paymentRowsFromHistory(payments: OrderPaymentRecord[]) {
  const rows: { type: string; amount: number; accountName?: string; accountType?: string }[] = [];
  for (const p of payments) {
    const amt = Number(p.amount) || 0;
    if (amt <= 0) continue;
    const rawLedgerType = p.account?.accountType;
    rows.push({
      type: mapAccountType(rawLedgerType),
      amount: amt,
      accountName: (p.account?.accountName ?? '').trim() || undefined,
      accountType: rawLedgerType,
    });
  }
  return rows;
}

export function normalizePaymentRow(row: Record<string, unknown>): OrderPaymentRecord {
  const accountRaw = row.account;
  let account: OrderPaymentRecord['account'] = null;
  if (accountRaw && typeof accountRaw === 'object') {
    const a = accountRaw as Record<string, unknown>;
    account = {
      id: String(a.id ?? ''),
      accountName: String(a.accountName ?? a.name ?? 'Account'),
      accountType: String(a.accountType ?? 'Cash'),
    };
  }
  return {
    id: String(row.id ?? ''),
    amount: Number(row.amount) || 0,
    note: typeof row.note === 'string' ? row.note : null,
    transactionDate:
      typeof row.transactionDate === 'string'
        ? row.transactionDate
        : typeof row.createdAt === 'string'
          ? row.createdAt
          : null,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
    account,
  };
}

export function unwrapPaymentRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
    if (Array.isArray(o.items)) return o.items as Record<string, unknown>[];
    if (Array.isArray(o.payments)) return o.payments as Record<string, unknown>[];
  }
  return [];
}

export function buildOrderInvoiceData(
  order: SaleOrderDetail,
  paymentHistory: OrderPaymentRecord[],
): InvoiceData {
  const advanceApplied = parseAdvanceFromNotes(order.notes);
  const accountRows = paymentRowsFromHistory(paymentHistory);
  const paymentsBreakdown = accountRows.length > 0 ? accountRows : undefined;
  const couponDisc = Number(order.couponDiscount) || 0;
  const giftDisc = Number(order.giftCardDiscount) || 0;
  const vipDisc = Number(order.vipDiscount) || 0;
  const pointsDisc = Number(order.pointsDiscount) || 0;
  const redeemPts = Number(order.redeemPoints) || 0;
  const servicesTot = Number(order.servicesTotal) || 0;
  const currentInvoiceDue = Number(order.dueAmount) || 0;
  const customerRunningDue =
    order.customer?.totalDue != null ? Number(order.customer.totalDue) : null;
  const previousDue =
    customerRunningDue != null
      ? Math.max(0, Math.round((customerRunningDue - currentInvoiceDue) * 100) / 100)
      : null;
  const sumRecordedPayments = paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const paidNum = Number(order.paidAmount) || 0;
  const receivedAmount =
    sumRecordedPayments > 0 ? sumRecordedPayments : paidNum > 0 ? paidNum : undefined;
  const resp =
    typeof order.responsiblePerson === 'string' ? order.responsiblePerson.trim() : '';

  return {
    saleOrderId: order.id,
    invoiceNo: order.invoiceNo,
    orderNo: order.orderNo,
    date: order.orderDate,
    branchName: order.branch?.name,
    branchAddress: order.branch?.address || undefined,
    branchPhone: order.branch?.phone || undefined,
    billToLabel: order.orderType === 'wholesale' ? 'Retailer' : undefined,
    customerName:
      order.orderType === 'wholesale'
        ? order.customerName || undefined
        : order.customerName || order.customer?.name || undefined,
    customerPhone: order.customerPhone || order.customer?.phone || undefined,
    customerEmail: order.customer?.email || undefined,
    customerAddress: order.customer?.address || undefined,
    items: (order.items || []).map((item) => ({
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discountValue: Number(item.discountValue) || 0,
      discountType: item.discountType,
      total: Number(item.totalPrice),
      imeiNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
      attributeValues: item.variant?.attributes?.map((a) => a.value),
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    couponDiscount: couponDisc > 0 ? couponDisc : undefined,
    giftCardDiscount: giftDisc > 0 ? giftDisc : undefined,
    vipDiscount: vipDisc > 0 ? vipDisc : undefined,
    pointsDiscount: pointsDisc > 0 ? pointsDisc : undefined,
    redeemPoints: redeemPts > 0 ? redeemPts : undefined,
    services: servicesTot > 0 ? [{ name: 'Services', price: servicesTot }] : undefined,
    taxAmount: Number(order.taxAmount),
    shippingCost: Number(order.shippingCost),
    grandTotal: Number(order.grandTotal),
    paidAmount: paidNum,
    receivedAmount,
    dueAmount: currentInvoiceDue,
    previousDue,
    advanceApplied: advanceApplied ?? undefined,
    paymentsBreakdown,
    paymentStatus: order.paymentStatus,
    paymentMethod:
      (order.paymentMethod && String(order.paymentMethod)) ||
      derivePaymentMethodFromBreakdown(paymentsBreakdown) ||
      undefined,
    responsiblePerson: resp || undefined,
    termsAndConditions: order.termsAndCondition?.description || undefined,
  };
}
