import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle,
  X,
  User,
  Phone,
  Wallet,
  Hash,
  Crown,
  AlertCircle,
  Building2,
  CreditCard,
  Smartphone,
  Banknote,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { KeyboardAware } from '@/components/ui/keyboard-aware';
import { ProductImage } from '@/components/ui/product-image';
import { InvoiceModal } from '@/features/sales-pos/pos/components/InvoiceModal';
import { formatCurrency } from '@/features/sales-pos/pos/utils/formatters';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type { CompleteOrderModalProps } from './complete-order-modal.types';
import { PAYMENT_STATUS_STYLES } from './complete-order-modal.types';
import { getAccountTypeMeta } from './complete-order-modal.utils';
import { useCompleteOrderModal } from './hooks/useCompleteOrderModal';
import { CompleteOrderPaymentSection } from './components/CompleteOrderPaymentSection';

export function CompleteOrderModal(props: CompleteOrderModalProps) {
  const insets = useSafeAreaInsets();
  const modal = useCompleteOrderModal(props);
  const [accountPickerRowId, setAccountPickerRowId] = useState<string | null>(null);

  if (!props.visible && !modal.showInvoiceModal) return null;

  const statusStyle = PAYMENT_STATUS_STYLES[modal.paymentStatus] ?? PAYMENT_STATUS_STYLES.due;
  const activeTc = modal.tcItems.filter((tc) => tc.status === 'active');
  const pickerRow = modal.paymentRows.find((r) => r.id === accountPickerRowId);
  const usedAccountIds = modal.paymentRows
    .filter((r) => r.id !== accountPickerRowId && r.accountId)
    .map((r) => r.accountId);
  const availableAccounts = modal.accounts.filter((a) => !usedAccountIds.includes(a.id));
  const payProgress = props.orderSummary.grandTotal
    ? Math.min(100, (modal.displayReceive / props.orderSummary.grandTotal) * 100)
    : 0;
  const isWalkIn = props.isWalkingCustomer;

  return (
    <>
      <Modal
        visible={props.visible && !modal.showInvoiceModal}
        animationType="slide"
        onRequestClose={props.onClose}
      >
        <KeyboardAware style={[styles.root, { paddingTop: insets.top }]}>
          <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <CheckCircle color="#fff" size={22} />
                <View>
                  <Text style={styles.headerTitle}>Complete Order</Text>
                  <Text style={styles.headerSub}>{props.cart?.length ?? 0} products</Text>
                </View>
              </View>
              <TouchableOpacity onPress={props.onClose} style={styles.closeBtn}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.sectionLabel}>Customer</Text>
              <View style={styles.customerHero}>
                <View style={styles.customerAvatar}>
                  <User color={isWalkIn ? colors.textMuted : colors.accentPrimary} size={22} />
                </View>
                <View style={styles.customerHeroBody}>
                  <View style={styles.customerNameRow}>
                    <Text style={styles.customerName}>
                      {props.customer?.name ?? 'Walk-in Customer'}
                    </Text>
                    {props.customer?.vipStatus?.isVIP ? (
                      <View style={styles.vipPill}>
                        <Crown color="#d97706" size={10} />
                        <Text style={styles.vipPillText}>VIP</Text>
                      </View>
                    ) : null}
                    {isWalkIn ? (
                      <View style={styles.walkInPill}>
                        <Text style={styles.walkInPillText}>Walk-in</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.customerMeta}>
                    <Phone color={colors.textMuted} size={12} />
                    <Text style={styles.customerPhone}>
                      {isWalkIn
                        ? 'No phone on file · pay in full'
                        : props.customer?.phone || 'No phone'}
                    </Text>
                  </View>
                  {props.customer && !isWalkIn ? (
                    <Text style={styles.customerStats}>
                      {props.customer.totalOrders ?? 0} orders ·{' '}
                      {formatCurrency(props.customer.totalSpent ?? 0)} spent
                    </Text>
                  ) : null}
                </View>
              </View>
              {isWalkIn ? (
                <View style={styles.walkInWarn}>
                  <AlertCircle color="#d97706" size={14} />
                  <Text style={styles.walkInWarnText}>
                    Walk-in customers must pay the full amount
                  </Text>
                </View>
              ) : null}
            </View>

            {props.cart && props.cart.length > 0 ? (
              <View style={[styles.card, shadows.soft]}>
                <Text style={styles.sectionLabel}>Products ({props.cart.length})</Text>
                {props.cart.map((item, idx) => (
                  <View key={item.id} style={styles.cartLine}>
                    <ProductImage src={item.image} size={40} borderRadius={8} iconSize={16} />
                    <View style={styles.cartLineBody}>
                      <Text style={styles.cartLineName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.cartLineMeta}>
                        {item.sku} · ×{item.quantity}
                      </Text>
                      {item.serialNumbers?.length ? (
                        <View style={styles.cartLineImeiRow}>
                          <Hash size={10} color={colors.accentPrimary} />
                          <Text style={styles.cartLineImei} numberOfLines={1}>
                            {item.serialNumbers.slice(0, 2).join(', ')}
                            {item.serialNumbers.length > 2
                              ? ` +${item.serialNumbers.length - 2}`
                              : ''}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.cartLineTotal}>{formatCurrency(item.lineTotal)}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {modal.customerId &&
            modal.customerAdvanceBalance != null &&
            modal.customerAdvanceBalance > 0 ? (
              <View style={[styles.advanceCard, shadows.soft]}>
                <View style={styles.advanceHeader}>
                  <Wallet color="#059669" size={16} />
                  <Text style={styles.advanceTitle}>Advance Balance</Text>
                  <Text style={styles.advanceAmount}>
                    {formatCurrency(modal.customerAdvanceBalance)}
                  </Text>
                </View>
                {modal.maxAdvanceApplicable > 0 || modal.advanceApplied > 0 ? (
                  <View style={styles.advanceActions}>
                    <TouchableOpacity
                      style={styles.advanceBtn}
                      onPress={() => modal.handleAdvanceChange(modal.maxAdvanceApplicable)}
                    >
                      <Text style={styles.advanceBtnText}>
                        Use {formatCurrency(modal.maxAdvanceApplicable)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.advanceInputWrap}>
                      <Text style={styles.advanceCurrency}>৳</Text>
                      <TextInput
                        style={styles.advanceInput}
                        value={modal.advanceApplied > 0 ? String(modal.advanceApplied) : ''}
                        onChangeText={modal.handleAdvanceChange}
                        keyboardType="decimal-pad"
                        placeholder="Custom amount"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    {modal.advanceApplied > 0 ? (
                      <TouchableOpacity onPress={() => modal.setAdvanceApplied(0)}>
                        <Text style={styles.clearAdvance}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            <CompleteOrderPaymentSection
              paymentRows={modal.paymentRows}
              accounts={modal.accounts}
              accountsLoading={modal.accountsLoading}
              grandTotal={props.orderSummary.grandTotal}
              onOpenAccountPicker={setAccountPickerRowId}
              onRowChange={modal.handleRowChange}
              onRemoveRow={modal.handleRemoveRow}
              onAddRow={modal.handleAddRow}
              onFillGrandTotal={modal.fillGrandTotal}
            />

            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.sectionLabel}>Details</Text>
              <View style={styles.statusRow}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusStyle.bg,
                      borderColor: statusStyle.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>
                    {modal.paymentStatus}
                  </Text>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={modal.paymentNote}
                onChangeText={modal.setPaymentNote}
                placeholder="Optional note…"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              {activeTc.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>Terms & Conditions</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity
                      style={[styles.personChip, !modal.selectedTcId && styles.personChipOn]}
                      onPress={() => modal.setSelectedTcId('')}
                    >
                      <Text style={styles.personChipText}>None</Text>
                    </TouchableOpacity>
                    {activeTc.map((tc) => (
                      <TouchableOpacity
                        key={tc.id}
                        style={[
                          styles.personChip,
                          modal.selectedTcId === tc.id && styles.personChipOn,
                        ]}
                        onPress={() => modal.setSelectedTcId(tc.id)}
                      >
                        <Text style={styles.personChipText}>{tc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.summaryBar}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatCurrency(props.orderSummary.grandTotal)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${payProgress}%` }]} />
              </View>
              <View style={styles.summaryMetrics}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.smLabel}>Received</Text>
                  <Text style={[styles.smValue, { color: '#059669' }]}>
                    {formatCurrency(modal.displayReceive)}
                  </Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.smLabel}>Change</Text>
                  <Text style={[styles.smValue, { color: '#0284c7' }]}>
                    {formatCurrency(modal.displayChange)}
                  </Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.smLabel}>Due</Text>
                  <Text
                    style={[
                      styles.smValue,
                      { color: modal.displayDue > 0 ? '#d97706' : colors.textPrimary },
                    ]}
                  >
                    {formatCurrency(modal.displayDue)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.footerActions}>
              <Button title="Cancel" variant="secondary" onPress={props.onClose} />
              <View style={{ flex: 1 }}>
                <Button
                  title="Confirm Order"
                  loading={props.loading}
                  onPress={() => void modal.handleConfirm()}
                />
              </View>
            </View>
          </View>
        </KeyboardAware>
      </Modal>

      <Modal
        visible={!!accountPickerRowId}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountPickerRowId(null)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setAccountPickerRowId(null)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select account</Text>
              <Text style={styles.pickerSub}>Choose where payment will be received</Text>
            </View>
            <FlatList
              data={availableAccounts}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>
                  {modal.accountsLoading ? 'Loading…' : 'No accounts available'}
                </Text>
              }
              renderItem={({ item }) => {
                const meta = getAccountTypeMeta(item.accountType);
                const selected = pickerRow?.accountId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selected && styles.pickerItemOn,
                      { borderColor: selected ? meta.border : colors.borderLight },
                    ]}
                    onPress={() => {
                      if (accountPickerRowId) {
                        modal.handleRowChange(accountPickerRowId, 'accountId', item.id);
                      }
                      setAccountPickerRowId(null);
                    }}
                  >
                    <View style={[styles.pickerIcon, { backgroundColor: meta.bg }]}>
                      <AccountPickerIcon accountType={item.accountType} color={meta.color} />
                    </View>
                    <View style={styles.pickerItemBody}>
                      <Text style={styles.pickerItemName} numberOfLines={1}>
                        {item.accountName ?? item.name ?? item.id}
                      </Text>
                      <View style={styles.pickerItemMeta}>
                        <Text style={[styles.pickerType, { color: meta.color }]}>{meta.label}</Text>
                        {item.branch?.name ? (
                          <Text style={styles.pickerBranch}> · {item.branch.name}</Text>
                        ) : null}
                      </View>
                    </View>
                    {typeof item.currentBalance === 'number' ? (
                      <Text style={styles.pickerBalance}>{formatCurrency(item.currentBalance)}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <InvoiceModal
        visible={modal.showInvoiceModal}
        invoiceData={modal.invoiceData}
        onClose={modal.closeInvoiceModal}
      />
    </>
  );
}

function AccountPickerIcon({ accountType, color }: { accountType?: string; color: string }) {
  const t = (accountType ?? '').toLowerCase();
  if (t === 'cash') return <Banknote color={color} size={18} />;
  if (t === 'card') return <CreditCard color={color} size={18} />;
  if (t === 'mobile_banking' || t.includes('mobile')) return <Smartphone color={color} size={18} />;
  if (t === 'bank_transfer' || t.includes('bank')) return <Building2 color={color} size={18} />;
  return <CreditCard color={color} size={18} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.sm, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerHeroBody: { flex: 1, minWidth: 0 },
  customerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  customerName: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vipPillText: { color: '#d97706', fontSize: 9, fontWeight: '800' },
  walkInPill: {
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  walkInPillText: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  customerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  customerPhone: { color: colors.textSecondary, fontSize: 12 },
  customerStats: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 4 },
  walkInWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  walkInWarnText: { flex: 1, color: '#b45309', fontSize: 11, fontWeight: '600' },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cartLineBody: { flex: 1, minWidth: 0 },
  cartLineName: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  cartLineMeta: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  cartLineImeiRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cartLineImei: { color: colors.accentPrimary, fontSize: 10, flex: 1 },
  cartLineTotal: { color: colors.textPrimary, fontWeight: '800', fontSize: 13 },
  advanceCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
  },
  advanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  advanceTitle: { flex: 1, color: '#059669', fontWeight: '700', fontSize: 12 },
  advanceAmount: { color: '#059669', fontWeight: '800', fontSize: 15 },
  advanceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  advanceBtn: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  advanceBtnText: { color: '#059669', fontWeight: '700', fontSize: 12 },
  advanceInputWrap: {
    flex: 1,
    minWidth: 110,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  advanceCurrency: { color: '#059669', fontSize: 13, fontWeight: '800', marginRight: 4 },
  advanceInput: { flex: 1, color: colors.textPrimary, fontSize: 12, paddingVertical: 0 },
  clearAdvance: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  chipScroll: { marginBottom: 8 },
  personChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  personChipOn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderAccent,
  },
  personChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  readonlyField: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    padding: 12,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 8,
  },
  noteInput: { minHeight: 72, textAlignVertical: 'top' },
  summaryBar: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: 10,
    marginBottom: 10,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryTotalLabel: {
    color: colors.accentPrimary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotalValue: { color: colors.accentPrimary, fontWeight: '800', fontSize: 18 },
  progressTrack: {
    height: 4,
    backgroundColor: '#e0e7ff',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.full,
  },
  summaryMetrics: { flexDirection: 'row' },
  summaryMetric: { flex: 1, alignItems: 'center' },
  smLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  smValue: { fontWeight: '800', fontSize: 12, marginTop: 2 },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '75%',
  },
  pickerHeader: { marginBottom: 12 },
  pickerTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 17 },
  pickerSub: { color: colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '500' },
  pickerEmpty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgPrimary,
  },
  pickerItemOn: { backgroundColor: '#fff' },
  pickerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemBody: { flex: 1, minWidth: 0 },
  pickerItemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  pickerItemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  pickerType: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  pickerBranch: { color: colors.textMuted, fontSize: 11, flex: 1 },
  pickerBalance: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
});
