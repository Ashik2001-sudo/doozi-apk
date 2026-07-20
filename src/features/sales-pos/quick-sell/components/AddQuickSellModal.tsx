import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Trash2,
  Zap,
  Hash,
  ChevronDown,
  Minus,
  AlertCircle,
  User,
  Search,
  Crown,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { CustomerSelectModal } from '@/features/sales-pos/pos/components/CustomerSelectModal';
import { AddCustomerModal } from '@/features/sales-pos/pos/components/AddCustomerModal';
import { resolveCustomerOnPhoneEnter } from '@/features/sales-pos/pos/utils/customerPhoneEnter';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import type { QuickSellPageState } from '../hooks/useQuickSellPage';

type Props = {
  page: QuickSellPageState;
};

export function AddQuickSellModal({ page }: Props) {
  const insets = useSafeAreaInsets();
  const [customerPickOpen, setCustomerPickOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [accountPickerRowId, setAccountPickerRowId] = useState<string | null>(null);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const [attrPickerIndex, setAttrPickerIndex] = useState<number | null>(null);
  const [valuePickerIndex, setValuePickerIndex] = useState<number | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearchBusy, setCustomerSearchBusy] = useState(false);

  useEffect(() => {
    if (page.showAddModal) {
      setCustomerPhone(page.addCustomer?.phone || '');
    }
  }, [page.showAddModal, page.addCustomer?.phone]);

  const handleCustomerPhoneEnter = async () => {
    if (!customerPhone.trim() || customerSearchBusy) return;
    setCustomerSearchBusy(true);
    try {
      const result = await resolveCustomerOnPhoneEnter(
        customerPhone,
        page.addCustomer ? [page.addCustomer] : [],
      );
      if (!result) return;
      if ('customer' in result) {
        page.setAddCustomer(result.customer);
        setCustomerPhone(result.customer.phone || '');
        return;
      }
      setCustomerPhone(result.phone);
      setAddCustomerOpen(true);
    } finally {
      setCustomerSearchBusy(false);
    }
  };

  if (!page.showAddModal) return null;

  const due = Math.max(0, page.addSaleTotal - page.addPaymentTotal);
  const isWalkIn = !page.addCustomer;
  const payProgress = page.addSaleTotal
    ? Math.min(100, (page.addPaymentTotal / page.addSaleTotal) * 100)
    : 0;

  return (
    <>
      <Modal visible={page.showAddModal} animationType="slide" onRequestClose={() => page.setShowAddModal(false)}>
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={['#312e81', '#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Zap color="#fff" size={20} />
                <View>
                  <Text style={styles.headerTitle}>Add Quick Sell</Text>
                  <Text style={styles.headerSub}>Fast, direct customer sale</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => page.setShowAddModal(false)} style={styles.closeBtn}>
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.section}>Branch</Text>
              <TouchableOpacity style={styles.select} onPress={() => setBranchPickerOpen(true)}>
                <Text style={styles.selectText}>
                  {page.branchList.find((b) => b.id === page.addBranchId)?.name || 'Select branch'}
                </Text>
                <ChevronDown color={colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>

            <View style={[styles.card, shadows.soft]}>
              <View style={styles.customerHeader}>
                <View style={styles.customerHeaderTitle}>
                  <User color={colors.accentPrimary} size={15} />
                  <Text style={[styles.section, { marginBottom: 0 }]}>Order Details</Text>
                </View>
                {page.addCustomer ? (
                  <TouchableOpacity
                    hitSlop={8}
                    onPress={() => {
                      page.setAddCustomer(null);
                      setCustomerPhone('');
                    }}
                  >
                    <X color={colors.statusError} size={17} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.customerPick} onPress={() => setCustomerPickOpen(true)}>
                  <View style={styles.customerAvatar}>
                    <User color={isWalkIn ? colors.textMuted : colors.accentPrimary} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerPickText} numberOfLines={1}>
                      {page.addCustomer
                        ? page.addCustomer.name
                        : 'Walk-in Customer'}
                    </Text>
                    <Text style={styles.customerPhone} numberOfLines={1}>
                      {page.addCustomer?.phone || 'No phone · full payment required'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setAddCustomerOpen(true)}
                >
                  <Plus color="#fff" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.phoneSearchRow}>
                <TextInput
                  style={styles.phoneSearchInput}
                  placeholder="Type phone & press Enter…"
                  placeholderTextColor={colors.textMuted}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  returnKeyType="search"
                  blurOnSubmit={false}
                  maxLength={15}
                  editable={!customerSearchBusy}
                  onSubmitEditing={() => void handleCustomerPhoneEnter()}
                />
                <TouchableOpacity
                  style={styles.phoneSearchBtn}
                  disabled={customerSearchBusy || !customerPhone.trim()}
                  onPress={() => void handleCustomerPhoneEnter()}
                >
                  {customerSearchBusy ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Search color="#fff" size={17} />
                  )}
                </TouchableOpacity>
              </View>

              {page.addCustomer ? (
                <View style={styles.customerStats}>
                  {page.addCustomer.vipStatus?.isVIP ? (
                    <View style={styles.vipBadge}>
                      <Crown color="#d97706" size={11} />
                      <Text style={styles.vipText}>VIP</Text>
                    </View>
                  ) : null}
                  <Text style={styles.customerStatText}>
                    Orders: {page.addCustomer.totalOrders ?? 0} · Spent:{' '}
                    {page.formatTaka(page.addCustomer.totalSpent ?? 0)}
                  </Text>
                </View>
              ) : null}

              {isWalkIn ? (
                <View style={styles.warnBox}>
                  <AlertCircle color="#d97706" size={14} />
                  <Text style={styles.hintWarn}>Walk-in must pay the full amount</Text>
                </View>
              ) : page.addCustomerAdvanceBalance > 0 ? (
                <Text style={styles.hint}>
                  Advance available: {page.formatTaka(page.addCustomerAdvanceBalance)}
                </Text>
              ) : (
                <Text style={styles.hint}>Registered customer — due allowed</Text>
              )}
            </View>

            <View style={[styles.card, shadows.soft]}>
              <Text style={styles.section}>Product</Text>
              <Text style={styles.label}>Product name</Text>
              <TextInput
                style={styles.input}
                value={page.addProductName}
                onChangeText={page.setAddProductName}
                placeholder="Product name"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.variantHeader}>
                <Text style={styles.label}>Variant attributes</Text>
                <TouchableOpacity onPress={page.handleAddVariantRow} style={styles.addVariantLink}>
                  <Plus color={colors.accentPrimary} size={14} />
                  <Text style={styles.link}>Add</Text>
                </TouchableOpacity>
              </View>
              {page.attributesLoading ? (
                <ActivityIndicator color={colors.accentPrimary} style={{ marginBottom: 10 }} />
              ) : page.attributes.length === 0 ? (
                <Text style={[styles.hint, { marginBottom: 10 }]}>
                  No attributes found for this branch
                </Text>
              ) : (
                page.addVariantRows.map((row, index) => {
                  const selectedAttr = page.attributes.find(
                    (a) => String(a.id) === String(row.attributeId),
                  );
                  const selectedVal = selectedAttr?.values?.find(
                    (v) => String(v.id) === String(row.attributeValueId),
                  );
                  return (
                    <View key={`variant-${index}`} style={styles.variantRow}>
                      <TouchableOpacity
                        style={[styles.select, { flex: 1 }]}
                        onPress={() => setAttrPickerIndex(index)}
                      >
                        <Text
                          style={[styles.selectText, !selectedAttr && styles.placeholder]}
                          numberOfLines={1}
                        >
                          {selectedAttr?.name || 'Attribute'}
                        </Text>
                        <ChevronDown color={colors.textMuted} size={14} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.select, { flex: 1 }, !row.attributeId && styles.selectDisabled]}
                        disabled={!row.attributeId}
                        onPress={() => setValuePickerIndex(index)}
                      >
                        <Text
                          style={[styles.selectText, !selectedVal && styles.placeholder]}
                          numberOfLines={1}
                        >
                          {selectedVal
                            ? selectedVal.displayName || selectedVal.value
                            : row.attributeId
                              ? 'Value'
                              : 'Select attr'}
                        </Text>
                        <ChevronDown color={colors.textMuted} size={14} />
                      </TouchableOpacity>
                      {page.addVariantRows.length > 1 ? (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => page.handleRemoveVariantRow(index)}
                        >
                          <Trash2 color={colors.statusError} size={15} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  );
                })
              )}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Quantity</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => page.setAddQuantity(Math.max(1, page.addQuantity - 1))}
                    >
                      <Minus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyInput}
                      value={String(page.addQuantity)}
                      onChangeText={(v) => page.setAddQuantity(Math.max(1, parseInt(v, 10) || 1))}
                      keyboardType="number-pad"
                      textAlign="center"
                    />
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => page.setAddQuantity(page.addQuantity + 1)}
                    >
                      <Plus color={colors.textPrimary} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.label}>Unit price</Text>
                  <View style={styles.priceWrap}>
                    <Text style={styles.currency}>৳</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={page.addUnitPrice ? String(page.addUnitPrice) : ''}
                      onChangeText={(v) => page.setAddUnitPrice(parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sale total</Text>
                <Text style={styles.totalValue}>{page.formatTaka(page.addSaleTotal)}</Text>
              </View>
            </View>

            <View style={[styles.card, shadows.soft]}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.section}>IMEI / Serial</Text>
                  <Text style={styles.hint}>Optional · must match quantity</Text>
                </View>
                <Switch
                  value={page.addHasImei}
                  onValueChange={(v) => {
                    page.setAddHasImei(v);
                    if (!v) {
                      page.setAddImeiList([]);
                      page.setAddCurrentImeiInput('');
                    }
                  }}
                  trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
                  thumbColor={page.addHasImei ? colors.accentPrimary : '#f8fafc'}
                />
              </View>
              {page.addHasImei ? (
                <>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={page.addCurrentImeiInput}
                      onChangeText={page.setAddCurrentImeiInput}
                      placeholder="Scan or type IMEI"
                      placeholderTextColor={colors.textMuted}
                      onSubmitEditing={page.addImei}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={page.addImei}>
                      <Plus color="#fff" size={18} />
                    </TouchableOpacity>
                  </View>
                  {page.addImeiList.map((imei) => (
                    <View key={imei} style={styles.imeiChip}>
                      <Hash color={colors.accentPrimary} size={12} />
                      <Text style={styles.imeiText}>{imei}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          page.setAddImeiList(page.addImeiList.filter((x) => x !== imei))
                        }
                      >
                        <X color={colors.statusError} size={14} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <Text style={styles.hint}>
                    {page.addImeiList.length}/{page.addQuantity} entered
                  </Text>
                </>
              ) : null}
            </View>

            <View style={[styles.card, shadows.soft]}>
              <View style={styles.payHeader}>
                <Text style={styles.section}>Payment</Text>
                <TouchableOpacity onPress={page.fillFullPayment}>
                  <Text style={styles.link}>Pay full</Text>
                </TouchableOpacity>
              </View>

              {page.addPaymentRows.map((row, idx) => {
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
                        onChangeText={(v) => page.updateAddPaymentAmount(row.id, v)}
                        placeholder="Amount"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        editable={!!row.accountId}
                      />
                      {page.addPaymentRows.length > 1 ? (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() =>
                            page.setAddPaymentRows(page.addPaymentRows.filter((r) => r.id !== row.id))
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
                  page.setAddPaymentRows([
                    ...page.addPaymentRows,
                    { id: String(Date.now()), accountId: '', amount: '' },
                  ])
                }
              >
                <Plus color={colors.accentPrimary} size={14} />
                <Text style={styles.link}>Add account</Text>
              </TouchableOpacity>

              {!isWalkIn && page.addCustomerAdvanceBalance > 0 ? (
                <View style={styles.advanceBox}>
                  <Text style={styles.hint}>
                    Advance: {page.formatTaka(page.addCustomerAdvanceBalance)}
                  </Text>
                  {page.addMaxAdvanceApplicable > 0 || page.addAdvanceApplied > 0 ? (
                    <View style={styles.advanceActions}>
                    <TouchableOpacity
                      style={styles.advanceUseBtn}
                      onPress={() =>
                        page.updateAddAdvanceApplied(page.addMaxAdvanceApplicable)
                      }
                    >
                      <Text style={styles.link}>
                        Use {page.formatTaka(page.addMaxAdvanceApplicable)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.advanceInputWrap}>
                      <Text style={styles.advanceCurrency}>৳</Text>
                      <TextInput
                        style={styles.advanceInput}
                        value={
                          page.addAdvanceApplied > 0 ? String(page.addAdvanceApplied) : ''
                        }
                        onChangeText={page.updateAddAdvanceApplied}
                        keyboardType="decimal-pad"
                        placeholder="Custom amount"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    {page.addAdvanceApplied > 0 ? (
                      <TouchableOpacity onPress={() => page.setAddAdvanceApplied(0)}>
                        <Text style={styles.clear}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            {!page.isEmployeeUser && page.employees.length > 0 ? (
              <View style={[styles.card, shadows.soft]}>
                <Text style={styles.section}>Responsible (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.chip, !page.addEmployeeId && styles.chipOn]}
                    onPress={() => page.setAddEmployeeId(null)}
                  >
                    <Text style={styles.chipText}>None</Text>
                  </TouchableOpacity>
                  {page.employees.map((e) => (
                    <TouchableOpacity
                      key={e.id}
                      style={[styles.chip, page.addEmployeeId === e.id && styles.chipOn]}
                      onPress={() => page.setAddEmployeeId(e.id)}
                    >
                      <Text style={styles.chipText}>{e.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {page.tcItems.length > 0 ? (
              <View style={[styles.card, shadows.soft]}>
                <Text style={styles.section}>Terms & Conditions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.chip, !page.addTcId && styles.chipOn]}
                    onPress={() => page.setAddTcId('')}
                  >
                    <Text style={styles.chipText}>None</Text>
                  </TouchableOpacity>
                  {page.tcItems
                    .filter((tc) => tc.status === 'active')
                    .map((tc) => (
                      <TouchableOpacity
                        key={tc.id}
                        style={[styles.chip, page.addTcId === tc.id && styles.chipOn]}
                        onPress={() => page.setAddTcId(tc.id)}
                      >
                        <Text style={styles.chipText}>{tc.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.summaryBar}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                <Text style={styles.summaryTotalValue}>{page.formatTaka(page.addSaleTotal)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${payProgress}%` }]} />
              </View>
              <View style={styles.summaryMetrics}>
                <View style={styles.summaryMetric}>
                  <Text style={styles.smLabel}>Received</Text>
                  <Text style={[styles.smValue, { color: '#059669' }]}>
                    {page.formatTaka(page.addPaymentTotal)}
                  </Text>
                </View>
                <View style={styles.summaryMetric}>
                  <Text style={styles.smLabel}>Due</Text>
                  <Text style={[styles.smValue, { color: due > 0 ? '#d97706' : colors.textPrimary }]}>
                    {page.formatTaka(due)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.footerActions}>
              <Button title="Cancel" variant="secondary" onPress={() => page.setShowAddModal(false)} />
              <View style={{ flex: 1 }}>
                <Button
                  title={`Confirm · ${page.formatTaka(page.addSaleTotal)}`}
                  loading={page.addSubmitting}
                  onPress={() => void page.handleSubmitAddSell()}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <CustomerSelectModal
        visible={customerPickOpen}
        branchId={page.addBranchId || null}
        selectedCustomer={page.addCustomer}
        onClose={() => setCustomerPickOpen(false)}
        onSelect={(c) => {
          page.setAddCustomer(c);
          setCustomerPhone(c.phone || '');
          setCustomerPickOpen(false);
        }}
        onWalkIn={() => {
          page.setAddCustomer(null);
          setCustomerPhone('');
          setCustomerPickOpen(false);
        }}
        onAddNew={(phone) => {
          if (phone) setCustomerPhone(phone);
          setCustomerPickOpen(false);
          setAddCustomerOpen(true);
        }}
      />

      <AddCustomerModal
        visible={addCustomerOpen}
        branchId={page.addBranchId || null}
        initialPhone={customerPhone}
        onClose={() => setAddCustomerOpen(false)}
        onSuccess={(c) => {
          page.setAddCustomer(c);
          setCustomerPhone(c.phone || '');
          setAddCustomerOpen(false);
        }}
      />

      <Modal visible={branchPickerOpen} transparent animationType="fade" onRequestClose={() => setBranchPickerOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setBranchPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select branch</Text>
            {page.branchList.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.sheetItem}
                onPress={() => {
                  page.setAddBranchId(b.id);
                  setBranchPickerOpen(false);
                }}
              >
                <Text style={styles.sheetItemText}>{b.name}</Text>
              </TouchableOpacity>
            ))}
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
              data={page.accessibleAccounts.filter((a) => {
                const used = page.addPaymentRows
                  .filter((r) => r.id !== accountPickerRowId)
                  .map((r) => r.accountId)
                  .filter(Boolean);
                return !used.includes(a.id);
              })}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.emptyPicker}>No more accounts available</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    if (accountPickerRowId) {
                      page.setAddPaymentRows(
                        page.addPaymentRows.map((r) =>
                          r.id === accountPickerRowId ? { ...r, accountId: item.id } : r,
                        ),
                      );
                    }
                    setAccountPickerRowId(null);
                  }}
                >
                  <Text style={styles.sheetItemText}>
                    {item.accountName || item.name}
                    {item.accountType ? ` (${item.accountType})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={attrPickerIndex != null}
        transparent
        animationType="fade"
        onRequestClose={() => setAttrPickerIndex(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setAttrPickerIndex(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select attribute</Text>
            <FlatList
              data={page.attributes}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.emptyPicker}>No attributes available</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    if (attrPickerIndex != null) {
                      page.handleVariantChange(attrPickerIndex, 'attributeId', item.id);
                    }
                    setAttrPickerIndex(null);
                  }}
                >
                  <Text style={styles.sheetItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={valuePickerIndex != null}
        transparent
        animationType="fade"
        onRequestClose={() => setValuePickerIndex(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setValuePickerIndex(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Select value</Text>
            <FlatList
              data={
                valuePickerIndex != null
                  ? page.attributes.find(
                      (a) =>
                        String(a.id) ===
                        String(page.addVariantRows[valuePickerIndex]?.attributeId),
                    )?.values ?? []
                  : []
              }
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.emptyPicker}>No values for this attribute</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetItem}
                  onPress={() => {
                    if (valuePickerIndex != null) {
                      page.handleVariantChange(valuePickerIndex, 'attributeValueId', item.id);
                    }
                    setValuePickerIndex(null);
                  }}
                >
                  <Text style={styles.sheetItemText}>{item.displayName || item.value}</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  section: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 6 },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  customerPick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerPickText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  customerPhone: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  phoneSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  phoneSearchInput: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
  },
  phoneSearchBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  vipText: { color: '#d97706', fontSize: 9, fontWeight: '800' },
  customerStatText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { color: colors.textMuted, fontSize: 11, marginTop: 8, fontWeight: '500' },
  hintWarn: { flex: 1, color: '#b45309', fontSize: 11, fontWeight: '600' },
  warnBox: {
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
  twoCol: { flexDirection: 'row', gap: 10 },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addVariantLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectDisabled: { opacity: 0.45 },
  placeholder: { color: colors.textMuted, fontWeight: '500' },
  emptyPicker: { color: colors.textMuted, textAlign: 'center', padding: 24 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
  },
  qtyBtn: {
    width: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  currency: { color: colors.accentPrimary, fontWeight: '800', fontSize: 16, marginRight: 4 },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  totalValue: { color: colors.accentPrimary, fontWeight: '800', fontSize: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  imeiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  imeiText: { flex: 1, color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.accentPrimary, fontWeight: '700', fontSize: 12 },
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
  advanceBox: { marginTop: 10, gap: 6 },
  advanceActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  advanceUseBtn: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    backgroundColor: colors.accentSoft,
  },
  advanceInputWrap: {
    flex: 1,
    minWidth: 120,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: '#ffffff',
  },
  advanceCurrency: { color: colors.statusSuccess, fontSize: 13, fontWeight: '800', marginRight: 4 },
  advanceInput: { flex: 1, color: colors.textPrimary, fontSize: 12, paddingVertical: 0 },
  clear: { color: colors.statusError, fontSize: 11, fontWeight: '600' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  chipOn: { backgroundColor: colors.accentSoft, borderColor: colors.borderAccent },
  chipText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
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
  progressFill: { height: '100%', backgroundColor: colors.accentPrimary, borderRadius: radius.full },
  summaryMetrics: { flexDirection: 'row' },
  summaryMetric: { flex: 1, alignItems: 'center' },
  smLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  smValue: { fontWeight: '800', fontSize: 12, marginTop: 2 },
  footerActions: { flexDirection: 'row', gap: 10 },
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
});
