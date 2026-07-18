import { Category, CategoryFormData, SubCategory, SubCategoryFormData, GroupedCategory, GroupedSubCategory } from '@/types/category.types';

// Status options
export const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'order', label: 'Order' },
];

// Store types (you can fetch these from backend or define static ones)
export const STORE_TYPES = [
  { value: '', label: 'All Store Types' },
  { value: 'Super Shop', label: 'Super Shop' },
  { value: 'Electronics & Gadgets', label: 'Electronics & Gadgets' },
  { value: 'Fashion & Clothing', label: 'Fashion & Clothing' },
  { value: 'Hardware & Tools', label: 'Hardware & Tools' },
  { value: 'Gifts & Cosmetics', label: 'Gifts & Cosmetics' },
  { value: 'Automobile & Accessories', label: 'Automobile & Accessories' },
  { value: 'Footwear Store', label: 'Footwear Store' },
  { value: 'Furniture Store', label: 'Furniture Store' },
  { value: 'Grocery Store', label: 'Grocery Store' },
  { value: 'Pharmacy & Health', label: 'Pharmacy & Health' },
  { value: 'Books & Stationery', label: 'Books & Stationery' },
  { value: 'Sports & Fitness', label: 'Sports & Fitness' },
  { value: 'Jewelry & Accessories', label: 'Jewelry & Accessories' },
  { value: 'Pet Supplies', label: 'Pet Supplies' },
  { value: 'Home & Garden', label: 'Home & Garden' },
];

