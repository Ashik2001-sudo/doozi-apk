import React, { useCallback, useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  Building2,
  CreditCard,
  DollarSign,
  Eye,
  Hash,
  Package,
  Search,
  ShoppingCart,
  UserRound,
  Undo2,
  X,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

type SerialSupplier = {
  id?: string;
  name: string;
  companyName?: string | null;
  phone?: string | null;
};

type SerialSearchPurchase = {
  id: string;
  billNo: string | null;
  invoiceNo: string | null;
  purchaseDate: string | null;
  grandTotal?: number;
  paidAmount?: number;
  dueAmount?: number;
  paymentStatus?: string | null;
  branch?: { name: string } | null;
  supplier?: SerialSupplier;
};

type SerialSearchSaleOrder = {
  id: string;
  invoiceNo: string | null;
  orderNo: string;
  orderDate: string;
  grandTotal: number;
  orderStatus: string;
  orderType?: string;
  customer?: { id: string; name: string; phone: string | null };
  customerName?: string | null;
  branch?: { id: string; name: string };
  retailerId?: string | null;
  retailer?: { id: string; name: string; phone: string | null } | null;
};

type SerialReturnHistory = {
  id: string;
  returnNo: string;
  returnDate: string;
  invoiceNo?: string;
  branchName?: string;
  createdAt: string;
};

type SerialSearchMatch = {
  id: string;
  serialNumber: string;
  status: string;
  branchId: string;
  productId: string;
  variantId: string | null;
  product?: { id: string; name: string; productType?: string };
  variant?: {
    id: string;
    sku: string;
    attributes?: Array<{
      attribute: { name: string };
      attributeValue: { value: string };
    }>;
  };
  purchase: SerialSearchPurchase | null;
  purchaseItem?: {
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    productName?: string;
  } | null;
  averageCost?: number | null;
  catalogPrices?: Array<{
    sellingPrice: number;
    sellingType?: string;
  }>;
  branch?: { id: string; name: string };
  batch: {
    id: string;
    batchNumber: string;
    batchDate: string;
    supplier?: SerialSupplier | null;
  } | null;
  supplier?: SerialSupplier | null;
  supplierSource?: 'purchase' | 'batch' | null;
  saleOrder: SerialSearchSaleOrder | null;
  saleHistory: SerialSearchSaleOrder[];
  returnHistory: SerialReturnHistory[];
};

type SerialSearchResponse = {
  serialNumber: string;
  matchCount: number;
  matches: SerialSearchMatch[];
};

type BatchDetail = {
  batchNumber?: string;
  batchDate?: string;
  availableQuantity?: number;
  quantity?: number;
  unitCost?: number;
  serialNumbers?: Array<{ serialNumber: string; status?: string }>;
};

function money(val: number | string) {
  const s = Number(val)
    .toLocaleString('en-IN', { maximumFractionDigits: 2 })
    .replace(/\.00$/, '');
  return `৳${s}`;
}

function formatDateTime(val: string | null | undefined) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function parseVariantAttributes(variant: SerialSearchMatch['variant']) {
  if (!variant?.attributes?.length) return '';
  return variant.attributes
    .map((a) => `${a.attribute?.name ?? ''}: ${a.attributeValue?.value ?? ''}`)
    .filter(Boolean)
    .join(', ');
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    in_stock: '#059669',
    sold: '#2563eb',
    returned: '#d97706',
    damaged: '#e11d48',
    warranty: '#7c3aed',
    completed: '#059669',
    paid: '#059669',
    partial: '#d97706',
    due: '#e11d48',
    cancelled: '#e11d48',
  };
  return map[status] || colors.textMuted;
}

function getCustomerLabel(sale: SerialSearchSaleOrder) {
  if (sale.orderType === 'wholesale' && (sale.retailerId || sale.retailer)) {
    return `Retailer: ${sale.retailer?.name ?? '—'}`;
  }
  if (sale.customer?.name || sale.customerName) {
    return `Customer: ${sale.customer?.name ?? sale.customerName ?? '—'}`;
  }
  return 'Walking';
}

