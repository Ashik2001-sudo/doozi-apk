import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Trash2, ChevronDown, Truck } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type { QuickSellPageState } from '../hooks/useQuickSellPage';

type Props = { page: QuickSellPageState };

export function AssignSupplierModal({ page }: Props) {
  const insets = useSafeAreaInsets();
  const [supplierPickerOpen, setSupplierPickerOpen] = useState(false);
  const [accountPickerRowId, setAccountPickerRowId] = useState<string | null>(null);

  if (!page.showAssignModal || !page.assigningOrder) return null;

  const order = page.assigningOrder;
  const supplier = page.suppliers.find((s) => s.id === page.assignSupplierId);

  return (
    <>
      <Modal
        visible={page.showAssignModal}
        animationType="slide"
        onRequestClose={() => page.setShowAssignModal(false)}
      >
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Truck color="#fff" size={20} />
                <View>
                  <Text style={styles.headerTitle}>Assign Supplier</Text>
                  <Text style={styles.headerSub} numberOfLines={1}>
                    {order.productName} · ×{order.quantity}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => page.setShowAssignModal(false)} style={styles.closeBtn}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.meta}>Sale total {page.formatTaka(order.totalAmount)}</Text>
              <Text style={styles.metaMuted}>Order {order.orderNo || order.invoiceNo}</Text>
            </View>

            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.section}>Supplier</Text>
              <TouchableOpacity style={styles.select} onPress={() => setSupplierPickerOpen(true)}>
                <Text style={styles.selectText} numberOfLines={1}>
                  {supplier
                    ? [supplier.name, supplier.companyName].filter(Boolean).join(' · ')
                    : 'Select supplier'}
                </Text>
                <ChevronDown color={colors.textMuted} size={16} />
              </TouchableOpacity>

              <Text style={styles.label}>Unit cost</Text>
              <TextInput
                style={styles.input}
                value={page.assignUnitPrice ? String(page.assignUnitPrice) : ''}
                onChangeText={(v) => page.setAssignUnitPrice(parseFloat(v) || 0)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Purchase total</Text>
                <Text style={styles.totalValue}>{page.formatTaka(page.assignGrandTotal)}</Text>
              </View>
            </View>

            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.section}>Payment to supplier</Text>
              {page.assignPaymentRows.map((row, idx) => {
                const acc = page.accessibleAccounts.find((a) => a.id === row.accountId);
                return (
                  <View key={row.id} style={styles.payRow}>
                    <TouchableOpacity
                      style={styles.select}
                      onPress={() => setAccountPickerRowId(row.id)}
                    >
                      <Text style={styles.selectText} numberOfLines={1}>
                        {acc?.accountName || acc?.name || `Account ${idx + 1}`}
                      </Text>
                      <ChevronDown color={colors.textMuted} size={16} />
                    </TouchableOpacity>
                    <View style={styles.amountRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={row.amount === '' ? '' : String(row.amount)}
                        onChangeText={(v) =>
                          page.setAssignPaymentRows(
                            page.assignPaymentRows.map((r) =>
                              r.id === row.id
                                ? { ...r, amount: v === '' ? '' : parseFloat(v) || 0 }
                                : r,
                            ),
                          )
                        }
                        placeholder="Amount"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        editable={!!row.accountId}
                      />
                      {page.assignPaymentRows.length > 1 ? (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() =>
                            page.setAssignPaymentRows(
                              page.assignPaymentRows.filter((r) => r.id !== row.id),
                            )
                          }
                        >
                          <Trash2 color={colors.statusError} size={16} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })}
              <TouchableOpacity
                style={styles.addAccount}
                onPress={() =>
                  page.setAssignPaymentRows([
                    ...page.assignPaymentRows,
                    { id: String(Date.now()), accountId: '', amount: '' },
                  ])
                }
              >
                <Plus color={colors.accentPrimary} size={14} />
                <Text style={styles.link}>Add account</Text>
              </TouchableOpacity>

              {page.supplierAdvanceBalance > 0 ? (
                <View style={styles.advanceBox}>
                  <Text style={styles.hint}>
                    Supplier advance: {page.formatTaka(page.supplierAdvanceBalance)}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      page.setAssignAdvanceApplied(
                        Math.min(page.supplierAdvanceBalance, page.assignGrandTotal),
                      )
                    }
                  >
                    <Text style={styles.link}>Use advance</Text>
                  </TouchableOpacity>
                  {page.assignAdvanceApplied > 0 ? (
                    <TouchableOpacity onPress={() => page.setAssignAdvanceApplied(0)}>
                      <Text style={styles.clear}>
                        Clear {page.formatTaka(page.assignAdvanceApplied)}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.summaryMini}>
                <Text style={styles.miniLabel}>Due {page.formatTaka(page.assignDueAuto)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Button title="Cancel" variant="secondary" onPress={() => page.setShowAssignModal(false)} />
            <View style={{ flex: 1 }}>
              <Button
                title="Assign Supplier"
                loading={page.assignSubmitting}
                onPress={() => void page.handleSubmitAssignSupplier()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={supplierPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSupplierPickerOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSupplierPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select supplier</Text>
            <FlatList
              data={page.suppliers}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={<Text style={styles.empty}>No suppliers found</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    void page.loadSupplierAdvance(item.id);
                    setSupplierPickerOpen(false);
                  }}
                >
                  <Text style={styles.sheetItemText}>
                    {[item.name, item.companyName].filter(Boolean).join(' · ') || item.id}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!accountPickerRowId}
        transparent
        animationType="fade"
        onRequestClose={() => setAccountPickerRowId(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setAccountPickerRowId(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select account</Text>
            <FlatList
              data={page.accessibleAccounts}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    if (accountPickerRowId) {
                      page.setAssignPaymentRows(
                        page.assignPaymentRows.map((r) =>
                          r.id === accountPickerRowId ? { ...r, accountId: item.id } : r,
                        ),
                      );
                    }
                    setAccountPickerRowId(null);
                  }}
                >
                  <Text style={styles.sheetItemText}>
                    {item.accountName || item.name}
                    {typeof item.currentBalance === 'number'
                      ? ` · ${page.formatTaka(item.currentBalance)}`
                      : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.sm, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
  },
  meta: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  metaMuted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13, flex: 1 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: { color: colors.textSecondary, fontWeight: '700' },
  totalValue: { color: '#2563eb', fontWeight: '800', fontSize: 16 },
  payRow: { marginTop: 8, gap: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccount: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  link: { color: colors.accentPrimary, fontWeight: '700', fontSize: 12 },
  advanceBox: { marginTop: 10, gap: 6 },
  hint: { color: colors.textMuted, fontSize: 11 },
  clear: { color: colors.statusError, fontSize: 11, fontWeight: '600' },
  summaryMini: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  miniLabel: { color: '#d97706', fontWeight: '700', fontSize: 13 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '70%',
  },
  sheetTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sheetItemText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 24 },
});
