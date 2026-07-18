/**
 * Permission Utilities
 * Helper functions for checking user permissions in the frontend
 * Updated for 3-level menu structure: menu -> childMenu -> type
 */

export interface UserPermission {
  module: string;     // Main menu (e.g., 'Inventory', 'HRM')
  childMenu: string;  // Child menu (e.g., 'Brand Management', 'Employee Management')
  type: string;       // Permission type (e.g., 'view', 'create', 'update', 'delete')
  granted: boolean;   // Is permission granted
}

/**
 * Get user permissions from localStorage
 */
export const getUserPermissions = (): UserPermission[] => {
  if (typeof window === 'undefined') return [];
  
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) return [];
  
  try {
    const userData = JSON.parse(userDataStr);
    return userData.permissions || [];
  } catch (error) {
    console.error('Error parsing user permissions:', error);
    return [];
  }
};

/**
 * Get user role from localStorage
 */
export const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) return null;
  
  try {
    const userData = JSON.parse(userDataStr);
    return userData.role || null;
  } catch (error) {
    console.error('Error parsing user role:', error);
    return null;
  }
};

/**
 * Check if user is admin
 * Admins have access to everything
 */
export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'admin' || role === 'user';
};

/**
 * Check if user has a specific permission
 * @param menu - Main menu (e.g., 'Inventory', 'HRM', 'Sales & POS')
 * @param childMenu - Child menu (e.g., 'Brand Management', 'Employee Management')
 * @param type - Permission type (e.g., 'view', 'create', 'update', 'delete')
 * @returns boolean - true if user has permission, false otherwise
 */
export const hasPermission = (menu: string, childMenu: string, type: string): boolean => {
  // Admins have all permissions
  if (isAdmin()) return true;
  
  const permissions = getUserPermissions();
  
  // Check if user has the specific permission (menu + childMenu + type)
  return permissions.some(
    permission => 
      permission.module === menu && 
      permission.childMenu === childMenu &&
      permission.type === type && 
      permission.granted
  );
};

/**
 * Check if user has view permission for a menu/childMenu
 */
export const canView = (menu: string, childMenu?: string): boolean => {
  return hasPermission(menu, childMenu || '', 'view');
};

/**
 * Check if user has create permission for a menu/childMenu
 */
export const canCreate = (menu: string, childMenu?: string): boolean => {
  return hasPermission(menu, childMenu || '', 'create');
};

/**
 * Check if user has update permission for a menu/childMenu
 */
export const canUpdate = (menu: string, childMenu?: string): boolean => {
  return hasPermission(menu, childMenu || '', 'update');
};

/**
 * Check if user has delete permission for a menu/childMenu
 */
export const canDelete = (menu: string, childMenu?: string): boolean => {
  return hasPermission(menu, childMenu || '', 'delete');
};

/**
 * Check if user has any permission for a menu
 * Useful for showing/hiding entire sections
 */
export const hasAnyPermission = (menu: string): boolean => {
  // Admins have all permissions
  if (isAdmin()) return true;
  
  const permissions = getUserPermissions();
  
  return permissions.some(
    permission => permission.module === menu && permission.granted
  );
};

/**
 * Check if user has multiple permissions
 * Returns true only if user has ALL specified permissions
 */
export const hasAllPermissions = (requirements: { menu: string; childMenu?: string; type: string }[]): boolean => {
  return requirements.every(req => hasPermission(req.menu, req.childMenu || '', req.type));
};

/**
 * Check if user has any of the specified permissions
 * Returns true if user has AT LEAST ONE of the specified permissions
 */
export const hasSomePermissions = (requirements: { menu: string; childMenu?: string; type: string }[]): boolean => {
  return requirements.some(req => hasPermission(req.menu, req.childMenu || '', req.type));
};

/**
 * Get all permission menus the user has access to
 */
export const getAllAccessibleMenus = (): string[] => {
  if (isAdmin()) {
    // Return all possible menus for admins
    return [
      'Dashboard',
      'Customize Shop',
      'Inventory',
      'Stock',
      'Sales & POS',
      'Purchases',
      'Contacts',
      'Promo',
      'Finance & Accounts',
      'Branch Management',
      'Orders',
      'Customer Management',
      'SMS Marketing',
      'Reports',
      'Recycle Bin',
      'Settings',
      'Review Management',
      'HRM',
      'Profile',
    ];
  }
  
  const permissions = getUserPermissions();
  const menus = new Set(permissions.map(p => p.module));
  return Array.from(menus);
};

/**
 * Check if a route/menu item should be accessible
 * Based on the menu permission mapping
 */
export const canAccessRoute = (menuId: string): boolean => {
  if (isAdmin()) return true;
  
  // Map menuId to actual menu names
  const menuMapping: Record<string, string> = {
    'dashboard': 'Dashboard',
    'customize-shop': 'Customize Shop',
    'inventory': 'Inventory',
    'stock': 'Stock',
    'sales-pos': 'Sales & POS',
    'purchases': 'Purchases',
    'contacts': 'Contacts',
    'promo': 'Promo',
    'finance-accounts': 'Finance & Accounts',
    'branch-management': 'Branch Management',
    'orders': 'Orders',
    'customer-management': 'Customer Management',
    'sms-marketing': 'SMS Marketing',
    'reports': 'Reports',
    'recycle-bin': 'Recycle Bin',
    'settings': 'Settings',
    'review-management': 'Review Management',
    'hrm': 'HRM',
    'profile': 'Profile',
  };
  
  const menuName = menuMapping[menuId] || menuId;
  return hasAnyPermission(menuName);
};

/**
 * Get permissions for a specific menu
 */
export const getMenuPermissions = (menu: string): UserPermission[] => {
  const permissions = getUserPermissions();
  return permissions.filter(p => p.module === menu);
};

/**
 * Get permissions for a specific menu and childMenu combination
 */
export const getChildMenuPermissions = (menu: string, childMenu: string): UserPermission[] => {
  const permissions = getUserPermissions();
  // Note: In the current structure, we only have module and type
  // Child menu filtering would need to be implemented based on the actual data structure
  return permissions.filter(p => p.module === menu);
};

/**
 * Check if user can access a specific feature
 * This is a more semantic way to check permissions
 */
export const canAccessFeature = (feature: string): boolean => {
  const featurePermissions: Record<string, { menu: string; childMenu?: string; type: string }> = {
    'add-product': { menu: 'Inventory', childMenu: 'Add Product', type: 'create' },
    'manage-brands': { menu: 'Inventory', childMenu: 'Brand Management', type: 'view' },
    'manage-categories': { menu: 'Inventory', childMenu: 'Category Management', type: 'view' },
    'view-stock': { menu: 'Stock', childMenu: 'Stock Overview', type: 'view' },
    'process-sales': { menu: 'Sales & POS', childMenu: 'POS', type: 'create' },
    'manage-employees': { menu: 'HRM', childMenu: 'Employee Management', type: 'view' },
    'view-reports': { menu: 'Reports', childMenu: 'Sales Report', type: 'view' },
    'manage-customers': { menu: 'Contacts', childMenu: 'Customers', type: 'view' },
  };
  
  const requirement = featurePermissions[feature];
  if (!requirement) return false;
  
  return hasPermission(requirement.menu, requirement.childMenu || '', requirement.type);
};