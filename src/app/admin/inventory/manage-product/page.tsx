import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertCircle,
  Box,
  Layers,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useBranches } from '@/hooks/branch/useBranches';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { ProductImage } from '@/components/ui/product-image';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

type Option = { id: string; name: string };
type Tab = 'store' | 'draft';
type StockStatus = '' | 'in_stock' | 'out_of_stock' | 'low_stock';

type VariantAttr = { name?: string; value?: string };

type StoreRow = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productType: string;
  productImage: string;
  attributes: VariantAttr[];
  sku: string;
  quantity: number;
  quantityAlert: number;
  sellingPrice: number;
  discountType: string;
  discountValue: number;
  branchId: string;
};

type DraftRow = {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  image: string;
  attributes: string;
  attributeValues: string;
  sku: string;
  status: string;
};

type Stats = {
  totalQuantity: number;
  totalProducts: number;
  outOfStock: number;
};

const PAGE_SIZE = 15;
const EMPTY_STATS: Stats = { totalQuantity: 0, totalProducts: 0, outOfStock: 0 };

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function normalizeOptions(json: unknown): Option[] {
  const raw = json as any;
  const candidate = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data?.items)
          ? raw.data.items
          : [];
  if (!Array.isArray(candidate)) return [];
  const seen = new Set<string>();
  return candidate
    .map((item: any) => ({
      id: String(item?.id ?? ''),
      name: String(item?.name ?? item?.slug ?? 'Unknown'),
    }))
    .filter((item) => item.id && !seen.has(item.id) && seen.add(item.id));
}

/** Same as seller-admin productsFromListResponse: unwrap products array from list response. */
function productsFromListResponse(data: any): any[] {
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data?.products)) return data.data.products;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

/** Same as seller-admin: images can be array or JSON string. */
function firstImage(raw: unknown): string {
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') return raw[0];
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed[0];
        }
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  return '';
}

function resolveProductImage(product: any): string {
  return firstImage(product?.images) || firstImage(product?.variants?.[0]?.images);
}

