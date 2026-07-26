import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, FileText, Printer, Send, X } from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { fetchTenantInvoiceBranding } from '@/lib/fetch-tenant-branding';
import {
  buildInvoiceHtmlAsync,
  printInvoiceHtmlAsync,
} from '@/lib/invoice-print';
import { InvoiceHtmlPreview } from '@/features/sales-pos/pos/components/InvoiceHtmlPreview';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

export interface InvoiceData {
  saleOrderId?: string;
  invoiceNo: string;
  orderNo: string;
  date: string;
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  billToLabel?: string;
  barcode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discountValue?: number;
    discountType?: string;
    total: number;
    serialNumbers?: string[];
    imeiNumbers?: string[];
    batchNumbers?: string[];
    attributeValues?: string[];
  }>;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  giftCardCode?: string;
  giftCardDiscount?: number;
  vipDiscount?: number;
  vipDiscountPercent?: number;
  pointsDiscount?: number;
  redeemPoints?: number;
  services?: Array<{ name: string; price: number }>;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  paidAmount: number;
  receivedAmount?: number;
  changeAmount?: number;
  dueAmount: number;
  previousDue?: number | null;
  advanceApplied?: number;
  paymentStatus: string;
  paymentMethod?: string;
  responsiblePerson?: string;
  paymentsBreakdown?: { type: string; amount: number; accountName?: string; accountType?: string }[];
  termsAndConditions?: string;
  adminLogoUrl?: string | null;
  companyName?: string | null;
  storeQrUrl?: string | null;
}

interface InvoiceModalProps {
  visible: boolean;
  invoiceData: InvoiceData | Record<string, unknown> | null;
  onClose: () => void;
}

export function InvoiceModal({ visible, invoiceData, onClose }: InvoiceModalProps) {
  const insets = useSafeAreaInsets();
  const [sendingSms, setSendingSms] = useState(false);
  const [busyAction, setBusyAction] = useState<'print' | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [branding, setBranding] = useState<{
    adminLogoUrl?: string | null;
    companyName?: string | null;
    storeQrUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void (async () => {
      const data = await fetchTenantInvoiceBranding();
      if (!cancelled && data) setBranding(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const mergedInvoiceData = useMemo(() => {
    if (!invoiceData) return null;
    return {
      ...invoiceData,
      adminLogoUrl:
        (invoiceData as InvoiceData).adminLogoUrl ?? branding?.adminLogoUrl,
      companyName:
        (invoiceData as InvoiceData).companyName ?? branding?.companyName ?? undefined,
      storeQrUrl: (invoiceData as InvoiceData).storeQrUrl ?? branding?.storeQrUrl,
    };
  }, [invoiceData, branding]);

  useEffect(() => {
    if (!visible || !mergedInvoiceData) {
      setPreviewHtml('');
      return;
    }
    let cancelled = false;
    // Let the invoice modal paint first — heavy HTML on the same tick OOMs low-RAM Androids.
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const html = await buildInvoiceHtmlAsync(mergedInvoiceData);
          if (!cancelled) setPreviewHtml(html);
        } catch {
          if (!cancelled) setPreviewHtml('');
        }
      })();
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [visible, mergedInvoiceData]);

  const canOfferSms =
    !!(invoiceData as InvoiceData | null)?.saleOrderId &&
    !!String((invoiceData as InvoiceData | null)?.customerPhone || '').trim();

  const handlePrint = async () => {
    if (!invoiceData) return;
    setBusyAction('print');
    try {
      await printInvoiceHtmlAsync(mergedInvoiceData || invoiceData);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendSms = async () => {
    const data = invoiceData as InvoiceData | null;
    if (!data?.saleOrderId) return;
    setSendingSms(true);
    try {
      const res = await authorizedFetch(`${API_BASE_URL}/sms/send-invoice`, {
        method: 'POST',
        body: JSON.stringify({
          saleOrderId: data.saleOrderId,
          recipient: data.customerPhone?.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to send SMS');
      }
      Alert.alert('SMS sent', 'Invoice SMS sent to customer');
      onClose();
    } catch (e) {
      Alert.alert('SMS failed', e instanceof Error ? e.message : 'Failed to send SMS');
    } finally {
      setSendingSms(false);
    }
  };

  if (!visible || !invoiceData) return null;

  const actionDisabled = sendingSms || !!busyAction;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <FileText color="#fff" size={20} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Invoice</Text>
              <Text style={styles.headerSub}>Preview matches print output</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={actionDisabled}>
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.previewWrap}>
          {previewHtml ? (
            <InvoiceHtmlPreview html={previewHtml} />
          ) : (
            <View style={styles.previewLoading}>
              <ActivityIndicator color={colors.accentPrimary} />
            </View>
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }, shadows.soft]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn, !canOfferSms && styles.disabledBtn]}
            onPress={() => void handleSendSms()}
            disabled={!canOfferSms || actionDisabled}
            activeOpacity={0.8}
          >
            {sendingSms ? (
              <ActivityIndicator color={colors.accentPrimary} size="small" />
            ) : (
              <Send color={canOfferSms ? colors.accentPrimary : colors.textMuted} size={16} />
            )}
            <Text style={[styles.secondaryText, !canOfferSms && styles.disabledText]}>Send SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.secondaryBtn]}
            onPress={() => void handlePrint()}
            disabled={actionDisabled}
            activeOpacity={0.8}
          >
            {busyAction === 'print' ? (
              <ActivityIndicator color={colors.accentPrimary} size="small" />
            ) : (
              <Printer color={colors.accentPrimary} size={16} />
            )}
            <Text style={styles.secondaryText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryBtn]}
            onPress={onClose}
            disabled={actionDisabled}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.primaryInner}>
              <CheckCircle color="#fff" size={16} />
              <Text style={styles.primaryText}>Done</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  previewWrap: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
  },
  secondaryBtn: {
    flexGrow: 1,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  secondaryText: { color: colors.accentPrimary, fontSize: 12, fontWeight: '700' },
  disabledBtn: { opacity: 0.45 },
  disabledText: { color: colors.textMuted },
  primaryBtn: { flexGrow: 1, overflow: 'hidden' },
  primaryInner: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
  },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
