export interface Customer {
  id: string;
  image?: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  advanceBalance?: number;
  totalDue?: number;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  };
  /** Optional employee info (who manages/created this customer) */
  employeeId?: string | null;
  employeeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  image?: string | File;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  branchId: string;
   /** Optional employee assignment (frontend only) */
  employeeId?: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface CustomerStats {
  totalCustomers: number;
  dueCustomers?: number;
  /** Sum of customer.totalDue (same scope as list / optional branch filter) */
  totalDueAmount?: number;
  activeCustomers?: number;
  newThisMonth?: number;
  vipCustomers?: number;
}

export interface CustomerFilters {
  searchTerm: string;
  branchId: string;
  city?: string;
}

