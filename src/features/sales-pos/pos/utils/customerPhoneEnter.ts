import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { POSCustomer } from '@/features/sales-pos/pos/types/pos.types';

/** Digits only */
export function digitsOnly(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Normalize BD phone for comparison:
 * - strip non-digits
 * - remove leading 880 / 88 country code
 * - keep leading 0 if present after that
 */
export function normalizePhone(phone: string): string {
  let digits = digitsOnly(phone);
  if (digits.startsWith('880') && digits.length >= 13) {
    digits = digits.slice(3);
  } else if (digits.startsWith('88') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits;
}

/** Last 11 digits (BD mobile) or full normalized — for fuzzy compare */
export function phoneMatchKey(phone: string): string {
  const n = normalizePhone(phone);
  if (n.length >= 11) return n.slice(-11);
  if (n.length >= 10) return n.slice(-10);
  return n;
}

export function phonesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ka = phoneMatchKey(a);
  const kb = phoneMatchKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  // one may miss leading 0: 017... vs 17...
  const a10 = ka.slice(-10);
  const b10 = kb.slice(-10);
  return a10.length >= 10 && a10 === b10;
}

export function isPhoneNumberQuery(value: string): boolean {
  const n = normalizePhone(value.trim());
  return n.length >= 10 && n.length <= 15;
}

export async function fetchCustomersBySearch(search: string): Promise<POSCustomer[]> {
  try {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    const response = await authorizedFetch(`${API_BASE_URL}/customers?${params.toString()}`);
    if (!response.ok) return [];
    const result = await response.json();
    const raw = result.data ?? result.customers ?? result;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function findPhoneMatch(list: POSCustomer[], query: string): POSCustomer | undefined {
  return list.find((c) => phonesMatch(c.phone, query));
}

/**
 * Seller-admin Enter behavior (improved matching):
 * - phone query + match → select customer
 * - phone query + no match → open Add Customer
 * - not a phone → null
 */
export async function resolveCustomerOnPhoneEnter(
  query: string,
  localList: POSCustomer[] = [],
): Promise<{ customer: POSCustomer } | { notFound: true; phone: string } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const normalized = normalizePhone(trimmed);
  if (!isPhoneNumberQuery(trimmed)) return null;

  const localFound = findPhoneMatch(localList, trimmed);
  if (localFound) return { customer: localFound };

  // Try original + normalized search (API may index either form)
  const searchTerms = Array.from(
    new Set([trimmed, normalized, normalized.startsWith('0') ? normalized : `0${normalized}`]),
  );

  let remote: POSCustomer[] = [];
  for (const term of searchTerms) {
    remote = await fetchCustomersBySearch(term);
    if (remote.length > 0) break;
  }

  const remoteFound = findPhoneMatch(remote, trimmed);
  if (remoteFound) return { customer: remoteFound };

  // Search hit a single clear result whose phone is close enough — select it
  // (same as useCustomer taking customers[0] when searching by phone)
  if (remote.length === 1 && remote[0]?.phone && phonesMatch(remote[0].phone, trimmed)) {
    return { customer: remote[0] };
  }
  if (remote.length === 1 && remote[0] && isPhoneNumberQuery(trimmed)) {
    // Backend search by phone usually returns the right customer first even if
    // stored format differs slightly — prefer select over false "add new"
    const only = remote[0];
    if (only.phone && phoneMatchKey(only.phone).slice(-10) === phoneMatchKey(trimmed).slice(-10)) {
      return { customer: only };
    }
    // If the only result came from a full-phone search, trust it
    if (normalized.length >= 10) {
      return { customer: only };
    }
  }

  // Multiple results: pick best phone match if any
  const best = remote.find((c) => c.phone && phonesMatch(c.phone, trimmed));
  if (best) return { customer: best };

  return { notFound: true, phone: trimmed };
}
