import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Banknote,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  PackageCheck,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
  X,
  Zap,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { money, variantLabel } from '../types';
import type { UseWholesaleActions } from '../hooks/useWholesaleActions';

function accountTypeMeta(accountType?: string) {
  const t = (accountType ?? '').toLowerCase();
  if (t === 'cash') return { label: 'Cash', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
  if (t === 'card') return { label: 'Card', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
  if (t === 'mobile_banking' || t.includes('mobile')) {
    return { label: 'Mobile', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' };
  }
  if (t === 'bank_transfer' || t.includes('bank')) {
    return { label: 'Bank', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
  }
  return { label: 'Account', color: colors.accentPrimary, bg: colors.accentSoft, border: colors.borderAccent };
}

function AccountTypeIcon({ accountType, size = 18 }: { accountType?: string; size?: number }) {
  const t = (accountType ?? '').toLowerCase();
  const meta = accountTypeMeta(accountType);
  if (t === 'cash') return <Banknote color={meta.color} size={size} />;
  if (t === 'card') return <CreditCard color={meta.color} size={size} />;
  if (t === 'mobile_banking' || t.includes('mobile')) {
    return <Smartphone color={meta.color} size={size} />;
  }
  if (t === 'bank_transfer' || t.includes('bank')) {
    return <Building2 color={meta.color} size={size} />;
  }
  return <Wallet color={meta.color} size={size} />;
}

export function SellOutModal({ actions }: { actions: UseWholesaleActions }) {
  const {
    sellItem,
    sellPrice,
    setSellPrice,
    sellRows,
    sellAdvance,
    sellBusy,
    sellAccounts,
    sellPaid,
    sellItemTotal,
    setAccountPickerId,
    closeSellOut,
    addSellRow,
    removeSellRow,
    setSellRowAmount,
    payFull,
    applyAdvance,
    clearAdvance,
    confirmSellOut,
  } = actions;

  const item = sellItem?.item;
  const order = sellItem?.order;
  const advanceBalance = Number(order?.retailer?.advanceBalance || 0);
  const due = Math.max(0, Math.round((sellItemTotal - sellPaid) * 100) / 100);
  const isFullyPaid = due <= 0.009 && sellPaid > 0;
  const variant =
    variantLabel(item?.variant) ||
    item?.sku ||
    (item?.serialNumbers?.length ? item.serialNumbers[0] : '');

  const onPriceChange = (v: string) => {
    const cleaned = v.replace(/,/g, '').trim();
    if (cleaned === '') {
      setSellPrice('');
      return;
    }
    if (!/^\d*\.?\d*$/.test(cleaned)) return;
    setSellPrice(cleaned);
  };

  const onAmountChange = (rowId: string, v: string) => {
    const cleaned = v.replace(/,/g, '').trim();
    if (cleaned === '') {
      setSellRowAmount(rowId, '');
      return;
    }
    if (!/^\d*\.?\d*$/.test(cleaned)) return;
    const num = parseFloat(cleaned);
    if (Number.isNaN(num) || num < 0) return;
    setSellRowAmount(rowId, num);
  };

  return (
    <Modal
      visible={!!sellItem}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeSellOut}
    >
      <View style={styles.sellOutOverlay}>
        <Pressable
          style={styles.sellOutBackdrop}
          onPress={closeSellOut}
          accessibilityRole="button"
          accessibilityLabel="Close sell out"
        />

        <View style={styles.sellOutSheet}>
          <View style={styles.sellOutHandle} />

          <View style={styles.sellOutHeader}>
            <View style={styles.sellOutHeaderLeft}>
              <LinearGradient colors={['#059669', '#10b981']} style={styles.sellOutHeaderIcon}>
                <PackageCheck color="#ffffff" size={20} strokeWidth={2.4} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellOutTitle}>Sell Out</Text>
                <Text style={styles.sellOutSub} numberOfLines={1}>
                  {order?.orderNo || 'Order'} · mark item as sold
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeSellOut} hitSlop={8}>
              <X color={colors.textPrimary} size={19} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sellOutScroll}
            contentContainerStyle={styles.sellOutContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sellOutProductCard}>
              <Text style={styles.sellOutProductName} numberOfLines={2}>
                {item?.productName || '—'}
              </Text>
              {variant ? (
                <Text style={styles.sellOutProductMeta} numberOfLines={1}>
                  {variant}
                </Text>
              ) : null}
              <View style={styles.sellOutChipRow}>
                <View style={styles.sellOutChip}>
                  <Text style={styles.sellOutChipText}>Qty {item?.quantity ?? 0}</Text>
                </View>
                <View style={styles.sellOutChip}>
                  <Text style={styles.sellOutChipText} numberOfLines={1}>
                    {order?.retailer?.name || order?.retailerName || 'Retailer'}
                  </Text>
                </View>
                {order?.branch?.name ? (
                  <View style={styles.sellOutChip}>
                    <Text style={styles.sellOutChipText} numberOfLines={1}>
                      {order.branch.name}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={styles.sellOutSectionLabel}>Unit price</Text>
            <View style={styles.sellOutPriceWrap}>
              <Text style={styles.sellOutCurrency}>৳</Text>
              <TextInput
                style={styles.sellOutPriceInput}
                value={sellPrice}
                onChangeText={onPriceChange}
                keyboardType="decimal-pad"
                selectTextOnFocus
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.sellOutPriceHint}>× {item?.quantity ?? 0}</Text>
            </View>

            <View style={styles.sellOutPayHead}>
              <View>
                <Text style={styles.sellOutSectionLabel}>Payment</Text>
                <Text style={styles.sellOutSectionHint}>
                  Split across accounts · capped at item total
                </Text>
              </View>
              <TouchableOpacity style={styles.sellOutPayFullBtn} onPress={payFull} activeOpacity={0.85}>
                <Zap color="#f59e0b" size={14} />
                <Text style={styles.sellOutPayFullText}>Pay full</Text>
              </TouchableOpacity>
            </View>

            {sellRows.map((row, index) => {
              const acc = sellAccounts.find((a) => a.id === row.accountId);
              const meta = accountTypeMeta(acc?.accountType);
              return (
                <View
                  key={row.id}
                  style={[
                    styles.sellOutPayRow,
                    acc ? { borderLeftColor: meta.color } : null,
                  ]}
                >
                  <View style={styles.sellOutPayRowTop}>
                    <View style={styles.sellOutPayBadge}>
                      <Text style={styles.sellOutPayBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.sellOutPayRowTitle}>Payment method</Text>
                    {sellRows.length > 1 ? (
                      <TouchableOpacity
                        style={styles.sellOutRemoveBtn}
                        onPress={() => removeSellRow(row.id)}
                        hitSlop={8}
                      >
                        <Trash2 color={colors.statusError} size={15} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.sellOutAccountCard,
                      acc ? { backgroundColor: meta.bg, borderColor: meta.border } : null,
                    ]}
                    onPress={() => setAccountPickerId(row.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.sellOutAccountIcon}>
                      {acc ? (
                        <AccountTypeIcon accountType={acc.accountType} />
                      ) : (
                        <CreditCard color={colors.textMuted} size={18} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.sellOutAccountName} numberOfLines={1}>
                        {acc?.accountName || acc?.name || 'Tap to select account'}
                      </Text>
                      {acc ? (
                        <View style={styles.sellOutAccountMeta}>
                          <View
                            style={[
                              styles.sellOutTypePill,
                              { borderColor: meta.border, backgroundColor: '#ffffff' },
                            ]}
                          >
                            <Text style={[styles.sellOutTypePillText, { color: meta.color }]}>
                              {meta.label}
                            </Text>
                          </View>
                          {acc.branch?.name ? (
                            <Text style={styles.sellOutAccountBranch} numberOfLines={1}>
                              {acc.branch.name}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text style={styles.sellOutAccountHint}>Cash, bank, card or mobile</Text>
                      )}
                    </View>
                    <ChevronRight color={colors.textMuted} size={18} />
                  </TouchableOpacity>

                  <View style={styles.sellOutAmountWrap}>
                    <Text style={styles.sellOutCurrencySm}>৳</Text>
                    <TextInput
                      style={styles.sellOutAmountInput}
                      value={row.amount === '' ? '' : String(row.amount)}
                      onChangeText={(v) => onAmountChange(row.id, v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      selectTextOnFocus
                      editable={!!row.accountId}
                    />
                  </View>
                </View>
              );
            })}

            <TouchableOpacity style={styles.sellOutAddAccount} onPress={addSellRow} activeOpacity={0.8}>
              <View style={styles.sellOutAddAccountIcon}>
                <Plus color={colors.accentPrimary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sellOutAddAccountTitle}>Add another account</Text>
                <Text style={styles.sellOutAddAccountSub}>Split payment across methods</Text>
              </View>
            </TouchableOpacity>

            {advanceBalance > 0 ? (
              <View style={[styles.sellOutAdvanceCard, sellAdvance > 0 && styles.sellOutAdvanceCardOn]}>
                <View style={styles.sellOutAdvanceLeft}>
                  <View style={styles.sellOutAdvanceIcon}>
                    <Wallet color={sellAdvance > 0 ? '#059669' : colors.accentPrimary} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sellOutAdvanceTitle}>Retailer advance</Text>
                    <Text style={styles.sellOutAdvanceSub}>
                      Available {money(advanceBalance)}
                      {sellAdvance > 0 ? ` · applied ${money(sellAdvance)}` : ''}
                    </Text>
                  </View>
                </View>
                {sellAdvance > 0 ? (
                  <TouchableOpacity style={styles.sellOutAdvanceClear} onPress={clearAdvance}>
                    <Text style={styles.sellOutAdvanceClearText}>Clear</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.sellOutAdvanceApply} onPress={applyAdvance}>
                    <Text style={styles.sellOutAdvanceApplyText}>Use</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <View style={styles.sellOutSummary}>
              <View style={styles.sellOutSummaryRow}>
                <Text style={styles.sellOutSummaryLabel}>Item total</Text>
                <Text style={styles.sellOutSummaryValue}>{money(sellItemTotal)}</Text>
              </View>
              <View style={styles.sellOutSummaryRow}>
                <Text style={styles.sellOutSummaryLabel}>Received</Text>
                <Text style={[styles.sellOutSummaryValue, { color: colors.statusSuccess }]}>
                  {money(sellPaid)}
                </Text>
              </View>
              <View style={[styles.sellOutSummaryRow, styles.sellOutSummaryDue]}>
                <View style={styles.sellOutDueLeft}>
                  {isFullyPaid ? (
                    <CheckCircle2 color={colors.statusSuccess} size={16} />
                  ) : null}
                  <Text style={styles.sellOutDueLabel}>
                    {isFullyPaid ? 'Fully paid' : 'Due after sell out'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sellOutDueValue,
                    isFullyPaid ? { color: colors.statusSuccess } : null,
                  ]}
                >
                  {money(due)}
                </Text>
              </View>
            </View>

            <Text style={styles.sellOutNote}>
              You can confirm with 0 payment — the full amount stays as due.
            </Text>
          </ScrollView>

          <View style={styles.sellOutFooter}>
            <Button
              title={
                sellBusy
                  ? 'Processing…'
                  : isFullyPaid
                    ? `Confirm · ${money(sellItemTotal)}`
                    : due > 0 && sellPaid > 0
                      ? `Confirm · Due ${money(due)}`
                      : 'Confirm Sell Out'
              }
              loading={sellBusy}
              onPress={() => void confirmSellOut()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
