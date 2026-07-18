export type WholesaleRetailer = {
  id: string;
  name: string;
  phone?: string;
  advanceBalance?: number;
  totalDue?: number;
};

export type AccountOption = {
  id: string;
  accountName?: string;
  name?: string;
  accountType?: string;
  branch?: { id: string; name: string };
  branchId?: string;
};

export type PaymentRow = {
  id: string;
  accountId: string;
  amount: number | '';
};

export type WholesaleItem = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  paidAmount?: number;
  itemInvoiceNo?: string | null;
  serialNumbers?: string[];
  status?: string;
  saleOrderId?: string | null;
  product?: { id: string; name: string };
  variant?: {
    id: string;
    sku: string;
    attributes?: Array<{ name?: string; value?: string; attributeName?: string; attributeValue?: string }>;
  };
};

export type WholesaleOrder = {
  id: string;
  orderNo: string;
  orderDate: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  orderStatus: string;
  retailer?: WholesaleRetailer | null;
  retailerName?: string | null;
  branch?: { id: string; name: string } | null;
  items: WholesaleItem[];
};

export type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  variantDisplay?: string;
  quantity: number;
  unitPrice: number;
  stockQuantity?: number;
  hasSerial?: boolean;
  serialNumbers?: string[];
};

export type PosProductLite = {
  id: string;
  name: string;
  hasSerialNumber?: boolean;
  variants: Array<{
    id: string;
    sku: string;
    stockQuantity?: number;
    price?: { sellingPrice?: number };
    attributes?: Array<{ attributeName?: string; attributeValue?: string; name?: string; value?: string }>;
    serialNumbers?: Array<{ serialNumber: string; status?: string } | string>;
  }>;
};

export type SellTarget = { order: WholesaleOrder; item: WholesaleItem };
export type ReturnTarget = { order: WholesaleOrder; item: WholesaleItem };

export type PaymentFilter = 'all' | 'paid' | 'partial' | 'due';
export type StatusFilter = 'all' | 'pending' | 'completed';

export type WholesaleStats = {
  totalOrders: number;
  pendingItems: number;
  soldItems: number;
  loadedValue: number;
};

export function money(n: number) {
  return `৳${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function generateWholesaleOrderNo() {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `WS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function itemStatusColor(status?: string) {
  const s = (status || '').toLowerCase();
  if (s === 'sold' || s === 'completed') return '#059669';
  if (s === 'returned') return '#d97706';
  if (s === 'cancelled') return '#e11d48';
  return '#2563eb';
}

export function variantLabel(v: CartLine['variantDisplay'] | WholesaleItem['variant']) {
  if (typeof v === 'string') return v;
  if (!v?.attributes?.length) return '';
  return v.attributes
    .map((a) => a.attributeValue || a.value || '')
    .filter(Boolean)
    .join(' · ');
}

export function getOrderStatusFromItems(items: WholesaleItem[], order?: WholesaleOrder) {
  if (!items.length) return order?.orderStatus || 'pending';
  const statuses = items.map((i) => (i.status || 'pending').toLowerCase());
  if (statuses.every((s) => s === 'returned')) return 'returned';
  if (statuses.every((s) => s === 'sold' || s === 'returned')) return 'completed';
  if (statuses.some((s) => s === 'sold')) return 'pending';
  return order?.orderStatus || 'pending';
}
