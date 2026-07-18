import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  Plus,
  Search,
  Store,
  Package,
  ClipboardList,
  Wallet,
} from 'lucide-react-native';
import { InvoiceModal } from '@/features/sales-pos/pos/components/InvoiceModal';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { useQuickSellPage } from '../hooks/useQuickSellPage';
import { AddQuickSellModal } from './AddQuickSellModal';
import { QuickSellOrderCard } from './QuickSellOrderCard';
import type { QuickSellOrder } from '../types';

export function QuickSellScreen() {
  const insets = useSafeAreaInsets();
  const page = useQuickSellPage();

  const renderOrder = ({ item }: { item: QuickSellOrder }) => (
    <QuickSellOrderCard
      order={item}
      formatTaka={page.formatTaka}
      busy={page.actionBusyId === item.id}
      onReturn={() => page.handleReturn(item)}
    />
  );

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <LinearGradient colors={['#0f766e', '#0d9488', '#14b8a6']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIcon}>
              <Zap color="#fff" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Quick Sell</Text>
              <Text style={styles.heroSub}>Fast, direct customer sale</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addFab} onPress={page.handleOpenAddModal} activeOpacity={0.85}>
            <Plus color="#0f766e" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatPill
            icon={Zap}
            label="Sales"
            value={String(page.stats?.orders ?? page.orders.length)}
          />
          <StatPill
            icon={ClipboardList}
            label="Today"
            value={String(page.stats?.todayCount ?? 0)}
          />
          <StatPill
            icon={Wallet}
            label="Sold ৳"
            value={String(Math.round(page.stats?.totalSold ?? page.stats?.todayAmount ?? 0))}
          />
        </View>
      </LinearGradient>

      {page.branchList.length > 1 ? (
        <View style={styles.branchBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.branchScroller}
            contentContainerStyle={styles.branchRow}
          >
            {page.branchList.map((b) => {
              const active = b.id === page.filterBranchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.chip, active && styles.chipOn]}
                  onPress={() => page.setFilterBranchId(b.id)}
                  activeOpacity={0.72}
                >
                  <LinearGradient
                    colors={active ? ['#6366f1', '#4f46e5'] : ['#ffffff', '#f8fafc']}
                    style={styles.chipInner}
                  >
                    <View style={[styles.branchIcon, active && styles.branchIconOn]}>
                      <Store
                        color={active ? '#ffffff' : colors.accentPrimary}
                        size={13}
                        strokeWidth={2.3}
                      />
                    </View>
                    <Text
                      style={[styles.chipText, active && styles.chipTextOn]}
                      numberOfLines={1}
                    >
                      {b.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <View style={styles.statusRow}>
          {(['all', 'pending', 'assigned'] as const).map((s) => {
            const active = page.filterStatus === s;
            const label = s === 'all' ? 'All Sales' : s === 'pending' ? 'Pending' : 'Assigned';
            return (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, active && styles.statusChipOn]}
                onPress={() => page.setFilterStatus(s)}
              >
                <Text style={[styles.statusChipText, active && styles.statusChipTextOn]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.searchRow, shadows.soft]}>
          <Search color="#0f766e" size={16} />
          <TextInput
            style={styles.searchInput}
            value={page.searchTerm}
            onChangeText={page.setSearchTerm}
            placeholder="Search product or order…"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {page.loading && page.orders.length === 0 ? (
        <ActivityIndicator color="#0f766e" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={page.orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            page.orders.length === 0 ? styles.listEmpty : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={page.loading}
              onRefresh={page.refreshList}
              tintColor="#0f766e"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Package color={colors.textMuted} size={32} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No quick sells yet</Text>
              <Text style={styles.emptyText}>
                Tap + to create a direct quick sale
              </Text>
              <TouchableOpacity style={styles.emptyCta} onPress={page.handleOpenAddModal}>
                <Plus color="#fff" size={16} />
                <Text style={styles.emptyCtaText}>Add Sell</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderOrder}
          onEndReached={() => page.loadMore()}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            page.loading && page.orders.length > 0 ? (
              <ActivityIndicator color="#0f766e" style={{ marginVertical: 16 }} />
            ) : page.hasMore ? (
              <Text style={styles.loadMoreHint}>
                Showing {page.orders.length} of {page.total}
              </Text>
            ) : page.orders.length > 0 ? (
              <Text style={styles.loadMoreHint}>
                {page.total} sale{page.total === 1 ? '' : 's'}
              </Text>
            ) : null
          }
        />
      )}

      <AddQuickSellModal page={page} />

      <InvoiceModal
        visible={page.showInvoiceModal}
        invoiceData={page.invoiceData}
        onClose={() => {
          page.setShowInvoiceModal(false);
          page.setInvoiceData(null);
        }}
      />
    </View>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statPill}>
      <Icon color="rgba(255,255,255,0.85)" size={12} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 20, letterSpacing: -0.3 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2, fontWeight: '500' },
  addFab: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statValue: { color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 3 },
  statLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  branchBar: {
    backgroundColor: colors.bgPrimary,
    paddingTop: 10,
    paddingBottom: 6,
  },
  branchScroller: {
    flexGrow: 0,
  },
  branchRow: {
    paddingHorizontal: spacing.sm,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  chip: {
    minWidth: 96,
    maxWidth: 160,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chipOn: {
    borderColor: colors.accentPrimary,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.28,
    elevation: 5,
  },
  chipInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  branchIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
  },
  branchIconOn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  chipText: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextOn: { color: '#ffffff', fontWeight: '800' },
  toolbar: { paddingHorizontal: spacing.sm, paddingTop: 8, gap: 8 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusChipOn: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  statusChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 12 },
  statusChipTextOn: { color: '#fff' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: { flex: 1, paddingVertical: 11, color: colors.textPrimary, fontSize: 13 },
  listContent: { padding: spacing.sm, paddingBottom: 28 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', padding: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loadMoreHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 14,
  },
});
