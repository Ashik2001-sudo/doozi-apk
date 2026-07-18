import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/branch/useBranches';
import { useDashboardStats } from '@/hooks/dashboard/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Hash,
  List,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

const COL = (Dimensions.get('window').width - spacing.md * 2 - 12) / 2;

const SHORTCUTS: Array<{
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  tint: string;
}> = [
  { id: 'pos', label: 'POS', href: '/admin/sales-pos/pos', icon: CreditCard, tint: '#4f46e5' },
  { id: 'quick-sell', label: 'Quick Sell', href: '/admin/sales-pos/quick-sell', icon: Zap, tint: '#d97706' },
  { id: 'wholesale', label: 'Wholesale', href: '/admin/sales-pos/wholesale-management', icon: Building2, tint: '#7c3aed' },
  { id: 'price-list', label: 'Price List', href: '/admin/inventory/price-list', icon: Tag, tint: '#059669' },
  { id: 'serial', label: 'Serial', href: '/admin/sales-pos/serial-number', icon: Hash, tint: '#0891b2' },
  { id: 'manage-product', label: 'Manage Product', href: '/admin/inventory/manage-product', icon: List, tint: '#10b981' },
];

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  tint: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(450)}
      style={[styles.kpi, shadows.soft, { width: COL, borderTopColor: tint }]}
    >
      <View style={styles.kpiHead}>
        <View style={[styles.kpiIcon, { backgroundColor: `${tint}16` }]}>
          <Icon color={tint} size={18} />
        </View>
        <View style={[styles.kpiPulse, { backgroundColor: tint }]} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue} numberOfLines={1}>
        {value}
      </Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </Animated.View>
  );
}

function KpiCardSkeleton() {
  return (
    <View style={[styles.kpi, shadows.soft, { width: COL, borderTopColor: '#e2e8f0' }]}>
      <View style={styles.kpiHead}>
        <Skeleton style={styles.skelIcon} />
      </View>
      <Skeleton style={styles.skelLabel} />
      <Skeleton style={styles.skelValue} />
      <Skeleton style={styles.skelSub} />
    </View>
  );
}

