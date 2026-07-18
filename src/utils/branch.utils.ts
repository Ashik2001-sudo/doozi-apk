import { Branch, BranchFormData } from '@/types/branch.types';

// Store types for dropdown
export const STORE_TYPES = [
  { value: 'Super Shop', label: 'Super Shop', icon: '🛒' },
  { value: 'Electronics & Gadgets', label: 'Electronics & Gadgets', icon: '📱' },
  { value: 'Fashion & Clothing', label: 'Fashion & Clothing', icon: '👕' },
  { value: 'Hardware & Tools', label: 'Hardware & Tools', icon: '🔧' },
  { value: 'Gifts & Cosmetics', label: 'Gifts & Cosmetics', icon: '🎁' },
  { value: 'Automobile & Accessories', label: 'Automobile & Accessories', icon: '🚗' },
  { value: 'Footwear Store', label: 'Footwear Store', icon: '👟' },
  { value: 'Furniture Store', label: 'Furniture Store', icon: '🪑' },
  { value: 'Grocery Store', label: 'Grocery Store', icon: '🛍️' },
  { value: 'Pharmacy & Health', label: 'Pharmacy & Health', icon: '💊' },
  { value: 'Books & Stationery', label: 'Books & Stationery', icon: '📚' },
  { value: 'Sports & Fitness', label: 'Sports & Fitness', icon: '⚽' },
  { value: 'Jewelry & Accessories', label: 'Jewelry & Accessories', icon: '💎' },
  { value: 'Pet Supplies', label: 'Pet Supplies', icon: '🐕' },
  { value: 'Home & Garden', label: 'Home & Garden', icon: '🏠' },
];

// Status options
export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'name', label: 'Name' },
  { value: 'storeType', label: 'Store Type' },
  { value: 'isActive', label: 'Status' },
];

// Form validation
export const validateBranchForm = (data: BranchFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Branch name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Branch name must be less than 100 characters';
  }

  if (!data.storeType) {
    errors.storeType = 'Store type is required';
  }

  if (!data.address.trim()) {
    errors.address = 'Address is required';
  } else if (data.address.length > 500) {
    errors.address = 'Address must be less than 500 characters';
  }

  if (data.phone && data.phone.length > 20) {
    errors.phone = 'Phone number must be less than 20 characters';
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  } else if (data.email && data.email.length > 100) {
    errors.email = 'Email must be less than 100 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format branch data for form
export const formatBranchForForm = (branch: Branch): BranchFormData => {
  return {
    name: branch.name,
    storeType: branch.storeType,
    logo: branch.logo || '',
    address: branch.address,
    phone: branch.phone || '',
    email: branch.email || '',
    description: branch.description || '',
  };
};

// Format form data for API
export const formatFormForAPI = (data: BranchFormData) => {
  return {
    name: data.name.trim(),
    storeType: data.storeType,
    logo: data.logo || undefined,
    address: data.address.trim(),
    phone: data.phone.trim() || undefined,
    email: data.email.trim() || undefined,
    description: data.description.trim() || undefined,
    isActive: data.isActive,
    isMainBranch: data.isMainBranch,
  };
};

// Get store type icon
export const getStoreTypeIcon = (storeType: string): string => {
  const type = STORE_TYPES.find(t => t.value === storeType);
  return type?.icon || '🏪';
};

// Format date
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status badge class
export const getStatusBadgeClass = (isActive: boolean): string => {
  return isActive ? 'status-active' : 'status-inactive';
};

// Get status text
export const getStatusText = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive';
};

// Get branch type badge class
export const getBranchTypeBadgeClass = (isMainBranch: boolean): string => {
  return isMainBranch ? 'type-badge main-branch' : 'type-badge';
};

// Get branch type text
export const getBranchTypeText = (isMainBranch: boolean): string => {
  return isMainBranch ? 'Main Branch' : 'Sub Branch';
};

// Calculate branch age
export const getBranchAge = (createdAt: Date | string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

// Generate branch code
export const generateBranchCode = (index: number): string => {
  return `BR${String(index + 1).padStart(3, '0')}`;
};

// Export CSV data
export const exportBranchesToCSV = (branches: Branch[]): string => {
  const headers = ['Name', 'Store Type', 'Address', 'Phone', 'Email', 'Status', 'Main Branch', 'Created At'];
  const rows = branches.map(branch => [
    branch.name,
    branch.storeType,
    branch.address,
    branch.phone || '',
    branch.email || '',
    branch.isActive ? 'Active' : 'Inactive',
    branch.isMainBranch ? 'Yes' : 'No',
    formatDate(branch.createdAt)
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string = 'branches.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
