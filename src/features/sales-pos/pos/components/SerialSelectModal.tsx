import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  Search,
  Cpu,
  Hash,
  Layers,
  ShoppingCart,
} from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/ui/product-image';
import {
  formatCurrency,
  getFinalSellingPrice,
  getVariantDisplayName,
} from '@/features/sales-pos/pos/utils/formatters';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { CartItem, POSProduct, POSProductVariant } from '../types/pos.types';

interface SerialRow {
  id: string;
  serialNumber: string;
  status?: string;
  batch?: { batchNumber?: string; batch_number?: string } | null;
}

interface SerialSelectModalProps {
  visible: boolean;
  product: POSProduct | null;
  variant: POSProductVariant | null;
  branchId: string | null;
  cart?: CartItem[];
  onClose: () => void;
  onConfirm: (
    serials: string[],
    batchNumber?: string,
    batchNumbers?: string[],
    serialBatchMap?: Record<string, string>,
  ) => void;
}

function SerialSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonCheck} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonLineShort} />
      </View>
    </View>
  );
}

export function SerialSelectModal({
  visible,
  product,
  variant,
  branchId,
  cart = [],
  onClose,
  onConfirm,
}: SerialSelectModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [serials, setSerials] = useState<SerialRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!visible || !product || !variant || !branchId) return;
    setSelected([]);
    setFilter('');
    void (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          productId: product.id,
          variantId: variant.id,
          branchId,
          status: 'in_stock',
        });
        const res = await authorizedFetch(`${API_BASE_URL}/product-serials?${params}`);
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setSerials(
          rows.map((s: any) => ({
            id: s.id,
            serialNumber: s.serialNumber,
            status: s.status,
            batch: s.batch || null,
          })),
        );
      } catch {
        setSerials([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, product, variant, branchId]);

  const inCartSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of cart) {
      for (const sn of item.serialNumbers || []) {
        const t = String(sn).trim().toLowerCase();
        if (t) set.add(t);
      }
    }
    return set;
  }, [cart]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return serials.filter((s) => {
      const key = s.serialNumber.trim().toLowerCase();
      if (inCartSet.has(key)) return false;
      if (!q) return true;
      return key.includes(q);
    });
  }, [serials, filter, inCartSet]);

  const sellingPrice = variant?.price?.sellingPrice ?? 0;
  const discountValue = variant?.price?.discountValue ?? 0;
  const discountType = variant?.price?.discountType;
  const finalPrice = getFinalSellingPrice(sellingPrice, discountType, discountValue);
  const rawImage = variant?.images?.[0] || product?.images?.[0];
  const variantName = getVariantDisplayName(variant?.attributes);
  const brandName = product?.sellerBrand?.name || product?.brand?.name;
  const availableCount = serials.filter(
    (s) => !inCartSet.has(s.serialNumber.trim().toLowerCase()),
  ).length;

  const toggle = (sn: string) => {
    setSelected((prev) => (prev.includes(sn) ? prev.filter((x) => x !== sn) : [...prev, sn]));
  };

  const selectAllFiltered = () => {
    const nums = filtered.map((s) => s.serialNumber);
    setSelected((prev) => {
      const merged = new Set([...prev, ...nums]);
      return Array.from(merged);
    });
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      Alert.alert('Select IMEI', 'Please select at least one IMEI/serial number');
      return;
    }
    const batchNumbers: string[] = [];
    const serialBatchMap: Record<string, string> = {};
    for (const sn of selected) {
      const row = serials.find((s) => s.serialNumber === sn);
      const batchNum = row?.batch?.batchNumber || row?.batch?.batch_number;
      if (batchNum?.trim()) {
        batchNumbers.push(batchNum.trim());
        serialBatchMap[sn] = batchNum.trim();
      }
    }
    onConfirm(
      selected,
      batchNumbers[0],
      batchNumbers.length ? batchNumbers : undefined,
      Object.keys(serialBatchMap).length ? serialBatchMap : undefined,
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <View style={styles.headerBadge}>
              <Cpu color="#fff" size={16} />
              <Text style={styles.headerBadgeText}>IMEI Select</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X color="#fff" size={20} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerHint}>Choose serial numbers to add to cart</Text>
        </LinearGradient>

        <View style={styles.productCard}>
          <ProductImage src={rawImage} size={72} borderRadius={14} iconSize={28} />
          <View style={styles.productInfo}>
            {brandName ? (
              <Text style={styles.brand} numberOfLines={1}>
                {brandName}
              </Text>
            ) : null}
            <Text style={styles.productName} numberOfLines={2}>
              {product?.name}
            </Text>
            {variantName ? (
              <Text style={styles.variantName} numberOfLines={1}>
                ({variantName})
              </Text>
            ) : null}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(finalPrice)}</Text>
              {discountValue > 0 ? (
                <Text style={styles.oldPrice}>{formatCurrency(sellingPrice)}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.statsRow, shadows.soft]}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{availableCount}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.statValueAccent]}>{selected.length}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{inCartSet.size}</Text>
            <Text style={styles.statLabel}>In cart</Text>
          </View>
        </View>

        <View style={[styles.searchRow, shadows.soft]}>
          <Search color={colors.accentPrimary} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search IMEI / serial…"
            placeholderTextColor={colors.textMuted}
            value={filter}
            onChangeText={setFilter}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {filter.length > 0 ? (
            <TouchableOpacity onPress={() => setFilter('')} hitSlop={8}>
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          ) : null}
        </View>

        {!loading && filtered.length > 0 ? (
          <View style={styles.listActions}>
            <Text style={styles.listCount}>
              {filtered.length} IMEI{filtered.length === 1 ? '' : 's'}
            </Text>
            <TouchableOpacity onPress={selectAllFiltered}>
              <Text style={styles.selectAllText}>Select all</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SerialSkeleton key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id || item.serialNumber}
            style={styles.list}
            contentContainerStyle={filtered.length === 0 ? styles.listEmpty : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Cpu color={colors.textMuted} size={28} strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyTitle}>
                  {serials.length > 0 ? 'All IMEIs in cart' : 'No IMEI found'}
                </Text>
                <Text style={styles.emptyText}>
                  {serials.length > 0
                    ? 'Every in-stock serial is already in your cart'
                    : 'No in-stock serial numbers for this product'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const on = selected.includes(item.serialNumber);
              const batchNum = item.batch?.batchNumber || item.batch?.batch_number;
              return (
                <TouchableOpacity
                  style={[styles.row, on && styles.rowOn, shadows.soft]}
                  onPress={() => toggle(item.serialNumber)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on ? <Check color="#fff" size={14} strokeWidth={3} /> : null}
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.serialRow}>
                      <Hash color={on ? colors.accentPrimary : colors.textMuted} size={14} />
                      <Text style={[styles.serial, on && styles.serialOn]}>{item.serialNumber}</Text>
                    </View>
                    {batchNum ? (
                      <View style={styles.batchRow}>
                        <Layers color={colors.textMuted} size={11} />
                        <Text style={styles.batch}>Batch {batchNum}</Text>
                      </View>
                    ) : null}
                  </View>
                  {on ? (
                    <View style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>Selected</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.footerInfo}>
            <ShoppingCart color={colors.accentPrimary} size={18} />
            <Text style={styles.footerCount}>
              {selected.length} IMEI selected
              {selected.length > 0 ? ` · ${formatCurrency(finalPrice * selected.length)}` : ''}
            </Text>
          </View>
          <Button
            title={selected.length > 0 ? `Add ${selected.length} to cart` : 'Add to cart'}
            onPress={handleConfirm}
            disabled={selected.length === 0}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerHint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 10 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: spacing.md,
    marginTop: -10,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.soft,
  },
  productInfo: { flex: 1, minWidth: 0 },
  brand: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  productName: { color: colors.textPrimary, fontWeight: '700', fontSize: 15, lineHeight: 20 },
  variantName: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  price: { color: colors.accentPrimary, fontWeight: '800', fontSize: 17 },
  oldPrice: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.textPrimary, fontWeight: '800', fontSize: 18 },
  statValueAccent: { color: colors.accentPrimary },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: colors.borderLight },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  listCount: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  selectAllText: { color: colors.accentPrimary, fontSize: 12, fontWeight: '700' },
  list: { flex: 1, marginHorizontal: spacing.md, marginTop: 4 },
  listEmpty: { flexGrow: 1 },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  skeletonCheck: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.bgTertiary,
  },
  skeletonLines: { flex: 1, gap: 6 },
  skeletonLine: {
    height: 12,
    width: '75%',
    borderRadius: 4,
    backgroundColor: colors.bgTertiary,
  },
  skeletonLineShort: {
    height: 8,
    width: '40%',
    borderRadius: 4,
    backgroundColor: colors.bgTertiary,
  },
  emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowOn: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentSoft,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkOn: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  rowBody: { flex: 1, minWidth: 0 },
  serialRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serial: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  serialOn: { color: colors.accentPrimary },
  batchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  batch: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  selectedTag: {
    backgroundColor: colors.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  selectedTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  footer: {
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  footerCount: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
});