// Form validation
export const validateCategoryForm = (data: CategoryFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Category name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Category name must be less than 100 characters';
  }

  if (data.slug.trim()) {
    if (data.slug.length > 50) {
      errors.slug = 'Category slug must be less than 50 characters';
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    errors.imageUrl = 'Please enter a valid image URL';
  }

  if (data.order < 0) {
    errors.order = 'Order must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSubCategoryForm = (data: SubCategoryFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Subcategory name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Subcategory name must be less than 100 characters';
  }

  if (data.slug.trim()) {
    if (data.slug.length > 50) {
      errors.slug = 'Subcategory slug must be less than 50 characters';
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
  }

  if (!data.categoryId) {
    errors.categoryId = 'Parent category is required';
  }

  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    errors.imageUrl = 'Please enter a valid image URL';
  }

  if (data.order < 0) {
    errors.order = 'Order must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/** Accepts absolute URLs, server upload paths, and local preview URLs */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return true;
  if (url.startsWith('/uploads/') || url.startsWith('blob:') || url.startsWith('data:')) return true;
  return isValidUrl(url);
};

// Slug generation
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Format category data for form
export const formatCategoryForForm = (category: Category): CategoryFormData => {
  return {
    name: category.name,
    description: category.description || '',
    imageUrl: category.imageUrl || '',
    status: category.status,
    slug: category.slug,
    order: category.order,
    storeTypeIds: category.storeType ? [category.storeType.id] : [],
    branchId: category.branchId || '',
  };
};

export const formatSubCategoryForForm = (subCategory: SubCategory): SubCategoryFormData => {
  return {
    name: subCategory.name,
    description: subCategory.description || '',
    imageUrl: subCategory.imageUrl || '',
    status: subCategory.status,
    slug: subCategory.slug,
    order: subCategory.order,
    categoryId: subCategory.categoryId,
    branchId: subCategory.branchId || '',
    storeTypeId: subCategory.storeTypeId,
  };
};

// Format form data for API
export const formatCategoryFormForAPI = (data: CategoryFormData) => {
  return {
    name: data.name.trim(),
    description: data.description.trim() || undefined,
    imageUrl: data.imageUrl.trim() || undefined,
    status: data.status,
    slug: data.slug.trim() || generateSlug(data.name),
    order: data.order,
    storeType: data.storeTypeIds?.[0] || undefined,
  };
};

export const formatSubCategoryFormForAPI = (data: SubCategoryFormData) => {
  return {
    name: data.name.trim(),
    description: data.description.trim() || undefined,
    imageUrl: data.imageUrl.trim() || undefined,
    status: data.status,
    slug: data.slug.trim() || generateSlug(data.name),
    order: data.order,
    categoryId: data.categoryId,
  };
};

// Format date
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status badge class
export const getStatusBadgeClass = (status: string): string => {
  return status === 'active' ? 'status-active' : 'status-inactive';
};

// Get status text
export const getStatusText = (status: string): string => {
  return status === 'active' ? 'Active' : 'Inactive';
};

// Calculate category age
export const getCategoryAge = (createdAt: Date | string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

// Get store type display name
export const getStoreTypeDisplayName = (storeType: string | null | undefined): string => {
  if (!storeType) return 'All Store Types';
  const type = STORE_TYPES.find(t => t.value === storeType);
  return type?.label || storeType;
};

// Export CSV data
export const exportCategoriesToCSV = (categories: Category[]): string => {
  const headers = ['Name', 'Slug', 'Description', 'Status', 'Store Type', 'Order', 'Subcategories', 'Created At'];
  const rows = categories.map(category => [
    category.name,
    category.slug,
    category.description || '',
    category.status,
    category.storeType || '',
    category.order.toString(),
    category.subCategories?.length?.toString() || '0',
    formatDate(category.createdAt)
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string = 'categories.csv'): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Category icon based on name or store type
export const getCategoryIcon = (category: Category | GroupedCategory): string => {
  const name = category.name.toLowerCase();
  
  if (name.includes('electronics') || name.includes('gadget')) return '📱';
  if (name.includes('fashion') || name.includes('clothing')) return '👕';
  if (name.includes('food') || name.includes('grocery')) return '🛒';
  if (name.includes('book') || name.includes('stationery')) return '📚';
  if (name.includes('sports') || name.includes('fitness')) return '⚽';
  if (name.includes('beauty') || name.includes('cosmetic')) return '💄';
  if (name.includes('home') || name.includes('furniture')) return '🏠';
  if (name.includes('automobile') || name.includes('car')) return '🚗';
  if (name.includes('health') || name.includes('pharmacy')) return '💊';
  if (name.includes('garden') || name.includes('plant')) return '🌱';
  
  return '📦'; // Default icon
};

/**
 * Group categories by name (slug) - Professional approach
 * Same category name = একটা card, কিন্তু multiple branches দেখাবে
 */
export const groupCategoriesByName = (categories: Category[]): GroupedCategory[] => {
  const grouped = new Map<string, GroupedCategory>();

  categories.forEach((category) => {
    const key = category.slug.toLowerCase().trim(); // Use slug as unique identifier
    
    if (grouped.has(key)) {
      // Category already exists, add this branch to it
      const existingCategory = grouped.get(key)!;
      
      // Add branch if not already present
      const branchExists = existingCategory.branches.some(b => b.branchId === category.branchId);
      
      if (!branchExists) {
        existingCategory.branches.push({
          id: category.id,
          categoryId: category.id,
          branchName: category.branch?.name || 'Unknown Branch',
          branchId: category.branchId,
          storeType: category.branch?.storeType || category.storeType?.name || '',
          isActive: category.status === 'active',
          subCategoriesCount: category.subCategories?.length || 0,
        });
        
        // Merge subcategories
        if (category.subCategories) {
          existingCategory.subCategories = [
            ...(existingCategory.subCategories || []),
            ...category.subCategories
          ];
          existingCategory.totalSubCategories += category.subCategories.length;
        }
      }
      
      // Update latest timestamp
      if (new Date(category.updatedAt) > new Date(existingCategory.updatedAt)) {
        existingCategory.updatedAt = category.updatedAt;
      }
    } else {
      // New category, create entry
      grouped.set(key, {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        slug: category.slug,
        order: category.order,
        storeType: category.storeType,
        branches: [{
          id: category.id,
          categoryId: category.id,
          branchName: category.branch?.name || 'Unknown Branch',
          branchId: category.branchId,
          storeType: category.branch?.storeType || category.storeType?.name || '',
          isActive: category.status === 'active',
          subCategoriesCount: category.subCategories?.length || 0,
        }],
        totalSubCategories: category.subCategories?.length || 0,
        subCategories: category.subCategories || [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    }
  });

  // Convert map to array and sort by newest first (last added on top)
  return Array.from(grouped.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Get unique category names count
 */
export const getUniqueCategoryCount = (categories: Category[]): number => {
  const uniqueSlugs = new Set(categories.map(c => c.slug.toLowerCase().trim()));
  return uniqueSlugs.size;
};

/**
 * Get categories count by status (considering grouped categories)
 */
export const getGroupedCategoryStats = (groupedCategories: GroupedCategory[]) => {
  const total = groupedCategories.length;
  const active = groupedCategories.filter(c => 
    c.branches.some(branch => branch.isActive)
  ).length;
  const inactive = total - active;
  const withSubCategories = groupedCategories.filter(c => c.totalSubCategories > 0).length;
  
  return { total, active, inactive, withSubCategories };
};

/**
 * Filter grouped categories
 */
export const filterGroupedCategories = (
  groupedCategories: GroupedCategory[],
  searchTerm: string,
  filterStatus: string,
  filterBranchId: string
): GroupedCategory[] => {
  return groupedCategories.filter(category => {
    // Search filter
    const matchesSearch = 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      category.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const hasActiveStatus = category.branches.some(b => b.isActive);
    const matchesStatus = 
      !filterStatus ||
      filterStatus === 'all' ||
      (filterStatus === 'active' && hasActiveStatus) ||
      (filterStatus === 'inactive' && !hasActiveStatus);
    
    // Branch filter ('all' legacy | '' = same as Price List "All Branches")
    const matchesBranch =
      filterBranchId === 'all' ||
      filterBranchId === '' ||
      category.branches.some(b => b.branchId === filterBranchId);
    
    return matchesSearch && matchesStatus && matchesBranch;
  });
};

// ================== SUBCATEGORY GROUPING ==================

/**
 * Group subcategories by slug (same subcategory across different branches)
 */
export const groupSubCategoriesBySlug = (subCategories: SubCategory[]): GroupedSubCategory[] => {
  const grouped = new Map<string, GroupedSubCategory>();

  subCategories.forEach((subCategory) => {
    const key = subCategory.slug.toLowerCase().trim(); // Use slug as unique identifier
    
    if (grouped.has(key)) {
      // SubCategory already exists, add this branch to it
      const existingSubCategory = grouped.get(key)!;
      
      // Add branch if not already present
      const branchExists = existingSubCategory.branches.some(b => b.branchId === subCategory.branchId);
      
      if (!branchExists) {
        existingSubCategory.branches.push({
          id: subCategory.id,
          subCategoryId: subCategory.id,
          branchName: subCategory.branch?.name || 'Unknown Branch',
          branchId: subCategory.branchId,
          storeType: subCategory.branch?.storeType || subCategory.storeType?.name || '',
          isActive: subCategory.status === 'active',
          categoryId: subCategory.categoryId,
          categoryName: '',
        });
        if (!existingSubCategory.imageUrl && subCategory.imageUrl) {
          existingSubCategory.imageUrl = subCategory.imageUrl;
        }
      }
      
      if (new Date(subCategory.updatedAt) > new Date(existingSubCategory.updatedAt)) {
        existingSubCategory.updatedAt = subCategory.updatedAt;
        if (subCategory.imageUrl) {
          existingSubCategory.imageUrl = subCategory.imageUrl;
        }
      }
    } else {
      // New subcategory, create entry
      grouped.set(key, {
        name: subCategory.name,
        description: subCategory.description,
        imageUrl: subCategory.imageUrl,
        status: subCategory.status,
        slug: subCategory.slug,
        order: subCategory.order,
        categoryId: subCategory.categoryId,
        storeType: subCategory.storeType,
        branches: [{
          id: subCategory.id,
          subCategoryId: subCategory.id,
          branchName: subCategory.branch?.name || 'Unknown Branch',
          branchId: subCategory.branchId,
          storeType: subCategory.branch?.storeType || subCategory.storeType?.name || '',
          isActive: subCategory.status === 'active',
          categoryId: subCategory.categoryId,
          categoryName: '', // Will be filled if needed
        }],
        createdAt: subCategory.createdAt,
        updatedAt: subCategory.updatedAt,
      });
    }
  });

  // Convert map to array and sort by order, then name
  return Array.from(grouped.values()).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get unique subcategory count (excluding duplicates across branches)
 */
export const getUniqueSubCategoryCount = (subCategories: SubCategory[]): number => {
  const uniqueSlugs = new Set(subCategories.map(sc => sc.slug.toLowerCase().trim()));
  return uniqueSlugs.size;
};

/**
 * Filter grouped subcategories
 */
export const filterGroupedSubCategories = (
  groupedSubCategories: GroupedSubCategory[],
  searchTerm: string,
  filterStatus?: string,
  filterBranchId?: string
): GroupedSubCategory[] => {
  return groupedSubCategories.filter(subCategory => {
    // Search filter
    const matchesSearch = 
      !searchTerm ||
      subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subCategory.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter (check if ANY branch is active/inactive)
    const hasActiveStatus = subCategory.branches.some(b => b.isActive);
    const matchesStatus = 
      !filterStatus ||
      (filterStatus === 'active' && hasActiveStatus) ||
      (filterStatus === 'inactive' && !hasActiveStatus);
    
    // Branch filter
    const matchesBranch = 
      filterBranchId === 'all' ||
      subCategory.branches.some(b => b.branchId === filterBranchId);
    
    return matchesSearch && matchesStatus && matchesBranch;
  });
};
