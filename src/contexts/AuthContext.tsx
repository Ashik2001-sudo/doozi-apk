import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuthData,
  getAuthenticatedDashboardPath,
  getTenantData,
  getUserData,
  initAuthStorage,
  isAuthenticated,
  setAuthData,
  setUnauthorizedHandler,
  config,
  apiFetch,
} from '@/lib/config';
import { useRouter, useSegments } from 'expo-router';

interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  employeeId?: string;
  designation?: string;
  department?: string | { id?: string; name?: string };
  shiftId?: string;
  profilePhoto?: string;
  permissions?: Array<{
    menu?: string;
    module?: string;
    childMenu?: string;
    type?: string;
    canView?: boolean;
    granted?: boolean;
  }>;
}

interface AuthTenant {
  id?: string;
  company: string;
  domain: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  loading: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<AuthTenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const loadFromStorage = useCallback(() => {
    setUser(getUserData<AuthUser>());
    setTenant(getTenantData<AuthTenant>());
  }, []);

  useEffect(() => {
    void (async () => {
      await initAuthStorage();
      loadFromStorage();
      setIsReady(true);
    })();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isReady) return;
    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const authed = isAuthenticated();
    if (!authed && !inAuth) {
      router.replace('/login');
    } else if (authed && inAuth) {
      router.replace(getAuthenticatedDashboardPath() as never);
    }
  }, [isReady, segments, router]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setTenant(null);
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const refreshMe = useCallback(async () => {
    const res = await apiFetch<{ user: AuthUser; tenant: AuthTenant }>(config.ENDPOINTS.AUTH.ME);
    if (res.data) {
      setUser(res.data.user);
      setTenant(res.data.tenant);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await apiFetch<{
          accessToken: string;
          user: AuthUser;
          tenant: AuthTenant;
        }>(config.ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (!res.data?.accessToken) throw new Error(res.message || 'Login failed');
        await setAuthData(res.data.accessToken, res.data.user, res.data.tenant);
        setUser(res.data.user);
        setTenant(res.data.tenant);
        router.replace(getAuthenticatedDashboardPath() as never);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    await clearAuthData();
    setUser(null);
    setTenant(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, tenant, loading, isReady, login, logout, refreshMe }),
    [user, tenant, loading, isReady, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
