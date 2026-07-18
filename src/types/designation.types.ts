// Designation Management Types and Interfaces

export interface Designation {
  id: string;
  name: string;
  description?: string;
  level?: string; // Junior, Mid, Senior, Manager, etc.
  status: string;
  departmentId?: string; // Links to department
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface DesignationStats {
  totalDesignations: number;
  activeDesignations: number;
  inactiveDesignations: number;
  totalEmployees: number;
}

export interface DesignationFormData {
  name: string;
  description?: string;
  level?: string;
  departmentId?: string; // Links to department
  status: 'active' | 'inactive';
}

export type DesignationFilterStatus = 'all' | 'active' | 'inactive';
export type DesignationViewMode = 'list' | 'grid';

export interface DesignationFilters {
  searchTerm: string;
  filterStatus: DesignationFilterStatus;
  filterLevel: string;
}

export interface DesignationModalState {
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  selectedDesignation: Designation | null;
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'Executive', label: 'Executive' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Mid', label: 'Mid' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Support', label: 'Support' },
] as const;

