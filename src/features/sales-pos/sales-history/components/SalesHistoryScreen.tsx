import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Building2,
  ChevronRight,
  FileText,
  PackageCheck,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SALE_TYPE_OPTIONS,
  useSalesHistoryList,
} from '../hooks/useSalesHistoryList';
import { formatMoney, formatShortDate, paymentStatusColor } from '../utils';
import type { SalesHistoryListItem } from '../types';

type PickerKind = 'branch' | 'orderStatus' | 'paymentStatus' | 'orderType' | null;

function typeMeta(orderType?: string | null) {
  const t = (orderType || '').toLowerCase();
  if (t === 'wholesale') {
    return { label: 'Wholesale', color: '#0369a1', bg: '#e0f2fe', Icon: Building2 };
  }
  if (t === 'quick_sell') {
    return { label: 'Quick Sell', color: '#b45309', bg: '#fffbeb', Icon: Zap };
  }
  return { label: 'POS', color: colors.accentPrimary, bg: colors.accentSoft, Icon: ShoppingBag };
}

function OrderCard({
  item,
  onPress,
}: {
  item: SalesHistoryListItem;
  onPress: () => void;
}) {
  const statusColor = paymentStatusColor(item.paymentStatus);
  const type = typeMeta(item.orderType);
  const TypeIcon = type.Icon;
  const due = Number(item.dueAmount) || 0;

  return (
    <TouchableOpacity
      style={[styles.shCard, { borderLeftColor: statusColor }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.shCardTop}>
        <View style={[styles.shCardIcon, { backgroundColor: type.bg }]}>
          <TypeIcon color={type.color} size={18} />
        </View>
        <View style={styles.shCardBody}>
          <Text style={styles.shCardInvoice} numberOfLines={1}>
            {item.invoiceNo || item.orderNo}
          </Text>
          <View style={styles.shCardMetaRow}>
            <User color={colors.textMuted} size={11} />
            <Text style={styles.shCardMeta} numberOfLines={1}>
              {item.customerName || 'Walk-in'}
            </Text>
            <Text style={styles.shCardDot}>·</Text>
            <Text style={styles.shCardMeta}>{formatShortDate(item.orderDate)}</Text>
          </View>
        </View>
        <View style={[styles.shStatusPill, { borderColor: `${statusColor}44`, backgroundColor: `${statusColor}12` }]}>
          <Text style={[styles.shStatusText, { color: statusColor }]}>{item.paymentStatus}</Text>
        </View>
      </View>

      <View style={styles.shCardBottom}>
        <View style={[styles.shTypePill, { backgroundColor: type.bg }]}>
          <Text style={[styles.shTypeText, { color: type.color }]}>{type.label}</Text>
        </View>
        <View style={styles.shAmounts}>
          <Text style={styles.shTotal}>{formatMoney(item.grandTotal)}</Text>
          {due > 0.009 ? (
            <Text style={styles.shDue}>Due {formatMoney(due)}</Text>
          ) : (
            <Text style={styles.shPaidHint}>Settled</Text>
          )}
        </View>
        <ChevronRight color={colors.textMuted} size={18} />
      </View>
    </TouchableOpacity>
  );
}

export function SalesHistoryScreen() {
  const router = useRouter();
  const list = useSalesHistoryList();
  const [picker, setPicker] = useState<PickerKind>(null);

  const branchLabel =
    list.branches.find((b) => b.id === list.filters.branchId)?.name || 'Branch';
  const orderStatusLabel =
    ORDER_STATUS_OPTIONS.find((o) => o.value === list.filters.orderStatus)?.label || 'Status';
  const paymentLabel =
    PAYMENT_STATUS_OPTIONS.find((o) => o.value === list.filters.paymentStatus)?.label ||
    'Payment';
  const typeLabel =
    SALE_TYPE_OPTIONS.find((o) => o.value === list.filters.orderType)?.label || 'Type';

  const pageStats = useMemo(() => {
    const revenue = list.orders.reduce((s, o) => s + (Number(o.grandTotal) || 0), 0);
    const due = list.orders.reduce((s, o) => s + (Number(o.dueAmount) || 0), 0);
    return { revenue, due };
  }, [list.orders]);

  const openPickerOptions = () => {
    if (picker === 'branch') {
      return list.branches.map((b) => ({ value: b.id, label: b.name }));
    }
    if (picker === 'orderStatus') {
      return ORDER_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
    }
    if (picker === 'paymentStatus') {
      return PAYMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
    }
    if (picker === 'orderType') {
      return SALE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
    }
    return [];
  };

  const applyPicker = (value: string) => {
    if (picker === 'branch') list.updateFilter('branchId', value);
    if (picker === 'orderStatus') list.updateFilter('orderStatus', value);
    if (picker === 'paymentStatus') list.updateFilter('paymentStatus', value);
    if (picker === 'orderType') {
      list.updateFilter('orderType', value as typeof list.filters.orderType);
    }
    setPicker(null);
  };

  const pickerTitle =
    picker === 'branch'
      ? 'Branch'
      : picker === 'orderStatus'
        ? 'Order status'
        : picker === 'paymentStatus'
          ? 'Payment status'
          : picker === 'orderType'
            ? 'Sale type'
            : '';

  return (
    <View style={styles.listRoot}>
      <FlatList
        data={list.orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.shListContent}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={() => void list.refresh()}
            tintColor={colors.accentPrimary}
          />
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#312e81', '#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shHero}
            >
              <View style={styles.shHeroIcon}>
                <Receipt color="#ffffff" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shHeroTitle}>Sales history</Text>
                <Text style={styles.shHeroSub}>Orders, invoices & payments</Text>
              </View>
              <View style={styles.shHeroBadge}>
                <Text style={styles.shHeroBadgeText}>{list.total}</Text>
              </View>
            </LinearGradient>

            <View style={styles.shStatsRow}>
              <View style={styles.shStatCard}>
                <View style={[styles.shStatDot, { backgroundColor: colors.accentPrimary }]} />
                <Text style={styles.shStatValue}>{String(list.total)}</Text>
                <Text style={styles.shStatLabel}>Orders</Text>
              </View>
              <View style={styles.shStatCard}>
                <View style={[styles.shStatDot, { backgroundColor: colors.statusSuccess }]} />
                <Text style={styles.shStatValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(pageStats.revenue)}
                </Text>
                <Text style={styles.shStatLabel}>Loaded</Text>
              </View>
              <View style={styles.shStatCard}>
                <View style={[styles.shStatDot, { backgroundColor: colors.statusWarning }]} />
                <Text style={styles.shStatValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(pageStats.due)}
                </Text>
                <Text style={styles.shStatLabel}>Due</Text>
              </View>
            </View>

            <View style={styles.shSearchRow}>
              <Search color={colors.accentPrimary} size={18} />
              <TextInput
                style={styles.shSearchInput}
                value={list.searchInput}
                onChangeText={list.setSearchInput}
                placeholder="Invoice, order, customer, phone, SKU, IMEI…"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {list.searchInput ? (
                <TouchableOpacity onPress={() => list.setSearchInput('')} hitSlop={8}>
                  <X color={colors.textMuted} size={17} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shFilterRow}
            >
              <TouchableOpacity
                style={[styles.shFilterChip, !!list.filters.branchId && styles.shFilterChipOn]}
                onPress={() => setPicker('branch')}
              >
                <Text
                  style={[styles.shFilterChipText, !!list.filters.branchId && styles.shFilterChipTextOn]}
                  numberOfLines={1}
                >
                  {branchLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shFilterChip, !!list.filters.orderType && styles.shFilterChipOn]}
                onPress={() => setPicker('orderType')}
              >
                <Text
                  style={[styles.shFilterChipText, !!list.filters.orderType && styles.shFilterChipTextOn]}
                >
                  {typeLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shFilterChip, !!list.filters.orderStatus && styles.shFilterChipOn]}
                onPress={() => setPicker('orderStatus')}
              >
                <Text
                  style={[
                    styles.shFilterChipText,
                    !!list.filters.orderStatus && styles.shFilterChipTextOn,
                  ]}
                >
                  {orderStatusLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shFilterChip, !!list.filters.paymentStatus && styles.shFilterChipOn]}
                onPress={() => setPicker('paymentStatus')}
              >
                <Text
                  style={[
                    styles.shFilterChipText,
                    !!list.filters.paymentStatus && styles.shFilterChipTextOn,
                  ]}
                >
                  {paymentLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shFilterChip} onPress={list.clearFilters}>
                <RotateCcw color={colors.textMuted} size={12} />
                <Text style={styles.shFilterChipText}>Reset</Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.shEmpty}>
              <FileText color={colors.textMuted} size={42} strokeWidth={1.3} />
              <Text style={styles.shEmptyTitle}>No sales found</Text>
              <Text style={styles.shEmptyText}>
                {list.error || 'Try adjusting search or filters'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          list.loadingMore ? (
            <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 16 }} />
          ) : list.orders.length ? (
            <View style={styles.shFooterRow}>
              <PackageCheck color={colors.textMuted} size={13} />
              <Text style={styles.shFooterHint}>
                Showing {list.orders.length} of {list.total}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            onPress={() =>
              router.push(`/admin/sales-pos/sales-history/${item.id}` as never)
            }
          />
        )}
      />

      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPicker(null)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.shPickerHandle} />
            <Text style={styles.pickerTitle}>{pickerTitle}</Text>
            <FlatList
              data={openPickerOptions()}
              keyExtractor={(item) => item.value || 'all'}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const selected =
                  (picker === 'branch' && item.value === list.filters.branchId) ||
                  (picker === 'orderStatus' && item.value === list.filters.orderStatus) ||
                  (picker === 'paymentStatus' && item.value === list.filters.paymentStatus) ||
                  (picker === 'orderType' && item.value === list.filters.orderType);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, selected && styles.pickerItemOn]}
                    onPress={() => applyPicker(item.value)}
                  >
                    <Text style={styles.accountName}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
