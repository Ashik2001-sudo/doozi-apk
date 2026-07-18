export function formatTaka(amount: number | null | undefined): string {
  const n = amount == null || Number.isNaN(Number(amount)) ? 0 : Number(amount);
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

export function parsePaymentRowsTotal(
  rows: Array<{ amount: number | '' }>,
): number {
  return rows.reduce(
    (s, r) => s + (r.amount === '' ? 0 : parseFloat(String(r.amount)) || 0),
    0,
  );
}

export function maxSalePaymentForRow(
  payableTotal: number,
  advanceApplied: number,
  otherRowsTotal: number,
): number {
  return Math.max(0, payableTotal - advanceApplied - otherRowsTotal);
}

export function parseSerialField(serialNumbers?: string | null): string[] {
  if (!serialNumbers) return [];
  try {
    const parsed = JSON.parse(serialNumbers);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* plain comma-separated */
  }
  return String(serialNumbers)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function statusTone(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Sold' };
  if (s === 'assigned') return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'Assigned' };
  if (s === 'returned') return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: 'Returned' };
  return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: status || '—' };
}
