import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { CartItem } from '../types/pos.types';

/**
 * Shared batch selection: picks the batch that was created first (creation order).
 * Used by both: Grid product click and Cart plus button.
 */
export async function getBatchForAddOne(
  productId: string,
  variantId: string,
  existingCartItem: CartItem | undefined,
  branchId: string | null
): Promise<{ batchNumber?: string; batchNumbers: string[]; hasBatches: boolean }> {
  const result: { batchNumber?: string; batchNumbers: string[]; hasBatches: boolean } = { batchNumbers: [], hasBatches: false };

  if (!branchId) return result;

  try {
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('variantId', variantId);
    params.append('branchId', branchId);

    const response = await authorizedFetch(`${API_BASE_URL}/batches?${params.toString()}`);

    if (!response.ok) return result;

    const data = await response.json();
    const batchesData = Array.isArray(data) ? data : data.data ?? [];

    const validBatches = batchesData
      .filter((b: any) => {
        const n = b.batchNumber ?? b.batch_number;
        return n && String(n).trim() !== '';
      })
      .sort((a: any, b: any) => {
        // First created = first selected (creation order)
        const getDate = (x: any) =>
          x.createdAt ?? x.created_at ?? x.batchDate ?? x.batch_date ?? 0;
        const dA = new Date(getDate(a)).getTime();
        const dB = new Date(getDate(b)).getTime();
        return dA - dB; // ascending = oldest first
      });

    const quantityToAdd = 1;
    let remainingNeeded = quantityToAdd;
    const selectedBatches: string[] = [];

    for (const batch of validBatches) {
      if (remainingNeeded <= 0) break;

      const batchNum = batch.batchNumber ?? batch.batch_number;
      if (!batchNum) continue;

      const totalAvailableQty = batch.availableQuantity ?? batch.quantity ?? 0;
      // Cart এ এই batch কতবার আছে সরাসরি count
      const usedFromThisBatch = (existingCartItem?.batchNumbers || []).filter(
        (b) => b === batchNum
      ).length;

      const remainingInBatch = Math.max(0, totalAvailableQty - usedFromThisBatch);

      if (remainingInBatch > 0) {
        const take = Math.min(remainingNeeded, remainingInBatch);
        for (let i = 0; i < take; i++) selectedBatches.push(batchNum);
        remainingNeeded -= take;
      }
    }

    result.hasBatches = validBatches.length > 0;
    if (selectedBatches.length > 0) {
      result.batchNumbers = selectedBatches;
      result.batchNumber = selectedBatches[0];
    }
  } catch {
    // Silently fallback to empty
  }

  return result;
}

/**
 * Resolve batch for one IMEI/serial (same source as ProductSelectionModal).
 * POS product list only includes serialNumber on variants, not batch — search-by-Enter must fetch this.
 */
export async function getBatchInfoForSerialFromApi(
  productId: string,
  variantId: string,
  branchId: string | null,
  serial: string
): Promise<{
  batchNumber?: string;
  batchNumbers: string[];
  serialBatchMap: Record<string, string>;
}> {
  const empty: {
    batchNumber?: string;
    batchNumbers: string[];
    serialBatchMap: Record<string, string>;
  } = { batchNumbers: [], serialBatchMap: {} };

  const trimmed = serial?.trim();
  if (!branchId || !trimmed) return empty;

  try {
    const params = new URLSearchParams();
    params.append('productId', productId);
    params.append('variantId', variantId);
    params.append('branchId', branchId);
    params.append('status', 'in_stock');
    params.append('search', trimmed);

    const response = await authorizedFetch(`${API_BASE_URL}/product-serials?${params.toString()}`);
    if (!response.ok) return empty;

    const result = await response.json();
    const rows = Array.isArray(result) ? result : result.data ?? [];
    if (!Array.isArray(rows)) return empty;

    const exactLower = trimmed.toLowerCase();
    const row = rows.find((r: any) => String(r.serialNumber ?? '').toLowerCase() === exactLower);
    if (!row) return empty;

    const apiSerial = String(row.serialNumber ?? trimmed);
    const rawBn = row.batch?.batchNumber ?? row.batch?.batch_number;
    const bn =
      rawBn != null && String(rawBn).trim() !== '' ? String(rawBn).trim() : undefined;
    if (!bn) return empty;

    return {
      batchNumber: bn,
      batchNumbers: [bn],
      serialBatchMap: { [apiSerial]: bn },
    };
  } catch {
    return empty;
  }
}
