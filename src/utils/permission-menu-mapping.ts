/**
 * Permission Menu Mapping
 * Maps sidebar menu IDs to permission modules
 * This file defines which permission modules control access to which menus
 */

export interface MenuPermission {
  menuId: string;
  label: string;
  permissionModule: string;
  childMenus?: MenuPermission[];
}

/**
 * Complete menu to permission mapping
 * Structure: Menu -> Permission Module
 * Keep in sync with: Sidebar.tsx, sidebar-permission-map.ts, route-permission-map.ts, seed-professional-permissions.ts
 */
export const MENU_PERMISSION_MAP: MenuPermission[] = [
  {
    menuId: 'customize-shop',
    label: 'Customize Shop',
    permissionModule: 'shop',
    childMenus: [
      { menuId: 'shop-decoration', label: 'Shop Decoration', permissionModule: 'shop' },
      { menuId: 'shop-settings',   label: 'Shop Settings',   permissionModule: 'settings' },
    ],
  },
  {
    menuId: 'inventory',
    label: 'Inventory',
    permissionModule: 'inventory',
    childMenus: [
      { menuId: 'inventory/add-product',         label: 'Add Product',          permissionModule: 'products' },
      { menuId: 'inventory/manage-product',      label: 'Manage Product',       permissionModule: 'products' },
      { menuId: 'inventory/price-list',          label: 'Price List',           permissionModule: 'products' },
      { menuId: 'inventory/low-stock',           label: 'Low Stock',            permissionModule: 'inventory' },
      { menuId: 'inventory/brand-management',    label: 'Brand Management',     permissionModule: 'products' },
      { menuId: 'inventory/category-management', label: 'Category Management',  permissionModule: 'products' },
      { menuId: 'inventory/unit-management',     label: 'Unit Management',      permissionModule: 'products' },
      { menuId: 'inventory/variants-attributes', label: 'Variants & Attributes', permissionModule: 'products' },
      { menuId: 'inventory/warranty-management', label: 'Warranty',             permissionModule: 'products' },
      { menuId: 'inventory/print-barcode',       label: 'Print Barcode',        permissionModule: 'products' },
      { menuId: 'inventory/print-qr-code',       label: 'Print QR Code',        permissionModule: 'products' },
    ],
  },
  {
    menuId: 'stock',
    label: 'Stock',
    permissionModule: 'inventory',
    childMenus: [
      { menuId: 'stock/stock-adjustment', label: 'Stock Adjustment', permissionModule: 'inventory' },
      { menuId: 'stock/stock-export',     label: 'Stock Export',     permissionModule: 'inventory' },
      { menuId: 'stock/stock-transfer',   label: 'Stock Transfer',   permissionModule: 'inventory' },
    ],
  },
  {
    menuId: 'sales-pos',
    label: 'Sales & POS',
    permissionModule: 'orders',
    childMenus: [
      { menuId: 'sales-pos/pos',                  label: 'POS',                  permissionModule: 'orders' },
      { menuId: 'sales-pos/pay-later',            label: 'Pay Later',            permissionModule: 'orders' },
      { menuId: 'sales-pos/quick-sell',           label: 'Quick Sell',           permissionModule: 'orders' },
      { menuId: 'sales-pos/wholesale-management', label: 'Wholesale Management', permissionModule: 'orders' },
      { menuId: 'sales-pos/sales-history',        label: 'Sales History',        permissionModule: 'orders' },
      { menuId: 'sales-pos/sales-return',         label: 'Sales Return',         permissionModule: 'orders' },
      { menuId: 'sales-pos/quotation',            label: 'Quotation',            permissionModule: 'orders' },
      { menuId: 'sales-pos/daily-status',         label: 'Daily Status',         permissionModule: 'orders' },
      { menuId: 'sales-pos/serial-number',        label: 'Serial Number',        permissionModule: 'orders' },
      { menuId: 'sales-pos/services',             label: 'Services',             permissionModule: 'orders' },
    ],
  },
  {
    menuId: 'purchases',
    label: 'Purchases',
    permissionModule: 'purchases',
    childMenus: [
      { menuId: 'purchases/purchases',        label: 'Purchases',        permissionModule: 'purchases' },
      { menuId: 'purchases/purchase-return',  label: 'Purchase Return',  permissionModule: 'purchases' },
      { menuId: 'purchases/purchase-product', label: 'Purchase Product', permissionModule: 'purchases' },
    ],
  },
  {
    menuId: 'contacts',
    label: 'Contacts',
    permissionModule: 'customers',
    childMenus: [
      { menuId: 'contacts/customers', label: 'Customers', permissionModule: 'customers' },
      { menuId: 'contacts/retailer',  label: 'Retailers', permissionModule: 'customers' },
      { menuId: 'contacts/suppliers', label: 'Suppliers', permissionModule: 'suppliers' },
    ],
  },
  {
    menuId: 'promo',
    label: 'Promo',
    permissionModule: 'promo',
    childMenus: [
      { menuId: 'promo/coupons',    label: 'Coupons',    permissionModule: 'promo' },
      { menuId: 'promo/gift-cards', label: 'Gift Cards', permissionModule: 'promo' },
    ],
  },
  {
    menuId: 'finance-accounts',
    label: 'Finance & Accounts',
    permissionModule: 'finance',
    childMenus: [
      { menuId: 'finance-accounts/financial-overview',   label: 'Financial Overview',   permissionModule: 'finance' },
      { menuId: 'finance-accounts/expenses',             label: 'Expenses',             permissionModule: 'expenses' },
      { menuId: 'finance-accounts/expenses/category',    label: 'Expense Categories',   permissionModule: 'expenses' },
      { menuId: 'finance-accounts/income',               label: 'Income',               permissionModule: 'income' },
      { menuId: 'finance-accounts/income/category',      label: 'Income Categories',    permissionModule: 'income' },
      { menuId: 'finance-accounts/accounts-list',        label: 'Accounts List',        permissionModule: 'finance' },
      { menuId: 'finance-accounts/transactions-list',    label: 'Transactions List',    permissionModule: 'finance' },
      { menuId: 'finance-accounts/product-transactions', label: 'Product Transactions', permissionModule: 'finance' },
      { menuId: 'finance-accounts/balance-sheet',        label: 'Balance Sheet',        permissionModule: 'reports' },
      { menuId: 'finance-accounts/trial-balance',        label: 'Trial Balance',        permissionModule: 'reports' },
      { menuId: 'finance-accounts/cash-flow',            label: 'Cash Flow',            permissionModule: 'reports' },
      { menuId: 'finance-accounts/cash-deposit',         label: 'Cash Deposit',         permissionModule: 'finance' },
      { menuId: 'finance-accounts/account-statement',    label: 'Account Statement',    permissionModule: 'reports' },
      { menuId: 'finance-accounts/profit-withdrawal',    label: 'Profit Withdrawal',    permissionModule: 'finance' },
    ],
  },
  {
    menuId: 'branch-management',
    label: 'Branch Management',
    permissionModule: 'branches',
    childMenus: [
      { menuId: 'branch-management/branches', label: 'All Branches', permissionModule: 'branches' },
    ],
  },
  {
    menuId: 'orders',
    label: 'Orders',
    permissionModule: 'orders',
  },
  {
    menuId: 'customer-management',
    label: 'Customer Management',
    permissionModule: 'customers',
  },
  {
    menuId: 'sms-marketing',
    label: 'SMS Marketing',
    permissionModule: 'sms-marketing',
    childMenus: [
      { menuId: 'sms-marketing/overview', label: 'SMS Overview', permissionModule: 'sms-marketing' },
      { menuId: 'sms-marketing/quick-send', label: 'Quick Send', permissionModule: 'sms-marketing' },
      { menuId: 'sms-marketing/packages', label: 'SMS Package', permissionModule: 'sms-marketing' },
      { menuId: 'sms-marketing/history', label: 'SMS History', permissionModule: 'sms-marketing' },
      { menuId: 'sms-marketing/templates', label: 'SMS Templates', permissionModule: 'sms-marketing' },
      { menuId: 'sms-marketing/configuration', label: 'SMS Configuration', permissionModule: 'sms-marketing' },
    ],
  },
  {
    menuId: 'reports',
    label: 'Reports',
    permissionModule: 'reports',
    childMenus: [
      { menuId: 'reports/sales-report',                          label: 'Sales Report',            permissionModule: 'reports' },
      { menuId: 'reports/sales-report/sales-report',             label: 'Sales Report',            permissionModule: 'reports' },
      { menuId: 'reports/sales-report/best-selling',             label: 'Best Selling Report',     permissionModule: 'reports' },
      { menuId: 'reports/purchase-report',                       label: 'Purchase Report',         permissionModule: 'reports' },
      { menuId: 'reports/stock-report',                          label: 'Stock Report',            permissionModule: 'reports' },
      { menuId: 'reports/supplier-report',                       label: 'Supplier Report',         permissionModule: 'reports' },
      { menuId: 'reports/supplier-report/supplier-report',       label: 'Supplier Report',         permissionModule: 'reports' },
      { menuId: 'reports/supplier-report/supplier-due-report',   label: 'Supplier Due Report',     permissionModule: 'reports' },
      { menuId: 'reports/customer-report',                       label: 'Customer Report',         permissionModule: 'reports' },
      { menuId: 'reports/customer-report/customer-report',       label: 'Customer Report',         permissionModule: 'reports' },
      { menuId: 'reports/customer-report/customer-due-report',   label: 'Customer Due Report',     permissionModule: 'reports' },
      { menuId: 'reports/product-report',                        label: 'Product Report',          permissionModule: 'reports' },
      { menuId: 'reports/product-report/product-report',         label: 'Product Report',          permissionModule: 'reports' },
      { menuId: 'reports/product-report/product-expiry-report',  label: 'Product Expiry Report',   permissionModule: 'reports' },
      { menuId: 'reports/product-report/product-quantity-report', label: 'Product Quantity Report', permissionModule: 'reports' },
      { menuId: 'reports/expense-report',                        label: 'Expense Report',          permissionModule: 'reports' },
      { menuId: 'reports/income-report',                         label: 'Income Report',           permissionModule: 'reports' },
      { menuId: 'reports/profit-loss',                           label: 'Profit & Loss Report',    permissionModule: 'reports' },
      { menuId: 'reports/business-overview',                     label: 'Business Overview',       permissionModule: 'reports' },
    ],
  },
  {
    menuId: 'recycle-bin',
    label: 'Recycle Bin',
    permissionModule: 'system',
    childMenus: [
      { menuId: 'recycle-bin/trash/archived-products',   label: 'Archived Products',   permissionModule: 'system' },
      { menuId: 'recycle-bin/trash/archived-stores',     label: 'Archived Stores',     permissionModule: 'system' },
      { menuId: 'recycle-bin/trash/archived-warehouses', label: 'Archived Warehouses', permissionModule: 'system' },
    ],
  },
  {
    menuId: 'settings',
    label: 'Settings',
    permissionModule: 'settings',
    childMenus: [
      { menuId: 'settings/financial-settings/tax-rates',        label: 'Tax Rates',          permissionModule: 'settings' },
      { menuId: 'settings/promotional/reward-points',           label: 'Reward Points',      permissionModule: 'settings' },
      { menuId: 'settings/promotional/vip-membership',          label: 'VIP Membership',     permissionModule: 'settings' },
      { menuId: 'settings/t&c_setting',                         label: 'Terms & Conditions', permissionModule: 'settings' },
      { menuId: 'settings/brand-logo',                          label: 'Brand Logo',         permissionModule: 'settings' },
    ],
  },
  {
    menuId: 'review-management',
    label: 'Review Management',
    permissionModule: 'reviews',
  },
  {
    menuId: 'hrm',
    label: 'HRM',
    permissionModule: 'hrm',
    childMenus: [
      { menuId: 'hrm/performance',            label: 'Performance',            permissionModule: 'performance' },
      { menuId: 'hrm/employee-management',    label: 'Employee Management',    permissionModule: 'employees' },
      { menuId: 'hrm/attendance/daily-log',   label: 'Daily Log',              permissionModule: 'attendance' },
      { menuId: 'hrm/attendance/summary',     label: 'Attendance Summary',     permissionModule: 'attendance' },
      { menuId: 'hrm/attendance/attendance-setting', label: 'Attendance Setting', permissionModule: 'attendance' },
      { menuId: 'hrm/shifts',                 label: 'Shifts',                 permissionModule: 'attendance' },
      { menuId: 'hrm/leaves/leaves',          label: 'Leave Requests',         permissionModule: 'leaves' },
      { menuId: 'hrm/leaves/leave-types',     label: 'Leave Types',            permissionModule: 'leaves' },
      { menuId: 'hrm/holiday',                label: 'Holiday',                permissionModule: 'leaves' },
      { menuId: 'hrm/payroll/salary-sheet',   label: 'Salary Sheet',           permissionModule: 'payroll' },
      { menuId: 'hrm/payroll/employee-salary', label: 'Employee Salary',       permissionModule: 'payroll' },
      { menuId: 'hrm/payroll/advance-salary', label: 'Advance Salary',         permissionModule: 'payroll' },
      { menuId: 'hrm/payroll/salary-settings', label: 'Salary Settings',       permissionModule: 'payroll' },
      { menuId: 'hrm/designation-management', label: 'Designation Management', permissionModule: 'departments' },
      { menuId: 'hrm/department-management',  label: 'Department Management',  permissionModule: 'departments' },
      { menuId: 'hrm/role-permission',        label: 'Role & Permission',      permissionModule: 'roles' },
    ],
  },
  {
    menuId: 'ecommerce',
    label: 'E-commerce',
    permissionModule: 'ecommerce',
    childMenus: [
      { menuId: 'ecommerce/online-orders',   label: 'Online Orders',   permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/store-settings',  label: 'Store Settings',  permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/store-domain',    label: 'Store Domain',    permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/theme-store',     label: 'Theme Store',     permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/themes',          label: 'Themes',          permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/payment-gateway', label: 'Payment Gateway', permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/seo-marketing',   label: 'SEO & Marketing', permissionModule: 'ecommerce' },
      { menuId: 'ecommerce/subscription',      label: 'Subscription',    permissionModule: 'ecommerce' },
    ],
  },
];

/**
 * Get permission module for a given menu ID
 */
export const getPermissionModuleForMenu = (menuId: string): string | null => {
  const allMenus: MenuPermission[] = [];

  MENU_PERMISSION_MAP.forEach(menu => {
    allMenus.push(menu);
    if (menu.childMenus) {
      allMenus.push(...menu.childMenus);
    }
  });

  const found = allMenus.find(m => m.menuId === menuId);
  return found ? found.permissionModule : null;
};

/**
 * Get all unique permission modules used across menus
 */
export const getAllPermissionModules = (): string[] => {
  const modules = new Set<string>();

  MENU_PERMISSION_MAP.forEach(menu => {
    modules.add(menu.permissionModule);
    if (menu.childMenus) {
      menu.childMenus.forEach(child => modules.add(child.permissionModule));
    }
  });

  return Array.from(modules).sort();
};

/**
 * Permission types available for each module
 */
export const PERMISSION_TYPES = ['view', 'create', 'update', 'delete'] as const;
export type PermissionType = typeof PERMISSION_TYPES[number];

/**
 * Format permission name for display
 */
export const formatPermissionType = (type: PermissionType): string => {
  const typeMap: Record<PermissionType, string> = {
    view:   'Read',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
  };
  return typeMap[type];
};
