// Brand Management Types and Interfaces

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  status: string;
  order?: number;
  storeTypeId?: string; // Store type ID (professional)
  branchId: string; // Branch this brand belongs to
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
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Grouped Brand - Professional approach for displaying brands across multiple branches
export interface GroupedBrand {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  status: string;
  order?: number;
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
  branches: Array<{
    id: string;
    brandId: string; // Original brand ID for this branch
    branchName: string;
    branchId: string;
    storeType: string;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BrandStats {
  totalBrands: number;
  activeBrands: number;
  inactiveBrands: number;
  brandsByStoreType: Array<{
    storeType: string;
    count: number;
  }>;
}

export interface BrandFormData {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  status: 'active' | 'inactive';
  order?: number;
  storeTypeId?: string; // Store type ID (auto-filled from branch)
  branchId: string; // Single branch selection (required)
  branchIds?: string[]; // Multiple branch selection (optional)
  storeType?: string; // Store type string (for compatibility)
}

export type BrandFilterStatus = 'all' | 'active' | 'inactive';
export type BrandViewMode = 'list' | 'grid';

export interface BrandFilters {
  searchTerm: string;
  filterStatus: BrandFilterStatus;
  filterStoreType: string;
  filterBranchId?: string; // Filter by branch
}

export interface BrandModalState {
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  selectedBrand: Brand | null;
}

export interface BrandApiResponse {
  success: boolean;
  message?: string;
  data?: Brand[] | Brand | BrandStats;
  error?: string;
}

