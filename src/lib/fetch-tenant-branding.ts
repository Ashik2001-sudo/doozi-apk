import { API_BASE_URL, authorizedFetch, getTenantData } from '@/lib/config';

export type TenantInvoiceBranding = {
  adminLogoUrl?: string | null;
  companyName?: string | null;
  storeQrUrl?: string | null;
};

export function mergeInvoiceWithBranding<T extends TenantInvoiceBranding>(
  invoice: T,
  branding?: TenantInvoiceBranding | null,
): T {
  if (!branding) return invoice;
  return {
    ...invoice,
    adminLogoUrl: invoice.adminLogoUrl ?? branding.adminLogoUrl,
    companyName: invoice.companyName ?? branding.companyName ?? undefined,
    storeQrUrl: invoice.storeQrUrl ?? branding.storeQrUrl,
  };
}

/** Sync fallback from logged-in tenant (localStorage). */
export function getTenantBrandingFromStorage(): TenantInvoiceBranding | null {
  const tenant = getTenantData() as {
    adminLogoUrl?: string | null;
    company?: string;
    name?: string;
  } | null;

  if (!tenant?.adminLogoUrl && !tenant?.company && !tenant?.name) {
    return null;
  }

  return {
    adminLogoUrl: tenant?.adminLogoUrl ?? null,
    companyName: tenant?.company || tenant?.name || null,
    storeQrUrl: null,
  };
}

/** Tenant logo / company / store QR for invoice print (same source as POS InvoiceModal). */
export async function fetchTenantInvoiceBranding(): Promise<TenantInvoiceBranding | null> {
  try {
    const res = await authorizedFetch(`${API_BASE_URL}/tenants/branding`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && json.data) {
      return json.data as TenantInvoiceBranding;
    }
  } catch {
    // Branding is optional for print
  }

  return getTenantBrandingFromStorage();
}
