import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Building2,
  Clock,
  Package,
  RotateCcw,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import {
  fulfillmentStatusColor,
  formatWholesaleDate,
  formatWholesaleDateTime,
  formatWholesaleTime,
  getFulfillmentStatusLabel,
  getOrderStatusFromItems,
  getWholesaleInTimeBase,
  getWholesaleSellOutAt,
  itemStatusColor,
  money,
  variantLabel,
  WholesaleItem,
  WholesaleOrder,
} from '../types';

type Props = {
  order: WholesaleOrder | null;
  onClose: () => void;
  onSellOut: (order: WholesaleOrder, item: WholesaleItem) => void;
  onReturn: (order: WholesaleOrder, item: WholesaleItem) => void;
};

function itemInTimeParts(item: WholesaleItem, orderDate?: string) {
  const base = getWholesaleInTimeBase(item, orderDate);
  if (!base) return { time: '—', extraDate: null as string | null };
  const time = formatWholesaleTime(base);
  let extraDate: string | null = null;
  if (item.createdAt && orderDate) {
    const dItem = new Date(item.createdAt);
    const dOrder = new Date(orderDate);
    const sameDay =
      dItem.getFullYear() === dOrder.getFullYear() &&
      dItem.getMonth() === dOrder.getMonth() &&
      dItem.getDate() === dOrder.getDate();
    if (!sameDay) extraDate = formatWholesaleDate(item.createdAt);
  }
  return { time, extraDate };
}

export function OrderDetailModal({ order, onClose, onSellOut, onReturn }: Props) {
  const items = order?.items || [];
  const pendingCount = items.filter(
    (i) => (i.status || 'pending').toLowerCase() === 'pending',
  ).length;
  const soldCount = items.filter((i) => {
    const s = (i.status || '').toLowerCase();
    return s === 'sold' || s === 'sold_out';
  }).length;
  const fulfillmentStatus = order ? getOrderStatusFromItems(items, order) : 'pending';
  const statusLabel = getFulfillmentStatusLabel(fulfillmentStatus);
  const statusColor = fulfillmentStatusColor(fulfillmentStatus);
  const retailer = order?.retailer?.name || order?.retailerName || 'Retailer';
  const employee =
    order?.assignedEmployee?.fullName || order?.assignedEmployee?.employeeId || '';

  return (
    <Modal visible={!!order} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <Pressable style={styles.detailBackdrop} onPress={onClose} />
        {order ? (
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />

            <View style={styles.detailHeader}>
              <View style={[styles.detailHeaderIcon, { backgroundColor: `${statusColor}14` }]}>
                <Package color={statusColor} size={22} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.detailEyebrow}>Wholesale order</Text>
                <Text style={styles.detailTitle} numberOfLines={1}>
                  {order.orderNo}
                </Text>
                <View style={styles.detailTimeRow}>
                  <Clock color={colors.textMuted} size={12} />
                  <Text style={styles.orderMeta}>{formatWholesaleDateTime(order.orderDate)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose} hitSlop={10}>
                <X color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailInfoCard}>
              <View style={styles.detailInfoRow}>
                <Store color={colors.textMuted} size={14} />
                <Text style={styles.detailInfoText} numberOfLines={1}>
                  {retailer}
                </Text>
              </View>
              {order.branch?.name ? (
                <View style={styles.detailInfoRow}>
                  <Building2 color={colors.textMuted} size={14} />
                  <Text style={styles.detailInfoText} numberOfLines={1}>
                    {order.branch.name}
                  </Text>
                </View>
              ) : null}
              {employee ? (
                <Text style={styles.detailEmployee} numberOfLines={1}>
                  Staff: {employee}
                </Text>
              ) : null}
            </View>

            <View style={styles.detailSummary}>
              <View>
                <Text style={styles.detailTotal}>{money(order.grandTotal)}</Text>
                <Text style={styles.detailSummaryHint}>
                  {items.length} items · {soldCount} sold · {pendingCount} pending
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: `${statusColor}14`,
                    borderWidth: 1,
                    borderColor: `${statusColor}35`,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { paddingHorizontal: 16 }]}>
              Items ({items.length})
            </Text>

            <ScrollView
              style={styles.detailScroll}
              contentContainerStyle={styles.detailScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {items.map((it, itemIdx) => {
                const st = (it.status || 'pending').toLowerCase();
                const color = itemStatusColor(st);
                const sold = st === 'sold' || st === 'sold_out';
                const pending = st === 'pending';
                const returned = st === 'returned';
                const itemTotal = Number(it.totalPrice) || it.quantity * it.unitPrice;
                const itemPaid = Number(it.paidAmount) || 0;
                const variant = variantLabel(it.variant);
                const inParts = itemInTimeParts(it, order.orderDate);
                const soAt = getWholesaleSellOutAt(it);
                const soTime = soAt ? formatWholesaleTime(soAt) : '—';
                const invoiceNo = it.itemInvoiceNo || `${order.orderNo}-${itemIdx + 1}`;
                const serials = it.serialNumbers?.length ? it.serialNumbers.join(', ') : '—';

                return (
                  <View key={it.id} style={styles.detailItemCard}>
                    <View style={styles.detailItemTop}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {it.productName}
                        </Text>
                        <Text style={styles.itemMeta} numberOfLines={1}>
                          {variant || it.sku || '—'} · Qty {it.quantity} · {money(itemTotal)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: `${color}14`,
                            borderWidth: 1,
                            borderColor: `${color}35`,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color }]}>
                          {sold ? 'Sold' : returned ? 'Returned' : 'Pending'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailTimeGrid}>
                      <View style={styles.detailTimeCell}>
                        <Clock color={colors.textMuted} size={11} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.detailTimeText}>In: {inParts.time}</Text>
                          {inParts.extraDate ? (
                            <Text style={styles.detailTimeExtra}>{inParts.extraDate}</Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.detailTimeCell}>
                        <Text style={styles.detailTimeText}>S/O: {soTime}</Text>
                      </View>
                    </View>

                    <Text style={styles.serials} numberOfLines={2}>
                      IMEI: {serials}
                    </Text>

                    <View style={styles.detailItemFoot}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.detailInvoice} numberOfLines={1}>
                          {invoiceNo}
                        </Text>
                        {sold || itemPaid > 0 ? (
                          <Text style={styles.detailPaidHint}>Paid {money(itemPaid)}</Text>
                        ) : (
                          <Text style={styles.itemMeta}>{money(it.unitPrice)} / unit</Text>
                        )}
                      </View>

                      {pending ? (
                        <View style={styles.detailItemActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => onSellOut(order, it)}
                          >
                            <ShoppingCart color="#ffffff" size={13} />
                            <Text style={styles.actionText}>Sell</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.returnBtn]}
                            onPress={() => onReturn(order, it)}
                          >
                            <RotateCcw color="#ffffff" size={13} />
                            <Text style={styles.actionText}>Return</Text>
                          </TouchableOpacity>
                        </View>
                      ) : returned ? null : sold ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.returnBtn]}
                          onPress={() => onReturn(order, it)}
                        >
                          <RotateCcw color="#ffffff" size={13} />
                          <Text style={styles.actionText}>Return</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
