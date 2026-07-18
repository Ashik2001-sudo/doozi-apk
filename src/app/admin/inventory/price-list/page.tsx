import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  CheckCircle,
  ChevronDown,
  DollarSign,
  Package,
  Pencil,
  Search,
  SlidersHorizontal,
  Tag,
  X,
  XCircle,
} from 'lucide-react-native';
import { useBranches } from '@/hooks/branch/useBranches';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { ProductImage } from '@/components/ui/product-image';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

type Option = { id: string; name: string };
type StockStatus = '' | 'in_stock' | 'out_of_stock' | 'low_stock';
type PriceListRow = {
  id: string;
  productId: string;
  variantId: string;
  priceId: string | null;
  productName: string;
  productType: string;
  productImage: string;
  categoryId: string | null;
  brandId: string | null;
  variantDisplay: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  purchasePrice: number;
  sellingPrice: number;
  branchId: string;
};
type PriceStats = {
  totalItems: number;
  totalProducts: number;
  totalPurchaseValue: number;
  totalSellingValue: number;
};

const PAGE_SIZE = 15;
const EMPTY_STATS: PriceStats = {
  totalItems: 0,
  totalProducts: 0,
  totalPurchaseValue: 0,
  totalSellingValue: 0,
};

function money(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function normalizeList(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== 'object') return {};
  const raw = json as Record<string, unknown>;
  if (raw.success && raw.data && typeof raw.data === 'object') {
    return raw.data as Record<string, unknown>;
  }
  return raw;
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

export default function PriceListPage() {
  const { branches, userAccessibleBranches, selectedBranchId } = useBranches();
  const branchList = userAccessibleBranches.length > 0 ? userAccessibleBranches : branches;
  const [branchId, setBranchId] = useState(selectedBranchId || '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('');
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [rows, setRows] = useState<PriceListRow[]>([]);
  const [stats, setStats] = useState<PriceStats>(EMPTY_STATS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PriceListRow | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [saving, setSaving] = useState(false);
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

  const appendQuery = useCallback(
    (params: URLSearchParams, targetPage: number, limit = PAGE_SIZE) => {
      if (branchId) params.set('branchId', branchId);
      else if (branchList.length) params.set('branchIds', branchList.map((b) => b.id).join(','));
      params.set('page', String(targetPage));
      params.set('limit', String(limit));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (categoryId) params.set('categoryId', categoryId);
      if (subcategoryId) params.set('subcategoryId', subcategoryId);
      if (brandId) params.set('brandId', brandId);
      if (stockStatus) params.set('stockStatus', stockStatus);
    },
    [
      branchId,
      branchList,
      debouncedSearch,
      categoryId,
      subcategoryId,
      brandId,
      stockStatus,
    ],
  );

  const fetchRows = useCallback(
    async (targetPage = 1, append = false) => {
      if (!branchList.length) {
        setRows([]);
        setStats(EMPTY_STATS);
        return;
      }
      const seq = ++requestRef.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        appendQuery(params, targetPage);
        const res = await authorizedFetch(`${API_BASE_URL}/products/price-list?${params}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'Failed to load price list');
        }
        const data = normalizeList(await res.json());
        if (seq !== requestRef.current) return;
        const items = Array.isArray(data.items) ? data.items as PriceListRow[] : [];
        setRows((prev) => append ? [...prev, ...items] : items);
        setPage(Number(data.page ?? targetPage));
        setTotal(Number(data.total ?? items.length));
        setTotalPages(Math.max(1, Number(data.totalPages ?? 1)));
        const s = (data.stats ?? {}) as Record<string, unknown>;
        setStats({
          totalItems: Number(s.totalItems ?? data.total ?? 0),
          totalProducts: Number(s.totalProducts ?? 0),
          totalPurchaseValue: Number(s.totalPurchaseValue ?? 0),
          totalSellingValue: Number(s.totalSellingValue ?? 0),
        });
      } catch (err) {
        if (seq !== requestRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load price list');
        if (!append) setRows([]);
      } finally {
        if (seq === requestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [appendQuery, branchList.length],
  );

  useEffect(() => {
    setPage(1);
    void fetchRows(1, false);
  }, [fetchRows]);

  const filterCount = [categoryId, subcategoryId, brandId, stockStatus].filter(Boolean).length;
  const hasMore = page < totalPages;

  const savePrice = async () => {
    if (!editingRow?.priceId) {
      Alert.alert('Unavailable', 'This variant has no editable price record.');
      return;
    }
    const nextPrice = Number(priceInput.replace(/,/g, ''));
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      Alert.alert('Invalid price', 'Enter a valid selling price (0 or more).');
      return;
    }
    setSaving(true);
    try {
      const res = await authorizedFetch(
        `${API_BASE_URL}/product-prices/${editingRow.priceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellingPrice: nextPrice }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Failed to update selling price');
      setEditingRow(null);
      setPriceInput('');
      await fetchRows(1, false);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  const renderRow = ({ item }: { item: PriceListRow }) => {
    const isOut = item.stockQuantity === 0;
    const isLow =
      !isOut &&
      item.lowStockThreshold > 0 &&
      item.stockQuantity <= item.lowStockThreshold;
    const statusColor = isOut ? '#e11d48' : isLow ? '#d97706' : '#059669';
    const StatusIcon = isOut ? XCircle : isLow ? AlertCircle : CheckCircle;
    const statusLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock';
    return (
      <View style={[styles.productCard, shadows.soft, { borderLeftColor: statusColor }]}>
        <View style={styles.productHead}>
          <ProductImage src={item.productImage} size={62} borderRadius={14} iconSize={24} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
            {item.variantDisplay ? (
              <Text style={styles.variant} numberOfLines={1}>{item.variantDisplay}</Text>
            ) : null}
            <Text style={styles.sku} numberOfLines={1}>SKU: {item.sku || '—'}</Text>
          </View>
          {item.priceId ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditingRow(item);
                setPriceInput(String(item.sellingPrice));
              }}
            >
              <Pencil color={colors.accentPrimary} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.stockRow}>
          <View style={[styles.stockPill, { backgroundColor: `${statusColor}12`, borderColor: `${statusColor}45` }]}>
            <StatusIcon color={statusColor} size={14} />
            <Text style={[styles.stockText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.qty}>Qty: {item.stockQuantity}</Text>
          <Text style={styles.productType}>{item.productType || 'single'}</Text>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.purchaseBox}>
            <Text style={styles.priceLabel}>Purchase</Text>
            <Text style={styles.purchaseValue}>{money(item.purchasePrice)}</Text>
          </View>
          <View style={styles.sellingBox}>
            <Text style={[styles.priceLabel, { color: colors.accentPrimary }]}>Selling</Text>
            <Text style={styles.sellingValue}>{money(item.sellingPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={rows}
        keyExtractor={(item) => `${item.variantId}:${item.branchId}`}
        renderItem={renderRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && rows.length > 0}
            onRefresh={() => void fetchRows(1, false)}
            tintColor={colors.accentPrimary}
          />
        }
        onEndReached={() => {
          if (hasMore && !loadingMore && !loading) void fetchRows(page + 1, true);
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
              <View style={styles.heroIcon}><Tag color="#ffffff" size={25} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Price List</Text>
                <Text style={styles.heroSub}>View and edit purchase & selling prices</Text>
              </View>
            </LinearGradient>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.branchRow}
            >
              <TouchableOpacity
                style={[styles.branchChip, !branchId && styles.branchChipOn]}
                onPress={() => {
                  branchInitializedRef.current = true;
                  setBranchId('');
                }}
              >
                <Text style={[styles.branchText, !branchId && styles.branchTextOn]}>All branches</Text>
              </TouchableOpacity>
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
                    <Text style={[styles.branchText, active && styles.branchTextOn]}>{branch.name}</Text>
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
                placeholder="Search product, SKU, variant, IMEI…"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}><X color={colors.textMuted} size={17} /></TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
                <SlidersHorizontal color="#ffffff" size={17} />
                {filterCount ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{filterCount}</Text></View> : null}
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
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
                  <Text style={[styles.statusFilterText, stockStatus === value && styles.statusFilterTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle color={colors.statusError} size={18} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => void fetchRows(1, false)}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {loading && rows.length === 0 ? (
              <ActivityIndicator color={colors.accentPrimary} size="large" style={{ marginVertical: 44 }} />
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Package color={colors.textMuted} size={42} strokeWidth={1.3} />
              <Text style={styles.emptyTitle}>{branchList.length ? 'No products with prices found' : 'No branches available'}</Text>
              <Text style={styles.emptyText}>Try changing the branch, search or filters.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 18 }} />
          ) : rows.length ? (
            <View style={styles.footerInfo}>
              <Text style={styles.footerText}>Showing {rows.length} of {total}</Text>
            </View>
          ) : null
        }
      />

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setFiltersOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHead}>
              <View><Text style={styles.sheetTitle}>Filters</Text><Text style={styles.sheetSub}>Category, subcategory and brand</Text></View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setFiltersOpen(false)}><X color={colors.textPrimary} size={20} /></TouchableOpacity>
            </View>
            <FilterGroup
              title="Category"
              items={categories}
              value={categoryId}
              allLabel="All Categories"
              onChange={(id) => { setCategoryId(id); setSubcategoryId(''); }}
            />
            <FilterGroup
              title="Subcategory"
              items={subcategories}
              value={subcategoryId}
              allLabel={categoryId ? 'All Subcategories' : 'Select category first'}
              disabled={!categoryId}
              onChange={setSubcategoryId}
            />
            <FilterGroup title="Brand" items={brands} value={brandId} allLabel="All Brands" onChange={setBrandId} />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setCategoryId(''); setSubcategoryId(''); setBrandId(''); setStockStatus(''); }}
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

      <Modal visible={!!editingRow} transparent animationType="fade" onRequestClose={() => setEditingRow(null)}>
        <View style={styles.overlay}>
          <View style={[styles.editModal, shadows.soft]}>
            <View style={styles.editIcon}><DollarSign color={colors.accentPrimary} size={24} /></View>
            <Text style={styles.editTitle}>Edit Selling Price</Text>
            <Text style={styles.editSub} numberOfLines={2}>
              {editingRow?.productName} · {editingRow?.variantDisplay || editingRow?.sku}
            </Text>
            <TextInput
              style={styles.priceInput}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingRow(null)} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => void savePrice()} disabled={saving}>
                {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterOptions}>
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
            <Text style={[styles.optionText, value === item.id && styles.optionTextOn]}>{item.name}</Text>
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
  branchRow: { paddingHorizontal: spacing.sm, paddingVertical: 5, gap: 7 },
  branchChip: { height: 34, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 11, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.borderLight },
  branchChipOn: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  branchText: { color: colors.textMuted, fontWeight: '700', fontSize: 11 },
  branchTextOn: { color: '#ffffff' },
  searchRow: { marginHorizontal: spacing.sm, marginTop: 8, paddingLeft: 13, paddingRight: 5, minHeight: 50, borderRadius: 15, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: colors.borderLight },
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
  sku: { color: colors.accentPrimary, fontSize: 10, fontWeight: '700', marginTop: 5, fontFamily: 'monospace' },
  editBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.borderAccent },
  stockRow: { marginTop: 11, paddingVertical: 8, paddingHorizontal: 9, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgTertiary },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  stockText: { fontSize: 10, fontWeight: '800' },
  qty: { color: colors.accentPrimary, fontSize: 11, fontWeight: '800' },
  productType: { marginLeft: 'auto', color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  priceRow: { marginTop: 10, flexDirection: 'row', gap: 9 },
  purchaseBox: { flex: 1, padding: 10, borderRadius: 11, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: colors.borderLight },
  sellingBox: { flex: 1, padding: 10, borderRadius: 11, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.borderAccent },
  priceLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  purchaseValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 3 },
  sellingValue: { color: colors.accentPrimary, fontSize: 16, fontWeight: '900', marginTop: 2 },
  errorBox: { marginHorizontal: spacing.sm, marginBottom: 10, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, color: colors.statusError, fontSize: 12 },
  retryText: { color: colors.statusError, fontWeight: '800', fontSize: 12 },
  empty: { alignItems: 'center', padding: 42 },
  emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 12, textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  footerInfo: { paddingHorizontal: spacing.md, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  editModal: { margin: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: '#ffffff', alignItems: 'center' },
  editIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.borderAccent },
  editTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900', marginTop: 12 },
  editSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 5 },
  priceInput: { width: '100%', height: 50, marginTop: 18, paddingHorizontal: 14, borderRadius: 13, color: colors.textPrimary, fontSize: 17, fontWeight: '800', backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.borderLight },
  editActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight },
  cancelText: { color: colors.textPrimary, fontWeight: '700' },
  saveBtn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentPrimary },
  saveText: { color: '#ffffff', fontWeight: '800' },
});
