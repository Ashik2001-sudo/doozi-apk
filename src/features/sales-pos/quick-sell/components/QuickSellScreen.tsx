import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Plus, Search, Package, PackageCheck, X } from 'lucide-react-native';
import { InvoiceModal } from '@/features/sales-pos/pos/components/InvoiceModal';
import { colors, radius, spacing } from '@/theme/tokens';
import { useQuickSellPage } from '../hooks/useQuickSellPage';
import { AddQuickSellModal } from './AddQuickSellModal';
import { QuickSellOrderCard } from './QuickSellOrderCard';
import type { QuickSellOrder } from '../types';

const STATUS_FILTERS: { key: 'all' | 'pending' | 'assigned'; label: string }[] = [
  { key: 'all', label: 'All status' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
];

export function QuickSellScreen() {
  const insets = useSafeAreaInsets();
  const page = useQuickSellPage();

  const renderOrder = ({ item }: { item: QuickSellOrder }) => (
    <QuickSellOrderCard
      order={item}
      formatTaka={page.formatTaka}
    />
  );

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <FlatList
        data={page.orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        onEndReached={() => page.loadMore()}
        onEndReachedThreshold={0.35}
        onRefresh={page.refreshList}
        refreshing={page.loading && page.orders.length > 0}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#312e81', '#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroIcon}>
                <Zap color="#ffffff" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Quick Sell</Text>
                <Text style={styles.heroSub}>Fast, direct customer sale</Text>
              </View>
              <TouchableOpacity style={styles.addFab} onPress={page.handleOpenAddModal}>
                <Plus color="#4f46e5" size={18} strokeWidth={2.6} />
                <Text style={styles.addFabText}>New</Text>
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.accentPrimary }]} />
                <Text style={styles.statValue}>
                  {String(page.stats?.orders ?? page.orders.length)}
                </Text>
                <Text style={styles.statLabel}>Sales</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.statusWarning }]} />
                <Text style={styles.statValue}>{String(page.stats?.todayCount ?? 0)}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statDot, { backgroundColor: colors.statusError }]} />
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                  {page.formatTaka(page.stats?.pendingAmount ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {page.branchList.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.branchRow}
              >
                {page.branchList.map((b) => {
                  const active = b.id === page.filterBranchId;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[styles.branchChip, active && styles.branchChipOn]}
                      onPress={() => page.setFilterBranchId(b.id)}
                    >
                      <Text style={[styles.branchText, active && styles.branchTextOn]}>
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.searchRow}>
              <Search color={colors.accentPrimary} size={18} />
              <TextInput
                style={styles.searchInput}
                value={page.searchTerm}
                onChangeText={page.setSearchTerm}
                placeholder="Search product, order no, customer..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {page.searchTerm ? (
                <TouchableOpacity onPress={() => page.setSearchTerm('')}>
                  <X color={colors.textMuted} size={17} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {STATUS_FILTERS.map((f) => {
                const active = page.filterStatus === f.key;
                return (
                  <TouchableOpacity
                    key={`st-${f.key}`}
                    style={[styles.filterChip, active && styles.filterChipOn]}
                    onPress={() => page.setFilterStatus(f.key)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextOn]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {page.error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{page.error}</Text>
                <TouchableOpacity onPress={page.refreshList}>
                  <Text style={styles.retry}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {page.loading && page.orders.length === 0 ? (
              <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 36 }} />
            ) : null}
          </>
        }
        ListEmptyComponent={
          !page.loading ? (
            <View style={styles.empty}>
              <Package color={colors.textMuted} size={42} strokeWidth={1.3} />
              <Text style={styles.emptyTitle}>No quick sells</Text>
              <Text style={styles.emptyText}>Tap New to create a direct quick sale</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          page.loading && page.orders.length > 0 ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 16 }} />
          ) : page.orders.length ? (
            <View style={styles.footerRow}>
              <PackageCheck color={colors.textMuted} size={13} />
              <Text style={styles.footerHint}>
                Showing {page.orders.length} of {page.total}
              </Text>
            </View>
          ) : null
        }
      />

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  listContent: { paddingBottom: 130 },

  hero: {
    margin: spacing.sm,
    borderRadius: radius.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: { color: '#ffffff', fontSize: 23, fontWeight: '900', letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 11.5, marginTop: 3 },
  addFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  addFabText: { color: '#4f46e5', fontWeight: '900', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.sm, marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: 11,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 7 },

  branchRow: { paddingHorizontal: spacing.sm, gap: 7, paddingVertical: 8 },
  branchChip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 11,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  branchChipOn: { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
  branchText: { color: colors.textMuted, fontWeight: '700', fontSize: 11 },
  branchTextOn: { color: '#ffffff' },

  searchRow: {
    marginHorizontal: spacing.sm,
    marginTop: 2,
    marginBottom: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, paddingVertical: 10 },

  filterRow: { flexDirection: 'row', gap: 7, paddingHorizontal: spacing.sm, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipOn: { backgroundColor: colors.accentSoft, borderColor: colors.borderAccent },
  filterChipText: { color: colors.textMuted, fontWeight: '700', fontSize: 11 },
  filterChipTextOn: { color: colors.accentPrimary },

  errorBox: {
    marginHorizontal: spacing.sm,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { flex: 1, color: colors.statusError, fontSize: 12 },
  retry: { color: colors.statusError, fontWeight: '800', fontSize: 12 },

  empty: { alignItems: 'center', padding: 42 },
  emptyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerHint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 14,
  },
});
