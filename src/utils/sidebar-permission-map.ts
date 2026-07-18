/**
 * Sidebar Menu to Permission Mapping
 * Maps each sidebar menu item to its required permission for access
 * Keep in sync with: Sidebar.tsx, permission-menu-mapping.ts, route-permission-map.ts, seed-professional-permissions.ts
 */

export interface MenuPermissionRequirement {
  menu: string;           // Main menu name in permission system
  childMenu?: string;     // Child menu name (optional for parent menus)
  requiresAny?: boolean;  // If true, having ANY permission type grants access
}

export const SIDEBAR_PERMISSION_MAP: Record<string, MenuPermissionRequirement> = {
  // ─── Customize Shop ───────────────────────────────────────────────────────
  'customize-shop':  { menu: 'Customize Shop', requiresAny: true },
  'shop-decoration': { menu: 'Customize Shop', childMenu: 'Shop Decoration' },
  'shop-settings':   { menu: 'Customize Shop', childMenu: 'Shop Settings' },

  // ─── Inventory ────────────────────────────────────────────────────────────
  'inventory':                      { menu: 'Inventory', requiresAny: true },
  'inventory/add-product':          { menu: 'Inventory', childMenu: 'Add Product' },
  'inventory/manage-product':       { menu: 'Inventory', childMenu: 'Manage Product' },
  'inventory/view-product':         { menu: 'Inventory', childMenu: 'Manage Product' },
  'inventory/price-list':           { menu: 'Inventory', childMenu: 'Price List' },
  'inventory/low-stock':            { menu: 'Inventory', childMenu: 'Low Stock' },
  'inventory/brand-management':     { menu: 'Inventory', childMenu: 'Brand Management' },
  'inventory/category-management':  { menu: 'Inventory', childMenu: 'Category Management' },
  'inventory/unit-management':      { menu: 'Inventory', childMenu: 'Unit Management' },
  'inventory/variants-attributes':  { menu: 'Inventory', childMenu: 'Variants & Attributes' },
  'inventory/warranty-management':  { menu: 'Inventory', childMenu: 'Warranty' },
  'inventory/print-barcode':        { menu: 'Inventory', childMenu: 'Print Barcode' },
  'inventory/print-qr-code':        { menu: 'Inventory', childMenu: 'Print QR Code' },

  // ─── Stock ────────────────────────────────────────────────────────────────
  'stock':                  { menu: 'Stock', requiresAny: true },
  'stock/stock-adjustment': { menu: 'Stock', childMenu: 'Stock Adjustment' },
  'stock/stock-export':     { menu: 'Stock', childMenu: 'Stock Export' },
  'stock/stock-transfer':   { menu: 'Stock', childMenu: 'Stock Transfer' },

  // ─── Sales & POS ──────────────────────────────────────────────────────────
  'sales-pos':                        { menu: 'Sales & POS', requiresAny: true },
  'sales-pos/pos':                    { menu: 'Sales & POS', childMenu: 'POS' },
  'sales-pos/pay-later':              { menu: 'Sales & POS', childMenu: 'Pay Later' },
  'sales-pos/quick-sell':             { menu: 'Sales & POS', childMenu: 'Quick Sell' },
  'sales-pos/wholesale-management':   { menu: 'Sales & POS', childMenu: 'Wholesale Management' },
  'sales-pos/sales-history':          { menu: 'Sales & POS', childMenu: 'Sales History' },
  'sales-pos/sales-return':           { menu: 'Sales & POS', childMenu: 'Sales Return' },
  'sales-pos/quotation':              { menu: 'Sales & POS', childMenu: 'Quotation' },
  'sales-pos/daily-status':           { menu: 'Sales & POS', childMenu: 'Daily Status' },
  'sales-pos/serial-number':          { menu: 'Sales & POS', childMenu: 'Serial Number' },
  'sales-pos/services':               { menu: 'Sales & POS', childMenu: 'Services' },

  // ─── Purchases ────────────────────────────────────────────────────────────
  'purchases':                  { menu: 'Purchases', requiresAny: true },
  'purchases/purchases':        { menu: 'Purchases', childMenu: 'Purchases' },
  'purchases/purchase-return':  { menu: 'Purchases', childMenu: 'Purchase Return' },
  'purchases/purchase-product': { menu: 'Purchases', childMenu: 'Purchase Product' },

  // ─── Contacts ─────────────────────────────────────────────────────────────
  'contacts':           { menu: 'Contacts', requiresAny: true },
  'contacts/customers': { menu: 'Contacts', childMenu: 'Customers' },
  'contacts/retailer':  { menu: 'Contacts', childMenu: 'Retailers' },
  'contacts/suppliers': { menu: 'Contacts', childMenu: 'Suppliers' },

  // ─── Promo ────────────────────────────────────────────────────────────────
  'promo':             { menu: 'Promo', requiresAny: true },
  'promo/coupons':     { menu: 'Promo', childMenu: 'Coupons' },
  'promo/gift-cards':  { menu: 'Promo', childMenu: 'Gift Cards' },

  // ─── Finance & Accounts ───────────────────────────────────────────────────
  'finance-accounts':                         { menu: 'Finance & Accounts', requiresAny: true },
  'finance-accounts/financial-overview':      { menu: 'Finance & Accounts', childMenu: 'Financial Overview' },
  'finance-accounts/expenses':                { menu: 'Finance & Accounts', childMenu: 'Expenses' },
  'finance-accounts/expenses/category':       { menu: 'Finance & Accounts', childMenu: 'Expense Categories' },
  'finance-accounts/income':                  { menu: 'Finance & Accounts', childMenu: 'Income' },
  'finance-accounts/income/category':         { menu: 'Finance & Accounts', childMenu: 'Income Categories' },
  'finance-accounts/accounts-list':           { menu: 'Finance & Accounts', childMenu: 'Accounts List' },
  'finance-accounts/transactions-list':       { menu: 'Finance & Accounts', childMenu: 'Transactions List' },
  'finance-accounts/product-transactions':    { menu: 'Finance & Accounts', childMenu: 'Product Transactions' },
  'finance-accounts/balance-sheet':           { menu: 'Finance & Accounts', childMenu: 'Balance Sheet' },
  'finance-accounts/trial-balance':           { menu: 'Finance & Accounts', childMenu: 'Trial Balance' },
  'finance-accounts/cash-flow':               { menu: 'Finance & Accounts', childMenu: 'Cash Flow' },
  'finance-accounts/cash-deposit':            { menu: 'Finance & Accounts', childMenu: 'Cash Deposit' },
  'finance-accounts/account-statement':       { menu: 'Finance & Accounts', childMenu: 'Account Statement' },
  'finance-accounts/profit-withdrawal':       { menu: 'Finance & Accounts', childMenu: 'Profit Withdrawal' },

  // ─── Branch Management ────────────────────────────────────────────────────
  'branch-management':          { menu: 'Branch Management', requiresAny: true },
  'branch-management/branches': { menu: 'Branch Management', childMenu: 'All Branches' },

  // ─── Orders ───────────────────────────────────────────────────────────────
  'orders': { menu: 'Orders', childMenu: 'Orders' },

  // ─── Customer Management ──────────────────────────────────────────────────
  'customer-management': { menu: 'Customer Management', childMenu: 'Customer Management' },

  // ─── SMS Marketing ────────────────────────────────────────────────────────
  'sms-marketing':                  { menu: 'SMS Marketing', requiresAny: true },
  'sms-marketing/overview':         { menu: 'SMS Marketing', childMenu: 'SMS Overview' },
  'sms-marketing/quick-send':       { menu: 'SMS Marketing', childMenu: 'Quick Send' },
  'sms-marketing/packages':         { menu: 'SMS Marketing', childMenu: 'SMS Package' },
  'sms-marketing/history':          { menu: 'SMS Marketing', childMenu: 'SMS History' },
  'sms-marketing/templates':        { menu: 'SMS Marketing', childMenu: 'SMS Templates' },
  'sms-marketing/configuration':  { menu: 'SMS Marketing', childMenu: 'SMS Configuration' },

  // ─── Reports ──────────────────────────────────────────────────────────────
  'reports':                                          { menu: 'Reports', requiresAny: true },
  'reports/sales-report':                             { menu: 'Reports', childMenu: 'Sales Report' },
  'reports/sales-report/sales-report':                { menu: 'Reports', childMenu: 'Sales Report' },
  'reports/sales-report/best-selling':                { menu: 'Reports', childMenu: 'Best Selling Report' },
  'reports/purchase-report':                          { menu: 'Reports', childMenu: 'Purchase Report' },
  'reports/stock-report':                             { menu: 'Reports', childMenu: 'Stock Report' },
  'reports/supplier-report':                          { menu: 'Reports', childMenu: 'Supplier Report' },
  'reports/supplier-report/supplier-report':          { menu: 'Reports', childMenu: 'Supplier Report' },
  'reports/supplier-report/supplier-due-report':      { menu: 'Reports', childMenu: 'Supplier Due Report' },
  'reports/customer-report':                          { menu: 'Reports', childMenu: 'Customer Report' },
  'reports/customer-report/customer-report':          { menu: 'Reports', childMenu: 'Customer Report' },
  'reports/customer-report/customer-due-report':      { menu: 'Reports', childMenu: 'Customer Due Report' },
  'reports/product-report':                           { menu: 'Reports', childMenu: 'Product Report' },
  'reports/product-report/product-report':            { menu: 'Reports', childMenu: 'Product Report' },
  'reports/product-report/product-expiry-report':     { menu: 'Reports', childMenu: 'Product Expiry Report' },
  'reports/product-report/product-quantity-report':   { menu: 'Reports', childMenu: 'Product Quantity Report' },
  'reports/expense-report':                           { menu: 'Reports', childMenu: 'Expense Report' },
  'reports/income-report':                            { menu: 'Reports', childMenu: 'Income Report' },
  'reports/profit-loss':                              { menu: 'Reports', childMenu: 'Profit & Loss Report' },
  'reports/business-overview':                        { menu: 'Reports', childMenu: 'Business Overview' },

  // ─── Recycle Bin ──────────────────────────────────────────────────────────
  'recycle-bin':                              { menu: 'Recycle Bin', requiresAny: true },
  'recycle-bin/trash':                        { menu: 'Recycle Bin', requiresAny: true },
  'recycle-bin/trash/archived-products':      { menu: 'Recycle Bin', childMenu: 'Archived Products' },
  'recycle-bin/trash/archived-stores':        { menu: 'Recycle Bin', childMenu: 'Archived Stores' },
  'recycle-bin/trash/archived-warehouses':    { menu: 'Recycle Bin', childMenu: 'Archived Warehouses' },

  // ─── Settings ─────────────────────────────────────────────────────────────
  'settings':                                   { menu: 'Settings', requiresAny: true },
  'settings/financial-settings':                { menu: 'Settings', requiresAny: true },
  'settings/financial-settings/tax-rates':      { menu: 'Settings', childMenu: 'Tax Rates' },
  'settings/promotional-settings':              { menu: 'Settings', requiresAny: true },
  'settings/promotional-settings/reward-points': { menu: 'Settings', childMenu: 'Reward Points' },
  'settings/promotional-settings/vip-membership': { menu: 'Settings', childMenu: 'VIP Membership' },
  'settings/promotional/reward-points':         { menu: 'Settings', childMenu: 'Reward Points' },
  'settings/promotional/vip-membership':        { menu: 'Settings', childMenu: 'VIP Membership' },
  'settings/t&c_setting':                       { menu: 'Settings', childMenu: 'Terms & Conditions' },
  'settings/brand-logo':                        { menu: 'Settings', childMenu: 'Brand Logo' },

  // ─── Review Management ────────────────────────────────────────────────────
  'review-management': { menu: 'Review Management', childMenu: 'Review Management' },

  // ─── HRM ──────────────────────────────────────────────────────────────────
  'hrm':                              { menu: 'HRM', requiresAny: true },
  'hrm/performance':                  { menu: 'HRM', childMenu: 'Performance' },
  'hrm/employee-management':          { menu: 'HRM', childMenu: 'Employee Management' },
  'hrm/attendance':                   { menu: 'HRM', requiresAny: true },
  'hrm/attendance/daily-log':         { menu: 'HRM', childMenu: 'Daily Log' },
  'hrm/attendance/summary':           { menu: 'HRM', childMenu: 'Attendance Summary' },
  'hrm/attendance/attendance-setting': { menu: 'HRM', childMenu: 'Attendance Setting' },
  'hrm/shifts':                       { menu: 'HRM', childMenu: 'Shifts' },
  'hrm/leaves':                       { menu: 'HRM', requiresAny: true },
  'hrm/leaves/leaves':                { menu: 'HRM', childMenu: 'Leave Requests' },
  'hrm/leaves/leave-types':           { menu: 'HRM', childMenu: 'Leave Types' },
  'hrm/holiday':                      { menu: 'HRM', childMenu: 'Holiday' },
  'hrm/payroll':                      { menu: 'HRM', requiresAny: true },
  'hrm/payroll/salary-sheet':         { menu: 'HRM', childMenu: 'Salary Sheet' },
  'hrm/payroll/employee-salary':      { menu: 'HRM', childMenu: 'Employee Salary' },
  'hrm/payroll/advance-salary':       { menu: 'HRM', childMenu: 'Advance Salary' },
  'hrm/payroll/salary-settings':      { menu: 'HRM', childMenu: 'Salary Settings' },
  'hrm/designation-management':       { menu: 'HRM', childMenu: 'Designation Management' },
  'hrm/department-management':        { menu: 'HRM', childMenu: 'Department Management' },
  'hrm/role-permission':              { menu: 'HRM', childMenu: 'Role & Permission' },

  // ─── Profile ──────────────────────────────────────────────────────────────
  'profile': { menu: 'Profile', childMenu: 'Profile' },

  // ─── Ask Me (sidebar icon bar) ───────────────────────────────────────────
  'ask-me': { menu: 'Ask Me', childMenu: 'Ask Me' },

  // ─── E-commerce ───────────────────────────────────────────────────────────
  'ecommerce':                    { menu: 'E-commerce', requiresAny: true },
  'ecommerce/online-orders':      { menu: 'E-commerce', childMenu: 'Online Orders' },
  'ecommerce/store-settings':     { menu: 'E-commerce', childMenu: 'Store Settings' },
  'ecommerce/store-domain':       { menu: 'E-commerce', childMenu: 'Store Domain' },
  'ecommerce/theme-store':        { menu: 'E-commerce', childMenu: 'Theme Store' },
  'ecommerce/themes':             { menu: 'E-commerce', childMenu: 'Themes' },
  'ecommerce/payment-gateway':    { menu: 'E-commerce', childMenu: 'Payment Gateway' },
  'ecommerce/seo-marketing':      { menu: 'E-commerce', childMenu: 'SEO & Marketing' },
  'ecommerce/subscription':       { menu: 'E-commerce', childMenu: 'Subscription' },
};

