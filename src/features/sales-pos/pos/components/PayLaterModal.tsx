import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Clock3, Hash, Package, Phone, User, X } from 'lucide-react-native';
import { API_BASE_URL, authorizedFetch, getUserData } from '@/lib/config';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import { formatCurrency } from '../utils/formatters';
import type { CartItem, OrderSummary, POSCustomer } from '../types/pos.types';

interface PayLaterModalProps {
  visible: boolean;
  onClose: () => void;
  customer: POSCustomer | null;
  cart: CartItem[];
  branchId: string | null;
  orderSummary: OrderSummary;
  onSuccess: () => void;
}

export function PayLaterModal({
  visible,
  onClose,
  customer,
  cart,
  branchId,
  orderSummary,
  onSuccess,
}: PayLaterModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) setNote('');
  }, [visible]);

  const handleSubmit = async () => {
    if (!customer?.id) {
      Alert.alert('Customer required', 'Select a registered customer for Pay Later.');
      return;
    }
    if (!branchId) {
      Alert.alert('Branch required', 'Select a branch before saving Pay Later.');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Cart empty', 'Add at least one product.');
      return;
    }

    setSaving(true);
    try {
      const user = getUserData<{ name?: string; email?: string }>();
      const response = await authorizedFetch(`${API_BASE_URL}/pay-later`, {
        method: 'POST',
        body: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone || undefined,
          branchId,
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName || undefined,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            serialNumbers: item.serialNumbers || [],
            batchNumbers:
              item.batchNumbers || (item.batchNumber ? [item.batchNumber] : []),
          })),
          subtotal: orderSummary.subtotal,
          totalAmount: orderSummary.grandTotal,
          discountAmount: orderSummary.orderDiscountAmount || 0,
          couponDiscount: orderSummary.couponDiscount || 0,
          giftCardDiscount: orderSummary.giftCardDiscount || 0,
          vipDiscount: orderSummary.vipDiscount || 0,
          redeemPoints: orderSummary.redeemPoints || 0,
          pointsDiscount: orderSummary.pointsDiscount || 0,
          servicesTotal: 0,
          note: note.trim() || undefined,
          createdBy: user?.name || user?.email || 'Unknown',
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || 'Failed to create Pay Later order');
      }

      setNote('');
      onSuccess();
      Alert.alert('Saved', 'Pay Later order created successfully.');
    } catch (error) {
      Alert.alert(
        'Pay Later failed',
        error instanceof Error ? error.message : 'Failed to create Pay Later order',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={saving ? undefined : onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#92400e', '#d97706', '#f59e0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Clock3 color="#ffffff" size={22} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Save for Pay Later</Text>
            <Text style={styles.headerSub}>Payment will be processed later</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={saving}
          >
            <X color="#ffffff" size={20} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.notice}>
            <AlertCircle color="#d97706" size={20} />
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>No changes will be made now</Text>
              <Text style={styles.noticeText}>
                Stock will not reduce and no transaction will be created. Payment and order
                will be processed when the customer pays.
              </Text>
            </View>
          </View>

          <View style={[styles.card, shadows.soft]}>
            <Text style={styles.sectionTitle}>CUSTOMER</Text>
            <View style={styles.infoRow}>
              <User color={colors.accentPrimary} size={17} />
              <Text style={styles.infoStrong}>{customer?.name || '—'}</Text>
            </View>
            {customer?.phone ? (
              <View style={styles.infoRow}>
                <Phone color={colors.textMuted} size={16} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, shadows.soft]}>
            <Text style={styles.sectionTitle}>PRODUCTS ({cart.length})</Text>
            {cart.map((item, index) => (
              <View
                key={item.id}
                style={[styles.productRow, index === cart.length - 1 && styles.lastRow]}
              >
                <View style={styles.productIcon}>
                  <Package color={colors.accentPrimary} size={17} />
                </View>
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.productMeta}>
                    {item.sku} · ×{item.quantity}
                  </Text>
                  {item.serialNumbers?.length ? (
                    <View style={styles.serialRow}>
                      <Hash color={colors.accentPrimary} size={11} />
                      <Text style={styles.serialText} numberOfLines={1}>
                        {item.serialNumbers.slice(0, 2).join(', ')}
                        {item.serialNumbers.length > 2
                          ? ` +${item.serialNumbers.length - 2}`
                          : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.productTotal}>{formatCurrency(item.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.totalCard, shadows.soft]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(orderSummary.grandTotal)}</Text>
          </View>

          <View style={[styles.card, shadows.soft]}>
            <Text style={styles.noteLabel}>Note (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note for this Pay Later order..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              style={styles.noteInput}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={() => void handleSubmit()}
            disabled={saving || cart.length === 0}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Clock3 color="#ffffff" size={18} />
            )}
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Pay Later'}</Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerText: { flex: 1, marginLeft: 11 },
  headerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  scroll: { flex: 1 },
  content: { padding: spacing.md, gap: 12, paddingBottom: spacing.lg },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 13,
    borderRadius: radius.md,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noticeBody: { flex: 1 },
  noticeTitle: { color: '#92400e', fontSize: 13, fontWeight: '800' },
  noticeText: { color: '#a16207', fontSize: 11, lineHeight: 17, marginTop: 3 },
  card: {
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  infoStrong: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  infoText: { color: colors.textSecondary, fontSize: 13 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  productIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
  },
  productBody: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  productName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  productMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  serialRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  serialText: { flex: 1, color: colors.accentPrimary, fontSize: 9 },
  productTotal: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  totalLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  totalValue: { color: colors.accentPrimary, fontSize: 20, fontWeight: '900' },
  noteLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  noteInput: {
    minHeight: 74,
    padding: 11,
    borderRadius: radius.md,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  saveButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: '#d97706',
  },
  disabledButton: { opacity: 0.65 },
  saveText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
});
