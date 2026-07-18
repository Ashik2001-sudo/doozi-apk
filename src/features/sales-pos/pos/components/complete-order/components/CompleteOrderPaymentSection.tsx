import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Banknote,
  Building2,
  CreditCard,
  Plus,
  Smartphone,
  Trash2,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { formatCurrency } from '../../../utils/formatters';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type { AccountOption, PaymentRow } from '../complete-order-modal.types';
import { getAccountName, getAccountTypeMeta } from '../complete-order-modal.utils';

interface CompleteOrderPaymentSectionProps {
  paymentRows: PaymentRow[];
  accounts: AccountOption[];
  accountsLoading: boolean;
  grandTotal: number;
  onOpenAccountPicker: (rowId: string) => void;
  onRowChange: (id: string, field: 'accountId' | 'amount', value: string | number) => void;
  onRemoveRow: (id: string) => void;
  onAddRow: () => void;
  onFillGrandTotal: () => void;
}

function AccountTypeIcon({
  accountType,
  size = 18,
}: {
  accountType?: string;
  size?: number;
}) {
  const t = (accountType ?? '').toLowerCase();
  const meta = getAccountTypeMeta(accountType);
  if (t === 'cash') return <Banknote color={meta.color} size={size} />;
  if (t === 'card') return <CreditCard color={meta.color} size={size} />;
  if (t === 'mobile_banking' || t.includes('mobile')) {
    return <Smartphone color={meta.color} size={size} />;
  }
  if (t === 'bank_transfer' || t.includes('bank')) {
    return <Building2 color={meta.color} size={size} />;
  }
  return <CreditCard color={meta.color} size={size} />;
}

export function CompleteOrderPaymentSection({
  paymentRows,
  accounts,
  accountsLoading,
  grandTotal,
  onOpenAccountPicker,
  onRowChange,
  onRemoveRow,
  onAddRow,
  onFillGrandTotal,
}: CompleteOrderPaymentSectionProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <LinearGradient colors={['#4338ca', '#6366f1']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIcon}>
              <CreditCard color="#fff" size={18} />
            </View>
            <View>
              <Text style={styles.heroTitle}>Payment</Text>
              <Text style={styles.heroSub}>
                {paymentRows.length} method{paymentRows.length === 1 ? '' : 's'} · {formatCurrency(grandTotal)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.heroAction} onPress={onFillGrandTotal}>
            <Zap color="#fbbf24" size={14} />
            <Text style={styles.heroActionText}>Pay full</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {accountsLoading && accounts.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accentPrimary} />
            <Text style={styles.loadingText}>Loading accounts…</Text>
          </View>
        ) : null}

        {paymentRows.map((row, index) => {
          const selAcc = accounts.find((a) => a.id === row.accountId);
          const meta = getAccountTypeMeta(selAcc?.accountType);
          const isCash = (selAcc?.accountType ?? '').toLowerCase() === 'cash';
          const amt = typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0;
          const overLimit = !isCash && row.accountId && amt > grandTotal;

          return (
            <View
              key={row.id}
              style={[styles.rowCard, { borderLeftColor: selAcc ? meta.color : colors.borderLight }]}
            >
              <View style={styles.rowTop}>
                <View style={styles.rowBadge}>
                  <Text style={styles.rowBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.rowTitle}>Payment method</Text>
                {paymentRows.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => onRemoveRow(row.id)}
                    hitSlop={8}
                  >
                    <Trash2 color={colors.statusError} size={15} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.accountCard, selAcc && { backgroundColor: meta.bg, borderColor: meta.border }]}
                onPress={() => onOpenAccountPicker(row.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.accountIconWrap, { backgroundColor: '#fff' }]}>
                  {selAcc ? (
                    <AccountTypeIcon accountType={selAcc.accountType} />
                  ) : (
                    <CreditCard color={colors.textMuted} size={18} />
                  )}
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {row.accountId
                      ? getAccountName(accounts, row.accountId)
                      : accountsLoading
                        ? 'Loading accounts…'
                        : 'Tap to select account'}
                  </Text>
                  {selAcc ? (
                    <View style={styles.accountMetaRow}>
                      <View style={[styles.typePill, { backgroundColor: '#fff', borderColor: meta.border }]}>
                        <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      {selAcc.branch?.name ? (
                        <Text style={styles.branchText} numberOfLines={1}>
                          {selAcc.branch.name}
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.accountHint}>Cash, bank, card or mobile</Text>
                  )}
                </View>
                <ChevronRight color={colors.textMuted} size={18} />
              </TouchableOpacity>

              <View style={[styles.amountInputWrap, overLimit && styles.amountCardError]}>
                <View style={styles.amountPrefixWrap}>
                  <Text style={styles.currencyPrefix}>৳</Text>
                  <Text style={styles.amountLabel}>Amount</Text>
                </View>
                <TextInput
                  style={styles.amountInput}
                  value={row.amount === '' ? '' : String(row.amount)}
                  onChangeText={(v) =>
                    onRowChange(row.id, 'amount', v === '' ? '' : parseFloat(v) || '')
                  }
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  editable={!!row.accountId}
                />
              </View>

              {overLimit ? (
                <Text style={styles.limitWarn}>
                  Non-cash accounts cannot exceed {formatCurrency(grandTotal)}
                </Text>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity style={styles.addBtn} onPress={onAddRow} activeOpacity={0.8}>
          <View style={styles.addBtnIcon}>
            <Plus color={colors.accentPrimary} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addBtnTitle}>Add another account</Text>
            <Text style={styles.addBtnSub}>Split payment across methods</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  hero: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  heroIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 10, marginTop: 1, fontWeight: '600' },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroActionText: { color: '#fbbf24', fontSize: 11, fontWeight: '800' },
  body: { padding: 10, gap: 8 },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  loadingText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  rowCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 3,
    padding: 10,
    gap: 8,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBadge: {
    width: 20,
    height: 20,
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBadgeText: { color: colors.accentPrimary, fontSize: 10, fontWeight: '800' },
  rowTitle: { flex: 1, color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  accountIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: { flex: 1, minWidth: 0 },
  accountName: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  accountMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  typePillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  branchText: { color: colors.textMuted, fontSize: 10, fontWeight: '600', flex: 1 },
  accountHint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  amountCardError: { borderColor: '#fca5a5', backgroundColor: '#fff7f7' },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 10,
  },
  amountPrefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 10,
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  currencyPrefix: {
    color: colors.accentPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  amountInput: {
    flex: 1,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  limitWarn: { color: colors.statusError, fontSize: 10, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderStyle: 'dashed',
    backgroundColor: colors.accentSoft,
  },
  addBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  addBtnTitle: { color: colors.accentPrimary, fontWeight: '800', fontSize: 12 },
  addBtnSub: { color: colors.textMuted, fontSize: 10, marginTop: 1, fontWeight: '500' },
});