/**
 * Check if user has permission to access a menu item
 */
export const canAccessMenuItem = (
  menuId: string,
  permissions: Array<{ module: string; childMenu?: string; type: string; granted: boolean }>,
  isAdmin: boolean
): boolean => {
  if (isAdmin) return true;

  // Dashboard is always accessible
  if (menuId === 'dashboard') return true;

  const requirement = SIDEBAR_PERMISSION_MAP[menuId];

  // Deny by default if not in map
  if (!requirement) return false;

  const { menu, childMenu, requiresAny } = requirement;

  if (requiresAny) {
    return permissions.some(perm => perm.module === menu && perm.granted);
  }

  if (childMenu) {
    return permissions.some(perm =>
      perm.module === menu &&
      perm.childMenu === childMenu &&
      perm.granted
    );
  }

  return permissions.some(perm => perm.module === menu && perm.granted);
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuByPermissions = (
  menuItems: any[],
  permissions: Array<{ module: string; childMenu?: string; type: string; granted: boolean }>,
  isAdmin: boolean
): any[] => {
  if (isAdmin) return menuItems;

  return menuItems
    .map(item => {
      const hasAccess = canAccessMenuItem(item.id, permissions, isAdmin);

      if (!hasAccess) return null;

      if (item.hasSubmenu && item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem: any) =>
          canAccessMenuItem(subItem.id, permissions, isAdmin)
        );

        if (filteredSubmenu.length === 0) return null;

        return { ...item, submenu: filteredSubmenu };
      }

      return item;
    })
    .filter(Boolean);
};
