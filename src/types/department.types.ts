// Department Management Types and Interfaces

export interface Department {
  id: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  budget?: number;
  status: string;
  employeeCount: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalEmployees: number;
  totalBudget: number;
}

export interface DepartmentFormData {
  name: string;
  description?: string;
  headOfDepartment?: string;
  budget?: number;
  status: 'active' | 'inactive';
}

export type DepartmentFilterStatus = 'all' | 'active' | 'inactive';
export type DepartmentViewMode = 'list' | 'grid';

export interface DepartmentFilters {
  searchTerm: string;
  filterStatus: DepartmentFilterStatus;
}

export interface DepartmentModalState {
  showAddModal: boolean;
  showEditModal: boolean;
  showDetailsModal: boolean;
  selectedDepartment: Department | null;
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

