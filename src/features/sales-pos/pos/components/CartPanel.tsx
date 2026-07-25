import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingCart,
  X,
  Phone,
  Crown,
  Search,
  ShoppingCart as CartIcon,
  Clock3,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { CartLineItem } from '@/features/sales-pos/pos/components/CartLineItem';
import { CustomerSelectModal } from '@/features/sales-pos/pos/components/CustomerSelectModal';
import { AddCustomerModal } from '@/features/sales-pos/pos/components/AddCustomerModal';
import { EditUnitPriceModal } from '@/features/sales-pos/pos/components/EditUnitPriceModal';
import { CartItem, OrderSummary, POSCustomer } from '@/features/sales-pos/pos/types/pos.types';
import { formatCurrency } from '@/features/sales-pos/pos/utils/formatters';
import { getEffectiveUnitPrice } from '@/features/sales-pos/pos/utils/calculations';
import { resolveCustomerOnPhoneEnter } from '@/features/sales-pos/pos/utils/customerPhoneEnter';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

interface CartPanelProps {
  cart: CartItem[];
  orderSummary: OrderSummary;
  loading?: boolean;
  isWide?: boolean;
  branchId: string | null;
  customer: POSCustomer | null;
  phoneNumber: string;
  customerLoading?: boolean;
  isWalkingCustomer: boolean;
  onClose?: () => void;
  onCheckout: () => void;
  onPayLater: () => void;
  onUpdateQuantity: (itemId: string, quantity: number, batchNumbers?: string[]) => void;
  onAddOneMore?: (item: CartItem) => void;
  onUpdateUnitPrice: (itemId: string, unitPrice: number) => void;
  onRemove: (itemId: string) => void;
  onRemoveSerial: (itemId: string, serial: string) => void;
  onCustomerSelect: (customer: POSCustomer) => void;
  onClearCustomer: () => void;
  onSetPhoneNumber: (phone: string) => void;
}

