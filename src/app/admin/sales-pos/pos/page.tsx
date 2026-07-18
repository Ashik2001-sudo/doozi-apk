import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePOS } from '@/features/sales-pos/pos/hooks/usePOS';
import { POSProduct, POSProductVariant } from '@/features/sales-pos/pos/types/pos.types';
import { CartPanel } from '@/features/sales-pos/pos/components/CartPanel';
import { CompleteOrderModal } from '@/features/sales-pos/pos/components/complete-order/CompleteOrderModal';
import { ProductCard, ProductGridSkeleton } from '@/features/sales-pos/pos/components/ProductCard';
import { BarcodeScannerModal } from '@/features/sales-pos/pos/components/BarcodeScannerModal';
import { formatCurrency, filterInStockProducts } from '@/features/sales-pos/pos/utils/formatters';
import { colors, radius, shadows, spacing } from '@/theme/tokens';
import {
  ScanLine,
  Search,
  ShoppingCart,
  Store,
} from 'lucide-react-native';
import { SerialSelectModal } from '@/features/sales-pos/pos/components/SerialSelectModal';
import {
  alertAddResult,
  addProductLikeSellerAdmin,
  tryAddByEnter,
} from '@/features/sales-pos/pos/utils/tryAddByEnter';

function serialMatches(product: POSProduct, variant: POSProductVariant, q: string, exact: boolean) {
  if (!product.hasSerialNumber) return false;
  const rows = ((variant as any).serialNumbers ?? []) as Array<string | { serialNumber?: string }>;
  return rows.some((row) => {
    const serial = typeof row === 'string' ? row : row?.serialNumber;
    const s = String(serial || '').trim().toLowerCase();
    return exact ? s === q : s.includes(q);
  });
}

