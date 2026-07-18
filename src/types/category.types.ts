// Category Types based on backend DTOs and models

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  slug?: string;
  order?: number;
  storeTypeId?: string;
  branchId: string; // Required: Branch selection
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  slug?: string;
  order?: number;
  storeTypeId?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  slug: string;
  order: number;
  storeTypeId?: string; // Store type ID (professional)
  branchId: string; // Branch this category belongs to
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  subCategories?: SubCategory[];
  branch?: { // Branch details from backend
    id: string;
    name: string;
    storeType: string;
  };
  storeType?: { // Store type details from backend
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  slug: string;
  order: number;
  categoryId: string;
  storeTypeId?: string; // Store type ID
  branchId: string; // Branch this subcategory belongs to
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  branch?: { // Branch details from backend
    id: string;
    name: string;
    storeType: string;
  };
  storeType?: { // Store type details from backend
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data: Category | Category[];
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesWithSubCategories: number;
}

export interface CategoryFormData {
  name: string;
  description: string;
  imageUrl: string;
  status: string;
  slug: string;
  order: number;
  storeTypeId?: string; // Store type ID (auto-filled from branch)
  branchId: string; // Single branch selection (required)
  storeTypeIds?: string[]; // Multiple store types (for compatibility)
  branchIds?: string[]; // Multiple branch selection (optional)
}

export interface CategoryFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CategoryModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  category?: Category;
}

export interface CategoryTableColumn {
  key: keyof Category;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, category: Category) => React.ReactNode;
}

// SubCategory Types
export interface CreateSubCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  slug?: string;
  order?: number;
  categoryId: string;
  branchId: string;
  storeTypeId?: string;
}

export interface UpdateSubCategoryDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  slug?: string;
  order?: number;
}

export interface SubCategoryFormData {
  name: string;
  description: string;
  imageUrl: string;
  status: string;
  slug: string;
  order: number;
  categoryId: string;
  branchId: string;
  storeTypeId?: string;
}

export interface SubCategoryModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  subCategory?: SubCategory;
  groupedSubCategory?: GroupedSubCategory;
  parentCategory?: Category;
  parentGroupedCategory?: GroupedCategory;
}

// Store Type Interface
export interface StoreType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isActive: boolean;
}

// Grouped Category - Professional approach for displaying categories across multiple branches
export interface GroupedCategory {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  slug: string;
  order: number;
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
  branches: Array<{
    id: string;
    categoryId: string; // Original category ID for this branch
    branchName: string;
    branchId: string;
    storeType: string;
    isActive: boolean;
    subCategoriesCount: number;
  }>;
  totalSubCategories: number;
  subCategories?: SubCategory[]; // All subcategories from all branches
  createdAt: Date;
  updatedAt: Date;
}

// Grouped SubCategory - Professional approach for displaying subcategories across multiple branches
export interface GroupedSubCategory {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  slug: string;
  order: number;
  categoryId: string;
  storeType?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
  branches: Array<{
    id: string;
    subCategoryId: string; // Original subcategory ID for this branch
    branchName: string;
    branchId: string;
    storeType: string;
    isActive: boolean;
    categoryId: string;
    categoryName: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
