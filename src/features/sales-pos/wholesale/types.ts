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
  createdAt?: string;
  soldOutAt?: string | null;
  returnedAt?: string | null;
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
  assignedEmployee?: { id: string; fullName?: string; employeeId?: string } | null;
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
  images?: string[];
  sellerBrand?: { name: string };
  brand?: { name: string };
  variants: Array<{
    id: string;
    sku: string;
    stockQuantity?: number;
    images?: string[];
    price?: { sellingPrice?: number };
    attributes?: Array<{ attributeName?: string; attributeValue?: string; name?: string; value?: string }>;
    serialNumbers?: Array<{ serialNumber: string; status?: string } | string>;
  }>;
};

export type SellTarget = { order: WholesaleOrder; item: WholesaleItem };
export type ReturnTarget = { order: WholesaleOrder; item: WholesaleItem };

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

/** Seller-admin style date (en-BD). */
export function formatWholesaleDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Seller-admin style time — e.g. 3:45 PM */
export function formatWholesaleTime(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleTimeString('en-BD', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatWholesaleDateTime(s?: string | null) {
  if (!s) return '—';
  return `${formatWholesaleDate(s)} · ${formatWholesaleTime(s)}`;
}

/** In-time base: item.createdAt || order.orderDate (same as seller-admin). */
export function getWholesaleInTimeBase(item: WholesaleItem, orderDate?: string | null) {
  return item.createdAt || orderDate || null;
}

export function getWholesaleSellOutAt(item: WholesaleItem) {
  return item.soldOutAt || item.returnedAt || null;
}

export function generateWholesaleOrderNo() {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `WS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export type WholesaleFulfillmentStatus = 'pending' | 'completed';

/** Item-line badge colors — matches seller-admin Sold / Returned / Pending. */
export function itemStatusColor(status?: string) {
  const s = (status || 'pending').toLowerCase();
  if (s === 'sold' || s === 'sold_out' || s === 'completed') return '#059669';
  if (s === 'returned') return '#2563eb';
  if (s === 'cancelled') return '#e11d48';
  return '#d97706'; // pending
}

/**
 * Order fulfillment status (UI + filter) — item lines only, not payment:
 * - pending: at least one line is still awaiting sell-out
 * - completed: every line is sold_out or returned (or mix)
 */
export function getOrderStatusFromItems(
  items: WholesaleItem[],
  _order?: unknown,
): WholesaleFulfillmentStatus {
  if (!items?.length) return 'completed';
  if (items.some((i) => (i.status || 'pending').toLowerCase() === 'pending')) return 'pending';
  return 'completed';
}

export function getFulfillmentStatusLabel(status: WholesaleFulfillmentStatus): string {
  return status === 'pending' ? 'Pending' : 'Complete';
}

export function fulfillmentStatusColor(status: WholesaleFulfillmentStatus): string {
  return status === 'pending' ? '#d97706' : '#059669';
}

export function variantLabel(v: CartLine['variantDisplay'] | WholesaleItem['variant']) {
  if (typeof v === 'string') return v;
  if (!v?.attributes?.length) return '';
  return v.attributes
    .map((a) => a.attributeValue || a.value || '')
    .filter(Boolean)
    .join(' · ');
}
