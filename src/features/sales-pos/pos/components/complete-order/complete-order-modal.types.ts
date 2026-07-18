import type { CartItem, OrderSummary, PaymentMethod } from '../../types/pos.types';

export interface PaymentItem {
  type: string;
  amount: number;
  transactionId?: string;
}

export interface PaymentRow {
  id: string;
  accountId: string;
  amount: number | '';
}

export interface AccountOption {
  id: string;
  name?: string;
  accountName?: string;
  accountType?: string;
  currentBalance?: number;
  accountNumber?: string | null;
  branch?: {
    id: string;
    name: string;
  };
}

export interface CompleteOrderCustomer {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  id?: string;
  advanceBalance?: number;
  totalOrders?: number;
  totalSpent?: number;
  vipStatus?: {
    isVIP: boolean;
    discountPercent?: number;
  };
}

export interface TermsAndCondition {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface CompleteOrderModalProps {
  visible: boolean;
  onClose: () => void;
  customer: CompleteOrderCustomer | null;
  isWalkingCustomer: boolean;
  payments: PaymentItem[];
  orderSummary: OrderSummary;
  onAddPayment: (type: string, amount: number, transactionId?: string) => void;
  onRemovePayment: (index: number) => void;
  onReplacePayments?: (list: PaymentMethod[]) => void;
  onConfirm: (opts?: {
    advanceApplied?: number;
    payments?: PaymentMethod[];
    paymentStatus?: string;
    responsiblePerson?: string;
    paymentDate?: string;
    paymentNote?: string;
    termsAndConditionId?: string;
  }) => Promise<{ success: boolean; message?: string; orderId?: string; orderData?: Record<string, unknown> }>;
  loading: boolean;
  branchId: string | null;
  cart?: CartItem[];
}

export const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  paid: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  partial: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  due: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};
