import { Role, RoleFormData, Permission, GroupedPermissions } from '@/types/role.types';

// Format date
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Validate role form
export const validateRoleForm = (
  data: RoleFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Role name is required';
  } else if (data.name.length > 50) {
    errors.name = 'Role name must be less than 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format role for form
export const formatRoleForForm = (role: Role): RoleFormData => {
  return {
    name: role.name,
    description: role.description || '',
    isDefault: role.isDefault,
    permissionIds: role.permissions.filter(p => p.granted).map(p => p.permission.id),
  };
};

// Format form data for API
export const formatRoleFormForAPI = (data: RoleFormData) => {
  return {
    name: data.name,
    description: data.description || undefined,
    isDefault: data.isDefault,
    permissionIds: data.permissionIds || [],
  };
};

// Group permissions by module
export const groupPermissionsByModule = (permissions: Permission[]): GroupedPermissions => {
  return permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as GroupedPermissions);
};

// Format module name for display
export const formatModuleName = (module: string): string => {
  return module
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get role stats
export const getRoleStats = (roles: Role[]) => {
  return {
    totalRoles: roles.length,
    defaultRoles: roles.filter(r => r.isDefault).length,
    customRoles: roles.filter(r => !r.isDefault).length,
    totalUsers: roles.reduce((sum, r) => sum + r._count.users, 0),
  };
};

// Check if all permissions in a module are selected
export const areAllModulePermissionsSelected = (
  modulePermissions: Permission[],
  selectedPermissionIds: string[]
): boolean => {
  return modulePermissions.every(p => selectedPermissionIds.includes(p.id));
};

// Get granted permissions count
export const getGrantedPermissionsCount = (role: Role): number => {
  return role.permissions.filter(p => p.granted).length;
};

// Filter roles
export const filterRoles = (
  roles: Role[],
  searchTerm: string
): Role[] => {
  if (!searchTerm) return roles;
  
  return roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
};

