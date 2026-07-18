import { Retailer, RetailerFilters } from '@/types/retailer.types';
import { getTodayLocalDate } from './date.utils';

export function exportRetailersToCSV(retailers: Retailer[]): void {
  const headers = ['Name', 'Email', 'Phone', 'Address', 'City'];

  const rows = retailers.map((retailer) => [
    retailer.name,
    retailer.email || '',
    retailer.phone,
    retailer.address || '',
    retailer.city || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `retailers-${getTodayLocalDate()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
