// Employee Management Types

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  joiningDate: string;
  designation: string;
  department: {
    id: string;
    name: string;
    description?: string;
    headOfDepartment?: string;
    budget?: number;
    status: string;
    employeeCount: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  /** Tenant-scoped department (matches seller-departments dropdown) */
  sellerDepartmentId?: string | null;
  sellerDepartment?: {
    id: string;
    name: string;
    status?: string;
  } | null;
  salary: number;
  status: 'active' | 'inactive';
  profilePhoto?: string;
  permanentAddress?: string;
  /** API may return `{ id, name }` from Prisma include */
  role?: string | { id: string; name: string };
  shift?: { id: string; shiftName: string } | null;
  branchAccess?: Array<{
    id: string;
    branchId: string;
    branch: {
      id: string;
      name: string;
      storeType?: string;
    };
  }>;
  canAccessAllBranches?: boolean;
  allowedShops?: string | string[];
  allowedWarehouses?: string | string[];
  allowedShopsForStockTransfer?: string | string[];
  canAccessAllShops?: boolean;
  canAccessAllWarehouses?: boolean;
  canAccessAllShopsForStockTransfer?: boolean;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    branchName?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
  };
  /** From API include (Prisma) — used for edit form */
  roleId?: string;
  details?: {
    address?: string | null;
    dateOfBirth?: string | Date | null;
    gender?: string | null;
    bloodGroup?: string | null;
    emergencyContactName?: string | null;
    emergencyContactRelationship?: string | null;
    emergencyContactPhone?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    branchName?: string | null;
  };
  documents?: {
    aadhar?: string;
    pan?: string;
    passport?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  // Step 1: Personal Information
  employeeId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  /** New file to upload, existing URL string, or null if none / removed */
  profilePhoto?: File | string | null | undefined;
  /** Edit mode: user clicked remove on existing photo */
  photoRemoved?: boolean;
  
  // Step 2: Login Access
  loginPhone: string;
  password: string;
  email: string;
  showPassword: boolean;
  
  // Step 3: Contact Information
  presentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Step 4: Access & Control
  department: string;
  role: string;
  designation: string;
  shiftId: string;
  allowedBranches: string[]; // Array of branch IDs
  canAccessAllBranches: boolean;
  
  // Step 5: Other Information
  joiningDate: string;
  basicSalary: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  status: 'active' | 'inactive';
}

export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  newThisMonth: number;
  averageSalary: number;
}

export interface EmployeeFilters {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  departmentFilter: string;
}

export interface EmployeeModalState {
  showViewModal: boolean;
  showFormModal: boolean;
  editingEmployee: Employee | null;
  viewingEmployee: Employee | null;
}

// Form step configuration
export interface FormStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export const FORM_STEPS: FormStep[] = [
  {
    number: 1,
    title: 'Personal Information',
    description: "Add employee's basic details such as name, contact, and date of birth.",
    icon: 'user'
  },
  {
    number: 2,
    title: 'Login Access',
    description: 'Set up username, password, and login credentials for system access.',
    icon: 'key'
  },
  {
    number: 3,
    title: 'Contact Information',
    description: 'Enter contact-related details.',
    icon: 'phone'
  },
  {
    number: 4,
    title: 'Access & Control',
    description: 'Manage your Safe Representatives.',
    icon: 'shield'
  },
  {
    number: 5,
    title: 'Other Information',
    description: 'Provide additional details such as emergency contact or notes.',
    icon: 'folder'
  }
];

// Options for form fields
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const RELATIONSHIP_OPTIONS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

// Shifts are now fetched from the database dynamically via API

