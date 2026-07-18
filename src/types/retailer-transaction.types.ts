export type RetailerTransactionType = 'payment' | 'advance' | 'due';

export interface RetailerTransaction {
  id: string;
  retailerId: string;
  type: RetailerTransactionType;
  amount: number;
  date: string;
  accountId?: string;
  account?: {
    id: string;
    accountName: string;
    accountType: string;
  };
  wholesaleOrderId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    dueAmount: number;
  };
  note?: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerTransactionFormData {
  type: RetailerTransactionType;
  amount: string;
  date: string;
  accountId: string;
  wholesaleOrderId?: string;
  note: string;
}

export interface RetailerInvoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  orderNo?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  status: 'paid' | 'partial' | 'unpaid';
}
