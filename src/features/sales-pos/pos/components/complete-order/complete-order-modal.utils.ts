import { formatCurrency } from '../../utils/formatters';
import { calculateLineTotal } from '../../utils/calculations';
import { parseMoneyField, pickCustomerPreviousDueForInvoice } from '@/lib/invoice-print';
import type { OrderSummary, PaymentMethod } from '../../types/pos.types';
import type {
  AccountOption,
  CompleteOrderCustomer,
  PaymentRow,
} from './complete-order-modal.types';

export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_banking: 'Mobile Banking',
  bank_transfer: 'Bank Transfer',
};

export function getCustomerAdvanceBalance(customer: CompleteOrderCustomer | null): number | null {
  if (!customer) return null;
  const c = customer as CompleteOrderCustomer & {
    advance?: number;
    totalAdvance?: number;
  };
  if (typeof c.advanceBalance === 'number') return c.advanceBalance;
  if (typeof c.advance === 'number') return c.advance;
  if (typeof c.totalAdvance === 'number') return c.totalAdvance;
  return null;
}

export function syncRowsToPayments(rows: PaymentRow[], onReplace: (list: PaymentMethod[]) => void) {
  const list: PaymentMethod[] = rows
    .filter((r) => r.accountId && (typeof r.amount === 'number' ? r.amount > 0 : Number(r.amount) > 0))
    .map((r) => ({
      type: 'cash' as const,
      amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
      transactionId: r.accountId,
    }));
  onReplace(list);
}

export function getAccountLabel(a: AccountOption) {
  const name = a.accountName ?? a.name ?? a.id;
  const branchName = a.branch?.name ? ` [${a.branch.name}]` : '';
  const type = a.accountType ? ` (${a.accountType})` : '';
  const balance =
    typeof a.currentBalance === 'number' ? ` - ${formatCurrency(a.currentBalance)}` : '';
  return `${name}${branchName}${type}${balance}`;
}

export function getAccountName(accounts: AccountOption[], id: string) {
  return accounts.find((a) => a.id === id)?.accountName ?? accounts.find((a) => a.id === id)?.name ?? id;
}

