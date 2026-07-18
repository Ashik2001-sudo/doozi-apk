/**
 * Route to Permission Mapping
 * Maps every admin route to its required permission
 * Keep in sync with: Sidebar.tsx, sidebar-permission-map.ts, permission-menu-mapping.ts, seed-professional-permissions.ts
 */

export interface RoutePermission {
  menu: string;
  childMenu: string;
  requireView?: boolean; // Default: true
}

export const ROUTE_PERMISSION_MAP: Record<string, RoutePermission> = {
  // ─── Customize Shop ───────────────────────────────────────────────────────
  '/admin/shop-decoration': { menu: 'Customize Shop', childMenu: 'Shop Decoration' },
  '/admin/shop-settings':   { menu: 'Customize Shop', childMenu: 'Shop Settings' },

  // ─── Inventory ────────────────────────────────────────────────────────────
  '/admin/inventory/add-product':         { menu: 'Inventory', childMenu: 'Add Product' },
  '/admin/inventory/manage-product':      { menu: 'Inventory', childMenu: 'Manage Product' },
  '/admin/inventory/view-product':        { menu: 'Inventory', childMenu: 'Manage Product' },
  '/admin/inventory/price-list':          { menu: 'Inventory', childMenu: 'Price List' },
  '/admin/inventory/low-stock':           { menu: 'Inventory', childMenu: 'Low Stock' },
  '/admin/inventory/brand-management':    { menu: 'Inventory', childMenu: 'Brand Management' },
  '/admin/inventory/category-management': { menu: 'Inventory', childMenu: 'Category Management' },
  '/admin/inventory/unit-management':     { menu: 'Inventory', childMenu: 'Unit Management' },
  '/admin/inventory/variants-attributes': { menu: 'Inventory', childMenu: 'Variants & Attributes' },
  '/admin/inventory/warranty-management': { menu: 'Inventory', childMenu: 'Warranty' },
  '/admin/inventory/print-barcode':       { menu: 'Inventory', childMenu: 'Print Barcode' },
  '/admin/inventory/print-qr-code':       { menu: 'Inventory', childMenu: 'Print QR Code' },

  // ─── Stock ────────────────────────────────────────────────────────────────
  '/admin/stock/stock-adjustment': { menu: 'Stock', childMenu: 'Stock Adjustment' },
  '/admin/stock/stock-export':     { menu: 'Stock', childMenu: 'Stock Export' },
  '/admin/stock/stock-transfer':   { menu: 'Stock', childMenu: 'Stock Transfer' },

  // ─── Sales & POS ──────────────────────────────────────────────────────────
  '/admin/sales-pos/pos':                  { menu: 'Sales & POS', childMenu: 'POS' },
  '/admin/sales-pos/pay-later':            { menu: 'Sales & POS', childMenu: 'Pay Later' },
  '/admin/sales-pos/quick-sell':           { menu: 'Sales & POS', childMenu: 'Quick Sell' },
  '/admin/sales-pos/wholesale-management': { menu: 'Sales & POS', childMenu: 'Wholesale Management' },
  '/admin/sales-pos/sales-history':        { menu: 'Sales & POS', childMenu: 'Sales History' },
  '/admin/sales-pos/sales-return':         { menu: 'Sales & POS', childMenu: 'Sales Return' },
  '/admin/sales-pos/quotation':            { menu: 'Sales & POS', childMenu: 'Quotation' },
  '/admin/sales-pos/daily-status':         { menu: 'Sales & POS', childMenu: 'Daily Status' },
  '/admin/sales-pos/serial-number':        { menu: 'Sales & POS', childMenu: 'Serial Number' },
  '/admin/sales-pos/services':             { menu: 'Sales & POS', childMenu: 'Services' },

  // ─── Purchases ────────────────────────────────────────────────────────────
  // Prefix: add-purchase, /[id] detail, etc. (longer paths below override)
  '/admin/purchases':                 { menu: 'Purchases', childMenu: 'Purchases' },
  '/admin/purchases/purchases':        { menu: 'Purchases', childMenu: 'Purchases' },
  '/admin/purchases/purchase-return':  { menu: 'Purchases', childMenu: 'Purchase Return' },
  '/admin/purchases/purchase-product': { menu: 'Purchases', childMenu: 'Purchase Product' },

  // ─── Contacts ─────────────────────────────────────────────────────────────
  '/admin/contacts/customers':    { menu: 'Contacts', childMenu: 'Customers' },
  '/admin/contacts/retailer':     { menu: 'Contacts', childMenu: 'Retailers' },
  '/admin/contacts/retailer/[id]': { menu: 'Contacts', childMenu: 'Retailers' },
  '/admin/contacts/suppliers':    { menu: 'Contacts', childMenu: 'Suppliers' },

  // ─── Promo ────────────────────────────────────────────────────────────────
  '/admin/promo/coupons':    { menu: 'Promo', childMenu: 'Coupons' },
  '/admin/promo/gift-cards': { menu: 'Promo', childMenu: 'Gift Cards' },

  // ─── Finance & Accounts ───────────────────────────────────────────────────
  '/admin/finance-accounts/financial-overview':   { menu: 'Finance & Accounts', childMenu: 'Financial Overview' },
  '/admin/finance-accounts/expenses':             { menu: 'Finance & Accounts', childMenu: 'Expenses' },
  '/admin/finance-accounts/expenses/category':    { menu: 'Finance & Accounts', childMenu: 'Expense Categories' },
  '/admin/finance-accounts/income':               { menu: 'Finance & Accounts', childMenu: 'Income' },
  '/admin/finance-accounts/income/category':      { menu: 'Finance & Accounts', childMenu: 'Income Categories' },
  '/admin/finance-accounts/accounts-list':        { menu: 'Finance & Accounts', childMenu: 'Accounts List' },
  '/admin/finance-accounts/transactions-list':    { menu: 'Finance & Accounts', childMenu: 'Transactions List' },
  '/admin/finance-accounts/product-transactions': { menu: 'Finance & Accounts', childMenu: 'Product Transactions' },
  '/admin/finance-accounts/balance-sheet':        { menu: 'Finance & Accounts', childMenu: 'Balance Sheet' },
  '/admin/finance-accounts/trial-balance':        { menu: 'Finance & Accounts', childMenu: 'Trial Balance' },
  '/admin/finance-accounts/cash-flow':            { menu: 'Finance & Accounts', childMenu: 'Cash Flow' },
  '/admin/finance-accounts/cash-deposit':         { menu: 'Finance & Accounts', childMenu: 'Cash Deposit' },
  '/admin/finance-accounts/account-statement':    { menu: 'Finance & Accounts', childMenu: 'Account Statement' },
  '/admin/finance-accounts/profit-withdrawal':    { menu: 'Finance & Accounts', childMenu: 'Profit Withdrawal' },

  // ─── Branch Management ────────────────────────────────────────────────────
  '/admin/branch-management/branches': { menu: 'Branch Management', childMenu: 'All Branches' },

  // ─── Orders ───────────────────────────────────────────────────────────────
  '/admin/orders': { menu: 'Orders', childMenu: 'Orders' },

  // ─── Customer Management ──────────────────────────────────────────────────
  '/admin/customer-management': { menu: 'Customer Management', childMenu: 'Customer Management' },

  // ─── SMS Marketing ────────────────────────────────────────────────────────
  '/admin/sms-marketing/overview':       { menu: 'SMS Marketing', childMenu: 'SMS Overview' },
  '/admin/sms-marketing/quick-send':     { menu: 'SMS Marketing', childMenu: 'Quick Send' },
  '/admin/sms-marketing/packages':       { menu: 'SMS Marketing', childMenu: 'SMS Package' },
  '/admin/sms-marketing/history':        { menu: 'SMS Marketing', childMenu: 'SMS History' },
  '/admin/sms-marketing/templates':      { menu: 'SMS Marketing', childMenu: 'SMS Templates' },
  '/admin/sms-marketing/configuration':  { menu: 'SMS Marketing', childMenu: 'SMS Configuration' },

  // ─── Reports ──────────────────────────────────────────────────────────────
  '/admin/reports/sales-report':                              { menu: 'Reports', childMenu: 'Sales Report' },
  '/admin/reports/sales-report/sales-report':                 { menu: 'Reports', childMenu: 'Sales Report' },
  '/admin/reports/sales-report/best-selling':                 { menu: 'Reports', childMenu: 'Best Selling Report' },
  '/admin/reports/purchase-report':                           { menu: 'Reports', childMenu: 'Purchase Report' },
  '/admin/reports/stock-report':                              { menu: 'Reports', childMenu: 'Stock Report' },
  '/admin/reports/supplier-report':                           { menu: 'Reports', childMenu: 'Supplier Report' },
  '/admin/reports/supplier-report/supplier-report':           { menu: 'Reports', childMenu: 'Supplier Report' },
  '/admin/reports/supplier-report/supplier-due-report':       { menu: 'Reports', childMenu: 'Supplier Due Report' },
  '/admin/reports/customer-report':                           { menu: 'Reports', childMenu: 'Customer Report' },
  '/admin/reports/customer-report/customer-report':           { menu: 'Reports', childMenu: 'Customer Report' },
  '/admin/reports/customer-report/customer-due-report':       { menu: 'Reports', childMenu: 'Customer Due Report' },
  '/admin/reports/product-report':                            { menu: 'Reports', childMenu: 'Product Report' },
  '/admin/reports/product-report/product-report':             { menu: 'Reports', childMenu: 'Product Report' },
  '/admin/reports/product-report/product-expiry-report':      { menu: 'Reports', childMenu: 'Product Expiry Report' },
  '/admin/reports/product-report/product-quantity-report':    { menu: 'Reports', childMenu: 'Product Quantity Report' },
  '/admin/reports/expense-report':                            { menu: 'Reports', childMenu: 'Expense Report' },
  '/admin/reports/income-report':                             { menu: 'Reports', childMenu: 'Income Report' },
  '/admin/reports/profit-loss':                               { menu: 'Reports', childMenu: 'Profit & Loss Report' },
  '/admin/reports/business-overview':                         { menu: 'Reports', childMenu: 'Business Overview' },

  // ─── Recycle Bin ──────────────────────────────────────────────────────────
  '/admin/recycle-bin/trash/archived-products':   { menu: 'Recycle Bin', childMenu: 'Archived Products' },
  '/admin/recycle-bin/trash/archived-stores':     { menu: 'Recycle Bin', childMenu: 'Archived Stores' },
  '/admin/recycle-bin/trash/archived-warehouses': { menu: 'Recycle Bin', childMenu: 'Archived Warehouses' },

  // ─── Settings ─────────────────────────────────────────────────────────────
  '/admin/settings/financial-settings/tax-rates':        { menu: 'Settings', childMenu: 'Tax Rates' },
  '/admin/settings/promotional/reward-points':           { menu: 'Settings', childMenu: 'Reward Points' },
  '/admin/settings/promotional/vip-membership':          { menu: 'Settings', childMenu: 'VIP Membership' },
  '/admin/settings/promotional-settings/reward-points':  { menu: 'Settings', childMenu: 'Reward Points' },
  '/admin/settings/promotional-settings/vip-membership': { menu: 'Settings', childMenu: 'VIP Membership' },
  '/admin/settings/t&c_setting':                         { menu: 'Settings', childMenu: 'Terms & Conditions' },
  '/admin/settings/brand-logo':                          { menu: 'Settings', childMenu: 'Brand Logo' },

  // ─── Review Management ────────────────────────────────────────────────────
  '/admin/review-management': { menu: 'Review Management', childMenu: 'Review Management' },

  // ─── HRM ──────────────────────────────────────────────────────────────────
  '/admin/hrm/performance':                   { menu: 'HRM', childMenu: 'Performance' },
  '/admin/hrm/employee-management':           { menu: 'HRM', childMenu: 'Employee Management' },
  '/admin/hrm/attendance/daily-log':          { menu: 'HRM', childMenu: 'Daily Log' },
  '/admin/hrm/attendance/summary':            { menu: 'HRM', childMenu: 'Attendance Summary' },
  '/admin/hrm/attendance/attendance-setting': { menu: 'HRM', childMenu: 'Attendance Setting' },
  '/admin/hrm/shifts':                        { menu: 'HRM', childMenu: 'Shifts' },
  '/admin/hrm/leaves/leaves':                 { menu: 'HRM', childMenu: 'Leave Requests' },
  '/admin/hrm/leaves/leave-types':            { menu: 'HRM', childMenu: 'Leave Types' },
  '/admin/hrm/holiday':                       { menu: 'HRM', childMenu: 'Holiday' },
  '/admin/hrm/payroll/salary-sheet':          { menu: 'HRM', childMenu: 'Salary Sheet' },
  '/admin/hrm/payroll/employee-salary':       { menu: 'HRM', childMenu: 'Employee Salary' },
  '/admin/hrm/payroll/advance-salary':        { menu: 'HRM', childMenu: 'Advance Salary' },
  '/admin/hrm/payroll/salary-settings':       { menu: 'HRM', childMenu: 'Salary Settings' },
  '/admin/hrm/designation-management':        { menu: 'HRM', childMenu: 'Designation Management' },
  '/admin/hrm/department-management':         { menu: 'HRM', childMenu: 'Department Management' },
  '/admin/hrm/role-permission':               { menu: 'HRM', childMenu: 'Role & Permission' },

  // ─── Profile ──────────────────────────────────────────────────────────────
  '/admin/profile': { menu: 'Profile', childMenu: 'Profile' },

  // ─── Ask Me (AI assistant, read-only) ─────────────────────────────────────
  '/admin/ask-me': { menu: 'Ask Me', childMenu: 'Ask Me' },

  // ─── E-commerce ─────────────────────────────────────────────────────────────
  '/admin/ecommerce/online-orders':     { menu: 'E-commerce', childMenu: 'Online Orders' },
  '/admin/ecommerce/store-settings':  { menu: 'E-commerce', childMenu: 'Store Settings' },
  '/admin/ecommerce/store-domain':    { menu: 'E-commerce', childMenu: 'Store Domain' },
  '/admin/ecommerce/theme-store':     { menu: 'E-commerce', childMenu: 'Theme Store' },
  '/admin/ecommerce/themes':          { menu: 'E-commerce', childMenu: 'Themes' },
  '/admin/ecommerce/payment-gateway': { menu: 'E-commerce', childMenu: 'Payment Gateway' },
  '/admin/ecommerce/seo-marketing':   { menu: 'E-commerce', childMenu: 'SEO & Marketing' },
  '/admin/ecommerce/subscription':    { menu: 'E-commerce', childMenu: 'Subscription' },
};