function normalizeMatch(m: SerialSearchMatch): SerialSearchMatch {
  const saleHistory =
    m.saleHistory && m.saleHistory.length > 0
      ? m.saleHistory
      : m.saleOrder
        ? [m.saleOrder]
        : [];
  const supplier = m.supplier ?? m.purchase?.supplier ?? m.batch?.supplier ?? null;
  const supplierSource =
    m.supplierSource ??
    (m.purchase?.supplier ? 'purchase' : m.batch?.supplier ? 'batch' : null);
  return { ...m, saleHistory, supplier, supplierSource };
}

export default function SerialNumberPage() {
  const router = useRouter();
  const [imeiInput, setImeiInput] = useState('');
  const [result, setResult] = useState<SerialSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchModal, setBatchModal] = useState<{
    show: boolean;
    batch: BatchDetail | null;
    loading: boolean;
  }>({ show: false, batch: null, loading: false });

  const searchBySerial = useCallback(async (serialNumber: string) => {
    if (!serialNumber?.trim()) {
      setResult(null);
      setError('Please enter a serial number');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const encoded = encodeURIComponent(serialNumber.trim());
      const res = await authorizedFetch(`${API_BASE_URL}/product-serials/search/${encoded}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || `Serial number "${serialNumber}" not found`);
      }
      const data = await res.json();
      if (data.matches && Array.isArray(data.matches)) {
        const matches = (data.matches as SerialSearchMatch[]).map(normalizeMatch);
        setResult({
          serialNumber: data.serialNumber ?? serialNumber.trim(),
          matchCount: data.matchCount ?? matches.length,
          matches,
        });
        return;
      }
      const one = normalizeMatch(data as SerialSearchMatch);
      setResult({
        serialNumber: one.serialNumber,
        matchCount: 1,
        matches: [one],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = () => {
    setImeiInput('');
    setResult(null);
    setError(null);
  };

  const fetchBatchDetails = useCallback(
    async (productId: string, variantId: string, branchId: string, batchNumber: string) => {
      setBatchModal({ show: true, loading: true, batch: null });
      try {
        const params = new URLSearchParams({
          productId,
          variantId,
          branchId,
          batchNumber,
          includeSerials: 'true',
        });
        const res = await authorizedFetch(`${API_BASE_URL}/batches?${params}`);
        if (!res.ok) throw new Error('Batch not found');
        const data = await res.json();
        const batches = Array.isArray(data) ? data : data.data ?? [data];
        setBatchModal({ show: true, batch: (batches[0] ?? null) as BatchDetail | null, loading: false });
      } catch {
        setBatchModal({ show: true, batch: null, loading: false });
      }
    },
    [],
  );

  const renderMatch = ({ item: match, index }: { item: SerialSearchMatch; index: number }) => {
    const variantLabel = parseVariantAttributes(match.variant);
    const color = statusColor(match.status);
    return (
      <View style={[styles.matchCard, shadows.soft]}>
        {result && result.matchCount > 1 ? (
          <Text style={styles.matchTitle}>
            Record {index + 1} of {result.matchCount}
            <Text style={styles.matchTitleMuted}>
              {` · ${match.product?.name ?? '—'} · ${match.branch?.name ?? '—'}`}
            </Text>
          </Text>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Package color={colors.accentPrimary} size={18} />
            <Text style={styles.sectionTitle}>Product & Status</Text>
          </View>
          <InfoRow label="Product" value={match.product?.name ?? '—'} />
          <InfoRow label="SKU" value={match.variant?.sku ?? '—'} mono />
          {variantLabel ? <InfoRow label="Variant" value={variantLabel} /> : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Status</Text>
            <View style={[styles.statusPill, { backgroundColor: `${color}14`, borderColor: `${color}40` }]}>
              <Text style={[styles.statusText, { color }]}>
                {(match.status || '—').replace('_', ' ')}
              </Text>
            </View>
          </View>
          <InfoRow label="IMEI / Serial" value={match.serialNumber} mono />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Building2 color={colors.accentPrimary} size={18} />
            <Text style={styles.sectionTitle}>Branch & Batch</Text>
          </View>
          <InfoRow label="Branch" value={match.branch?.name ?? '—'} />
          {match.batch ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Batch</Text>
              <TouchableOpacity
                disabled={!match.variantId}
                onPress={() => {
                  if (!match.batch || !match.variantId) return;
                  void fetchBatchDetails(
                    match.productId,
                    match.variantId,
                    match.branchId,
                    match.batch.batchNumber,
                  );
                }}
              >
                <Text style={styles.linkValue}>{match.batch.batchNumber}</Text>
              </TouchableOpacity>
              <Text style={styles.infoHint}>{formatDateTime(match.batch.batchDate)}</Text>
            </View>
          ) : (
            <InfoRow label="Batch" value="—" />
          )}
        </View>

        {match.purchase ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <CreditCard color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Purchase Info</Text>
            </View>
            <InfoRow label="Bill No" value={match.purchase.billNo ?? '—'} />
            <InfoRow label="Invoice No" value={match.purchase.invoiceNo ?? '—'} />
            <InfoRow label="Purchase Date" value={formatDateTime(match.purchase.purchaseDate)} />
            {match.purchase.branch?.name ? (
              <InfoRow label="Purchase Branch" value={match.purchase.branch.name} />
            ) : null}

            {match.purchaseItem || match.purchase.grandTotal != null ? (
              <View style={styles.financialGrid}>
                {match.purchaseItem ? (
                  <FinancialTile
                    label="Unit Cost"
                    value={money(match.purchaseItem.unitPrice)}
                    tone="#7c3aed"
                  />
                ) : null}
                {match.purchaseItem ? (
                  <FinancialTile
                    label={`Line Total · ${match.purchaseItem.quantity} qty`}
                    value={money(match.purchaseItem.totalPrice)}
                    tone="#2563eb"
                  />
                ) : null}
                {match.purchase.paidAmount != null ? (
                  <FinancialTile
                    label="Purchase Paid"
                    value={money(match.purchase.paidAmount)}
                    tone="#059669"
                  />
                ) : null}
                {match.purchase.dueAmount != null ? (
                  <FinancialTile
                    label="Purchase Due"
                    value={money(match.purchase.dueAmount)}
                    tone="#e11d48"
                  />
                ) : null}
              </View>
            ) : null}
            {match.purchase.paymentStatus ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Status</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: `${statusColor(match.purchase.paymentStatus)}14`,
                      borderColor: `${statusColor(match.purchase.paymentStatus)}40`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor(match.purchase.paymentStatus) },
                    ]}
                  >
                    {match.purchase.paymentStatus}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {match.supplier ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <UserRound color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Supplier Details</Text>
              {match.supplierSource ? (
                <Text style={styles.sourcePill}>
                  via {match.supplierSource === 'purchase' ? 'purchase' : 'batch'}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              activeOpacity={match.supplier.id ? 0.7 : 1}
              disabled={!match.supplier.id}
              style={styles.supplierCard}
              onPress={() => {
                const supplierId = match.supplier?.id;
                if (supplierId) {
                  router.push(`/admin/contacts/suppliers/${supplierId}` as never);
                }
              }}
            >
              <View style={styles.supplierIcon}>
                <UserRound color={colors.accentPrimary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supplierName}>
                  {match.supplier.companyName ?? match.supplier.name}
                </Text>
                {match.supplier.companyName ? (
                  <Text style={styles.infoHint}>{match.supplier.name}</Text>
                ) : null}
                {match.supplier.phone ? (
                  <Text style={styles.supplierPhone}>{match.supplier.phone}</Text>
                ) : null}
              </View>
              {match.supplier.id ? <Text style={styles.supplierAction}>Details ›</Text> : null}
            </TouchableOpacity>
          </View>
        ) : null}

        {match.averageCost != null || match.catalogPrices?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <DollarSign color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Cost & Selling Price</Text>
            </View>
            {match.averageCost != null ? (
              <InfoRow label="Average Cost" value={money(match.averageCost)} />
            ) : null}
            {match.catalogPrices?.map((price, priceIndex) => (
              <InfoRow
                key={`${match.id}-price-${price.sellingType ?? priceIndex}`}
                label={`${(price.sellingType ?? 'selling').replace(/_/g, ' ')} Price`}
                value={money(price.sellingPrice)}
              />
            ))}
          </View>
        ) : null}

        {match.saleHistory?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <ShoppingCart color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Sale History</Text>
            </View>
            {match.saleHistory.map((sale) => {
              const saleColor = statusColor(sale.orderStatus);
              return (
                <View key={`${match.id}-${sale.id}`} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyPrimary}>
                      {sale.invoiceNo ?? sale.orderNo ?? '—'}
                    </Text>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() =>
                        router.push('/admin/sales-pos/sales-history' as never)
                      }
                    >
                      <Eye color={colors.accentPrimary} size={14} />
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.historyMeta}>{formatDateTime(sale.orderDate)}</Text>
                  <Text style={styles.historyMeta}>{getCustomerLabel(sale)}</Text>
                  {(sale.retailer?.phone || (!sale.retailer && sale.customer?.phone)) ? (
                    <Text style={styles.infoHint}>
                      {sale.retailer?.phone || sale.customer?.phone}
                    </Text>
                  ) : null}
                  <View style={styles.historyBottom}>
                    <Text style={styles.historyMeta}>{sale.branch?.name ?? '—'}</Text>
                    <Text style={styles.historyAmount}>{money(sale.grandTotal)}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${saleColor}14`, borderColor: `${saleColor}40` },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: saleColor }]}>
                        {sale.orderStatus}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {match.returnHistory?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Undo2 color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Return History</Text>
            </View>
            {match.returnHistory.map((r, idx) => (
              <View key={`${match.id}-${r.id}`} style={styles.historyCard}>
                <Text style={styles.historyPrimary}>
                  #{idx + 1} · {r.returnNo}
                </Text>
                <Text style={styles.historyMeta}>Return: {formatDateTime(r.returnDate)}</Text>
                <Text style={styles.historyMeta}>Invoice: {r.invoiceNo ?? '—'}</Text>
                <Text style={styles.historyMeta}>Branch: {r.branchName ?? '—'}</Text>
                <Text style={styles.infoHint}>Created: {formatDateTime(r.createdAt)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(!match.saleHistory || match.saleHistory.length === 0) && match.status !== 'returned' ? (
          <View style={styles.emptyNote}>
            <Text style={styles.emptyNoteText}>
              This unit has not been sold yet (for this product/branch).
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={result?.matches ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          result ? (
            <RefreshControl
              refreshing={loading}
              onRefresh={() => void searchBySerial(imeiInput)}
              tintColor={colors.accentPrimary}
            />
          ) : undefined
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#312e81', '#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroIcon}>
                <Hash color="#ffffff" size={25} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Serial / IMEI Search</Text>
                <Text style={styles.heroSub}>
                  Search by IMEI or serial to view full product history
                </Text>
              </View>
            </LinearGradient>

            <View style={[styles.searchCard, shadows.soft]}>
              <View style={styles.searchRow}>
                <Search color={colors.accentPrimary} size={18} />
                <TextInput
                  style={styles.searchInput}
                  value={imeiInput}
                  onChangeText={setImeiInput}
                  placeholder="Enter IMEI or serial number..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  returnKeyType="search"
                  onSubmitEditing={() => void searchBySerial(imeiInput)}
                  editable={!loading}
                />
                {imeiInput ? (
                  <TouchableOpacity onPress={handleClear} hitSlop={8}>
                    <X color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.searchActions}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={loading ? 'Searching...' : 'Search'}
                    loading={loading}
                    disabled={!imeiInput.trim()}
                    onPress={() => void searchBySerial(imeiInput)}
                  />
                </View>
                <Button title="Clear" variant="secondary" onPress={handleClear} disabled={loading} />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {result && result.matchCount > 1 ? (
              <View style={styles.multiNotice}>
                <Text style={styles.multiNoticeText}>
                  {result.matchCount} inventory records found for this IMEI / serial — each
                  product/branch is shown below.
                </Text>
              </View>
            ) : null}

            {loading && !result ? (
              <ActivityIndicator
                color={colors.accentPrimary}
                size="large"
                style={{ marginVertical: 40 }}
              />
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading && !error && !result ? (
            <View style={styles.empty}>
              <Hash color={colors.textMuted} size={48} strokeWidth={1.3} />
              <Text style={styles.emptyTitle}>Enter IMEI or Serial Number</Text>
              <Text style={styles.emptyText}>
                Search to view product details, purchase, sale, and return history.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={batchModal.show}
        transparent
        animationType="fade"
        onRequestClose={() => setBatchModal({ show: false, batch: null, loading: false })}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setBatchModal({ show: false, batch: null, loading: false })}
        >
          <Pressable style={[styles.batchModal, shadows.soft]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.batchHead}>
              <Text style={styles.batchTitle}>Batch Details</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setBatchModal({ show: false, batch: null, loading: false })}
              >
                <X color={colors.textPrimary} size={18} />
              </TouchableOpacity>
            </View>
            {batchModal.loading ? (
              <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 28 }} />
            ) : batchModal.batch ? (
              <ScrollView style={{ maxHeight: 360 }}>
                <InfoRow label="Batch No" value={batchModal.batch.batchNumber ?? '—'} mono />
                <InfoRow label="Batch Date" value={formatDateTime(batchModal.batch.batchDate)} />
                <InfoRow
                  label="Available Qty"
                  value={String(batchModal.batch.availableQuantity ?? batchModal.batch.quantity ?? 0)}
                />
                {batchModal.batch.unitCost != null ? (
                  <InfoRow label="Unit Cost" value={money(batchModal.batch.unitCost)} />
                ) : null}
                {batchModal.batch.serialNumbers?.length ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.infoLabel}>Serials in batch</Text>
                    {batchModal.batch.serialNumbers.slice(0, 40).map((sn) => (
                      <Text key={sn.serialNumber} style={styles.serialLine}>
                        {sn.serialNumber}
                        {sn.status ? ` · ${sn.status}` : ''}
                      </Text>
                    ))}
                    {batchModal.batch.serialNumbers.length > 40 ? (
                      <Text style={styles.infoHint}>
                        +{batchModal.batch.serialNumbers.length - 40} more
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Batch not found</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

function FinancialTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={[styles.financialTile, { borderLeftColor: tone }]}>
      <Text style={styles.financialLabel}>{label}</Text>
      <Text style={[styles.financialValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  listContent: { paddingBottom: 120 },
  hero: {
    margin: spacing.sm,
    borderRadius: radius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { color: '#ffffff', fontSize: 21, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3, lineHeight: 15 },
  searchCard: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 10 },
  searchActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  errorBox: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { color: colors.statusError, fontSize: 13 },
  multiNotice: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  multiNoticeText: { color: '#92400e', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  empty: { alignItems: 'center', padding: 42 },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  matchCard: {
    marginHorizontal: spacing.sm,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  matchTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  matchTitleMuted: { color: colors.textMuted, fontWeight: '500', fontSize: 12 },
  section: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  infoRow: { marginBottom: 8 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  infoHint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  sourcePill: {
    color: colors.accentPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    overflow: 'hidden',
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  supplierIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  supplierName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  supplierPhone: { color: colors.accentPrimary, fontSize: 12, fontWeight: '700', marginTop: 3 },
  supplierAction: { color: colors.accentPrimary, fontSize: 11, fontWeight: '800' },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  financialTile: {
    width: '48%',
    minHeight: 60,
    padding: 9,
    borderRadius: 10,
    borderLeftWidth: 3,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  financialLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  financialValue: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  linkValue: {
    color: colors.accentPrimary,
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  viewBtnText: { color: colors.accentPrimary, fontSize: 11, fontWeight: '800' },
  historyCard: {
    marginBottom: 8,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyPrimary: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  historyMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  historyAmount: {
    color: colors.accentPrimary,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 'auto',
    marginRight: 8,
  },
  historyBottom: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyNote: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyNoteText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  batchModal: {
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    padding: spacing.md,
  },
  batchHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batchTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
  },
  serialLine: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
  },
});