export function getAccountTypeMeta(accountType?: string) {
  const t = (accountType ?? '').toLowerCase();
  if (t === 'cash') {
    return { label: 'Cash', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  }
  if (t === 'card') {
    return { label: 'Card', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
  }
  if (t === 'mobile_banking' || t.includes('mobile')) {
    return { label: 'Mobile', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' };
  }
  if (t === 'bank_transfer' || t.includes('bank')) {
    return { label: 'Bank', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
  }
  return {
    label: accountType ? accountType.replace(/_/g, ' ') : 'Account',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
  };
}

export function rowsToPaymentMethods(
  rows: PaymentRow[],
  accounts: AccountOption[],
): PaymentMethod[] {
  return rows
    .filter((r) => r.accountId && (typeof r.amount === 'number' ? r.amount > 0 : Number(r.amount) > 0))
    .map((r) => {
      const selectedAccount = accounts.find((a) => a.id === r.accountId);
      const accountType = selectedAccount?.accountType?.toLowerCase() || 'cash';
      let paymentType: PaymentMethod['type'] = 'cash';
      if (accountType === 'cash') paymentType = 'cash';
      else if (accountType === 'card') paymentType = 'card';
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
      const accountName = (selectedAccount?.accountName ?? selectedAccount?.name ?? '').trim();
      return {
        type: paymentType,
        amount: typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0,
        transactionId: r.accountId,
        accountName: accountName || undefined,
        accountType: selectedAccount?.accountType,
      };
    });
}

function parseJsonArray(value: unknown): string[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export interface BuildInvoiceDataParams {
  orderData: Record<string, unknown>;
  customer: CompleteOrderCustomer | null;
  orderSummary: OrderSummary;
  cart?: any[];
  appliedCoupon?: { code?: string };
  appliedGiftCard?: { code?: string };
  appliedServices?: Array<{ name: string; price: number }>;
  vipDiscountPercent?: number;
  displayReceive: number;
  displayChange: number;
  displayDue: number;
  advanceApplied: number;
  effectivePayments: PaymentMethod[];
  paymentStatus: string;
  responsiblePerson: string;
  termsAndConditions?: string;
}

export function buildInvoiceDataFromOrder(params: BuildInvoiceDataParams) {
  const {
    orderData,
    customer,
    orderSummary,
    cart,
    appliedCoupon,
    appliedGiftCard,
    appliedServices,
    vipDiscountPercent,
    displayReceive,
    displayChange,
    displayDue,
    advanceApplied,
    effectivePayments,
    paymentStatus,
    responsiblePerson,
    termsAndConditions,
  } = params;

  const notes = (orderData.notes as string) || '';
  let couponCode = '';
  let giftCardCode = '';
  if (notes) {
    const couponMatch = notes.match(/Coupon:\s*([^,|]+)/i);
    if (couponMatch) couponCode = couponMatch[1].trim();
    const giftMatch = notes.match(/Gift Card:\s*([^,|]+)/i);
    if (giftMatch) giftCardCode = giftMatch[1].trim();
  }

  const rawCustomer =
    (customer || (orderData.customer as Record<string, unknown>) || {}) as Record<string, unknown>;
  const previousDueFromOrder =
    parseMoneyField(orderData.previousDue) ??
    parseMoneyField(orderData.customerPreviousDue) ??
    pickCustomerPreviousDueForInvoice(rawCustomer) ??
    null;

  const invoicePaidAmount = Math.min(displayReceive, orderSummary.grandTotal);
  const rawDueAmount = orderData.dueAmount;
  const invoiceDueAmount =
    typeof rawDueAmount === 'number'
      ? rawDueAmount
      : typeof rawDueAmount === 'string'
        ? parseFloat(rawDueAmount) || displayDue
        : displayDue;

  const orderItems = orderData.items as any[] | undefined;
  const branch = orderData.branch as
    | { name?: string; address?: string; phone?: string }
    | undefined;

  return {
    saleOrderId: (orderData.id as string) || undefined,
    invoiceNo: (orderData.invoiceNo as string) || (orderData.orderNo as string),
    orderNo: orderData.orderNo as string,
    date:
      (orderData.orderDate as string) ||
      (orderData.createdAt as string) ||
      new Date().toISOString(),
    branchName: branch?.name || '',
    branchAddress: branch?.address || undefined,
    branchPhone: branch?.phone || undefined,
    barcode: (orderData.invoiceNo as string) || (orderData.orderNo as string),
    customerName: customer?.name || (orderData.customerName as string),
    customerPhone: customer?.phone || (orderData.customerPhone as string),
    customerEmail: customer?.email,
    customerAddress: customer?.address,
    items: orderItems
      ? orderItems.map((item: any) => {
          const serialNumbers = parseJsonArray(item.serialNumbers);
          const batchNumbers = parseJsonArray(item.batchNumbers);
          const allSerialsForMemo = serialNumbers.length > 0 ? serialNumbers : undefined;
          const attrs = item.variant?.attributes;
          const attributeValues =
            attrs && Array.isArray(attrs)
              ? attrs.map((a: { value?: string }) => a.value).filter(Boolean)
              : undefined;
          return {
            productName: item.productName || item.product?.name || 'Unknown Product',
            sku: item.sku || item.variant?.sku || 'N/A',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            discountValue: item.discountValue ? Number(item.discountValue) : 0,
            discountType: item.discountType || 'fixed',
            total: calculateLineTotal(
              item.quantity,
              Number(item.unitPrice),
              item.discountType as 'fixed' | 'percentage' | undefined,
              item.discountValue ? Number(item.discountValue) : 0,
            ),
            serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
            imeiNumbers: allSerialsForMemo,
            batchNumbers: batchNumbers.length > 0 ? batchNumbers : undefined,
            attributeValues: attributeValues?.length ? attributeValues : undefined,
          };
        })
      : (cart || []).map((item: any) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountValue: item.discountValue,
          discountType: item.discountType,
          total: calculateLineTotal(
            item.quantity,
            item.unitPrice,
            item.discountType,
            item.discountValue,
          ),
          serialNumbers: item.serialNumbers,
          imeiNumbers: item.imeiNumbers,
          batchNumbers: item.batchNumbers || (item.batchNumber ? [item.batchNumber] : undefined),
        })),
    subtotal: orderSummary.subtotal,
    discountAmount: orderSummary.orderDiscountAmount || 0,
    couponCode: couponCode || appliedCoupon?.code,
    couponDiscount: orderSummary.couponDiscount || 0,
    giftCardCode: giftCardCode || appliedGiftCard?.code,
    giftCardDiscount: orderSummary.giftCardDiscount || 0,
    vipDiscount: orderSummary.vipDiscount || 0,
    vipDiscountPercent:
      (vipDiscountPercent ?? 0) > 0 && (orderSummary.vipDiscount ?? 0) > 0
        ? vipDiscountPercent
        : undefined,
    pointsDiscount: orderSummary.pointsDiscount || 0,
    redeemPoints: orderSummary.redeemPoints || 0,
    services:
      appliedServices && appliedServices.length > 0
        ? appliedServices.map((svc) => ({ name: svc.name, price: svc.price }))
        : undefined,
    taxAmount: orderSummary.taxAmount,
    shippingCost: orderSummary.shippingCost,
    grandTotal: orderSummary.grandTotal,
    paidAmount: invoicePaidAmount,
    receivedAmount: displayReceive,
    changeAmount: displayChange,
    dueAmount: invoiceDueAmount,
    previousDue: previousDueFromOrder,
    advanceApplied: advanceApplied > 0 ? advanceApplied : undefined,
    paymentsBreakdown: effectivePayments,
    paymentStatus: (orderData.paymentStatus as string) || paymentStatus,
    paymentMethod: orderData.paymentMethod as string | undefined,
    responsiblePerson: (orderData.responsiblePerson as string) || responsiblePerson,
    termsAndConditions,
  };
}
