// Role & Permission Management Types and Interfaces

export interface Permission {
  id: string;
  module: string;
  type: string;
  description?: string;
}

export interface RolePermission {
  id: string;
  granted: boolean;
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: RolePermission[];
  _count: {
    users: number;
  };
}

export interface GroupedPermissions {
  [module: string]: Permission[];
}

export interface RoleFormData {
  name: string;
  description?: string;
  isDefault: boolean;
  permissionIds?: string[];
}

export interface RoleModalState {
  showCreateModal: boolean;
  showEditModal: boolean;
  showPermissionModal: boolean;
  selectedRole: Role | null;
  editingRole: Role | null;
}

export interface RoleStats {
  totalRoles: number;
  defaultRoles: number;
  customRoles: number;
  totalPermissions: number;
}

