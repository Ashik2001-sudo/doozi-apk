import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Clock, Package } from 'lucide-react-native';
import { colors, shadows } from '@/theme/tokens';
import { styles } from '../styles';
import {
  fulfillmentStatusColor,
  formatWholesaleDate,
  formatWholesaleTime,
  getFulfillmentStatusLabel,
  getOrderStatusFromItems,
  money,
  WholesaleOrder,
} from '../types';

type Props = {
  order: WholesaleOrder;
  onPress: () => void;
};

function accentColor(order: WholesaleOrder) {
  const items = order.items || [];
  if (items.length && items.every((i) => (i.status || '').toLowerCase() === 'sold_out')) {
    return colors.statusSuccess;
  }
  if (items.some((i) => (i.status || '').toLowerCase() === 'returned')) return '#2563eb';
  return colors.statusWarning;
}

export const OrderCard = React.memo(function OrderCard({ order, onPress }: Props) {
  const items = order.items || [];
  const pendingCount = items.filter(
    (i) => (i.status || 'pending').toLowerCase() === 'pending',
  ).length;
  const soldCount = items.filter((i) => {
    const s = (i.status || '').toLowerCase();
    return s === 'sold' || s === 'sold_out';
  }).length;
  const fulfillmentStatus = getOrderStatusFromItems(items, order);
  const statusLabel = getFulfillmentStatusLabel(fulfillmentStatus);
  const statusColor = fulfillmentStatusColor(fulfillmentStatus);
  const accent = accentColor(order);
  const retailer = order.retailer?.name || order.retailerName || 'Retailer';
  const dateLabel = formatWholesaleDate(order.orderDate);
  const timeLabel = formatWholesaleTime(order.orderDate);

  return (
    <TouchableOpacity
      style={[styles.orderCard, shadows.soft]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Open order ${order.orderNo}`}
    >
      <View style={[styles.orderAccent, { backgroundColor: accent }]} />

      <View style={styles.orderCardBody}>
        <View style={styles.orderHead}>
          <View style={[styles.orderIcon, { backgroundColor: `${statusColor}14` }]}>
            <Package color={statusColor} size={20} />
          </View>

          <View style={styles.orderHeadMain}>
            <View style={styles.orderTitleRow}>
              <Text style={styles.orderNo} numberOfLines={1}>
                {order.orderNo}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: `${statusColor}14`,
                    borderColor: `${statusColor}35`,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.orderMetaRow}>
              <Clock color={colors.textMuted} size={12} />
              <Text style={styles.orderMeta}>
                {dateLabel} · {timeLabel}
              </Text>
            </View>

            <Text style={styles.orderRetailer} numberOfLines={1}>
              {retailer}
              {order.branch?.name ? ` · ${order.branch.name}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.orderSummaryLeft}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{items.length}</Text>
            </View>
            <View>
              <Text style={styles.orderTotal}>{money(order.grandTotal)}</Text>
              <Text style={styles.orderProgressHint}>
                {pendingCount > 0
                  ? `${pendingCount} pending · ${soldCount} sold`
                  : `${soldCount} sold`}
              </Text>
            </View>
          </View>
          <View style={styles.openChip}>
            <Text style={styles.openChipText}>Open</Text>
            <ChevronRight color={colors.accentPrimary} size={15} strokeWidth={2.4} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
