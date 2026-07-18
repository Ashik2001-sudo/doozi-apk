export interface Account {
  id: string;
  accountType: string;
  accountName: string;
  accountNumber?: string;
  openingBalance: number;
  netAdvanceBalance: number;
  currentBalance: number;
  status: boolean;
  /** Auto-created Cash account when branch was created — not deletable. */
  isBranchDefaultAccount?: boolean;
  notes?: string;
  branchId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface AccountFormData {
  accountType: string;
  accountName: string;
  accountNumber?: string;
  openingBalance: number;
  notes?: string;
  status: boolean;
  branchId: string;
}

export interface AccountStats {
  total: number;
  active: number;
  inactive: number;
  /** Sum of openingBalance for accounts in scope (same branch / employee filter as list) */
  totalOpeningBalance?: number;
  totalBalance: number;
}

export interface AccountFilters {
  search: string;
  branchId: string;
}

export const ACCOUNT_TYPES = [
  'Bank',
  'Mobile Banking',
];

