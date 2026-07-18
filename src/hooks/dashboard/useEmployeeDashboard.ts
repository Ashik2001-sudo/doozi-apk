import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { EmployeeData } from '@/types/dashboard.types';
import {
  apiFetch,
  clearAuthData,
  getTenantData,
  getUserData,
  isAuthenticated,
} from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';

export function useEmployeeDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEmployeeData = useCallback(async () => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<Record<string, any>>('/auth/me');
      const currentUser = (res.data as any)?.user ?? res.data;
      if (!currentUser) {
        await clearAuthData();
        router.replace('/login');
        return;
      }

      const role = String(currentUser.role || user?.role || '').toLowerCase();
      if (role !== 'employee') {
        router.replace('/admin/dashboard' as never);
        return;
      }

      const local = getUserData<Record<string, any>>() || {};
      const dept = currentUser.department ?? local.department;
      setEmployee({
        id: String(currentUser.id),
        employeeId: String(currentUser.employeeId || local.employeeId || ''),
        name: currentUser.name || user?.name || '',
        email: currentUser.email || user?.email || '',
        phone: currentUser.phone ?? local.phone ?? '',
        designation: currentUser.designation ?? local.designation ?? '',
        department:
          typeof dept === 'string'
            ? { id: '', name: dept }
            : dept
              ? { id: String(dept.id || ''), name: String(dept.name || '') }
              : undefined,
        joiningDate: currentUser.joiningDate ?? local.joiningDate ?? new Date().toISOString(),
        profilePhoto: currentUser.profilePhoto ?? local.profilePhoto,
        role: 'employee',
        shiftId: currentUser.shiftId ?? local.shiftId,
      });
    } catch (e) {
      console.warn('Employee dashboard auth check failed', e);
      // Fall back to stored user so UI still works offline briefly
      if (user?.role === 'employee') {
        const local = getUserData<Record<string, any>>() || {};
        setEmployee({
          id: String(user.id || local.id || ''),
          employeeId: String(local.employeeId || ''),
          name: user.name,
          email: user.email,
          phone: local.phone || '',
          designation: local.designation || '',
          department: local.department
            ? typeof local.department === 'string'
              ? { id: '', name: local.department }
              : local.department
            : undefined,
          joiningDate: local.joiningDate || new Date().toISOString(),
          profilePhoto: local.profilePhoto,
          role: 'employee',
          shiftId: local.shiftId,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [router, user]);

  useEffect(() => {
    void loadEmployeeData();
  }, [loadEmployeeData]);

  const tenant = getTenantData<{ company?: string; id?: string }>();

  return {
    employee,
    tenant,
    loading,
    reload: loadEmployeeData,
    handleLogout: logout,
  };
}
