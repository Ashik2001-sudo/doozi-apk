// Unit Management Types and Interfaces

export interface Unit {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  type: string;
  baseUnit?: string;
  conversionFactor?: number;
  status: string;
  storeTypeId?: string; // Store type ID (professional)
  branchId: string; // Branch this unit belongs to
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  branch?: { // Branch details from backend
    id: string;
    name: string;
    storeType: string;
  };
  storeType?: { // Store type details from backend
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
}

export interface UnitStats {
  totalUnits: number;
  activeUnits: number;
  inactiveUnits: number;
  unitsByType: Array<{
    type: string;
    count: number;
  }>;
}

export interface UnitFormData {
  name: string;
  shortName: string;
  description?: string;
  type: string;
  baseUnit?: string;
  conversionFactor?: number;
  status: 'active' | 'inactive';
  storeTypeId?: string; // Store type ID (auto-filled from branch)
  branchId: string; // Single branch selection (required)
  branchIds?: string[]; // Multiple branch selection (optional)
}

export type UnitFilterStatus = 'all' | 'active' | 'inactive';
export type UnitViewMode = 'list' | 'grid';

export interface UnitFilters {
  searchTerm: string;
  filterStatus: UnitFilterStatus;
  filterType: string;
}

export interface UnitModalState {
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  selectedUnit: Unit | null;
  selectedGroupedUnit: GroupedUnit | null;
}

// Grouped Unit - Professional approach for displaying units across multiple branches
export interface GroupedUnit {
  name: string;
  shortName: string;
  description?: string;
  type: string;
  baseUnit?: string;
  conversionFactor?: number;
  status: string;
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
  branches: Array<{
    id: string;
    unitId: string; // Original unit ID for this branch
    branchName: string;
    branchId: string;
    storeType: string;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UnitApiResponse {
  success: boolean;
  message?: string;
  data?: Unit[] | Unit | UnitStats;
  error?: string;
}

// Unit Type Constants
export const UNIT_TYPES = [
  { value: 'weight', label: 'Weight', icon: 'Weight' },
  { value: 'length', label: 'Length', icon: 'Ruler' },
  { value: 'volume', label: 'Volume', icon: 'Droplets' },
  { value: 'piece', label: 'Piece', icon: 'Package' },
  { value: 'area', label: 'Area', icon: 'Square' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'type-asc', label: 'Type (A-Z)' },
  { value: 'type-desc', label: 'Type (Z-A)' },
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
] as const;