/**
 * Get the permission requirement for a given route pathname.
 * Supports dynamic routes by matching the longest prefix.
 */
export const getRoutePermission = (pathname: string): RoutePermission | null => {
  if (ROUTE_PERMISSION_MAP[pathname]) {
    return ROUTE_PERMISSION_MAP[pathname];
  }

  const matchingRoutes = Object.keys(ROUTE_PERMISSION_MAP)
    .filter(route => pathname.startsWith(route + '/') || pathname === route)
    .sort((a, b) => b.length - a.length);

  const matchedRoute = matchingRoutes[0];
  if (matchedRoute) {
    return ROUTE_PERMISSION_MAP[matchedRoute];
  }

  return null;
};

/**
 * Check if user can access a route
 */
export const canAccessRoute = (
  pathname: string,
  permissions: Array<{ module: string; childMenu: string; type: string; granted: boolean }>,
  isAdmin: boolean
): boolean => {
  if (isAdmin) return true;

  if (pathname === '/admin/dashboard' || pathname === '/admin/dashboard/employee') {
    return true;
  }

  // Account profile + billing / verification / security / activity — always for logged-in users
  if (pathname === '/admin/profile' || pathname.startsWith('/admin/profile/')) {
    return true;
  }

  // New purchase: allow view on either "Purchases" or "Purchase Product" (dashboard links here as purchase-product)
  if (pathname === '/admin/purchases/add-purchase' || pathname.startsWith('/admin/purchases/add-purchase/')) {
    return permissions.some(
      (perm) =>
        perm.module === 'Purchases' &&
        (perm.childMenu === 'Purchases' || perm.childMenu === 'Purchase Product') &&
        perm.type === 'view' &&
        perm.granted,
    );
  }

  // Purchase detail: /admin/purchases/[id] — same OR as list API + purchase-product flow (not reserved subroutes)
  const purchaseDetailMatch = pathname.match(/^\/admin\/purchases\/([^/]+)$/);
  if (purchaseDetailMatch) {
    const seg = purchaseDetailMatch[1];
    const reserved = new Set(['purchases', 'add-purchase', 'purchase-product', 'purchase-return']);
    if (!reserved.has(seg)) {
      return permissions.some(
        (perm) =>
          perm.module === 'Purchases' &&
          (perm.childMenu === 'Purchases' ||
            perm.childMenu === 'Purchase Product' ||
            perm.childMenu === 'Purchase Return') &&
          perm.type === 'view' &&
          perm.granted,
      );
    }
  }

  const routePermission = getRoutePermission(pathname);

  if (!routePermission) {
    console.warn(`⚠️ Route not in permission map: ${pathname}`);
    return false;
  }

  const { menu, childMenu } = routePermission;

  return permissions.some(perm =>
    perm.module === menu &&
    perm.childMenu === childMenu &&
    perm.type === 'view' &&
    perm.granted
  );
};
