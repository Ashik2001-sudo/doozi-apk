import {
  getCachedItem,
  hydrateStorageCache,
  removeCachedItem,
  setCachedItem,
  storageGetItem,
  storageRemoveItem,
  storageSetItem,
} from '@/lib/mobile-storage';

const normalizeApiBase = (url: string | undefined, fallback: string) => {
  let s = url && String(url).trim() ? String(url).trim() : fallback;
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  s = s.replace(/\u200b/g, '').trim();
  return s.replace(/\/$/, '');
};

export const config = {
  API_URL: normalizeApiBase(process.env.EXPO_PUBLIC_API_URL, 'http://10.0.2.2:4000'),
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Seller Admin',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  AUTH_TOKEN_KEY: 'authToken',
  USER_DATA_KEY: 'userData',
  TENANT_DATA_KEY: 'tenantData',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      VERIFY: '/auth/verify',
      REFRESH: '/auth/refresh-session',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    TENANT: {
      SETUP_STATUS: '/tenants/setup-status',
      SUBSCRIPTION_STATUS: '/tenants/subscription-status',
      BRANDING: '/tenants/branding',
    },
  },
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};

export const API_BASE_URL = config.API_URL;

export function getMediaUrl(path: string | undefined | null): string {
  if (path == null || path === '') return '';
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = config.API_URL.replace(/\/$/, '');
  return p.startsWith('/') ? `${base}${p}` : `${base}/${p}`;
}

export const getApiUrl = (endpoint: string) => `${config.API_URL}${endpoint}`;

export const getAuthHeaders = (): Record<string, string> => {
  const token = getCachedItem('token') || getCachedItem(config.AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const persistRefreshedAccessToken = async (token: string) => {
  await storageSetItem('token', token);
  await storageSetItem(config.AUTH_TOKEN_KEY, token);
  setCachedItem('token', token);
  setCachedItem(config.AUTH_TOKEN_KEY, token);
};

export const isAuthenticated = (): boolean => {
  const token = getCachedItem('token') || getCachedItem(config.AUTH_TOKEN_KEY);
  const userData = getCachedItem(config.USER_DATA_KEY);
  return Boolean(token && userData);
};

export const getUserData = <T = Record<string, unknown>>(): T | null => {
  const userData = getCachedItem(config.USER_DATA_KEY);
  return userData ? (JSON.parse(userData) as T) : null;
};

export const getAuthenticatedDashboardPath = (): string => {
  const user = getUserData<{ role?: string }>();
  if (user?.role === 'employee') return '/admin/dashboard/employee';
  return '/admin/dashboard';
};

export const getTenantData = <T = Record<string, unknown>>(): T | null => {
  const tenantData = getCachedItem(config.TENANT_DATA_KEY);
  return tenantData ? (JSON.parse(tenantData) as T) : null;
};

export const getResolvedTenantId = (): string | undefined => {
  const t = getTenantData<{ id?: string; tenantId?: string }>();
  const fromTenant = t?.id ?? t?.tenantId;
  if (fromTenant) return String(fromTenant);
  const token = getCachedItem('token') || getCachedItem(config.AUTH_TOKEN_KEY);
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return undefined;
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(payloadB64 + pad)) as { tenantId?: string };
    return payload?.tenantId ? String(payload.tenantId) : undefined;
  } catch {
    return undefined;
  }
};

export const clearAuthData = async () => {
  const keys = [
    'token',
    config.AUTH_TOKEN_KEY,
    config.USER_DATA_KEY,
    config.TENANT_DATA_KEY,
    'sessionExpiresAt',
    'sessionLastActivityAt',
    'sessionLoginAt',
    'userInfo',
    'selectedBranch',
    'selectedBranchId',
    'accessToken',
  ];
  for (const key of keys) {
    removeCachedItem(key);
    await storageRemoveItem(key);
  }
};