export default function POSPage() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width > 700;
  const pos = usePOS();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchBusy, setSearchBusy] = useState(false);
  const [serialPick, setSerialPick] = useState<{
    product: POSProduct;
    variant: POSProductVariant;
  } | null>(null);

  const inStockProducts = useMemo(
    () => filterInStockProducts(pos.products),
    [pos.products],
  );

  const displayProducts = useMemo(() => {
    const q = pos.searchTerm.trim().toLowerCase();
    if (!q) return inStockProducts;

    const exact = inStockProducts.filter((product) =>
      (product.variants || []).some((variant) => serialMatches(product, variant, q, true)),
    );
    if (exact.length > 0) return exact;

    return inStockProducts.filter((product) => {
      if ((product.name || '').toLowerCase().includes(q)) return true;
      return (product.variants || []).some((variant) => {
        if ((variant.sku || '').toLowerCase().includes(q)) return true;
        return serialMatches(product, variant, q, false);
      });
    });
  }, [inStockProducts, pos.searchTerm]);

  const handleAddProduct = (product: POSProduct) => {
    const variant = product.variants?.[0];
    if (!variant) {
      Alert.alert('No variant', 'Product has no sellable variant');
      return;
    }
    void (async () => {
      const result = await addProductLikeSellerAdmin({
        product,
        variant,
        cart: pos.cart,
        branchId: pos.selectedBranchId,
        addToCart: pos.addToCart,
        onSelectSerial: (p, v) => setSerialPick({ product: p, variant: v }),
      });
      alertAddResult(result);
    })();
  };

  const handleSearchSubmit = async (scannedValue?: string) => {
    const q = (scannedValue ?? pos.searchTerm).trim();
    if (!q || searchBusy) return;
    setSearchBusy(true);
    try {
      const result = await tryAddByEnter({
        query: q,
        products: pos.products,
        cart: pos.cart,
        branchId: pos.selectedBranchId,
        addToCart: pos.addToCart,
        onSelectSerial: (product, variant) => setSerialPick({ product, variant }),
      });
      if (result.message) {
        Alert.alert(result.handled ? 'Scan / Search' : 'Info', result.message);
      } else if (result.handled) {
        pos.setSearchTerm('');
      }
    } finally {
      setSearchBusy(false);
    }
  };

  const handleScan = (value: string) => {
    setScannerOpen(false);
    pos.setSearchTerm(value);
    void handleSearchSubmit(value);
  };

  const handleCheckoutOpen = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const cartPanel = (
    <CartPanel
      cart={pos.cart}
      orderSummary={pos.orderSummary}
      loading={pos.loading}
      isWide={isWide}
      branchId={pos.selectedBranchId}
      customer={pos.customer}
      phoneNumber={pos.phoneNumber}
      customerLoading={pos.customerLoading}
      isWalkingCustomer={pos.isWalkingCustomer}
      onClose={() => setCartOpen(false)}
      onCheckout={handleCheckoutOpen}
      onUpdateQuantity={pos.updateQuantity}
      onAddOneMore={(item) => {
        void (async () => {
          const result = await pos.handleAddOneMore(item);
          if (!result.success && result.message) {
            Alert.alert('Stock', result.message);
          }
        })();
      }}
      onUpdateUnitPrice={pos.updateUnitPrice}
      onRemove={pos.removeFromCart}
      onRemoveSerial={pos.removeSerialFromCart}
      onClearCart={pos.clearCart}
      onCustomerSelect={pos.setCustomer}
      onClearCustomer={pos.clearCustomer}
      onSetPhoneNumber={pos.setPhoneNumber}
    />
  );

  return (
    <View style={[styles.root, { paddingTop: isWide ? 0 : 4 }]}>
      {pos.branches.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.branchScroller}
          contentContainerStyle={styles.branchRow}
        >
          {pos.branches.map((b) => {
            const active = b.id === pos.selectedBranchId;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.chip, active && styles.chipOn]}
                onPress={() => void pos.setSelectedBranchId(b.id)}
                activeOpacity={0.72}
              >
                <LinearGradient
                  colors={active ? ['#6366f1', '#4f46e5'] : ['#ffffff', '#f8fafc']}
                  style={styles.chipInner}
                >
                  <View style={[styles.branchIcon, active && styles.branchIconOn]}>
                    <Store
                      color={active ? '#ffffff' : colors.accentPrimary}
                      size={12}
                      strokeWidth={2.3}
                    />
                  </View>
                  <Text
                    style={[styles.chipText, active && styles.chipTextOn]}
                    numberOfLines={1}
                  >
                    {b.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={[styles.searchRow, shadows.soft]}>
        <View style={styles.searchIconWrap}>
          <Search color={colors.accentPrimary} size={18} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="IMEI, SKU, barcode — then Enter"
          placeholderTextColor={colors.textMuted}
          value={pos.searchTerm}
          onChangeText={pos.setSearchTerm}
          onSubmitEditing={() => void handleSearchSubmit()}
          returnKeyType="search"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.scannerBtn}
          onPress={() => setScannerOpen(true)}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel="Scan QR code or barcode"
        >
          <LinearGradient colors={['#0f172a', '#334155']} style={styles.scannerBtnInner}>
            {searchBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ScanLine color="#ffffff" size={19} strokeWidth={2.3} />
            )}
          </LinearGradient>
        </TouchableOpacity>
        {!isWide ? (
          <TouchableOpacity style={styles.cartFab} onPress={() => setCartOpen(true)}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.cartFabInner}>
              <ShoppingCart color="#fff" size={16} />
            </LinearGradient>
            {pos.cart.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pos.cart.length > 99 ? '99+' : pos.cart.length}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </View>

      {!isWide && pos.cart.length > 0 ? (
        <View style={styles.quickTotal}>
          <Text style={styles.quickTotalLabel}>Cart total</Text>
          <Text style={styles.quickTotalValue}>{formatCurrency(pos.orderSummary.grandTotal)}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <View style={[styles.productsPane, !isWide && { flex: 1 }]}>
          {pos.productsLoading && displayProducts.length === 0 ? <ProductGridSkeleton /> : null}
          {pos.productsError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{pos.productsError}</Text>
              <TouchableOpacity onPress={() => pos.refetch()}>
                <Text style={styles.retry}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!pos.productsLoading && !pos.productsError && displayProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <PackagePlaceholder />
              <Text style={styles.emptyCartTitle}>
                {pos.selectedBranchId
                  ? pos.searchTerm.trim()
                    ? 'No products found'
                    : inStockProducts.length === 0 && pos.products.length > 0
                      ? 'Nothing in stock here'
                      : 'No products yet'
                  : 'Loading branch…'}
              </Text>
              <Text style={styles.emptyCart}>
                {pos.searchTerm.trim()
                  ? 'Try exact IMEI/SKU and tap Add'
                  : inStockProducts.length === 0 && pos.products.length > 0
                    ? 'These items have no available stock for this branch'
                    : 'Search by name, SKU or scan barcode'}
              </Text>
            </View>
          ) : null}
          {displayProducts.length > 0 ? (
            <FlatList
              data={displayProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!pos.searchTerm.trim()) pos.loadMore();
              }}
              ListFooterComponent={
                pos.productsLoading && displayProducts.length > 0 ? (
                  <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 16 }} />
                ) : null
              }
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={handleAddProduct} />
              )}
            />
          ) : null}
        </View>
        {isWide ? cartPanel : null}
      </View>

      <Modal visible={!isWide && cartOpen} animationType="slide" onRequestClose={() => setCartOpen(false)}>
        <View style={[styles.mobileCart, { paddingTop: insets.top }]}>
          {cartPanel}
        </View>
      </Modal>

      <CompleteOrderModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        customer={pos.customer}
        isWalkingCustomer={pos.isWalkingCustomer}
        payments={pos.payments}
        orderSummary={pos.orderSummary}
        onAddPayment={() => {}}
        onRemovePayment={() => {}}
        onReplacePayments={pos.setPayments}
        onConfirm={pos.completeOrder}
        loading={pos.loading}
        branchId={pos.selectedBranchId}
        cart={pos.cart}
      />

      <SerialSelectModal
        visible={!!serialPick}
        product={serialPick?.product ?? null}
        variant={serialPick?.variant ?? null}
        branchId={pos.selectedBranchId}
        cart={pos.cart}
        onClose={() => setSerialPick(null)}
        onConfirm={(serials, batchNumber, batchNumbers, serialBatchMap) => {
          if (!serialPick) return;
          alertAddResult(
            pos.addToCart(
              serialPick.product,
              serialPick.variant,
              serials,
              batchNumber,
              batchNumbers,
              serialBatchMap,
            ),
          );
        }}
      />

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

    </View>
  );
}

