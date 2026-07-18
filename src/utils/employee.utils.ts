import { Employee, EmployeeFormData, EmployeeStats, GENDER_OPTIONS } from '@/types/employee.types';

/**
 * Calculate employee statistics
 */
export function getEmployeeStats(employees: Employee[]): EmployeeStats {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  
  // Calculate new employees this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = employees.filter(emp => {
    const joiningDate = new Date(emp.joiningDate);
    return joiningDate >= firstDayOfMonth;
  }).length;

  // Calculate average salary
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const averageSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;

  return {
    totalEmployees,
    activeEmployees,
    newThisMonth,
    averageSalary
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `৳${formatted}`;
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/** View/detail: Prisma `details.dateOfBirth` is often ISO string or Date */
export function formatEmployeeDetailDate(
  value: string | Date | null | undefined
): string {
  if (value == null || value === '') return '';
  const s = typeof value === 'string' ? value : value.toISOString();
  try {
    return formatDate(s);
  } catch {
    return '';
  }
}

/**
 * Filter employees based on search term, status, and department
 */
export function filterEmployees(
  employees: Employee[],
  searchTerm: string,
  statusFilter: 'all' | 'active' | 'inactive',
  departmentFilter: string
): Employee[] {
  return employees.filter(employee => {
    const matchesSearch = 
      employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.department?.name === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });
}

/**
 * Generate new employee ID
 */
export function generateEmployeeId(): string {
  return `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/** yyyy-mm-dd for <input type="date" /> */
function toDateInputValue(raw: string | Date | undefined | null): string {
  if (raw == null || raw === '') return '';
  const s = typeof raw === 'string' ? raw : raw.toISOString?.() ?? '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1] : '';
}

/**
 * Format employee data for form (when editing)
 */
export function formatEmployeeForForm(employee: Employee): EmployeeFormData {
  const e = employee as Employee & { profile_photo?: string };
  const details = employee.details;
  const dob =
    toDateInputValue(details?.dateOfBirth as string | undefined) ||
    toDateInputValue(employee.dateOfBirth);
  const genderRaw = (details?.gender ?? employee.gender) || '';
  const genderNorm = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : '';
  const gender = GENDER_OPTIONS.includes(genderNorm) ? genderNorm : genderRaw;
  const blood = (details?.bloodGroup ?? employee.bloodGroup) || '';
  const roleRel = (employee as Employee & { role?: { id: string } }).role;

  return {
    employeeId: employee.employeeId || '',
    fullName: employee.fullName || '',
    phone: employee.phone || '',
    dateOfBirth: dob,
    gender,
    bloodGroup: blood,
    profilePhoto: e.profilePhoto ?? e.profile_photo ?? null,
    photoRemoved: false,
    loginPhone: employee.phone || '',
    password: '',
    email: employee.email || '',
    showPassword: false,
    presentAddress: (details?.address ?? employee.address) || '',
    permanentAddress: employee.permanentAddress || '',
    emergencyContactName:
      details?.emergencyContactName ?? employee.emergencyContact?.name ?? '',
    emergencyContactRelationship:
      details?.emergencyContactRelationship ?? employee.emergencyContact?.relationship ?? '',
    emergencyContactPhone:
      details?.emergencyContactPhone ?? employee.emergencyContact?.phone ?? '',
    // Dropdown uses seller-department ids from /seller-departments
    department:
      employee.sellerDepartment?.id ||
      employee.sellerDepartmentId ||
      employee.department?.id ||
      '',
    role: String(employee.roleId || roleRel?.id || ''),
    designation: employee.designation || '',
    shiftId: employee.shift?.id || '',
    allowedBranches: employee.branchAccess?.map((ba) => ba.branchId) || [],
    canAccessAllBranches: employee.canAccessAllBranches || false,
    joiningDate: toDateInputValue(employee.joiningDate),
    basicSalary: employee.salary?.toString() || '',
    bankName: details?.bankName ?? employee.bankInfo?.bankName ?? '',
    accountNumber: details?.accountNumber ?? employee.bankInfo?.accountNumber ?? '',
    branchName: details?.branchName ?? employee.bankInfo?.branchName ?? '',
    status: employee.status || 'active',
  };
}

/**
 * Format form data for API submission
 */
export function formatEmployeeFormForAPI(formData: EmployeeFormData, isEdit: boolean = false) {
  // Build details object with only non-empty optional fields
  const details: Record<string, string> = {};
  
  if (formData.presentAddress) details.address = formData.presentAddress;
  if (formData.dateOfBirth) details.dateOfBirth = formData.dateOfBirth;
  if (formData.gender) details.gender = formData.gender.toLowerCase();
  if (formData.bloodGroup) details.bloodGroup = formData.bloodGroup;
  
  if (formData.emergencyContactName) details.emergencyContactName = formData.emergencyContactName;
  if (formData.emergencyContactRelationship) details.emergencyContactRelationship = formData.emergencyContactRelationship;
  if (formData.emergencyContactPhone) details.emergencyContactPhone = formData.emergencyContactPhone;
  
  if (formData.bankName) details.bankName = formData.bankName;
  if (formData.accountNumber) details.accountNumber = formData.accountNumber;
  if (formData.branchName) details.branchName = formData.branchName;

  // Build main request data with only required fields and non-empty optional fields
  const requestData: Record<string, string | number | boolean | string[] | Record<string, string> | null> = {};

  // Only add fields that are required or have values
  if (!isEdit || formData.fullName) requestData.fullName = formData.fullName;
  if (!isEdit || formData.phone) requestData.phone = formData.phone;
  if (!isEdit || formData.password) requestData.password = formData.password;
  if (!isEdit || formData.joiningDate) requestData.joiningDate = formData.joiningDate;
  if (!isEdit || formData.designation) requestData.designation = formData.designation;
  if (!isEdit || formData.basicSalary) requestData.salary = parseFloat(formData.basicSalary);
  if (!isEdit || formData.status) requestData.status = formData.status;

  // Add optional fields only if they have values
  if (formData.email && formData.email.trim()) {
    requestData.email = formData.email;
  }
  if (formData.department) {
    requestData.departmentName = formData.department;
  }
  
  // Add role field (IMPORTANT for permissions!)
  if (formData.role) {
    requestData.roleId = formData.role;
  }
  
  // Add shift field (include when editing to allow clearing)
  if (formData.shiftId || isEdit) {
    requestData.shiftId = formData.shiftId || null;
  }
  
  // Add branch access fields
  if (formData.allowedBranches && formData.allowedBranches.length > 0) {
    requestData.branchIds = formData.allowedBranches;
  }
  if (formData.canAccessAllBranches !== undefined) {
    requestData.canAccessAllBranches = formData.canAccessAllBranches;
  }
  
  if (Object.keys(details).length > 0) {
    requestData.details = details;
  }

  return requestData;
}

/**
 * Validate employee form by step
 */
export function validateEmployeeFormStep(
  step: number,
  formData: EmployeeFormData,
  isEdit: boolean = false
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  switch (step) {
    case 1:
      if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      break;
    case 2:
      if (!formData.loginPhone.trim()) errors.loginPhone = 'Phone for login is required';
      if (!isEdit && !formData.password.trim()) errors.password = 'Password is required';
      break;
    case 3:
      if (!formData.presentAddress.trim()) errors.presentAddress = 'Present address is required';
      break;
    case 4:
      if (!formData.department) errors.department = 'Department is required';
      if (!formData.designation) errors.designation = 'Designation is required';
      break;
    case 5:
      if (!formData.joiningDate) errors.joiningDate = 'Joining date is required';
      if (!formData.basicSalary.trim()) errors.basicSalary = 'Basic salary is required';
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate all steps of employee form
 */
export function validateAllEmployeeFormSteps(
  formData: EmployeeFormData,
  isEdit: boolean = false
): { isValid: boolean; errors: Record<string, string> } {
  const allErrors: Record<string, string> = {};

  // Step 1 validation
  if (!formData.fullName.trim()) allErrors.fullName = 'Full name is required';
  if (!formData.phone.trim()) allErrors.phone = 'Phone number is required';

  // Step 2 validation
  if (!formData.loginPhone.trim()) allErrors.loginPhone = 'Phone for login is required';
  if (!isEdit && !formData.password.trim()) allErrors.password = 'Password is required';

  // Step 3 validation
  if (!formData.presentAddress.trim()) allErrors.presentAddress = 'Present address is required';

  // Step 4 validation
  if (!formData.department) allErrors.department = 'Department is required';
  if (!formData.designation) allErrors.designation = 'Designation is required';

  // Step 5 validation
  if (!formData.joiningDate) allErrors.joiningDate = 'Joining date is required';
  if (!formData.basicSalary.trim()) allErrors.basicSalary = 'Basic salary is required';

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors
  };
}

/**
 * Get initial employee form data
 */
export function getInitialEmployeeFormData(): EmployeeFormData {
  return {
    employeeId: generateEmployeeId(),
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    profilePhoto: null,
    loginPhone: '',
    password: '',
    email: '',
    showPassword: false,
    presentAddress: '',
    permanentAddress: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    department: '',
    role: '',
    designation: '',
    shiftId: '',
    allowedBranches: [],
    canAccessAllBranches: false,
    joiningDate: '',
    basicSalary: '',
    bankName: '',
    accountNumber: '',
    branchName: '',
    status: 'active',
    photoRemoved: false,
  };
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status: 'active' | 'inactive'): string {
  return status === 'active' 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30';
}

/**
 * Sort employees by various criteria
 */
export function sortEmployees(
  employees: Employee[],
  sortBy: 'name' | 'date' | 'salary' | 'department',
  order: 'asc' | 'desc' = 'asc'
): Employee[] {
  const sorted = [...employees].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'date':
        comparison = new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime();
        break;
      case 'salary':
        comparison = a.salary - b.salary;
        break;
      case 'department':
        const deptA = a.department?.name || '';
        const deptB = b.department?.name || '';
        comparison = deptA.localeCompare(deptB);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