export const setAuthData = async (
  token: string,
  user: { name: string; email: string; role?: string; id?: string; permissions?: unknown[] },
  tenant: { company: string; domain: string; id?: string } | null,
) => {
  await storageSetItem('token', token);
  await storageSetItem(config.AUTH_TOKEN_KEY, token);
  await storageSetItem(config.USER_DATA_KEY, JSON.stringify(user));
  await storageSetItem(config.TENANT_DATA_KEY, JSON.stringify(tenant ?? {}));

  setCachedItem('token', token);
  setCachedItem(config.AUTH_TOKEN_KEY, token);
  setCachedItem(config.USER_DATA_KEY, JSON.stringify(user));
  setCachedItem(config.TENANT_DATA_KEY, JSON.stringify(tenant ?? {}));
};

export async function initAuthStorage(): Promise<void> {
  await hydrateStorageCache();
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedInFlight = false;

/** Register from AuthProvider — clears UI state + navigates to /login */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function isAuthPublicEndpoint(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/signup') ||
    u.includes('/auth/register') ||
    u.includes('/auth/refresh-session') ||
    u.includes('/auth/forgot') ||
    u.includes('/auth/reset')
  );
}

function messageLooksLikeInvalidToken(message: unknown): boolean {
  const msg = String(message || '').toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('invalid token') ||
    msg.includes('token invalid') ||
    msg.includes('jwt expired') ||
    msg.includes('jwt malformed') ||
    msg.includes('token expired') ||
    msg.includes('access token') ||
    msg.includes('unauthorized') ||
    msg.includes('authentication failed') ||
    msg.includes('not authenticated') ||
    msg.includes('please log in') ||
    msg.includes('please login')
  );
}

/**
 * Call when API says session/token is invalid.
 * Clears storage and redirects to login (via AuthProvider handler).
 */
export async function handleUnauthorizedSession(reason?: string): Promise<void> {
  if (unauthorizedInFlight) return;
  unauthorizedInFlight = true;
  try {
    if (__DEV__ && reason) {
      console.warn('[auth] session ended:', reason);
    }
    await clearAuthData();
    unauthorizedHandler?.();
  } finally {
    // allow future logouts after a short delay (e.g. user logs in again then expires)
    setTimeout(() => {
      unauthorizedInFlight = false;
    }, 1500);
  }
}

export async function isUnauthorizedResponse(res: Response): Promise<boolean> {
  if (res.status === 401) return true;
  if (res.status !== 403) return false;
  try {
    const json = await res.clone().json();
    return messageLooksLikeInvalidToken(json?.message || json?.error || json?.errorMessage);
  } catch {
    return false;
  }
}

type RefreshResult =
  | { status: 'refreshed'; token: string }
  | { status: 'rejected' }
  | { status: 'unavailable' };

let refreshInFlight: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const currentToken = getCachedItem('token') || getCachedItem(config.AUTH_TOKEN_KEY);
    if (!currentToken) return { status: 'rejected' };

    try {
      const res = await fetch(getApiUrl(config.ENDPOINTS.AUTH.REFRESH), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (!res.ok) {
        return res.status >= 500 ? { status: 'unavailable' } : { status: 'rejected' };
      }

      const json = await res.json().catch(() => ({}));
      const token = json?.data?.accessToken;
      if (!json?.success || typeof token !== 'string' || !token) {
        return { status: 'rejected' };
      }

      await persistRefreshedAccessToken(token);
      return { status: 'refreshed', token };
    } catch {
      // A temporary network failure must not sign the user out.
      return { status: 'unavailable' };
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Fetch with auth headers, refreshing the persisted session before signing out. */
export async function authorizedFetch(
  input: string | URL | Request,
  options: RequestInit = {},
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string>),
  };

  // FormData must set its own multipart boundary — never force JSON content-type
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const res = await fetch(input, {
    ...options,
    headers,
  });

  if (!isAuthPublicEndpoint(url) && (await isUnauthorizedResponse(res))) {
    const refresh = await refreshAccessToken();
    if (refresh.status === 'refreshed') {
      const retryRes = await fetch(input, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${refresh.token}`,
        },
      });
      if (!(await isUnauthorizedResponse(retryRes))) return retryRes;
    } else if (refresh.status === 'unavailable') {
      return res;
    }

    let reason = `HTTP ${res.status}`;
    try {
      const json = await res.clone().json();
      reason = String(json?.message || json?.error || reason);
    } catch {
      /* ignore */
    }
    await handleUnauthorizedSession(reason);
  }

  return res;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await authorizedFetch(getApiUrl(endpoint), options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

export default config;