function PackagePlaceholder() {
  return (
    <View style={styles.packageIcon}>
      <ShoppingCart color={colors.textMuted} size={32} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  branchScroller: {
    flexGrow: 0,
    height: 36,
  },
  branchRow: {
    paddingHorizontal: spacing.sm,
    gap: 4,
    alignItems: 'center',
  },
  chip: {
    maxWidth: 145,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chipOn: {
    borderColor: colors.accentPrimary,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.24,
    elevation: 4,
  },
  chipInner: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  branchIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: colors.accentSoft,
  },
  branchIconOn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipText: {
    flexShrink: 1,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  chipTextOn: { color: '#ffffff', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, color: colors.textPrimary, paddingVertical: 10, fontSize: 14, fontWeight: '500' },
  scannerBtn: {
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFab: {
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 5,
  },
  cartFabInner: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    zIndex: 10,
    backgroundColor: '#ef4444',
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 7,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', lineHeight: 13 },
  quickTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  quickTotalLabel: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  quickTotalValue: { color: colors.accentPrimary, fontWeight: '800', fontSize: 16 },
  content: { flex: 1, flexDirection: 'row' },
  productsPane: { flex: 1.25, paddingHorizontal: 2 },
  productList: { paddingBottom: 24, paddingHorizontal: 4 },
  productRow: { justifyContent: 'space-between' },
  errorBox: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: { color: colors.statusError, fontSize: 13, marginBottom: 8 },
  retry: { color: colors.accentPrimary, fontWeight: '700', fontSize: 13 },
  emptyProducts: { alignItems: 'center', marginTop: 48, paddingHorizontal: spacing.lg },
  packageIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyCartWrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: spacing.lg },
  emptyCartTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginTop: spacing.sm },
  emptyCart: { color: colors.textMuted, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 20 },
  mobileCart: { flex: 1, backgroundColor: colors.bgPrimary },
});
