import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShoppingCart,
  UserRound,
} from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch, getMediaUrl } from '@/lib/config';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type {
  Purchase,
  Supplier,
  SupplierDetailStats,
  SupplierTransaction,
} from '@/types/supplier.types';

type Tab = 'business' | 'transactions';

type PagedResponse<T> = {
  data?: T[];
  total?: number;
  totalPages?: number;
};

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `৳${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function date(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB');
}

function responseMessage(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'message' in data) {
    return String((data as { message?: unknown }).message || fallback);
  }
  return fallback;
}

export default function SupplierDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const supplierId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [activeTab, setActiveTab] = useState<Tab>('business');
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [stats, setStats] = useState<SupplierDetailStats>({
    advance: 0,
    totalPurchase: 0,
    totalPaid: 0,
    totalDue: 0,
  });
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [purchasePage, setPurchasePage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [purchasePages, setPurchasePages] = useState(1);
  const [transactionPages, setTransactionPages] = useState(1);
  const [purchaseTotal, setPurchaseTotal] = useState(0);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!supplierId) return;
    const [supplierResponse, statsResponse] = await Promise.all([
      authorizedFetch(`${API_BASE_URL}/suppliers/${supplierId}`),
      authorizedFetch(`${API_BASE_URL}/suppliers/${supplierId}/stats`),
    ]);
    const supplierJson = await supplierResponse.json().catch(() => ({}));
    const statsJson = await statsResponse.json().catch(() => ({}));
    if (!supplierResponse.ok) {
      throw new Error(responseMessage(supplierJson, 'Failed to load supplier details'));
    }
    setSupplier(supplierJson.data ?? supplierJson);
    if (statsResponse.ok) {
      setStats((current) => ({ ...current, ...(statsJson.data ?? statsJson) }));
    }
  }, [supplierId]);

  const fetchPurchases = useCallback(async () => {
    if (!supplierId) return;
    setListLoading(true);
    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/suppliers/${supplierId}/purchases?page=${purchasePage}&limit=10`,
      );
      const json = (await response.json().catch(() => ({}))) as PagedResponse<Purchase>;
      if (!response.ok) throw new Error(responseMessage(json, 'Failed to load purchases'));
      setPurchases(json.data ?? []);
      setPurchaseTotal(json.total ?? 0);
      setPurchasePages(Math.max(1, json.totalPages ?? 1));
    } finally {
      setListLoading(false);
    }
  }, [purchasePage, supplierId]);

  const fetchTransactions = useCallback(async () => {
    if (!supplierId) return;
    setListLoading(true);
    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/suppliers/${supplierId}/transactions?page=${transactionPage}&limit=10`,
      );
      const json = (await response.json().catch(() => ({}))) as PagedResponse<SupplierTransaction>;
      if (!response.ok) throw new Error(responseMessage(json, 'Failed to load transactions'));
      setTransactions(json.data ?? []);
      setTransactionTotal(json.total ?? 0);
      setTransactionPages(Math.max(1, json.totalPages ?? 1));
    } finally {
      setListLoading(false);
    }
  }, [supplierId, transactionPage]);

  const loadInitial = useCallback(async () => {
    if (!supplierId) {
      setError('Supplier ID is missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  }, [fetchOverview, supplierId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (loading) return;
    const request = activeTab === 'business' ? fetchPurchases() : fetchTransactions();
    void request.catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    });
  }, [activeTab, fetchPurchases, fetchTransactions, loading]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchOverview(),
        activeTab === 'business' ? fetchPurchases() : fetchTransactions(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, fetchOverview, fetchPurchases, fetchTransactions]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentPrimary} size="large" />
        <Text style={styles.loadingText}>Loading supplier details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.accentPrimary}
        />
      }
    >
      <LinearGradient
        colors={['#312e81', '#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={20} />
        </TouchableOpacity>
        <View style={styles.heroIcon}>
          <UserRound color="#ffffff" size={25} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{supplier?.name ?? 'Supplier Details'}</Text>
          <Text style={styles.heroSub}>
            {supplier?.companyName || supplier?.phone || 'Business overview and ledger history'}
          </Text>
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle color={colors.statusError} size={18} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!supplier ? (
        <View style={[styles.emptyCard, shadows.soft]}>
          <UserRound color={colors.textMuted} size={46} strokeWidth={1.4} />
          <Text style={styles.emptyTitle}>Supplier not found</Text>
          <Text style={styles.emptyText}>
            This supplier may have been removed or you may not have access.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.profileCard, shadows.soft]}>
            {supplier.image ? (
              <Image source={{ uri: getMediaUrl(supplier.image) }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{supplier.name.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.profileBody}>
              <Text style={styles.profileName}>{supplier.name}</Text>
              {supplier.companyName ? (
                <Text style={styles.companyName}>{supplier.companyName}</Text>
              ) : null}
              <ContactRow
                icon={<Phone color="#4f46e5" size={15} />}
                label="Phone"
                value={supplier.phone}
                onPress={() => void Linking.openURL(`tel:${supplier.phone}`)}
              />
              {supplier.email ? (
                <ContactRow
                  icon={<Mail color="#7c3aed" size={15} />}
                  label="Email"
                  value={supplier.email}
                  onPress={() => void Linking.openURL(`mailto:${supplier.email}`)}
                />
              ) : null}
              {supplier.address ? (
                <ContactRow
                  icon={<MapPin color="#059669" size={15} />}
                  label="Address"
                  value={supplier.address}
                />
              ) : null}
              <ContactRow
                icon={<CalendarDays color="#d97706" size={15} />}
                label="Member since"
                value={date(supplier.createdAt)}
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard label="Advance" value={money(stats.advance)} color="#059669" />
            <StatCard label="Total Purchase" value={money(stats.totalPurchase)} color="#2563eb" />
            <StatCard label="Total Paid" value={money(stats.totalPaid)} color="#7c3aed" />
            <StatCard label="Total Due" value={money(stats.totalDue)} color="#e11d48" />
          </View>

          <View style={styles.tabs}>
            <TabButton
              active={activeTab === 'business'}
              icon={<Building2 color={activeTab === 'business' ? colors.accentPrimary : colors.textMuted} size={17} />}
              title="Purchases"
              count={purchaseTotal}
              onPress={() => setActiveTab('business')}
            />
            <TabButton
              active={activeTab === 'transactions'}
              icon={<CreditCard color={activeTab === 'transactions' ? colors.accentPrimary : colors.textMuted} size={17} />}
              title="Transactions"
              count={transactionTotal}
              onPress={() => setActiveTab('transactions')}
            />
          </View>

          <View style={[styles.historySection, shadows.soft]}>
            <View style={styles.sectionHeader}>
              {activeTab === 'business' ? (
                <ShoppingCart color={colors.accentPrimary} size={19} />
              ) : (
                <ReceiptText color={colors.accentPrimary} size={19} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {activeTab === 'business' ? 'Purchase Invoices' : 'Transaction History'}
                </Text>
                <Text style={styles.sectionSub}>
                  {activeTab === 'business' ? purchaseTotal : transactionTotal} records
                </Text>
              </View>
            </View>

            {listLoading ? (
              <ActivityIndicator color={colors.accentPrimary} style={styles.listLoader} />
            ) : activeTab === 'business' ? (
              purchases.length ? (
                purchases.map((purchase) => (
                  <PurchaseCard
                    key={purchase.id}
                    purchase={purchase}
                    onPress={() => router.push(`/admin/purchases/${purchase.id}` as never)}
                  />
                ))
              ) : (
                <EmptyHistory text="No purchase invoices found" />
              )
            ) : transactions.length ? (
              transactions.map((transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))
            ) : (
              <EmptyHistory text="No transactions found" />
            )}

            <Pagination
              page={activeTab === 'business' ? purchasePage : transactionPage}
              totalPages={activeTab === 'business' ? purchasePages : transactionPages}
              onPrevious={() =>
                activeTab === 'business'
                  ? setPurchasePage((page) => Math.max(1, page - 1))
                  : setTransactionPage((page) => Math.max(1, page - 1))
              }
              onNext={() =>
                activeTab === 'business'
                  ? setPurchasePage((page) => Math.min(purchasePages, page + 1))
                  : setTransactionPage((page) => Math.min(transactionPages, page + 1))
              }
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const body = (
    <>
      <View style={styles.contactIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={[styles.contactValue, onPress && styles.contactLink]}>{value}</Text>
      </View>
    </>
  );
  return onPress ? (
    <TouchableOpacity style={styles.contactRow} onPress={onPress}>
      {body}
    </TouchableOpacity>
  ) : (
    <View style={styles.contactRow}>{body}</View>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function TabButton({
  active,
  icon,
  title,
  count,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      {icon}
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{title}</Text>
      <View style={[styles.countPill, active && styles.countPillActive]}>
        <Text style={[styles.countText, active && styles.countTextActive]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress: () => void }) {
  const statusColor =
    purchase.paymentStatus === 'paid'
      ? '#059669'
      : purchase.paymentStatus === 'partial'
        ? '#d97706'
        : '#e11d48';
  return (
    <TouchableOpacity style={styles.itemCard} activeOpacity={0.72} onPress={onPress}>
      <View style={styles.itemTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{purchase.billNo || purchase.invoiceNo || 'Purchase'}</Text>
          <Text style={styles.itemMeta}>Invoice: {purchase.invoiceNo || '—'} · {date(purchase.purchaseDate)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${statusColor}14`, borderColor: `${statusColor}40` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{purchase.paymentStatus}</Text>
        </View>
      </View>
      <View style={styles.amountRow}>
        <Amount label="Total" value={money(purchase.grandTotal)} />
        <Amount label="Paid" value={money(purchase.paidAmount)} color="#059669" />
        <Amount label="Due" value={money(purchase.dueAmount)} color="#e11d48" />
        <ChevronRight color={colors.textMuted} size={18} />
      </View>
    </TouchableOpacity>
  );
}

