export interface QuickSellOrder {
  id: string;
  orderNo: string;
  invoiceNo: string;
  tenantId?: string;
  branchId: string;
  productName: string;
  attribute?: string | null;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
  status: string;
  accountId?: string;
  supplierId?: string | null;
  purchaseId?: string | null;
  paidAmountToSupplier?: number;
  dueAmountToSupplier?: number;
  advanceApplied?: number | null;
  serialNumbers?: string | null;
  createdAt: string;
  updatedAt?: string;
  branch?: { id: string; name: string };
  account?: { id: string; accountName: string };
  supplier?: { id: string; name?: string; companyName?: string } | null;
  assignedEmployee?: { id: string; fullName: string; employeeId?: string } | null;
  saleOrderId?: string | null;
  saleItemId?: string | null;
  customer?: { id: string; name?: string; phone?: string } | null;
}

export interface CreateQuickSellPayload {
  customerId?: string;
  productName: string;
  attribute?: string;
  quantity: number;
  sellingPrice: number;
  branchId: string;
  accountId?: string;
  serialNumbers?: string[];
  payments?: Array<{ accountId: string; amount: number }>;
  advanceApplied?: number;
  assignedEmployeeId?: string;
  termsAndConditionId?: string;
}

export interface AssignSupplierPayload {
  supplierId: string;
  unitPrice: number;
  paidAmountToSupplier: number;
  dueAmountToSupplier: number;
  payments?: Array<{ accountId: string; amount: number; paymentMethod?: string }>;
  applyAdvance?: boolean;
  advanceApplied?: number;
}

export type QuickSellStats = {
  pending: number;
  assigned: number;
  orders: number;
  pendingAmount: number;
  totalSold?: number;
  todayCount?: number;
  todayAmount?: number;
};

export type QuickSellPaymentRow = {
  id: string;
  accountId: string;
  amount: number | '';
};

export type AccountOption = {
  id: string;
  name?: string;
  accountName?: string;
  accountType?: string;
  currentBalance?: number;
  branch?: { id: string; name: string };
  branchId?: string;
};

export type SupplierOption = {
  id: string;
  name?: string;
  companyName?: string;
  advanceBalance?: number;
};
