import { Designation, DesignationFormData } from '@/types/designation.types';

// Format date
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Validate designation form
export const validateDesignationForm = (
  data: DesignationFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Designation name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Designation name must be less than 100 characters';
  }

  if (data.level && data.level.length > 50) {
    errors.level = 'Level must be less than 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format designation for form
export const formatDesignationForForm = (designation: Designation): DesignationFormData => {
  return {
    name: designation.name,
    description: designation.description || '',
    level: designation.level || '',
    status: designation.status as 'active' | 'inactive',
  };
};

// Format form data for API
export const formatDesignationFormForAPI = (data: DesignationFormData) => {
  return {
    name: data.name,
    description: data.description || undefined,
    level: data.level || undefined,
    status: data.status || 'active',
  };
};

// Filter designations
export const filterDesignations = (
  designations: Designation[],
  searchTerm: string,
  filterStatus?: string,
  filterLevel?: string
): Designation[] => {
  return designations.filter((designation) => {
    const matchesSearch =
      !searchTerm ||
      designation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (designation.level?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (designation.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatusFilter =
      !filterStatus ||
      filterStatus === 'all' ||
      (filterStatus === 'active' && designation.status === 'active') ||
      (filterStatus === 'inactive' && designation.status === 'inactive');

    const matchesLevelFilter =
      !filterLevel ||
      filterLevel === 'all' ||
      designation.level === filterLevel;

    return matchesSearch && matchesStatusFilter && matchesLevelFilter;
  });
};

// Get designation stats
export const getDesignationStats = (designations: Designation[]): {
  totalDesignations: number;
  activeDesignations: number;
  inactiveDesignations: number;
  totalEmployees: number;
} => {
  return {
    totalDesignations: designations.length,
    activeDesignations: designations.filter(d => d.status === 'active').length,
    inactiveDesignations: designations.filter(d => d.status === 'inactive').length,
    totalEmployees: 0, // Will be populated from API stats
  };
};

// Sort designations
export const sortDesignations = (
  designations: Designation[],
  sortBy: string
): Designation[] => {
  const sorted = [...designations];
  
  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'level-asc':
      return sorted.sort((a, b) => (a.level || '').localeCompare(b.level || ''));
    case 'level-desc':
      return sorted.sort((a, b) => (b.level || '').localeCompare(a.level || ''));
    case 'created-desc':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'created-asc':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return sorted;
  }
};

// Get status badge class (Tailwind)
export const getStatusBadgeClass = (status: string): string => {
  return status === 'active'
    ? 'inline-block py-1.5 px-3 rounded-lg text-[13px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    : 'inline-block py-1.5 px-3 rounded-lg text-[13px] font-medium bg-red-500/20 text-red-400 border border-red-500/30';
};

// Get level badge class (Tailwind)
const badgeBase = 'inline-block py-1.5 px-3 rounded-lg text-[13px] font-medium border';
export const getLevelBadgeClass = (level?: string): string => {
  switch (level) {
    case 'Executive':
      return `${badgeBase} bg-purple-500/20 text-purple-300 border-purple-500/40`;
    case 'Manager':
      return `${badgeBase} bg-blue-500/20 text-blue-300 border-blue-500/40`;
    case 'Supervisor':
      return `${badgeBase} bg-green-500/20 text-green-400 border-green-500/30`;
    case 'Senior':
      return `${badgeBase} bg-yellow-500/20 text-yellow-400 border-yellow-500/40`;
    case 'Mid':
      return `${badgeBase} bg-orange-500/20 text-orange-400 border-orange-500/40`;
    case 'Junior':
      return `${badgeBase} bg-violet-500/20 text-violet-300 border-violet-500/40`;
    case 'Support':
      return `${badgeBase} bg-slate-500/20 text-slate-400 border-slate-500/40`;
    default:
      return badgeBase + ' bg-slate-500/20 text-slate-400 border-slate-500/40';
  }
};