export default function ManageProductPage() {
  const { branches, userAccessibleBranches, selectedBranchId } = useBranches();
  const branchList = userAccessibleBranches.length > 0 ? userAccessibleBranches : branches;

  const activeTab: Tab = 'store';
  const [branchId, setBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('');
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const requestRef = useRef(0);
  const branchInitializedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!branchInitializedRef.current && selectedBranchId) {
      branchInitializedRef.current = true;
      setBranchId(selectedBranchId);
    }
  }, [branchId, selectedBranchId]);

  useEffect(() => {
    void (async () => {
      try {
        const params = new URLSearchParams();
        if (branchId) params.set('branchId', branchId);
        const res = await authorizedFetch(`${API_BASE_URL}/seller-categories?${params}`);
        if (!res.ok) throw new Error();
        setCategories(normalizeOptions(await res.json()));
      } catch {
        setCategories([]);
      }
    })();
  }, [branchId]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/seller-brands`);
        if (!res.ok) throw new Error();
        setBrands(normalizeOptions(await res.json()));
      } catch {
        setBrands([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      setSubcategoryId('');
      return;
    }
    void (async () => {
      try {
        const res = await authorizedFetch(
          `${API_BASE_URL}/seller-categories/${categoryId}/subcategories`,
        );
        if (!res.ok) throw new Error();
        setSubcategories(normalizeOptions(await res.json()));
      } catch {
        setSubcategories([]);
      }
    })();
  }, [categoryId]);

  const appendBranchParams = useCallback(
    (params: URLSearchParams) => {
      if (branchId) params.set('branchId', branchId);
      else if (branchList.length) params.set('branchIds', branchList.map((b) => b.id).join(','));
    },
    [branchId, branchList],
  );

  /** Flatten products → variant rows, same logic as seller-admin store list. */
  const buildStoreRows = useCallback(
    (products: any[]): StoreRow[] => {
      const allowedIds = new Set(branchList.map((b) => b.id));
      const rows: StoreRow[] = [];
      for (const product of products) {
        if (product?.status !== 'active' || !Array.isArray(product.variants)) continue;
        const productImage = resolveProductImage(product);
        for (const variant of product.variants) {
          const vb: string | undefined = variant?.branchId;
          if (!vb) continue;
          if (branchId) {
            if (vb !== branchId) continue;
          } else if (allowedIds.size > 0 && !allowedIds.has(vb)) {
            continue;
          }
          const prices = Array.isArray(variant.prices) ? variant.prices : [];
          const variantPrice = prices.find((p: any) => p?.branchId === vb) ?? prices[0] ?? null;
          rows.push({
            id: String(variant.id),
            productId: String(product.id),
            variantId: String(variant.id),
            productName: product.name || '',
            productType: product.productType || '-',
            productImage: productImage || firstImage(variant.images),
            attributes: Array.isArray(variant.attributes) ? variant.attributes : [],
            sku: variant.sku || '',
            quantity: Number(variant.stockQuantity) || 0,
            quantityAlert: Number(variant.lowStockThreshold) || 0,
            sellingPrice: Number(variantPrice?.sellingPrice) || 0,
            discountType: variantPrice?.discountType || 'fixed',
            discountValue: Number(variantPrice?.discountValue) || 0,
            branchId: vb,
          });
        }
      }
      return rows;
    },
    [branchId, branchList],
  );

  const buildDraftRows = useCallback((products: any[]): DraftRow[] => {
    return products.map((product: any) => {
      const variants = Array.isArray(product.variants) && product.variants.length
        ? product.variants
        : [{ sku: '-', attributes: [] }];
      const first = variants[0];
      const attrs: VariantAttr[] = Array.isArray(first.attributes) ? first.attributes : [];
      const names = [...new Set(attrs.map((a) => (a?.name || '').trim()).filter(Boolean))];
      const values = attrs.map((a) => a?.value).filter(Boolean).join(', ');
      return {
        id: String(product.id),
        productId: String(product.id),
        productName: product.name || '',
        productType: product.productType || '-',
        image: resolveProductImage(product),
        attributes: product.productType === 'variable' && names.length ? names.join(', ') : '-',
        attributeValues: product.productType === 'variable' && values ? values : '-',
        sku: first.sku || '-',
        status: product.status || 'draft',
      };
    });
  }, []);

  const fetchList = useCallback(
    async (targetPage = 1, append = false) => {
      if (!branchList.length) {
        setStoreRows([]);
        setDraftRows([]);
        return;
      }
      const seq = ++requestRef.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(targetPage),
          status: activeTab === 'store' ? 'active' : 'draft',
        });
        appendBranchParams(params);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (categoryId) params.set('categoryId', categoryId);
        if (subcategoryId) params.set('subcategoryId', subcategoryId);
        if (brandId) params.set('brandId', brandId);

        const res = await authorizedFetch(`${API_BASE_URL}/products?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'Failed to fetch products');
        }
        const data = await res.json();
        if (seq !== requestRef.current) return;
        const products = productsFromListResponse(data);
        const pagination = data?.pagination || data?.data?.pagination || {};
        setPage(targetPage);
        setTotal(Number(pagination.total ?? products.length));
        setTotalPages(Math.max(1, Number(pagination.pages ?? 1)));
        if (activeTab === 'store') {
          const rows = buildStoreRows(products);
          setStoreRows((prev) => (append ? [...prev, ...rows] : rows));
        } else {
          const rows = buildDraftRows(products);
          setDraftRows((prev) => (append ? [...prev, ...rows] : rows));
        }
      } catch (err) {
        if (seq !== requestRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        if (!append) {
          setStoreRows([]);
          setDraftRows([]);
        }
      } finally {
        if (seq === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [
      activeTab,
      appendBranchParams,
      branchList.length,
      brandId,
      buildDraftRows,
      buildStoreRows,
      categoryId,
      debouncedSearch,
      subcategoryId,
    ],
  );

  useEffect(() => {
    setPage(1);
    void fetchList(1, false);
  }, [fetchList]);

  /** Stats – same endpoint as seller-admin (/products/manage-stats). */
  useEffect(() => {
    if (!branchList.length) {
      setStats(EMPTY_STATS);
      return;
    }
    void (async () => {
      try {
        const params = new URLSearchParams({
          status: activeTab === 'store' ? 'active' : 'draft',
        });
        appendBranchParams(params);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (categoryId) params.set('categoryId', categoryId);
        if (subcategoryId) params.set('subcategoryId', subcategoryId);
        if (brandId) params.set('brandId', brandId);
        if (stockStatus) params.set('stockStatus', stockStatus);

        const res = await authorizedFetch(`${API_BASE_URL}/products/manage-stats?${params}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data = json?.data && typeof json.data === 'object' ? json.data : json;
        setStats({
          totalQuantity: Number(data?.totalQuantity || 0),
          totalProducts: Number(data?.totalVariants ?? data?.totalProducts ?? 0),
          outOfStock: Number(data?.outOfStock || 0),
        });
      } catch {
        setStats(EMPTY_STATS);
      }
    })();
  }, [
    activeTab,
    appendBranchParams,
    branchList.length,
    brandId,
    categoryId,
    debouncedSearch,
    stockStatus,
    subcategoryId,
  ]);

  /** Client-side stock filter, same as seller-admin. */
  const visibleStoreRows = useMemo(() => {
    if (!stockStatus) return storeRows;
    return storeRows.filter((row) => {
      const qty = row.quantity || 0;
      if (stockStatus === 'in_stock') return qty > 0;
      if (stockStatus === 'out_of_stock') return qty === 0;
      return qty > 0 && row.quantityAlert > 0 && qty <= row.quantityAlert;
    });
  }, [storeRows, stockStatus]);

  const filterCount = [categoryId, subcategoryId, brandId, stockStatus].filter(Boolean).length;
  const hasMore = page < totalPages;
  const listData: Array<StoreRow | DraftRow> = activeTab === 'store' ? visibleStoreRows : draftRows;

  const renderStoreRow = (item: StoreRow) => {
    const qty = item.quantity || 0;
    const isOut = qty === 0;
    const isLow = qty > 0 && item.quantityAlert > 0 && qty <= item.quantityAlert;
    const statusColor = isOut ? '#e11d48' : isLow ? '#d97706' : '#059669';
    const discountLabel = item.discountValue
      ? item.discountType === 'percentage'
        ? `${item.discountValue}%`
        : money(item.discountValue)
      : '—';
    return (
      <View style={[styles.productCard, shadows.soft, { borderLeftColor: statusColor }]}>
        <View style={styles.productHead}>
          <ProductImage src={item.productImage} size={62} borderRadius={14} iconSize={24} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
            {item.attributes.length > 0 ? (
              <View style={styles.attrRow}>
                {item.attributes.map((attr, i) => (
                  <View key={`${item.id}-attr-${i}`} style={styles.attrChip}>
                    <Text style={styles.attrText}>{attr.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.sku} numberOfLines={1}>SKU: {item.sku || '—'}</Text>
          </View>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{item.productType}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Qty</Text>
            <Text style={[styles.metaValue, { color: statusColor }]}>{qty}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Price</Text>
            <Text style={[styles.metaValue, { color: colors.accentPrimary }]}>
              {money(item.sellingPrice)}
            </Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Discount</Text>
            <Text style={[styles.metaValue, { color: '#d97706' }]}>{discountLabel}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDraftRow = (item: DraftRow) => {
    const isActive = item.status === 'active';
    const statusColor = isActive ? '#059669' : '#d97706';
    return (
      <View style={[styles.productCard, shadows.soft, { borderLeftColor: statusColor }]}>
        <View style={styles.productHead}>
          <ProductImage src={item.image} size={62} borderRadius={14} iconSize={24} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
            {item.attributes !== '-' ? (
              <Text style={styles.variant} numberOfLines={1}>
                {item.attributes}: {item.attributeValues}
              </Text>
            ) : null}
            <Text style={styles.sku} numberOfLines={1}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.statusPill, { borderColor: `${statusColor}55` }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Type</Text>
            <Text style={[styles.metaValue, { textTransform: 'capitalize' }]}>{item.productType}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          activeTab === 'store' ? renderStoreRow(item as StoreRow) : renderDraftRow(item as DraftRow)
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && listData.length > 0}
            onRefresh={() => void fetchList(1, false)}
            tintColor={colors.accentPrimary}
          />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading) void fetchList(page + 1, true);
        }}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#312e81', '#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroIcon}><Package color="#ffffff" size={25} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Manage Products</Text>
                <Text style={styles.heroSub}>View and manage your products</Text>
              </View>
            </LinearGradient>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.accentPrimary }]} />
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {stats.totalProducts.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>{activeTab === 'store' ? 'Product' : 'Draft'}</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.statusSuccess }]} />
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {stats.totalQuantity.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Quantity</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: '#0891b2' }]} />
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {total.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Listed</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.statusError }]} />
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {stats.outOfStock.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Out</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.branchRow}
            >
              {activeTab === 'store' ? (
                <TouchableOpacity
                  style={[styles.branchChip, !branchId && styles.branchChipOn]}
                  onPress={() => {
                    branchInitializedRef.current = true;
                    setBranchId('');
                  }}
                >
                  <Text style={[styles.branchText, !branchId && styles.branchTextOn]}>
                    All branches
                  </Text>
                </TouchableOpacity>
              ) : null}
              {branchList.map((branch) => {
                const active = branch.id === branchId;
                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={[styles.branchChip, active && styles.branchChipOn]}
                    onPress={() => {
                      branchInitializedRef.current = true;
                      setBranchId(branch.id);
                    }}
                  >
                    <Text style={[styles.branchText, active && styles.branchTextOn]}>
                      {branch.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.searchRow, shadows.soft]}>
              <Search color={colors.accentPrimary} size={18} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search products, SKU, serial/IMEI…"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X color={colors.textMuted} size={17} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
                <SlidersHorizontal color="#ffffff" size={17} />
                {filterCount ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{filterCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            {activeTab === 'store' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusRow}
              >
                {([
                  ['', 'All Status'],
                  ['in_stock', 'In Stock'],
                  ['low_stock', 'Low Stock'],
                  ['out_of_stock', 'Out of Stock'],
                ] as Array<[StockStatus, string]>).map(([value, label]) => (
                  <TouchableOpacity
                    key={value || 'all'}
                    style={[styles.statusFilter, stockStatus === value && styles.statusFilterOn]}
                    onPress={() => setStockStatus(value)}
                  >
                    <Text
                      style={[
                        styles.statusFilterText,
                        stockStatus === value && styles.statusFilterTextOn,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ height: 10 }} />
            )}

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle color={colors.statusError} size={18} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => void fetchList(1, false)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {loading && listData.length === 0 ? (
              <ActivityIndicator
                color={colors.accentPrimary}
                size="large"
                style={{ marginVertical: 44 }}
              />
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              {activeTab === 'store' ? (
                <Box color={colors.textMuted} size={42} strokeWidth={1.3} />
              ) : (
                <Layers color={colors.textMuted} size={42} strokeWidth={1.3} />
              )}
              <Text style={styles.emptyTitle}>
                {activeTab === 'store' ? 'No store products found' : 'No draft products found'}
              </Text>
              <Text style={styles.emptyText}>Try changing the branch, search or filters.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 18 }} />
          ) : listData.length ? (
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>
                Showing {listData.length} of {total}
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHead}>
              <View>
                <Text style={styles.sheetTitle}>Filters</Text>
                <Text style={styles.sheetSub}>Category, subcategory and brand</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setFiltersOpen(false)}>
                <X color={colors.textPrimary} size={20} />
              </TouchableOpacity>
            </View>
            <FilterGroup
              title="Category"
              items={categories}
              value={categoryId}
              allLabel="All Categories"
              onChange={(id) => {
                setCategoryId(id);
                setSubcategoryId('');
              }}
            />
            <FilterGroup
              title="Subcategory"
              items={subcategories}
              value={subcategoryId}
              allLabel={categoryId ? 'All Subcategories' : 'Select category first'}
              disabled={!categoryId}
              onChange={setSubcategoryId}
            />
            <FilterGroup
              title="Brand"
              items={brands}
              value={brandId}
              allLabel="All Brands"
              onChange={setBrandId}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setCategoryId('');
                  setSubcategoryId('');
                  setBrandId('');
                  setStockStatus('');
                }}
              >
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setFiltersOpen(false)}>
                <Text style={styles.applyText}>Apply filters</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function FilterGroup({
  title,
  items,
  value,
  allLabel,
  disabled,
  onChange,
}: {
  title: string;
  items: Option[];
  value: string;
  allLabel: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <View style={[styles.filterGroup, disabled && { opacity: 0.45 }]}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterOptions}
      >
        <TouchableOpacity
          disabled={disabled}
          style={[styles.optionChip, !value && styles.optionChipOn]}
          onPress={() => onChange('')}
        >
          <Text style={[styles.optionText, !value && styles.optionTextOn]}>{allLabel}</Text>
        </TouchableOpacity>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            disabled={disabled}
            style={[styles.optionChip, value === item.id && styles.optionChipOn]}
            onPress={() => onChange(item.id)}
          >
            <Text style={[styles.optionText, value === item.id && styles.optionTextOn]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  listContent: { paddingBottom: 120 },
  hero: { margin: spacing.sm, borderRadius: radius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.sm, marginBottom: 4 },
  statCard: { flex: 1, borderRadius: radius.md, padding: 11, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.borderLight },
  statValue: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 7 },
  branchRow: { paddingHorizontal: spacing.sm, paddingVertical: 8, gap: 7 },
  branchChip: { height: 34, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 11, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.borderLight },
  branchChipOn: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  branchText: { color: colors.textMuted, fontWeight: '700', fontSize: 11 },
  branchTextOn: { color: '#ffffff' },
  searchRow: { marginHorizontal: spacing.sm, paddingLeft: 13, paddingRight: 5, minHeight: 50, borderRadius: 15, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.borderLight },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, paddingVertical: 10 },
  filterBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentPrimary },
  filterBadge: { position: 'absolute', right: -3, top: -4, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e11d48', borderWidth: 2, borderColor: '#ffffff' },
  filterBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '900' },
  statusRow: { paddingHorizontal: spacing.sm, paddingVertical: 10, gap: 7 },
  statusFilter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.borderLight },
  statusFilterOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentPrimary },
  statusFilterText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  statusFilterTextOn: { color: colors.accentPrimary },
  productCard: { marginHorizontal: spacing.sm, marginBottom: 10, padding: 13, backgroundColor: '#ffffff', borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4, borderColor: colors.borderLight },
  productHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  productInfo: { flex: 1, minWidth: 0 },
  productName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  variant: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  attrRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  attrChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderLight },
  attrText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  sku: { color: colors.accentPrimary, fontSize: 10, fontWeight: '700', marginTop: 5, fontFamily: 'monospace' },
  typeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.borderAccent },
  typeText: { color: colors.accentPrimary, fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, backgroundColor: '#f8fafc' },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  metaRow: { marginTop: 11, flexDirection: 'row', gap: 9 },
  metaBox: { flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 11, backgroundColor: colors.bgTertiary },
  metaLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  metaValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  errorBox: { marginHorizontal: spacing.sm, marginBottom: 10, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, color: colors.statusError, fontSize: 12 },
  retryText: { color: colors.statusError, fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', padding: 42 },
  emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  footerInfo: { paddingHorizontal: spacing.md, paddingVertical: 14, alignItems: 'center' },
  footerText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.58)' },
  sheet: { maxHeight: '82%', padding: spacing.md, paddingBottom: 28, backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  sheetSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  closeBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgTertiary },
  filterGroup: { marginBottom: 16 },
  filterTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  filterOptions: { gap: 7 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderLight },
  optionChipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accentPrimary },
  optionText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  optionTextOn: { color: colors.accentPrimary },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  clearBtn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  clearText: { color: colors.textPrimary, fontWeight: '700' },
  applyBtn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentPrimary },
  applyText: { color: '#ffffff', fontWeight: '800' },
});
