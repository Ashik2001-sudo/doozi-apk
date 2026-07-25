import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Package,
  Printer,
  User,
  Wallet,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { InvoiceModal } from '@/features/sales-pos/pos/components/InvoiceModal';
import { colors } from '@/theme/tokens';
import { useOrderDetail } from '../hooks/useOrderDetail';
import { usePayDue } from '../hooks/usePayDue';
import { styles } from '../styles';
import {
  buildOrderInvoiceData,
  formatMoney,
  formatOrderDate,
  formatShortDate,
  orderTypeAccent,
  saleTypeLabel,
  variantLabel,
} from '../utils';
import { PayDueSheet } from './PayDueSheet';

type Props = {
  orderId: string;
};

export function OrderDetailScreen({ orderId }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const detail = useOrderDetail(orderId);
  const pay = usePayDue({
    orderId,
    order: detail.order,
    setOrder: detail.setOrder,
    setPayments: detail.setPayments,
  });
  const [showInvoice, setShowInvoice] = useState(false);

  const accent = orderTypeAccent(detail.order?.orderType);
  const due = Number(detail.order?.dueAmount) || 0;
  const canPay = due > 0.009;

  const invoiceData = useMemo(() => {
    if (!detail.order) return null;
    return buildOrderInvoiceData(detail.order, detail.payments);
  }, [detail.order, detail.payments]);

  const summaryLines = useMemo(() => {
    if (!detail.order) return [];
    const o = detail.order;
    const lines: { label: string; value: number; tone?: 'muted' | 'danger' }[] = [
      { label: 'Subtotal', value: Number(o.subtotal) || 0 },
    ];
    if (Number(o.discountAmount) > 0) {
      lines.push({ label: 'Discount', value: -(Number(o.discountAmount) || 0), tone: 'danger' });
    }
    if (Number(o.couponDiscount) > 0) {
      lines.push({ label: 'Coupon', value: -(Number(o.couponDiscount) || 0), tone: 'danger' });
    }
    if (Number(o.giftCardDiscount) > 0) {
      lines.push({ label: 'Gift card', value: -(Number(o.giftCardDiscount) || 0), tone: 'danger' });
    }
    if (Number(o.vipDiscount) > 0) {
      lines.push({ label: 'VIP', value: -(Number(o.vipDiscount) || 0), tone: 'danger' });
    }
    if (Number(o.pointsDiscount) > 0) {
      lines.push({ label: 'Points', value: -(Number(o.pointsDiscount) || 0), tone: 'danger' });
    }
    if (Number(o.servicesTotal) > 0) {
      lines.push({ label: 'Services', value: Number(o.servicesTotal) || 0 });
    }
    if (Number(o.taxAmount) > 0) {
      lines.push({ label: 'Tax', value: Number(o.taxAmount) || 0 });
    }
    if (Number(o.shippingCost) > 0) {
      lines.push({ label: 'Shipping', value: Number(o.shippingCost) || 0 });
    }
    return lines;
  }, [detail.order]);

  if (detail.loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.accentPrimary} size="large" />
        <Text style={styles.mutedCenter}>Loading order…</Text>
      </View>
    );
  }

  if (detail.error || !detail.order) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{detail.error || 'Order not found'}</Text>
        <Text style={styles.mutedCenter}>
          The order may have been deleted or you may not have permission.
        </Text>
        <Button title="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const order = detail.order;
  const items = order.items || [];
  const isWholesale = (order.orderType || '').toLowerCase() === 'wholesale';
  const customerName =
    order.customerName ||
    order.customer?.name ||
    (isWholesale ? '—' : 'Walk-in Customer');
  const customerPhone = order.customerPhone || order.customer?.phone || '—';

  return (
    <View style={styles.root}>
      <LinearGradient colors={accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[styles.topBar, { paddingTop: 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <Text style={styles.topBarEyebrow}>Order details</Text>
            <Text style={styles.topBarHeading} numberOfLines={1}>
              {order.invoiceNo || order.orderNo}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setShowInvoice(true)}
            accessibilityRole="button"
            accessibilityLabel="Open invoice"
          >
            <Printer color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={detail.refreshing}
            onRefresh={() => void detail.refresh()}
            tintColor={colors.accentPrimary}
          />
        }
      >
        <LinearGradient colors={accent} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.heroInvoice}>{order.invoiceNo || order.orderNo}</Text>
              <Text style={styles.heroOrderNo}>Order {order.orderNo}</Text>
              <Text style={styles.heroDate}>{formatOrderDate(order.orderDate)}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{order.paymentStatus}</Text>
            </View>
          </View>
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{saleTypeLabel(order.orderType)}</Text>
          </View>
          <TouchableOpacity
            style={styles.heroInvoiceBtn}
            onPress={() => setShowInvoice(true)}
            activeOpacity={0.85}
          >
            <Printer color="#fff" size={16} />
            <Text style={styles.heroInvoiceBtnText}>Invoice</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{formatMoney(order.grandTotal)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Paid</Text>
            <Text style={[styles.metricValue, { color: colors.statusSuccess }]}>
              {formatMoney(order.paidAmount)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Due</Text>
            <Text style={[styles.metricValue, { color: due > 0 ? colors.statusWarning : colors.textPrimary }]}>
              {formatMoney(due)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <User color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>{isWholesale ? 'Retailer' : 'Customer'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{customerPhone}</Text>
          </View>
          {!isWholesale && order.customer?.email ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{order.customer.email}</Text>
            </View>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Branch</Text>
            <Text style={styles.infoValue}>{order.branch?.name || '—'}</Text>
          </View>
          {order.responsiblePerson ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Responsible</Text>
              <Text style={styles.infoValue}>{order.responsiblePerson}</Text>
            </View>
          ) : null}
          {order.paymentMethod ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Method</Text>
              <Text style={styles.infoValue}>{String(order.paymentMethod).replace(/_/g, ' ')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <Package color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Items</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{items.length}</Text>
            </View>
          </View>
          {items.map((item, idx) => {
            const v = variantLabel(item);
            const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers.filter(Boolean) : [];
            return (
              <View
                key={item.id}
                style={[styles.itemCard, idx === items.length - 1 && styles.itemCardLast]}
              >
                <View style={styles.itemTop}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={styles.itemTotal}>{formatMoney(item.totalPrice)}</Text>
                </View>
                <Text style={styles.itemMeta}>
                  Qty {item.quantity} × {formatMoney(item.unitPrice)}
                  {v ? ` · ${v}` : ''}
                </Text>
                {serials.length ? (
                  <Text style={styles.serials} numberOfLines={2}>
                    IMEI: {serials.join(', ')}
                  </Text>
                ) : null}
              </View>
            );
          })}

          <View style={{ marginTop: 8 }}>
            {summaryLines.map((line) => (
              <View key={line.label} style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>{line.label}</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    line.tone === 'danger' ? { color: colors.statusError } : null,
                  ]}
                >
                  {formatMoney(line.value)}
                </Text>
              </View>
            ))}
            <View style={styles.summaryGrand}>
              <Text style={styles.summaryGrandLabel}>Grand total</Text>
              <Text style={styles.summaryGrandValue}>{formatMoney(order.grandTotal)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <Wallet color={colors.accentPrimary} size={18} />
              <Text style={styles.sectionTitle}>Payments</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{detail.payments.length}</Text>
            </View>
          </View>
          {detail.payments.length === 0 ? (
            <Text style={styles.emptyPayments}>No payment records yet</Text>
          ) : (
            detail.payments.map((p, idx) => (
              <View key={p.id || String(idx)} style={styles.timelineItem}>
                <View style={styles.timelineDotCol}>
                  <View style={styles.timelineDot} />
                  {idx < detail.payments.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineAmount}>{formatMoney(p.amount)}</Text>
                  <Text style={styles.timelineMeta}>
                    {p.account?.accountName || 'Account'}
                    {p.account?.accountType ? ` · ${p.account.accountType}` : ''}
                  </Text>
                  <Text style={styles.timelineMeta}>
                    {formatShortDate(p.transactionDate || p.createdAt)}
                    {p.note ? ` · ${p.note}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {(order.saleReturns?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleRow}>
                <FileText color={colors.accentPrimary} size={18} />
                <Text style={styles.sectionTitle}>Returns</Text>
              </View>
            </View>
            {order.saleReturns!.map((r) => (
              <View key={r.id} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{r.returnNo}</Text>
                <Text style={styles.infoValue}>
                  {formatMoney(r.refundAmount || r.totalAmount)} · {r.status}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerBtn}>
          <Button title="Invoice" variant="secondary" onPress={() => setShowInvoice(true)} />
        </View>
        {canPay ? (
          <View style={styles.footerBtn}>
            <Button title="Pay due" onPress={pay.openPay} />
          </View>
        ) : (
          <View
            style={[
              styles.footerBtn,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 46,
                borderRadius: 13,
                backgroundColor: '#ecfdf5',
                borderWidth: 1,
                borderColor: '#a7f3d0',
              },
            ]}
          >
            <CheckCircle2 color={colors.statusSuccess} size={16} />
            <Text style={{ color: colors.statusSuccess, fontWeight: '800', fontSize: 14 }}>Paid</Text>
          </View>
        )}
      </View>

      <PayDueSheet pay={pay} dueAmount={due} />

      <InvoiceModal
        visible={showInvoice}
        invoiceData={invoiceData}
        onClose={() => setShowInvoice(false)}
      />
    </View>
  );
}
