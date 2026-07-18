// Branch Types based on backend DTOs
export interface CreateBranchDto {
  name: string;
  storeType: string;
  logo?: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  isActive?: boolean;
  isMainBranch?: boolean;
}

export interface UpdateBranchDto {
  name?: string;
  storeType?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  isActive?: boolean;
  isMainBranch?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  storeType: string;
  logo?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  isActive: boolean;
  isMainBranch: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchResponse {
  success: boolean;
  message: string;
  data: Branch | Branch[];
}

export interface BranchStats {
  totalBranches: number;
  activeBranches: number;
  inactiveBranches: number;
  mainBranches: number;
}

export interface BranchFormData {
  name: string;
  storeType: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  isActive?: boolean;
  isMainBranch?: boolean;
}

export interface BranchFilters {
  search: string;
  storeType: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface BranchModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  branch?: Branch;
}

export interface BranchTableColumn {
  key: keyof Branch;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, branch: Branch) => React.ReactNode;
}