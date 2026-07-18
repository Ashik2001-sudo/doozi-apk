import { Customer, CustomerFilters } from '@/types/customer.types';
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

// Filter customers
export function filterCustomers(
  customers: Customer[],
  filters: CustomerFilters
): Customer[] {
  return customers.filter((customer) => {
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // City filter
    if (filters.city && customer.city !== filters.city) {
      return false;
    }

    return true;
  });
}

// Export to CSV
export function exportToCSV(customers: Customer[]): void {
  const headers = ['Name', 'Email', 'Phone', 'Address', 'City'];
  
  const rows = customers.map((customer) => [
    customer.name,
    customer.email || '',
    customer.phone,
    customer.address || '',
    customer.city || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customers-${getTodayLocalDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

