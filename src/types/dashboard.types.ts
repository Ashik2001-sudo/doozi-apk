// Dashboard Types and Interfaces

// User Types
export interface User {
  id?: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
}

// Tenant Types
export interface Subscription {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  isTrial: boolean;
  trialEndsAt?: string;
  price: number;
}

export interface Tenant {
  domain?: string;
  name?: string;
  company?: string;
  setupCompleted?: boolean;
  subscription?: Subscription;
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  isMainBranch: boolean;
  isActive: boolean;
}

// Stats Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  growthRate: number;
}

// Activity Types
export type ActivityColor = 'green' | 'blue' | 'yellow' | 'red';
export type ActivityType = 'order' | 'product' | 'customer' | 'alert';

export interface Activity {
  id: number;
  type: ActivityType;
  message: string;
  time: string;
  icon: string;
  color: ActivityColor;
}

// Quick Action Types
export type QuickActionColor = 'blue' | 'green' | 'purple' | 'yellow';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: QuickActionColor;
  description: string;
}

// Employee Types
export interface EmployeeDepartment {
  id: string;
  name: string;
}

export interface EmployeeData extends User {
  id: string;
  employeeId: string;
  designation: string;
  department?: EmployeeDepartment;
  joiningDate: string;
  shiftId?: string;
}

// Subscription Info Types
export interface SubscriptionInfo {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  planName: string;
  endDate: string;
}

// View Types
export type DashboardView = 
  | 'dashboard'
  // Inventory
  | 'add-product'
  | 'manage-product'
  | 'purchase-product'
  | 'stock-management'
  | 'brand-management'
  | 'category-management'
  | 'unit-management'
  | 'warranty-management'
  | 'wholesale-management'
  | 'retail-management'
  | 'low-stock'
  | 'expired-products'
  | 'variants-attributes'
  | 'print-barcode'
  | 'print-qr-code'
  // Stock
  | 'stock-overview'
  | 'stock-alerts'
  | 'stock-adjustment'
  | 'stock-reports'
  | 'stock-export'
  | 'stock-transfer'
  // Sales & POS
  | 'sales-history'
  | 'sales-return'
  | 'quotation'
  | 'pos'
  | 'services'
  // EMI Management
  | 'emi-settings'
  | 'emi-history'
  // Purchases
  | 'purchases'
  | 'purchase-return'
  // Contacts
  | 'customers'
  | 'suppliers'
  // SMS Marketing
  | 'sms-overview'
  | 'quick-send'
  | 'group-send'
  | 'group'
  | 'due-reminder'
  | 'emi-reminder'
  | 'sms-templates'
  | 'packages'
  | 'sms-history'
  | 'bulk-sms-sender'
  | 'whatsapp-sender'
  // Reports
  | 'sales-report'
  | 'best-selling'
  | 'purchase-report'
  | 'stock-report'
  | 'supplier-report'
  | 'supplier-due-report'
  | 'customer-report'
  | 'customer-due-report'
  | 'product-report'
  | 'product-expiry-report'
  | 'product-quantity-report'
  | 'expense-report'
  | 'income-report'
  | 'profit-loss-report'
  // Recycle Bin
  | 'trash'
  | 'archived-products'
  | 'archived-stores'
  | 'archived-warehouses'
  // Settings
  | 'financial-settings'
  | 'tax-rates'
  | 'promotional-settings'
  | 'reward-points'
  | 'vip-membership'
  // Promo
  | 'coupons'
  | 'gift-cards'
  // Finance & Accounts
  | 'financial-overview'
  | 'expenses'
  | 'expense-category'
  | 'income'
  | 'income-category'
  | 'accounts-list'
  | 'transactions-list'
  | 'balance-sheet'
  | 'trial-balance'
  | 'cash-flow'
  | 'account-statement'
  // HRM
  | 'designations'
  | 'shifts'
  | 'attendance'
  | 'daily-log'
  | 'summary'
  | 'leaves'
  | 'leave-types'
  | 'holiday'
  | 'payroll'
  | 'salary-sheet'
  | 'employee-salary'
  | 'advance-salary'
  | 'salary-settings'
  | 'employee-management'
  | 'performance'
  | 'department-management'
  | 'role-permission'
  // Branch Management
  | 'branch-management';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

