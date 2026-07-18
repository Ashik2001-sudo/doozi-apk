import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShoppingCart,
  X,
  User,
  Phone,
  Plus,
  Crown,
  Search,
  ShoppingCart as CartIcon,
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
  onUpdateQuantity: (itemId: string, quantity: number, batchNumbers?: string[]) => void;
  onAddOneMore?: (item: CartItem) => void;
  onUpdateUnitPrice: (itemId: string, unitPrice: number) => void;
  onRemove: (itemId: string) => void;
  onRemoveSerial: (itemId: string, serial: string) => void;
  onClearCart: () => void;
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
  onUpdateQuantity,
  onAddOneMore,
  onUpdateUnitPrice,
  onRemove,
  onRemoveSerial,
  onClearCart,
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

  const handleClear = () => {
    Alert.alert('Clear cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClearCart },
    ]);
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
    <View style={[styles.customerCard, shadows.soft]}>
      <View style={styles.customerTop}>
        <View style={styles.customerTitleRow}>
          <User color={colors.accentPrimary} size={16} />
          <Text style={styles.customerTitle}>Order Details</Text>
        </View>
        {!isWalkingCustomer && customer ? (
          <TouchableOpacity onPress={onClearCustomer} hitSlop={8}>
            <X color={colors.statusError} size={18} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.customerActions}>
        <TouchableOpacity style={styles.customerPick} onPress={() => setSelectOpen(true)}>
          <Phone color={colors.textMuted} size={16} />
          <View style={{ flex: 1 }}>
            {customerLoading ? (
              <ActivityIndicator color={colors.accentPrimary} size="small" />
            ) : (
              <Text style={styles.customerPickText} numberOfLines={1}>
                {customer
                  ? `${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`
                  : 'Walk-in Customer'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addCustomerBtn}
          onPress={() => {
            setAddPhone(phoneNumber);
            setAddOpen(true);
          }}
        >
          <Plus color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.phoneRow}>
        <TextInput
          style={styles.phoneInput}
          placeholder="Type phone & press Enter…"
          placeholderTextColor={colors.textMuted}
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
          style={styles.phoneEnterBtn}
          onPress={() => void handlePhoneEnter()}
          disabled={phoneEnterBusy || !phoneNumber.trim()}
        >
          {phoneEnterBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Search color="#fff" size={18} />
          )}
        </TouchableOpacity>
      </View>

      {customer && !isWalkingCustomer ? (
        <View style={styles.customerStats}>
          {customer.vipStatus?.isVIP ? (
            <View style={styles.vipBadge}>
              <Crown color="#d97706" size={12} />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          ) : null}
          <Text style={styles.statText}>
            Orders: {customer.totalOrders ?? 0} · Spent: {formatCurrency(customer.totalSpent ?? 0)}
          </Text>
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
              <Text style={styles.headerTitle}>Your cart</Text>
              <Text style={styles.headerSub}>
                {cart.length} line{cart.length === 1 ? '' : 's'} · {itemCount} unit
                {itemCount === 1 ? '' : 's'}
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
            <Text style={styles.headerTotalLabel}>Running total</Text>
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
            <Text style={styles.emptyTitle}>Cart is empty</Text>
            <Text style={styles.emptyText}>Scan IMEI/SKU or tap a product to add items</Text>
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
              <Text style={styles.grandLabel}>Grand total</Text>
              <Text style={styles.grandValue}>{formatCurrency(orderSummary.grandTotal)}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear cart</Text>
            </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  customerActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  customerPick: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customerPickText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  addCustomerBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  phoneInput: {
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
  phoneEnterBtn: {
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
    marginTop: 6,
    flexWrap: 'wrap',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  vipText: { color: '#d97706', fontSize: 10, fontWeight: '800' },
  statText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
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
  actions: { gap: 8 },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearBtnText: { color: colors.statusError, fontWeight: '700', fontSize: 13 },
  checkoutWrap: { width: '100%' },
});