function OrderRowSkeleton({ last }: { last?: boolean }) {
  return (
    <View style={[styles.orderRow, last && { borderBottomWidth: 0 }]}>
      <Skeleton style={styles.orderDotSkel} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton style={styles.skelOrderInvoice} />
        <Skeleton style={styles.skelOrderMeta} />
        <Skeleton style={styles.skelOrderStatus} />
      </View>
      <View style={styles.orderRight}>
        <Skeleton style={styles.skelOrderTotal} />
      </View>
    </View>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, tenant } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranches();
  const { saleStats, recentOrders, loading, error, refetch } = useDashboardStats(
    selectedBranchId || undefined,
  );

  React.useEffect(() => {
    if (user?.role === 'employee') {
      router.replace('/admin/dashboard/employee' as never);
    }
  }, [user?.role, router]);

  const fmt = (n?: number) => `৳${(n ?? 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

  if (user?.role === 'employee') {
    return (
      <View style={styles.container}>
        <Skeleton style={styles.skelHero} />
        <View style={styles.kpiGrid}>
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
          <KpiCardSkeleton />
        </View>
      </View>
    );
  }

  const initialLoading = loading && !saleStats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 110 }}
      refreshControl={
        <RefreshControl refreshing={loading && !initialLoading} onRefresh={() => void refetch()} tintColor={colors.accentPrimary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#312e81', '#4f46e5', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBand}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroBadge}>
          <BarChart3 color="#c7d2fe" size={13} />
          <Text style={styles.heroBadgeText}>BUSINESS OVERVIEW</Text>
        </View>
        <Text style={styles.hello}>Welcome back</Text>
        <Text style={styles.greeting}>{user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
        <Text style={styles.company}>{tenant?.company || 'Everything is ready for business'}</Text>
      </LinearGradient>

      {branches.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.branchRow}>
          {branches.map((b) => {
            const active = b.id === selectedBranchId;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => void setSelectedBranchId(b.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{b.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.shortcutSection}>
        <Text style={styles.shortcutTitle}>Sales & inventory</Text>
        <View style={styles.shortcutGrid}>
          {SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.shortcut, shadows.soft]}
                onPress={() => router.push(item.href as never)}
                activeOpacity={0.85}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: `${item.tint}18` }]}>
                  <Icon color={item.tint} size={22} />
                </View>
                <Text style={styles.shortcutLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.kpiGrid}>
        {initialLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard label="Today sales" value={String(saleStats?.todaySales ?? 0)} sub={fmt(saleStats?.todayRevenue)} icon={ShoppingBag} tint="#4f46e5" delay={40} />
            <KpiCard label="Today revenue" value={fmt(saleStats?.todayRevenue)} icon={DollarSign} tint="#7c3aed" delay={80} />
            <KpiCard label="This month" value={String(saleStats?.monthlySales ?? 0)} sub={fmt(saleStats?.monthlyRevenue)} icon={TrendingUp} tint="#6366f1" delay={120} />
            <KpiCard label="All time" value={fmt(saleStats?.totalRevenue)} icon={DollarSign} tint="#8b5cf6" delay={160} />
          </>
        )}
      </View>

      <Animated.View entering={FadeInRight.delay(200).duration(500)} style={styles.quickWrap}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/admin/sales-pos/pos' as never)}
          style={shadows.glow}
        >
          <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.quickBtn}>
            <View style={styles.quickLeft}>
              <ShoppingCart color="#fff" size={22} />
              <View>
                <Text style={styles.quickText}>Open POS</Text>
                <Text style={styles.quickHint}>Start a new sale</Text>
              </View>
            </View>
            <ArrowUpRight color="#fff" size={22} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent orders</Text>
        <TouchableOpacity onPress={() => router.push('/admin/sales-pos/sales-history' as never)}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.ordersCard, shadows.soft]}>
        {initialLoading ? (
          <>
            <OrderRowSkeleton />
            <OrderRowSkeleton />
            <OrderRowSkeleton last />
          </>
        ) : recentOrders.length === 0 ? (
          <Text style={styles.empty}>No recent orders yet</Text>
        ) : (
          recentOrders.map((order, i) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderRow, i === recentOrders.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push('/admin/sales-pos/sales-history' as never)}
            >
              <View style={styles.orderDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.orderInvoice}>{order.invoiceNo || order.orderNo}</Text>
                <Text style={styles.orderMeta}>{order.customerName || 'Walk-in customer'}</Text>
                <View style={styles.orderStatus}>
                  <Text style={styles.orderStatusText}>{order.orderStatus || 'completed'}</Text>
                </View>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>{fmt(order.grandTotal)}</Text>
                <ChevronRight color={colors.textMuted} size={16} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  heroBand: {
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: 18,
    paddingBottom: 20,
    borderRadius: radius.xl,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    right: -45,
    top: -70,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    right: 55,
    bottom: -65,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 12,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroBadgeText: { color: '#e0e7ff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  hello: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '600' },
  greeting: {
    color: '#ffffff',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  company: { color: 'rgba(255,255,255,0.78)', marginTop: 6, fontSize: 13 },
  branchRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipActive: { borderColor: colors.accentPrimary, backgroundColor: colors.accentSoft },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.accentPrimary, fontWeight: '700' },
  error: { color: colors.statusError, paddingHorizontal: spacing.md },
  shortcutSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  shortcutTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  shortcutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcut: {
    width: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    minHeight: 92,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  shortcutLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  kpiGrid: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpi: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderTopWidth: 3,
    minHeight: 132,
  },
  kpiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiPulse: { width: 7, height: 7, borderRadius: 4, opacity: 0.55 },
  kpiLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  kpiValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  kpiSub: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  quickWrap: { padding: spacing.md },
  quickBtn: {
    borderRadius: radius.xl,
    padding: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  quickHint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  sectionHead: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  seeAll: { color: colors.accentPrimary, fontWeight: '600', fontSize: 13 },
  ordersCard: {
    marginHorizontal: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  empty: { color: colors.textMuted, padding: spacing.lg, textAlign: 'center' },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  orderDot: {
    width: 10,
    height: 42,
    borderRadius: 5,
    backgroundColor: '#e0e7ff',
  },
  orderInvoice: { color: colors.textPrimary, fontWeight: '800', fontSize: 14 },
  orderMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  orderStatus: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: '#ecfdf5',
  },
  orderStatusText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  orderRight: { alignItems: 'flex-end', gap: 8 },
  orderTotal: { color: colors.accentPrimary, fontWeight: '800', fontSize: 14 },
  skelHero: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    height: 150,
    borderRadius: radius.xl,
  },
  skelIcon: { width: 36, height: 36, borderRadius: 12, marginBottom: 10 },
  skelLabel: { width: '55%', height: 10, marginTop: 2 },
  skelValue: { width: '70%', height: 18, marginTop: 8 },
  skelSub: { width: '40%', height: 9, marginTop: 8 },
  orderDotSkel: { width: 10, height: 42, borderRadius: 5 },
  skelOrderInvoice: { width: '45%', height: 12 },
  skelOrderMeta: { width: '60%', height: 10 },
  skelOrderStatus: { width: 64, height: 14, borderRadius: radius.full },
  skelOrderTotal: { width: 58, height: 12 },
});
