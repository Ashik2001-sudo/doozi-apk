import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Clock, Package, User, Zap } from 'lucide-react-native';
import { colors, shadows, spacing } from '@/theme/tokens';
import { parseSerialField, statusTone } from '../utils/formatters';
import type { QuickSellOrder } from '../types';

type Props = {
  order: QuickSellOrder;
  formatTaka: (n: number) => string;
  onOpenDetails?: (saleOrderId: string) => void;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('en-BD', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function accentForStatus(status?: string) {
  if (status === 'pending') return colors.accentPrimary;
  if (status === 'assigned') return colors.statusSuccess;
  if (status === 'returned') return '#d97706';
  return '#94a3b8';
}

export function QuickSellOrderCard({ order, formatTaka, onOpenDetails }: Props) {
  const tone = statusTone(order.status);
  const accent = accentForStatus(order.status);
  const saleOrderId = order.saleOrderId?.trim() || '';
  const canOpenDetails = !!saleOrderId && typeof onOpenDetails === 'function';
  const orderRef = order.orderNo || order.invoiceNo || '—';
  const serials = parseSerialField(order.serialNumbers);
  const customer = order.customer?.name?.trim() || 'Walk-in';
  const supplier = [order.supplier?.name, order.supplier?.companyName]
    .filter(Boolean)
    .join(' · ');
  const staff = order.assignedEmployee?.fullName || order.assignedEmployee?.employeeId || '';
  const imeiPreview = serials.length
    ? serials.length === 1
      ? serials[0]
      : `${serials[0]} +${serials.length - 1}`
    : null;

  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: accent }]} />

      <View style={styles.body}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: `${accent}14` }]}>
            <Zap color={accent} size={18} />
          </View>

          <View style={styles.headMain}>
            <View style={styles.titleRow}>
              <Text style={styles.product} numberOfLines={1}>
                {order.productName}
              </Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: `${accent}14`,
                    borderColor: `${accent}35`,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: tone.text }]}>{tone.label}</Text>
              </View>
            </View>

            {order.attribute ? (
              <View style={styles.attrChip}>
                <Text style={styles.attrText} numberOfLines={1}>
                  {order.attribute}
                </Text>
              </View>
            ) : null}

            <View style={styles.metaRow}>
              <Clock color={colors.textMuted} size={12} />
              <Text style={styles.meta}>
                {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <User color={colors.textMuted} size={12} />
              <Text style={styles.customer} numberOfLines={1}>
                {customer}
                {order.branch?.name ? ` · ${order.branch.name}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {imeiPreview ? (
          <Text style={styles.imei} numberOfLines={1}>
            IMEI: {imeiPreview}
          </Text>
        ) : null}

        {supplier || staff ? (
          <Text style={styles.extra} numberOfLines={1}>
            {[supplier ? `Supplier: ${supplier}` : null, staff ? `Staff: ${staff}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}

        <View style={styles.summary}>
          <View style={styles.summaryLeft}>
            <View style={styles.qtyBadge}>
              <Package color={colors.textSecondary} size={13} />
              <Text style={styles.qtyText}>×{order.quantity}</Text>
            </View>
            <View>
              <Text style={styles.total}>{formatTaka(order.totalAmount)}</Text>
              <Text style={styles.unitHint}>
                {orderRef} · {formatTaka(order.sellingPrice)} / unit
              </Text>
            </View>
          </View>

          {canOpenDetails ? (
            <View style={styles.openChip}>
              <Text style={styles.openChipText}>Open</Text>
              <ChevronRight color={colors.accentPrimary} size={15} strokeWidth={2.4} />
            </View>
          ) : null}
        </View>
      </View>
    </>
  );

  if (canOpenDetails) {
    return (
      <TouchableOpacity
        style={[styles.card, shadows.soft]}
        activeOpacity={0.9}
        onPress={() => onOpenDetails!(saleOrderId)}
        accessibilityRole="button"
        accessibilityLabel={`Open order ${orderRef}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, shadows.soft]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.sm,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accent: { width: 4 },
  body: { flex: 1, padding: 13, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headMain: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  product: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  attrChip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attrText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: { color: colors.textMuted, fontSize: 11, flexShrink: 1 },
  customer: { flex: 1, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  imei: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  extra: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
  },
  summaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: {
    minWidth: 40,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#e2e8f0',
  },
  qtyText: { color: colors.textSecondary, fontWeight: '800', fontSize: 12 },
  total: { color: colors.accentPrimary, fontSize: 16, fontWeight: '900' },
  unitHint: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  openChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  openChipText: { color: colors.accentPrimary, fontSize: 11, fontWeight: '800' },
});
