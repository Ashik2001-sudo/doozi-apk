import { Unit, UnitFormData, UnitStats, GroupedUnit } from '@/types/unit.types';

// Unit type icon mapping
export const getUnitTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weight':
      return 'Weight';
    case 'length':
      return 'Ruler';
    case 'volume':
      return 'Droplets';
    case 'piece':
      return 'Package';
    case 'area':
      return 'Square';
    default:
      return 'Package';
  }
};

// Status badge styling
export const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'inactive':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Status text formatting
export const getStatusText = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Unit type display name
export const getUnitTypeDisplayName = (type: string) => {
  switch (type.toLowerCase()) {
    case 'weight':
      return 'Weight';
    case 'length':
      return 'Length';
    case 'volume':
      return 'Volume';
    case 'piece':
      return 'Piece';
    case 'area':
      return 'Area';
    default:
      return type;
  }
};

// Format date
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format unit age
export const getUnitAge = (createdAt: string) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

// Validate unit form data
export const validateUnitForm = (data: UnitFormData) => {
  const errors: Partial<Record<keyof UnitFormData, string>> = {};

  if (!data.name.trim()) {
    errors.name = 'Unit name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Unit name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Unit name must be less than 100 characters';
  }

  if (!data.shortName.trim()) {
    errors.shortName = 'Short name is required';
  } else if (data.shortName.trim().length < 1) {
    errors.shortName = 'Short name must be at least 1 character';
  } else if (data.shortName.trim().length > 20) {
    errors.shortName = 'Short name must be less than 20 characters';
  }

  if (!data.type) {
    errors.type = 'Unit type is required';
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  if (data.conversionFactor && data.conversionFactor <= 0) {
    errors.conversionFactor = 'Conversion factor must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format unit for form
export const formatUnitForForm = (unit: Unit): UnitFormData => {
  return {
    name: unit.name,
    shortName: unit.shortName,
    description: unit.description || '',
    type: unit.type,
    baseUnit: unit.baseUnit || '',
    conversionFactor: unit.conversionFactor,
    status: unit.status as 'active' | 'inactive',
    storeTypeId: unit.storeTypeId || (typeof unit.storeType === 'object' ? unit.storeType?.id : undefined),
    branchId: unit.branchId || '',
  };
};

// Format form data for API
export const formatUnitFormForAPI = (data: UnitFormData) => {
  return {
    name: data.name.trim(),
    shortName: data.shortName.trim(),
    description: data.description?.trim() || undefined,
    type: data.type,
    baseUnit: data.baseUnit?.trim() || undefined,
    conversionFactor: data.conversionFactor || undefined,
    status: data.status,
    storeTypeId: data.storeTypeId || undefined,
    branchId: data.branchId,
  };
};

// Sort units
export const sortUnits = (units: Unit[], sortBy: string): Unit[] => {
  const sorted = [...units].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'type-asc':
        return a.type.localeCompare(b.type);
      case 'type-desc':
        return b.type.localeCompare(a.type);
      case 'created-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'created-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });

  return sorted;
};

// Calculate unit stats
export const calculateUnitStats = (units: Unit[]): Partial<UnitStats> => {
  const totalUnits = units.length;
  const activeUnits = units.filter(unit => unit.status === 'active').length;
  const inactiveUnits = units.filter(unit => unit.status === 'inactive').length;

  // Group by type
  const typeGroups = units.reduce((acc, unit) => {
    acc[unit.type] = (acc[unit.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unitsByType = Object.entries(typeGroups).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    totalUnits,
    activeUnits,
    inactiveUnits,
    unitsByType,
  };
};

// Unit type options for forms
export const UNIT_TYPE_OPTIONS = [
  { value: 'weight', label: 'Weight' },
  { value: 'length', label: 'Length' },
  { value: 'volume', label: 'Volume' },
  { value: 'piece', label: 'Piece' },
  { value: 'area', label: 'Area' },
];

// Status options for forms
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Sort options for units
export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'type-asc', label: 'Type (A-Z)' },
  { value: 'type-desc', label: 'Type (Z-A)' },
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
];

// ================== UNIT GROUPING ==================

/**
 * Group units by shortName (same unit across different branches)
 */
export const groupUnitsByShortName = (units: Unit[]): GroupedUnit[] => {
  const grouped = new Map<string, GroupedUnit>();

  units.forEach((unit) => {
    const key = unit.shortName.toLowerCase().trim(); // Use shortName as unique identifier
    
    if (grouped.has(key)) {
      // Unit already exists, add this branch to it
      const existingUnit = grouped.get(key)!;
      
      // Add branch if not already present
      const branchExists = existingUnit.branches.some(b => b.branchId === unit.branchId);
      
      if (!branchExists) {
        existingUnit.branches.push({
          id: unit.id,
          unitId: unit.id,
          branchName: unit.branch?.name || 'Unknown Branch',
          branchId: unit.branchId,
          storeType: unit.branch?.storeType || unit.storeType?.name || '',
          isActive: unit.status === 'active',
        });
      }
      
      // Update latest timestamp
      if (new Date(unit.updatedAt) > new Date(existingUnit.updatedAt)) {
        existingUnit.updatedAt = unit.updatedAt;
      }
    } else {
      // New unit, create entry
      grouped.set(key, {
        name: unit.name,
        shortName: unit.shortName,
        description: unit.description,
        type: unit.type,
        baseUnit: unit.baseUnit,
        conversionFactor: unit.conversionFactor,
        status: unit.status,
        storeType: unit.storeType,
        branches: [{
          id: unit.id,
          unitId: unit.id,
          branchName: unit.branch?.name || 'Unknown Branch',
          branchId: unit.branchId,
          storeType: unit.branch?.storeType || unit.storeType?.name || '',
          isActive: unit.status === 'active',
        }],
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
      });
    }
  });

  // Convert map to array and sort by newest first (last added on top)
  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get unique unit count (excluding duplicates across branches)
 */
export const getUniqueUnitCount = (units: Unit[]): number => {
  const uniqueShortNames = new Set(units.map(u => u.shortName.toLowerCase().trim()));
  return uniqueShortNames.size;
};

/**
 * Filter grouped units
 */
export const filterGroupedUnits = (
  groupedUnits: GroupedUnit[],
  searchTerm: string,
  filterStatus?: string,
  filterType?: string,
  filterBranchId?: string
): GroupedUnit[] => {
  return groupedUnits.filter(unit => {
    // Search filter
    const matchesSearch = 
      !searchTerm ||
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter (check if ANY branch is active/inactive)
    const hasActiveStatus = unit.branches.some(b => b.isActive);
    const matchesStatus = 
      !filterStatus || filterStatus === 'all' ||
      (filterStatus === 'active' && hasActiveStatus) ||
      (filterStatus === 'inactive' && !hasActiveStatus);
    
    // Type filter
    const matchesType = 
      !filterType || filterType === 'all' ||
      unit.type === filterType;
    
    // Branch filter ('' = All Branches)
    const matchesBranch =
      !filterBranchId || filterBranchId === 'all' || filterBranchId === '' ||
      unit.branches.some(b => b.branchId === filterBranchId);
    
    return matchesSearch && matchesStatus && matchesType && matchesBranch;
  });
};

/**
 * Get grouped unit stats
 */
export const getGroupedUnitStats = (groupedUnits: GroupedUnit[]) => {
  const totalUnique = groupedUnits.length;
  const totalInstances = groupedUnits.reduce((sum, unit) => sum + unit.branches.length, 0);
  
  const activeUnits = groupedUnits.filter(unit => 
    unit.branches.some(b => b.isActive)
  ).length;
  
  const inactiveUnits = groupedUnits.filter(unit => 
    unit.branches.every(b => !b.isActive)
  ).length;
  
  const unitsByType = groupedUnits.reduce((acc, unit) => {
    const existing = acc.find(item => item.type === unit.type);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ type: unit.type, count: 1 });
    }
    return acc;
  }, [] as Array<{ type: string; count: number }>);
  
  return {
    totalUnique,
    totalInstances,
    activeUnits,
    inactiveUnits,
    unitsByType,
  };
};
