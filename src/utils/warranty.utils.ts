import { Warranty, WarrantyFormData, GroupedWarranty } from '@/types/warranty.types';

// Warranty type icon mapping
export const getWarrantyTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'replacement':
      return '🔄';
    case 'repair':
      return '🔧';
    case 'refund':
      return '💰';
    case 'extended':
      return '⏰';
    case 'limited':
      return '🛡️';
    default:
      return '🛡️';
  }
};

// Format duration in human-readable format
export const formatDuration = (days: number): string => {
  if (days === 0) return 'No Warranty';
  if (days === 36500) return 'Lifetime';
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} Year${years > 1 ? 's' : ''}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} Month${months > 1 ? 's' : ''}`;
  }
  return `${days} Day${days > 1 ? 's' : ''}`;
};

// Format date
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Get status badge class
export const getStatusBadgeClass = (status: string): string => {
  return status === 'active' ? 'status-active' : 'status-inactive';
};

// Validate warranty form
export const validateWarrantyForm = (
  data: WarrantyFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Warranty name is required';
  }

  if (!data.duration || parseInt(data.duration) < 0) {
    errors.duration = 'Valid duration is required';
  }

  if (!data.type) {
    errors.type = 'Warranty type is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format warranty for form
export const formatWarrantyForForm = (warranty: Warranty): WarrantyFormData => {
  return {
    name: warranty.name,
    duration: warranty.duration.toString(),
    description: warranty.description || '',
    type: warranty.type,
    status: warranty.status as 'active' | 'inactive',
    storeTypeId: warranty.storeTypeId || warranty.storeType?.id || '',
    branchId: warranty.branchId || warranty.branch?.id || '',
  };
};

// Format form data for API
export const formatWarrantyFormForAPI = (data: WarrantyFormData) => {
  return {
    name: data.name,
    duration: parseInt(data.duration) || 0,
    description: data.description || undefined,
    type: data.type,
    status: data.status || 'active',
  };
};

// ================== WARRANTY GROUPING ==================

/**
 * Group warranties by name (same warranty across different branches)
 */
export const groupWarrantiesByName = (warranties: Warranty[]): GroupedWarranty[] => {
  const grouped = new Map<string, GroupedWarranty>();

  warranties.forEach((warranty) => {
    const key = `${warranty.name.toLowerCase().trim()}_${warranty.duration}_${warranty.type}`;
    
    if (grouped.has(key)) {
      // Warranty already exists, add this branch to it
      const existingWarranty = grouped.get(key)!;
      
      // Add branch if not already present
      const branchExists = existingWarranty.branches.some(b => b.branchId === warranty.branchId);
      
      if (!branchExists) {
        existingWarranty.branches.push({
          id: warranty.id,
          warrantyId: warranty.id,
          branchName: warranty.branch?.name || 'Unknown Branch',
          branchId: warranty.branchId,
          storeType: warranty.branch?.storeType || warranty.storeType?.name || '',
          isActive: warranty.status === 'active',
        });
      }
      
      // Update latest timestamp
      if (new Date(warranty.updatedAt) > new Date(existingWarranty.updatedAt)) {
        existingWarranty.updatedAt = warranty.updatedAt;
      }
    } else {
      // New warranty, create entry
      grouped.set(key, {
        name: warranty.name,
        duration: warranty.duration,
        description: warranty.description,
        type: warranty.type,
        status: warranty.status,
        storeType: warranty.storeType,
        branches: [{
          id: warranty.id,
          warrantyId: warranty.id,
          branchName: warranty.branch?.name || 'Unknown Branch',
          branchId: warranty.branchId,
          storeType: warranty.branch?.storeType || warranty.storeType?.name || '',
          isActive: warranty.status === 'active',
        }],
        createdAt: warranty.createdAt,
        updatedAt: warranty.updatedAt,
      });
    }
  });

  // Convert map to array and sort by type, then name
  return Array.from(grouped.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get unique warranty count (excluding duplicates across branches)
 */
export const getUniqueWarrantyCount = (warranties: Warranty[]): number => {
  const uniqueKeys = new Set(
    warranties.map(w => `${w.name.toLowerCase().trim()}_${w.duration}_${w.type}`)
  );
  return uniqueKeys.size;
};

/**
 * Filter grouped warranties
 */
export const filterGroupedWarranties = (
  groupedWarranties: GroupedWarranty[],
  searchTerm: string,
  filterStatus?: string,
  filterBranchId?: string
): GroupedWarranty[] => {
  return groupedWarranties.filter(warranty => {
    // Search filter
    const matchesSearch = 
      !searchTerm ||
      warranty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warranty.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (warranty.description && warranty.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const hasActiveStatus = warranty.branches.some(b => b.isActive);
    const matchesStatus = 
      !filterStatus ||
      filterStatus === 'all' ||
      (filterStatus === 'active' && hasActiveStatus) ||
      (filterStatus === 'inactive' && !hasActiveStatus);
    
    // Branch filter ('' = All Branches)
    const matchesBranch =
      !filterBranchId || filterBranchId === 'all' || filterBranchId === '' ||
      warranty.branches.some(b => b.branchId === filterBranchId);
    
    return matchesSearch && matchesStatus && matchesBranch;
  });
};

/**
 * Get grouped warranty stats
 */
export const getGroupedWarrantyStats = (groupedWarranties: GroupedWarranty[]) => {
  const totalUnique = groupedWarranties.length;
  const totalInstances = groupedWarranties.reduce((sum, warranty) => sum + warranty.branches.length, 0);
  
  const activeWarranties = groupedWarranties.filter(warranty => 
    warranty.branches.some(b => b.isActive)
  ).length;
  
  const inactiveWarranties = groupedWarranties.filter(warranty => 
    warranty.branches.every(b => !b.isActive)
  ).length;
  
  const warrantiesByType = groupedWarranties.reduce((acc, warranty) => {
    const existing = acc.find(item => item.type === warranty.type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: warranty.type, count: 1 });
    }
    return acc;
  }, [] as Array<{ type: string; count: number }>);
  
  return {
    totalUnique,
    totalInstances,
    activeWarranties,
    inactiveWarranties,
    warrantiesByType,
  };
};

