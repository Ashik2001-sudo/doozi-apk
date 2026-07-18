import { getUserData } from '@/lib/config';
import { ROUTE_PERMISSION_MAP } from '@/utils/route-permission-map';

export function usePermissions() {
  const user = getUserData<{
    role?: string;
    permissions?: Array<{ menu: string; childMenu: string; canView?: boolean }>;
  }>();

  const isOwner = user?.role === 'admin' || user?.role === 'user' || !user?.role;
  const isEmployee = user?.role === 'employee';

  const hasPermission = (menu: string, childMenu: string): boolean => {
    if (isOwner) return true;
    if (!isEmployee || !user?.permissions) return false;
    return user.permissions.some(
      (p) => p.menu === menu && p.childMenu === childMenu && p.canView !== false,
    );
  };

  const canAccessRoute = (routePath: string): boolean => {
    if (isOwner) return true;
    const normalized = routePath.replace(/\/\[.*?\]/g, '/[id]');
    const perm = ROUTE_PERMISSION_MAP[normalized] || ROUTE_PERMISSION_MAP[routePath];
    if (!perm) return true;
    return hasPermission(perm.menu, perm.childMenu);
  };

  return { user, isOwner, isEmployee, hasPermission, canAccessRoute };
}
