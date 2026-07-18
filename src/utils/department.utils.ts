import { Department, DepartmentFormData } from '@/types/department.types';

// Format date
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format currency
export const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return formatted.replace(/\.00$/, '');
};

// Validate department form
export const validateDepartmentForm = (
  data: DepartmentFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Department name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Department name must be less than 100 characters';
  }

  if (data.budget && data.budget < 0) {
    errors.budget = 'Budget cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format department for form
export const formatDepartmentForForm = (department: Department): DepartmentFormData => {
  return {
    name: department.name,
    description: department.description || '',
    headOfDepartment: department.headOfDepartment || '',
    budget: department.budget || 0,
    status: department.status as 'active' | 'inactive',
  };
};

// Format form data for API
export const formatDepartmentFormForAPI = (data: DepartmentFormData) => {
  return {
    name: data.name,
    description: data.description || undefined,
    headOfDepartment: data.headOfDepartment || undefined,
    budget: data.budget || 0,
    status: data.status || 'active',
  };
};

// Filter departments
export const filterDepartments = (
  departments: Department[],
  searchTerm: string,
  filterStatus?: string
): Department[] => {
  return departments.filter((dept) => {
    const matchesSearch =
      !searchTerm ||
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.headOfDepartment?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (dept.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesFilter =
      !filterStatus ||
      filterStatus === 'all' ||
      (filterStatus === 'active' && dept.status === 'active') ||
      (filterStatus === 'inactive' && dept.status === 'inactive');

    return matchesSearch && matchesFilter;
  });
};

// Get department stats
export const getDepartmentStats = (departments: Department[]): {
  totalDepartments: number;
  activeDepartments: number;
  inactiveDepartments: number;
  totalEmployees: number;
  totalBudget: number;
} => {
  return {
    totalDepartments: departments.length,
    activeDepartments: departments.filter(d => d.status === 'active').length,
    inactiveDepartments: departments.filter(d => d.status === 'inactive').length,
    totalEmployees: departments.reduce((sum, d) => sum + d.employeeCount, 0),
    totalBudget: departments.reduce((sum, d) => sum + (d.budget || 0), 0),
  };
};

// Sort departments
export const sortDepartments = (
  departments: Department[],
  sortBy: string
): Department[] => {
  const sorted = [...departments];
  
  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'employees-desc':
      return sorted.sort((a, b) => b.employeeCount - a.employeeCount);
    case 'employees-asc':
      return sorted.sort((a, b) => a.employeeCount - b.employeeCount);
    case 'budget-desc':
      return sorted.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    case 'budget-asc':
      return sorted.sort((a, b) => (a.budget || 0) - (b.budget || 0));
    case 'created-desc':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'created-asc':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return sorted;
  }
};

