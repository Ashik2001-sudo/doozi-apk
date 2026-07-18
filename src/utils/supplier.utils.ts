import { Supplier, SupplierFilters } from '@/types/supplier.types';
import { getTodayLocalDate } from './date.utils';

// Format phone number
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '-';
  return phone;
}

// Format email
export function formatEmail(email?: string): string {
  if (!email) return '-';
  return email;
}

// Validate email
export function isValidEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone
export function isValidPhone(phone: string): boolean {
  return /^[0-9]{10,15}$/.test(phone);
}

// Filter suppliers
export function filterSuppliers(
  suppliers: Supplier[],
  filters: SupplierFilters
): Supplier[] {
  return suppliers.filter((supplier) => {
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.companyName?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Branch filter
    if (filters.branchId && supplier.branchId !== filters.branchId) {
      return false;
    }

    return true;
  });
}

// Sort suppliers
export function sortSuppliers(
  suppliers: Supplier[],
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Supplier[] {
  return [...suppliers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'companyName':
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
        break;
      case 'email':
        comparison = (a.email || '').localeCompare(b.email || '');
        break;
      case 'phone':
        comparison = a.phone.localeCompare(b.phone);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

// Export to CSV
export function exportToCSV(suppliers: Supplier[]): void {
  const headers = ['Name', 'Company Name', 'Email', 'Phone', 'Address', 'Branch'];
  
  const rows = suppliers.map((supplier) => [
    supplier.name,
    supplier.companyName || '',
    supplier.email || '',
    supplier.phone,
    supplier.address || '',
    supplier.branch?.name || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `suppliers-${getTodayLocalDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get branch color
export function getBranchColor(branchName: string): string {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
  ];
  const hash = branchName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