function TransactionCard({ transaction }: { transaction: SupplierTransaction }) {
  const positive = transaction.type === 'advance' || transaction.type === 'refund';
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{transaction.type.replace(/_/g, ' ')}</Text>
          <Text style={styles.itemMeta}>{date(transaction.transactionDate)}</Text>
        </View>
        <Text style={[styles.transactionAmount, { color: positive ? '#059669' : '#e11d48' }]}>
          {money(transaction.amount)}
        </Text>
      </View>
      <Text style={styles.itemMeta}>
        Account: {transaction.offsetsOpeningInventory
          ? 'Opening stock (inventory capital)'
          : transaction.account?.accountName || transaction.accountId || '—'}
      </Text>
      {transaction.invoiceNo ? (
        <Text style={styles.itemMeta}>Invoice: {transaction.invoiceNo}</Text>
      ) : null}
      {transaction.note ? <Text style={styles.note}>{transaction.note}</Text> : null}
    </View>
  );
}

function Amount({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

function EmptyHistory({ text }: { text: string }) {
  return (
    <View style={styles.emptyHistory}>
      <ReceiptText color={colors.textMuted} size={32} strokeWidth={1.4} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        disabled={page <= 1}
        style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
        onPress={onPrevious}
      >
        <ChevronLeft color={colors.textPrimary} size={17} />
      </TouchableOpacity>
      <Text style={styles.pageText}>Page {page} of {totalPages}</Text>
      <TouchableOpacity
        disabled={page >= totalPages}
        style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
        onPress={onNext}
      >
        <ChevronRight color={colors.textPrimary} size={17} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingBottom: 120 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgPrimary,
  },
  loadingText: { color: colors.textMuted, fontSize: 13, marginTop: 12 },
  hero: {
    margin: spacing.sm,
    padding: 14,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroTitle: { color: '#ffffff', fontSize: 19, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.76)', fontSize: 11, marginTop: 3 },
  errorBox: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    padding: 11,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { flex: 1, color: colors.statusError, fontSize: 12 },
  retryText: { color: colors.accentPrimary, fontSize: 12, fontWeight: '800' },
  emptyCard: {
    margin: spacing.sm,
    padding: 38,
    alignItems: 'center',
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptyText: { color: colors.textMuted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  profileCard: {
    marginHorizontal: spacing.sm,
    padding: 14,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatar: { width: 70, height: 70, borderRadius: 22, backgroundColor: colors.bgTertiary },
  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  profileBody: { flex: 1 },
  profileName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  companyName: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  contactIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
  },
  contactLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  contactValue: { color: colors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 1 },
  contactLink: { color: colors.accentPrimary },
  statsGrid: {
    margin: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48.5%',
    minHeight: 76,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderTopWidth: 3,
  },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 17, fontWeight: '900', marginTop: 7 },
  tabs: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    padding: 4,
    borderRadius: 13,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.bgTertiary,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabActive: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.borderAccent },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: colors.accentPrimary },
  countPill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  countPillActive: { backgroundColor: colors.accentSoft },
  countText: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  countTextActive: { color: colors.accentPrimary },
  historySection: {
    marginHorizontal: spacing.sm,
    padding: 12,
    borderRadius: radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingBottom: 11,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  sectionSub: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  listLoader: { marginVertical: 34 },
  itemCard: {
    marginTop: 8,
    padding: 11,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', textTransform: 'capitalize' },
  itemMeta: { color: colors.textMuted, fontSize: 10, marginTop: 3, lineHeight: 15 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'capitalize' },
  amountRow: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountLabel: { color: colors.textMuted, fontSize: 9 },
  amountValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '800', marginTop: 2 },
  transactionAmount: { fontSize: 15, fontWeight: '900' },
  note: {
    color: colors.textPrimary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  emptyHistory: { alignItems: 'center', paddingVertical: 30 },
  pagination: {
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  pageButton: {
    width: 36,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pageButtonDisabled: { opacity: 0.35 },
  pageText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
});