export function CartPanel({
  cart,
  orderSummary,
  loading,
  isWide,
  branchId,
  customer,
  phoneNumber,
  customerLoading,
  isWalkingCustomer,
  onClose,
  onCheckout,
  onPayLater,
  onUpdateQuantity,
  onAddOneMore,
  onUpdateUnitPrice,
  onRemove,
  onRemoveSerial,
  onCustomerSelect,
  onClearCustomer,
  onSetPhoneNumber,
}: CartPanelProps) {
  const insets = useSafeAreaInsets();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [selectOpen, setSelectOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [phoneEnterBusy, setPhoneEnterBusy] = useState(false);
  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null);
  const [priceInput, setPriceInput] = useState('');

  const openPriceEdit = (item: CartItem) => {
    setPriceEditItem(item);
    setPriceInput(String(getEffectiveUnitPrice(item.lineTotal, item.quantity)));
  };

  const closePriceEdit = () => {
    setPriceEditItem(null);
    setPriceInput('');
  };

  const savePriceEdit = () => {
    const parsed = parseFloat(priceInput.replace(/,/g, ''));
    if (Number.isNaN(parsed) || parsed < 0 || !priceEditItem) return;
    onUpdateUnitPrice(priceEditItem.id, parsed);
    closePriceEdit();
  };

  /** Seller-admin: type phone → Enter → select match, or open Add Customer */
  const handlePhoneEnter = async () => {
    if (!phoneNumber.trim() || phoneEnterBusy) return;
    setPhoneEnterBusy(true);
    try {
      const result = await resolveCustomerOnPhoneEnter(phoneNumber, customer ? [customer] : []);
      if (!result) return;
      if ('customer' in result) {
        onCustomerSelect(result.customer);
        return;
      }
      setAddPhone(result.phone);
      setAddOpen(true);
    } finally {
      setPhoneEnterBusy(false);
    }
  };

  const customerHeader = (
    <View style={styles.customerCard}>
      <View style={styles.customerTop}>
        <Text style={styles.customerTitle}>Customer</Text>
        {!isWalkingCustomer && customer ? (
          <TouchableOpacity onPress={onClearCustomer} hitSlop={10} style={styles.clearCustomerBtn}>
            <Text style={styles.clearCustomerText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {customer && !isWalkingCustomer ? (
        <TouchableOpacity
          style={styles.selectedCard}
          onPress={() => setSelectOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.selectedAvatar}>
            <Text style={styles.selectedAvatarText}>
              {(customer.name || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.selectedBody}>
            <View style={styles.selectedNameRow}>
              <Text style={styles.selectedName} numberOfLines={1}>
                {customer.name}
              </Text>
              {customer.vipStatus?.isVIP ? (
                <View style={styles.vipBadge}>
                  <Crown color="#b45309" size={10} />
                  <Text style={styles.vipText}>VIP</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.selectedPhone} numberOfLines={1}>
              {customer.phone || '—'}
            </Text>
            <Text style={styles.selectedMeta} numberOfLines={1}>
              {customer.totalOrders ?? 0} orders
              {'  ·  '}
              {formatCurrency(customer.totalSpent ?? 0)} spent
            </Text>
          </View>
          <Search color={colors.textMuted} size={16} />
        </TouchableOpacity>
      ) : (
        <View style={styles.walkInCard}>
          <View style={styles.walkInTop}>
            <Text style={styles.walkInBadge}>Walk-in</Text>
            <TouchableOpacity onPress={() => setSelectOpen(true)} hitSlop={8}>
              <Text style={styles.browseLink}>Browse</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.phoneField}>
            <Phone color={colors.textMuted} size={16} />
            <TextInput
              style={styles.phoneFieldInput}
              placeholder="Phone number"
              placeholderTextColor="#94a3b8"
              value={phoneNumber}
              onChangeText={onSetPhoneNumber}
              keyboardType="phone-pad"
              returnKeyType="search"
              blurOnSubmit={false}
              maxLength={15}
              editable={!phoneEnterBusy}
              onSubmitEditing={() => void handlePhoneEnter()}
            />
            <TouchableOpacity
              style={[
                styles.phoneSearchBtn,
                (!phoneNumber.trim() || phoneEnterBusy) && styles.phoneSearchBtnOff,
              ]}
              onPress={() => void handlePhoneEnter()}
              disabled={phoneEnterBusy || !phoneNumber.trim()}
              activeOpacity={0.85}
            >
              {phoneEnterBusy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Search color="#fff" size={15} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {customerLoading ? (
        <View style={styles.customerLoadingRow}>
          <ActivityIndicator color={colors.accentPrimary} size="small" />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.pane, isWide && shadows.soft]}>
      <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <ShoppingCart color="#fff" size={20} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Cart</Text>
              <Text style={styles.headerSub}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          {!isWide && onClose ? (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X color="#fff" size={20} />
            </TouchableOpacity>
          ) : null}
        </View>
        {cart.length > 0 ? (
          <View style={styles.headerTotal}>
            <Text style={styles.headerTotalLabel}>Total</Text>
            <Text style={styles.headerTotalValue}>{formatCurrency(orderSummary.grandTotal)}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={cart.length === 0 ? styles.listEmpty : styles.listContent}
        ListHeaderComponent={customerHeader}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <CartIcon color={colors.textMuted} size={32} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Empty cart</Text>
            <Text style={styles.emptyText}>Add products to continue</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <CartLineItem
            item={item}
            index={index}
            onUpdateQuantity={onUpdateQuantity}
            onAddOneMore={onAddOneMore}
            onRemove={onRemove}
            onRemoveSerial={onRemoveSerial}
            onEditUnitPrice={openPriceEdit}
          />
        )}
      />

      {cart.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(orderSummary.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{formatCurrency(orderSummary.grandTotal)}</Text>
            </View>
          </View>

          <View style={styles.orderActions}>
            {!isWalkingCustomer && customer ? (
              <TouchableOpacity
                style={[styles.payLaterBtn, loading && styles.actionDisabled]}
                onPress={onPayLater}
                disabled={loading || cart.length === 0}
              >
                <Clock3 color="#d97706" size={17} />
                <Text style={styles.payLaterBtnText}>Pay Later</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.checkoutWrap}>
              <Button
                title={`Checkout · ${formatCurrency(orderSummary.grandTotal)}`}
                disabled={cart.length === 0}
                loading={loading}
                onPress={onCheckout}
              />
            </View>
          </View>
        </View>
      ) : null}

      <CustomerSelectModal
        visible={selectOpen}
        branchId={branchId}
        selectedCustomer={customer}
        onClose={() => setSelectOpen(false)}
        onSelect={onCustomerSelect}
        onWalkIn={onClearCustomer}
        onAddNew={(phone) => {
          setSelectOpen(false);
          setAddPhone(phone || phoneNumber);
          setAddOpen(true);
        }}
      />

      <AddCustomerModal
        visible={addOpen}
        branchId={branchId}
        initialPhone={addPhone}
        onClose={() => setAddOpen(false)}
        onSuccess={(c) => {
          onCustomerSelect(c);
          setAddOpen(false);
        }}
      />

      <EditUnitPriceModal
        item={priceEditItem}
        priceInput={priceInput}
        onPriceInputChange={setPriceInput}
        onClose={closePriceEdit}
        onSave={savePriceEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pane: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderLight,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  headerTotalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  headerTotalValue: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  list: { flex: 1 },
  listContent: { padding: spacing.sm, paddingBottom: spacing.md },
  listEmpty: { flexGrow: 1 },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eef2f7',
    padding: 14,
    marginBottom: 12,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  clearCustomerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearCustomerText: {
    color: colors.statusError,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
  },
  selectedAvatarText: {
    color: colors.accentPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  selectedBody: { flex: 1, minWidth: 0 },
  selectedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedName: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  selectedPhone: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  selectedMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  walkInCard: {
    gap: 10,
  },
  walkInTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walkInBadge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  browseLink: {
    color: colors.accentPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  phoneField: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  phoneFieldInput: {
    flex: 1,
    height: 46,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
    paddingVertical: 0,
  },
  phoneSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
  },
  phoneSearchBtnOff: {
    opacity: 0.35,
  },
  customerLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vipText: { color: '#b45309', fontSize: 9, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', paddingTop: 32, paddingHorizontal: spacing.lg },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    gap: 10,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  summaryCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 2 },
  grandLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  grandValue: { color: colors.accentPrimary, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  orderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payLaterBtn: {
    height: 46,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  payLaterBtnText: { color: '#b45309', fontSize: 12, fontWeight: '800' },
  actionDisabled: { opacity: 0.55 },
  checkoutWrap: { flex: 1, minWidth: 0 },
});
