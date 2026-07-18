import { getUserData } from '@/lib/config';

/** Minimal shape for branch-scoped account filtering (POS, pay-later, etc.). */
export type AccountWithOptionalBranch = {
  branch?: { id: string; name?: string } | null;
};

/**
 * Same rules as {@link useBranches} / header branch list:
 * - Admin / user: all accounts
 * - Employee with canAccessAllBranches: all accounts
 * - Otherwise: only accounts whose branch.id is in userData.accessibleBranches
 * - If accessibleBranches is empty (fallback): do not filter (matches branch hook behavior)
 */
export function filterAccountsByUserBranchAccess<T extends AccountWithOptionalBranch>(accounts: T[]): T[] {
  if (typeof window === 'undefined') return accounts;
  const userData = getUserData() as {
    role?: string;
    canAccessAllBranches?: boolean;
    accessibleBranches?: Array<{ id: string }>;
  } | null;
  if (!userData) return accounts;

  const role = String(userData.role ?? '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'user';
  if (isAdmin) return accounts;
  if (userData.canAccessAllBranches) return accounts;

  const accessibleIds = (userData.accessibleBranches || []).map((b) => b.id);
  if (accessibleIds.length === 0) return accounts;

  return accounts.filter((a) => {
    const bid = (a as any).branch?.id ?? (a as any).branchId;
    if (!bid) return false;
    return accessibleIds.includes(String(bid));
  });
}
