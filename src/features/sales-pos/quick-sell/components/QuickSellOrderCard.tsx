import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Hash,
  Package,
  RotateCcw,
  Truck,
  User,
  Calendar,
} from 'lucide-react-native';
import { colors, radius, shadows } from '@/theme/tokens';
import { parseSerialField, statusTone } from '../utils/formatters';
import type { QuickSellOrder } from '../types';

type Props = {
  order: QuickSellOrder;
  formatTaka: (n: number) => string;
  busy?: boolean;
  onReturn: () => void;
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
  busy,
  onReturn,
}: Props) {
  const tone = statusTone(order.status);
  const serials = parseSerialField(order.serialNumbers);
  const accent =
    order.status === 'pending'
      ? '#f59e0b'
      : order.status === 'assigned'
        ? '#10b981'
        : order.status === 'returned'
          ? '#ef4444'
          : '#94a3b8';

  return (
    <View style={[styles.card, shadows.soft, { borderLeftColor: accent }]}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
          <Package color={accent} size={18} />
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
        <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
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
          <Hash color="#0f766e" size={12} />
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

      {order.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnReturn} onPress={onReturn} disabled={busy}>
            <RotateCcw color="#dc2626" size={14} />
            <Text style={styles.btnReturnText}>Return Sale</Text>
          </TouchableOpacity>
          {busy ? <ActivityIndicator color="#0f766e" size="small" /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 8,
  },
  top: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBody: { flex: 1, minWidth: 0 },
  product: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
  attr: { color: colors.textMuted, fontSize: 12, marginTop: 1, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2, flexWrap: 'wrap' },
  meta: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  dot: { color: colors.textMuted, fontSize: 11 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginBottom: 6,
  },
  saleDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  saleDetailText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saleDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  metricTotal: { color: '#0f766e', fontSize: 16, fontWeight: '800', marginLeft: 8 },
  serialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 5,
  },
  serialText: { flex: 1, color: '#0f766e', fontSize: 12, fontWeight: '600' },
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
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  btnReturn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  btnReturnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },
});
