import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/config';
import { getCachedItem, setCachedItem, storageSetItem } from '@/lib/mobile-storage';

export interface Branch {
  id: string;
  name: string;
  isMainBranch?: boolean;
  isActive?: boolean;
}

function parseBranchList(json: any): Branch[] {
  const raw = json?.success ? json.data : json?.data ?? json;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && raw.id) return [raw];
  return [];
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(
    () => getCachedItem('selectedBranchId'),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Branch[]>('/branches');
      const list = parseBranchList(res).filter((b) => b.isActive !== false);
      setBranches(list);

      const cached = getCachedItem('selectedBranchId');
      const stillValid = cached && list.some((b) => b.id === cached);
      if (stillValid) {
        setSelectedBranchIdState(cached);
      } else if (list.length > 0) {
        const main = list.find((b) => b.isMainBranch) || list[0];
        setCachedItem('selectedBranchId', main.id);
        await storageSetItem('selectedBranchId', main.id);
        setSelectedBranchIdState(main.id);
      }
    } catch (e) {
      setBranches([]);
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBranches();
  }, [fetchBranches]);

  const setSelectedBranchId = async (id: string) => {
    setSelectedBranchIdState(id);
    setCachedItem('selectedBranchId', id);
    await storageSetItem('selectedBranchId', id);
  };

  return {
    branches,
    loading,
    error,
    selectedBranchId,
    setSelectedBranchId,
    userAccessibleBranches: branches,
    refetch: fetchBranches,
  };
}
