// Customer Transaction Types

export type TransactionType = 'payment' | 'advance' | 'due';

export interface CustomerTransaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  /**
   * Frontend-friendly date field used in UI;
   * mapped from backend `transactionDate`.
   */
  date: string;
  /** Raw transaction date from backend (ISO string) */
  transactionDate?: string;
  accountId?: string;
  account?: {
    id: string;
    accountName: string;
    accountType: string;
  };
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
  note?: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  date: string;
  accountId: string;
  invoiceId?: string;
  note: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}

export interface Account {
  id: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  accountNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  invoiceNo?: string;
  orderNo?: string;
  totalAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  dueAmount?: number;
  date?: string;
  orderDate?: string;
  status?: 'paid' | 'partial' | 'unpaid';
}
