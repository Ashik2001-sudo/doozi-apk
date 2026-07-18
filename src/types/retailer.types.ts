export interface Retailer {
  id: string;
  image?: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  advanceBalance?: number;
  totalDue?: number;
  totalPurchase?: number;
  totalPaid?: number;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  };
  employeeId?: string | null;
  employeeName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RetailerFormData {
  image?: string | File;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  branchId: string;
  employeeId?: string | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface RetailerStats {
  totalRetailers: number;
  activeRetailers?: number;
  dueRetailers?: number;
  /** Sum of (sell-out order due + retailer.totalDue) per retailer, same scope as stats */
  totalDueAmount?: number;
  newThisMonth?: number;
}

export interface RetailerFilters {
  searchTerm: string;
  branchId: string;
}
