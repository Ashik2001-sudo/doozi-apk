import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Package, PackageCheck, Plus, Search, X } from 'lucide-react-native';
import { colors, shadows } from '@/theme/tokens';
import { styles } from '../styles';
import { money, StatusFilter, WholesaleItem, WholesaleOrder } from '../types';
import type { UseWholesaleOrders } from '../hooks/useWholesaleOrders';
import { OrderCard } from './OrderCard';

type Props = {
  orders: UseWholesaleOrders;
  onCreate: () => void;
  onOpenSale: (saleOrderId: string) => void;
  onSellOut: (order: WholesaleOrder, item: WholesaleItem) => void;
  onReturn: (order: WholesaleOrder, item: WholesaleItem) => void;
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All status' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Complete' },
];

export function WholesaleList({ orders, onCreate, onOpenSale, onSellOut, onReturn }: Props) {
  const {
    branchList,
    branchId,
    selectBranch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    orders: list,
    total,
    loading,
    loadingMore,
    error,
    expandedId,
    toggleExpand,
    stats,
    refresh,
    loadMore,
  } = orders;

  return (
    <FlatList
      data={list}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          expanded={expandedId === item.id}
          onToggle={() => toggleExpand(item.id)}
          onOpenSale={onOpenSale}
          onSellOut={onSellOut}
          onReturn={onReturn}
        />
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      onRefresh={refresh}
      refreshing={loading && list.length > 0}
      ListHeaderComponent={
        <>
          <LinearGradient
            colors={['#312e81', '#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <Building2 color="#ffffff" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Wholesale</Text>
              <Text style={styles.heroSub}>Create orders, sell out & return</Text>
            </View>
            <TouchableOpacity style={styles.addFab} onPress={onCreate}>
              <Plus color="#4f46e5" size={18} strokeWidth={2.6} />
              <Text style={styles.addFabText}>New</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: colors.accentPrimary }]} />
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: colors.statusWarning }]} />
              <Text style={styles.statValue}>{stats.pendingItems}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: colors.statusSuccess }]} />
              <Text style={styles.statValue}>{stats.soldItems}</Text>
              <Text style={styles.statLabel}>Sold</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statDot, { backgroundColor: '#0891b2' }]} />
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {money(stats.loadedValue)}
              </Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.branchRow}
          >
            {branchList.map((b) => {
              const active = b.id === branchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchChip, active && styles.branchChipOn]}
                  onPress={() => selectBranch(b.id)}
                >
                  <Text style={[styles.branchText, active && styles.branchTextOn]}>{b.name}</Text>
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
              placeholder="Search order no, retailer, product, SKU, IMEI..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
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
              const active = statusFilter === f.key;
              return (
                <TouchableOpacity
                  key={`st-${f.key}`}
                  style={[styles.filterChip, active && styles.filterChipOn]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextOn]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={refresh}>
                <Text style={styles.retry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {loading && list.length === 0 ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 36 }} />
          ) : null}
        </>
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Package color={colors.textMuted} size={42} strokeWidth={1.3} />
            <Text style={styles.emptyTitle}>No wholesale orders</Text>
            <Text style={styles.emptyText}>Tap New to create a retailer wholesale order</Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 16 }} />
        ) : list.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <PackageCheck color={colors.textMuted} size={13} />
            <Text style={styles.footerHint}>
              Showing {list.length} of {total}
            </Text>
          </View>
        ) : null
      }
    />
  );
}
