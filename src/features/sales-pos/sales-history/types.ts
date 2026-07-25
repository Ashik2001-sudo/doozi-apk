export interface SaleItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  returnedQuantity?: number;
  unitPrice: number;
  discountType: string;
  discountValue: number;
  totalPrice: number;
  costPrice?: number;
  serialNumbers?: string[];
  batchNumbers?: string[];
  variant?: {
    id: string;
    sku: string;
    attributes?: { name: string; value: string }[];
  };
}

export interface SaleOrderDetail {
  id: string;
  orderNo: string;
  invoiceNo: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  retailerId: string | null;
  wholesaleOrderId: string | null;
  branchId: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCost: number;
  servicesTotal?: number;
  couponDiscount?: number;
  giftCardDiscount?: number;
  vipDiscount?: number;
  pointsDiscount?: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string | null;
  responsiblePerson?: string | null;
  redeemPoints?: number;
  notes: string | null;
  orderDate: string;
  paymentDate: string | null;
  createdAt?: string;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
    email?: string | null;
    address?: string | null;
    totalDue?: number | null;
  };
  branch?: { id: string; name: string; address?: string; phone?: string | null };
  termsAndCondition?: { id: string; name: string; description: string } | null;
  items: SaleItem[];
  saleReturns?: Array<{
    id: string;
    returnNo: string;
    returnDate: string;
    status: string;
    totalAmount: number;
    refundAmount: number;
  }>;
}

export interface OrderPaymentRecord {
  id: string;
  amount: number;
  note?: string | null;
  transactionDate?: string | null;
  createdAt?: string;
  account?: {
    id: string;
    accountName: string;
    accountType: string;
  } | null;
}

export interface PayAccountOption {
  id: string;
  accountName: string;
  accountType: string;
  currentBalance?: number;
  branch?: { id: string; name: string } | null;
}

export interface SalesHistoryListItem {
  id: string;
  invoiceNo: string;
  orderNo: string;
  grandTotal: number;
  orderDate: string;
  customerName?: string | null;
  paymentStatus: string;
  orderType?: string;
  dueAmount?: number;
}
