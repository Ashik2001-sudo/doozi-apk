import { Account } from '@/types/account.types';
import { formatTaka } from '@/lib/currency';

/** ৳ with South Asian commas (1,00,000). Prefer this everywhere instead of raw toLocaleString. */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  const n = amount != null ? Number(amount) : 0;
  const value = typeof n === 'number' && !Number.isNaN(n) ? n : 0;
  return formatTaka(value);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/** True when opening, net advance, and current balance are all zero (safe to delete if no linked activity). */
export function accountBalancesAllZero(account: Account): boolean {
  const n = (v: number | string | undefined | null) =>
    Math.abs(Number(v ?? 0)) < 1e-9;
  return (
    n(account.openingBalance) &&
    n(account.netAdvanceBalance) &&
    n(account.currentBalance)
  );
}

/** Backend blocks delete; hide/disable UI when API sends the flag. */
export function isBranchDefaultAccount(account: Account): boolean {
  return account.isBranchDefaultAccount === true;
}

export const filterAccounts = (
  accounts: Account[],
  searchTerm: string,
  branchId?: string
): Account[] => {
  return accounts.filter((account) => {
    const matchesSearch =
      !searchTerm ||
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBranch = !branchId || account.branchId === branchId;

    return matchesSearch && matchesBranch;
  });
};

export const validateAccountForm = (formData: {
  accountType: string;
  accountName: string;
  accountNumber?: string;
  openingBalance: number;
  branchId: string;
}): string | null => {
  if (!formData.accountType) {
    return 'Account type is required';
  }
  if (!formData.accountName || formData.accountName.trim().length === 0) {
    return 'Account name is required';
  }
  if (!formData.branchId) {
    return 'Branch is required';
  }
  if (formData.openingBalance < 0) {
    return 'Opening balance cannot be negative';
  }
  return null;
};

