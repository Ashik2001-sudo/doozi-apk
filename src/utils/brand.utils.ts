import { Brand, GroupedBrand } from '@/types/brand.types';

/**
 * Group brands by name - Professional approach
 * Same brand name = একটা card, কিন্তু multiple branches দেখাবে
 */
export const groupBrandsByName = (brands: Brand[]): GroupedBrand[] => {
  const grouped = new Map<string, GroupedBrand>();

  brands.forEach((brand) => {
    const key = brand.name.toLowerCase().trim();
    
    if (grouped.has(key)) {
      // Brand already exists, add this branch to it
      const existingBrand = grouped.get(key)!;
      
      // Add branch if not already present
      const branchExists = existingBrand.branches.some(b => b.branchId === brand.branchId);
      
      if (!branchExists) {
        existingBrand.branches.push({
          id: brand.id,
          brandId: brand.id,
          branchName: brand.branch?.name || 'Unknown Branch',
          branchId: brand.branchId,
          storeType: brand.branch?.storeType || brand.storeType?.name || '',
          isActive: brand.status === 'active',
        });
        if (!existingBrand.logoUrl && brand.logoUrl) {
          existingBrand.logoUrl = brand.logoUrl;
        }
        const brandOrder = brand.order ?? 0;
        if (brandOrder < (existingBrand.order ?? 0)) {
          existingBrand.order = brandOrder;
        }
      }
      
      if (new Date(brand.updatedAt) > new Date(existingBrand.updatedAt)) {
        existingBrand.updatedAt = brand.updatedAt;
        if (brand.logoUrl) existingBrand.logoUrl = brand.logoUrl;
      }
    } else {
      // New brand, create entry
      grouped.set(key, {
        name: brand.name,
        description: brand.description,
        logoUrl: brand.logoUrl,
        website: brand.website,
        status: brand.status,
        order: brand.order ?? 0,
        storeType: brand.storeType,
        branches: [{
          id: brand.id,
          brandId: brand.id,
          branchName: brand.branch?.name || 'Unknown Branch',
          branchId: brand.branchId,
          storeType: brand.branch?.storeType || brand.storeType?.name || '',
          isActive: brand.status === 'active',
        }],
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      });
    }
  });

  // Sort by display order (lower first), then name
  return Array.from(grouped.values()).sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
  );
};

/**
 * Get unique brand names count
 */
export const getUniqueBrandCount = (brands: Brand[]): number => {
  const uniqueNames = new Set(brands.map(b => b.name.toLowerCase().trim()));
  return uniqueNames.size;
};

/**
 * Get brands count by status (considering grouped brands)
 */
export const getGroupedBrandStats = (groupedBrands: GroupedBrand[]) => {
  const total = groupedBrands.length;
  const active = groupedBrands.filter(b => 
    b.branches.some(branch => branch.isActive)
  ).length;
  const inactive = total - active;
  
  return { total, active, inactive };
};

/**
 * Filter grouped brands
 */
export const filterGroupedBrands = (
  groupedBrands: GroupedBrand[],
  searchTerm: string,
  filterStatus: 'all' | 'active' | 'inactive',
  filterBranchId: string
): GroupedBrand[] => {
  return groupedBrands.filter(brand => {
    // Search filter
    const matchesSearch = 
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    // Status filter
    const hasActiveStatus = brand.branches.some(b => b.isActive);
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && hasActiveStatus) ||
      (filterStatus === 'inactive' && !hasActiveStatus);
    
    // Branch filter ('all' legacy | '' = same as Price List "All Branches")
    const matchesBranch =
      filterBranchId === 'all' ||
      filterBranchId === '' ||
      brand.branches.some((b) => b.branchId === filterBranchId);
    
    return matchesSearch && matchesStatus && matchesBranch;
  });
};

