import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { itemStatusColor, money, variantLabel, WholesaleItem, WholesaleOrder } from '../types';

type Props = {
  order: WholesaleOrder;
  expanded: boolean;
  onToggle: () => void;
  onOpenSale: (saleOrderId: string) => void;
  onSellOut: (order: WholesaleOrder, item: WholesaleItem) => void;
  onReturn: (order: WholesaleOrder, item: WholesaleItem) => void;
};

function statusBorderColor(order: WholesaleOrder) {
  const items = order.items || [];
  if (items.length && items.every((i) => (i.status || '').toLowerCase() === 'sold' || (i.status || '').toLowerCase() === 'sold_out'))
    return colors.statusSuccess;
  if (items.some((i) => (i.status || '').toLowerCase() === 'returned')) return '#2563eb';
  return colors.statusWarning;
}

export const OrderCard = React.memo(function OrderCard({
  order,
  expanded,
  onToggle,
  onOpenSale,
  onSellOut,
  onReturn,
}: Props) {
  const pendingCount = (order.items || []).filter(
    (i) => (i.status || 'pending').toLowerCase() === 'pending',
  ).length;
  const itemCount = order.items?.length || 0;

  return (
    <View style={[styles.orderCard, { borderLeftColor: statusBorderColor(order) }]}>
      <TouchableOpacity style={styles.orderHead} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.orderIcon}>
          <Package color={colors.accentPrimary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNo}>{order.orderNo}</Text>
          <Text style={styles.orderMeta}>
            {order.retailer?.name || order.retailerName || 'Retailer'} · {order.branch?.name || '—'}
          </Text>
          <Text style={styles.orderMeta}>
            <Clock color={colors.textMuted} size={10} />{' '}
            {new Date(order.orderDate).toLocaleDateString()}
            {pendingCount ? ` · ${pendingCount} pending` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.orderTotal}>{money(order.grandTotal)}</Text>
          <View style={[styles.statusPill, { borderColor: `${itemStatusColor(order.orderStatus)}55` }]}>
            <Text style={[styles.statusText, { color: itemStatusColor(order.orderStatus) }]}>
              {order.orderStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.summaryStrip}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.orderMeta}>{itemCount === 1 ? 'item' : 'items'}</Text>
        </View>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onPress={onToggle}
        >
          <Text style={[styles.link, { marginTop: 0 }]}>{expanded ? 'Hide' : 'View'}</Text>
          {expanded ? (
            <ChevronDown color={colors.accentPrimary} size={16} />
          ) : (
            <ChevronRight color={colors.accentPrimary} size={16} />
          )}
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.itemsWrap}>
          {(order.items || []).map((it) => {
            const st = (it.status || 'pending').toLowerCase();
            const color = itemStatusColor(st);
            const sold = st === 'sold' || st === 'sold_out';
            const pending = st === 'pending';
            return (
              <View key={it.id} style={styles.itemCard}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {it.productName}
                </Text>
                <Text style={styles.itemMeta}>
                  {it.sku}
                  {variantLabel(it.variant) ? ` · ${variantLabel(it.variant)}` : ''}
                </Text>
                <Text style={styles.itemMeta}>
                  Qty {it.quantity} × {money(it.unitPrice)} ={' '}
                  {money(Number(it.totalPrice) || it.quantity * it.unitPrice)}
                  {Number(it.paidAmount) > 0 ? ` · Paid ${money(Number(it.paidAmount))}` : ''}
                </Text>
                {it.serialNumbers?.length ? (
                  <Text style={styles.serials} numberOfLines={2}>
                    IMEI: {it.serialNumbers.join(', ')}
                  </Text>
                ) : null}
                <View style={styles.itemFooter}>
                  <View style={[styles.statusPill, { borderColor: `${color}55` }]}>
                    <Text style={[styles.statusText, { color }]}>
                      {sold ? 'Sold' : st === 'returned' ? 'Returned' : 'Pending'}
                    </Text>
                  </View>
                  <View style={styles.itemActions}>
                    {it.saleOrderId ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.viewBtn]}
                        onPress={() => onOpenSale(it.saleOrderId as string)}
                      >
                        <Text style={[styles.actionText, { color: colors.accentPrimary }]}>Sale</Text>
                      </TouchableOpacity>
                    ) : null}
                    {pending ? (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onSellOut(order, it)}
                      >
                        <ShoppingCart color="#ffffff" size={12} />
                        <Text style={styles.actionText}>Sell</Text>
                      </TouchableOpacity>
                    ) : null}
                    {pending || sold ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.returnBtn]}
                        onPress={() => onReturn(order, it)}
                      >
                        <RotateCcw color="#ffffff" size={12} />
                        <Text style={styles.actionText}>Return</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});
