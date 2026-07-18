export interface Product {
  id: string;
  name: string;
  description?: string;
  specifications?: string;
  productType: 'single' | 'variable';
  branchId: string;
  sellerCategoryId?: string;
  sellerSubcategoryId?: string;
  sellerBrandId?: string;
  sellerUnitId?: string;
  sku?: string;
  hasSerialNumber: boolean;
  images?: string[];
  status?: string;
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  attributes: VariantAttribute[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantAttribute {
  id: string;
  attributeId: string;
  attributeValueId: string;
  attribute?: ProductAttribute;
  attributeValue?: ProductAttributeValue;
}

export interface ProductAttribute {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  isRequired: boolean;
  status: string;
  tenantId: string;
  branchId?: string;
  values?: ProductAttributeValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeValue {
  id: string;
  attributeId: string;
  value: string;
  displayName?: string;
  order: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  // Basic Information
  name: string;
  description: string;
  specifications: string;
  productType: 'single' | 'variable';
  branchId: string;
  categoryId: string; // This will be sellerCategoryId
  subcategoryId: string; // This will be sellerSubcategoryId
  brandId: string; // This will be sellerBrandId
  unitId: string;
  taxRateId: string;
  sku: string;
  hasSerialNumber: boolean;
  
  // Images
  images: string[];

  // Temporary uploads (not yet persisted to backend)
  // We keep blob urls for preview, and actual File objects for upload-on-save.
  pendingImages?: Array<{ tempUrl: string; file: File }>;
  
  // Variants (for variable products)
  variants: ProductVariantFormData[];
}

export interface ProductVariantFormData {
  id?: string;
  name: string;
  sku: string;
  attributes: VariantAttributeFormData[];
  images: string[];

  // Temporary variant image upload (not yet persisted to backend)
  pendingImage?: { tempUrl: string; file: File } | null;
}

export interface VariantAttributeFormData {
  attributeId: string;
  attributeValueId: string;
  image?: string; // Image URL for this specific attribute value
}

export interface SellerCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: string;
  slug: string;
  order: number;
  tenantId: string;
  branchId: string;
  storeTypeId?: string;
  createdAt: Date;
  updatedAt: Date;
  subcategories?: SellerSubcategory[];
}

export interface SellerSubcategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  status: string;
  slug: string;
  order: number;
  categoryId: string;
  tenantId: string;
  branchId: string;
  storeTypeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerUnit {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  type: string;
  baseUnit?: string;
  conversionFactor?: number;
  status: string;
  storeTypeId?: string;
  tenantId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerBrand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  status: string;
  storeTypeId?: string;
  tenantId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string;
}

export interface Branch {
  id: string;
  name: string;
}

export const PRODUCT_TYPES = [
  { value: 'single', label: 'Single Product' },
  { value: 'variable', label: 'Variable Product' }
] as const;

export const SERIAL_NUMBER_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
] as const;
