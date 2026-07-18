// Warranty Management Types and Interfaces

export interface Warranty {
  id: string;
  name: string;
  duration: number;
  description?: string;
  type: string;
  status: string;
  storeTypeId?: string;
  branchId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    storeType: string;
  };
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
}

export interface WarrantyStats {
  total: number;
  active: number;
  inactive: number;
  warrantiesByType: Array<{
    type: string;
    count: number;
  }>;
}

export interface WarrantyFormData {
  name: string;
  duration: string;
  description?: string;
  type: string;
  status?: 'active' | 'inactive';
  storeTypeId?: string;
  branchId?: string;
  branchIds?: string[];
}

export type WarrantyFilterType = 'all' | string;
export type WarrantyViewMode = 'list' | 'grid';

export interface WarrantyFilters {
  searchTerm: string;
  filterType: WarrantyFilterType;
  filterBranchId: string;
}

export interface WarrantyModalState {
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  selectedWarranty: Warranty | null;
  selectedGroupedWarranty: GroupedWarranty | null;
}

// Grouped Warranty - Professional approach for displaying warranties across multiple branches
export interface GroupedWarranty {
  name: string;
  duration: number;
  description?: string;
  type: string;
  status: string;
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
  branches: Array<{
    id: string;
    warrantyId: string; // Original warranty ID for this branch
    branchName: string;
    branchId: string;
    storeType: string;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Warranty Type Constants
export const WARRANTY_TYPES = [
  { value: 'replacement', label: 'Replacement', icon: '🔄' },
  { value: 'repair', label: 'Repair', icon: '🔧' },
  { value: 'refund', label: 'Refund', icon: '💰' },
  { value: 'extended', label: 'Extended', icon: '⏰' },
  { value: 'limited', label: 'Limited', icon: '🛡️' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

