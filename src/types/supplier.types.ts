export interface Supplier {
  id: string;
  image?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  status?: string;
  branchId?: string;
  branch?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  image?: string | File;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
}

export interface SupplierStats {
  totalSuppliers: number;
  totalDues: number;
  suppliersWithDuesCount: number;
  totalAdvance: number;
  suppliersWithAdvanceCount: number;
}

export interface SupplierFilters {
  searchTerm: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
}

// ==================== Supplier Details Types ====================

export interface SupplierDetailStats {
  advance: number;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
}

export interface Purchase {
  id: string;
  billNo: string;
  invoiceNo: string;
  supplierId: string;
  branchId: string;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  paymentStatus: 'paid' | 'partial' | 'due';
  purchaseDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'payment' | 'advance' | 'refund' | 'adjustment' | 'due';
  amount: number;
  accountId: string | null;
  offsetsOpeningInventory?: boolean;
  account?: {
    id: string;
    accountName: string;
    accountType: string;
  } | null;
  invoiceNo?: string;
  purchaseId?: string;
  note?: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchasePaymentDto {
  // purchaseId is passed as URL parameter, not in body
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'mobile_banking';
  accountId: string;
  transactionId?: string;
  note?: string;
}

export interface CreateSupplierTransactionDto {
  supplierId: string;
  type: 'payment' | 'advance' | 'refund' | 'adjustment' | 'due';
  amount: number;
  accountId?: string;
  /** When true with type due: no cash/bank line; reduces Opening Inventory Capital in trial balance. */
  offsetsOpeningInventory?: boolean;
  invoiceNo?: string;
  purchaseId?: string;
  note?: string;
  transactionDate?: string;
}

export interface UpdateSupplierTransactionDto {
  type?: 'payment' | 'advance' | 'refund' | 'adjustment' | 'due';
  amount?: number;
  accountId?: string;
  invoiceNo?: string;
  purchaseId?: string;
  note?: string;
  transactionDate?: string;
}
