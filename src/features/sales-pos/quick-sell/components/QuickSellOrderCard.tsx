import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Hash,
  Package,
  Truck,
  User,
  Calendar,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/theme/tokens';
import { parseSerialField, statusTone } from '../utils/formatters';
import type { QuickSellOrder } from '../types';

type Props = {
  order: QuickSellOrder;
  formatTaka: (n: number) => string;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function QuickSellOrderCard({
  order,
  formatTaka,
}: Props) {
  const tone = statusTone(order.status);
  const serials = parseSerialField(order.serialNumbers);
  const accent =
    order.status === 'pending'
      ? colors.statusWarning
      : order.status === 'assigned'
        ? colors.statusSuccess
        : order.status === 'returned'
          ? '#2563eb'
          : '#94a3b8';

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Package color={colors.accentPrimary} size={20} />
        </View>
        <View style={styles.topBody}>
          <Text style={styles.product} numberOfLines={1}>
            {order.productName}
          </Text>
          {order.attribute ? (
            <Text style={styles.attr} numberOfLines={1}>
              {order.attribute}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Calendar color={colors.textMuted} size={11} />
            <Text style={styles.meta}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>{order.orderNo || order.invoiceNo}</Text>
          </View>
        </View>
        <View style={[styles.badge, { borderColor: `${accent}55` }]}>
          <Text style={[styles.badgeText, { color: tone.text }]}>{tone.label}</Text>
        </View>
      </View>

      <View style={styles.saleRow}>
        <View style={styles.saleDetails}>
          <Text style={styles.saleDetailText}>×{order.quantity}</Text>
          <View style={styles.saleDot} />
          <Text style={styles.saleDetailText}>{formatTaka(order.sellingPrice)} / unit</Text>
        </View>
        <Text style={styles.metricTotal}>{formatTaka(order.totalAmount)}</Text>
      </View>

      {serials.length > 0 ? (
        <View style={styles.serialRow}>
          <Hash color={colors.accentPrimary} size={12} />
          <Text style={styles.serialText} numberOfLines={1}>
            {serials.slice(0, 2).join(', ')}
            {serials.length > 2 ? ` +${serials.length - 2}` : ''}
          </Text>
        </View>
      ) : null}

      {(order.customer?.name || order.supplier) ? (
        <View style={styles.peopleRow}>
          {order.customer?.name ? (
            <View style={styles.personChip}>
              <User color={colors.textMuted} size={12} />
              <Text style={styles.personText} numberOfLines={1}>
                {order.customer.name}
              </Text>
            </View>
          ) : null}
          {order.supplier ? (
            <View style={[styles.personChip, styles.supplierChip]}>
              <Truck color="#2563eb" size={12} />
              <Text style={[styles.personText, { color: '#1d4ed8' }]} numberOfLines={1}>
                {[order.supplier.name, order.supplier.companyName].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    padding: 13,
    marginHorizontal: spacing.sm,
    marginBottom: 10,
  },
  top: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  topBody: { flex: 1, minWidth: 0 },
  product: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  attr: { color: colors.textMuted, fontSize: 12, marginTop: 1, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2, flexWrap: 'wrap' },
  meta: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  dot: { color: colors.textMuted, fontSize: 11 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  saleDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  saleDetailText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saleDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  metricTotal: { color: colors.accentPrimary, fontSize: 16, fontWeight: '900', marginLeft: 8 },
  serialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 5,
  },
  serialText: { flex: 1, color: colors.accentPrimary, fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  peopleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 2 },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: '100%',
  },
  supplierChip: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  personText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', maxWidth: 180 },
});
