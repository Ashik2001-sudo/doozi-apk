import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Cpu,
  Minus,
  PackagePlus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { KeyboardAware } from '@/components/ui/keyboard-aware';
import { ProductImage } from '@/components/ui/product-image';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { money, type CartLine } from '../types';
import type { UseWholesaleCreate } from '../hooks/useWholesaleCreate';

export function AddOrderModal({ create }: { create: UseWholesaleCreate }) {
  const [retailerDropdownOpen, setRetailerDropdownOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);

  const {
    open,
    step,
    setStep,
    closeModal,
    retailers,
    retailerQ,
    setRetailerQ,
    retailerLoading,
    selectedRetailer,
    setSelectedRetailer,
    openAddRetailer,
    productQ,
    setProductQ,
    displayProductCards,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    loadMoreWholesaleProducts,
    cart,
    cartTotal,
    busy,
    pickProduct,
    addByCode,
    goToRetailerStep,
    setScannerOpen,
    setLinePrice,
    incLine,
    decLine,
    removeLine,
    createOrder,
    todaysOrder,
    todaysOrderLoading,
    filteredEmployees,
    employeesLoading,
    selectedEmployeeId,
    setSelectedEmployeeId,
    employeeQ,
    setEmployeeQ,
    isEmployeeUser,
    tcItems,
    addModalTcId,
    setAddModalTcId,
  } = create;

  const activeTcItems = tcItems.filter((tc) => tc.status === 'active');

  React.useEffect(() => {
    if (!open || step !== 2) setRetailerDropdownOpen(false);
  }, [open, step]);

  React.useEffect(() => {
    if (!open || step !== 1) setCartOpen(false);
  }, [open, step]);

  return (
    <>
    <Modal visible={open} animationType="slide" onRequestClose={closeModal}>
      <KeyboardAware style={styles.modalRoot}>
        <View style={styles.modalHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>
              {step === 1 ? 'Add Wholesale Order' : 'Assign Retailer'}
            </Text>
            <Text style={styles.modalSub}>
              {step === 1
                ? 'Choose products first, then assign a retailer'
                : `${cart.length} item(s) · ${money(cartTotal)}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            <>
              <View style={styles.productSearchBar}>
                <Search color={colors.accentPrimary} size={19} />
                <TextInput
                  style={styles.productSearchInput}
                  value={productQ}
                  onChangeText={setProductQ}
                  placeholder="Search product or IMEI/Serial..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => void addByCode()}
                />
                {productQ ? (
                  <TouchableOpacity onPress={() => setProductQ('')} hitSlop={8}>
                    <X color={colors.textMuted} size={17} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.scannerButton}
                  onPress={() => setScannerOpen(true)}
                  accessibilityLabel="Scan barcode, QR, SKU or IMEI"
                >
                  <ScanBarcode color="#ffffff" size={20} />
                </TouchableOpacity>
              </View>
              <Text style={styles.searchHint}>
                Type to browse · press Search for exact SKU/IMEI
              </Text>

              {productsLoading ? (
                <View style={styles.productLoading}>
                  <ActivityIndicator color={colors.accentPrimary} />
                  <Text style={styles.pickMeta}>Loading products...</Text>
                </View>
              ) : displayProductCards.length ? (
                <View style={styles.productGrid}>
                  {displayProductCards.slice(0, 40).map(({ product, variant }) => {
                      const variantText = (variant.attributes || [])
                        .map((attribute) => attribute.attributeValue || attribute.value)
                        .filter(Boolean)
                        .join(' · ');
                      const stock = Number(variant.stockQuantity ?? 0);
                      const image = variant.images?.[0] || product.images?.[0];
                      const brand = product.sellerBrand?.name || product.brand?.name;
                      return (
                        <TouchableOpacity
                          key={`${product.id}-${variant.id}`}
                          style={styles.productCard}
                          activeOpacity={0.82}
                          onPress={() => pickProduct(product, variant)}
                        >
                          <View style={styles.productImageBox}>
                            {image ? (
                              <ProductImage
                                src={image}
                                fill
                                borderRadius={0}
                                style={styles.productImage}
                              />
                            ) : (
                              <PackagePlus color={colors.textMuted} size={36} strokeWidth={1.4} />
                            )}
                            {product.hasSerialNumber ? (
                              <View style={styles.imeiBadge}>
                                <Cpu color="#ffffff" size={10} />
                                <Text style={styles.imeiBadgeText}>IMEI</Text>
                              </View>
                            ) : null}
                          </View>
                          {brand ? (
                            <Text style={styles.productBrand} numberOfLines={1}>
                              {brand}
                            </Text>
                          ) : null}
                          <Text style={styles.productCardName} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <Text style={styles.productCardSku} numberOfLines={1}>
                            {variantText || variant.sku || '—'}
                          </Text>
                          <View style={styles.productCardFooter}>
                            <Text style={styles.productCardPrice}>
                              {money(Number(variant.price?.sellingPrice ?? 0))}
                            </Text>
                            <View style={styles.stockBadge}>
                              <Text style={styles.stockBadgeText}>
                                {stock} stock
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              ) : (
                <View style={styles.productEmpty}>
                  <PackagePlus color={colors.textMuted} size={38} strokeWidth={1.4} />
                  <Text style={styles.emptyTitle}>
                    {productQ ? 'No products found' : 'Search or browse products'}
                  </Text>
                </View>
              )}

              {productsHasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreWholesaleProducts}
                  disabled={productsLoadingMore}
                >
                  {productsLoadingMore ? (
                    <ActivityIndicator color={colors.accentPrimary} size="small" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more products</Text>
                  )}
                </TouchableOpacity>
              ) : null}

            </>
          ) : (
            <>
              <View style={styles.assignRetailerIntro}>
                <View style={styles.assignRetailerIntroIcon}>
                  <UserPlus color={colors.accentPrimary} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignRetailerIntroTitle}>Who is this order for?</Text>
                  <Text style={styles.assignRetailerIntroText}>
                    Search an existing retailer or add a new one
                  </Text>
                </View>
              </View>

              <View style={styles.retailerSearchActions}>
                <View style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.retailerSearchBar,
                      { marginBottom: 0 },
                      retailerDropdownOpen ? styles.retailerComboOpen : null,
                    ]}
                  >
                    <Search color={colors.accentPrimary} size={18} />
                    <TextInput
                      style={styles.productSearchInput}
                      value={retailerQ}
                      onChangeText={(value) => {
                        setRetailerQ(value);
                        setRetailerDropdownOpen(true);
                      }}
                      onFocus={() => setRetailerDropdownOpen(true)}
                      placeholder="Search or select retailer..."
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {retailerLoading ? (
                      <ActivityIndicator color={colors.accentPrimary} size="small" />
                    ) : retailerQ || selectedRetailer ? (
                      <TouchableOpacity
                        onPress={() => {
                          setRetailerQ('');
                          setSelectedRetailer(null);
                          setRetailerDropdownOpen(true);
                        }}
                        hitSlop={8}
                      >
                        <X color={colors.textMuted} size={17} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setRetailerDropdownOpen((v) => !v)}
                        hitSlop={8}
                      >
                        <ChevronDown color={colors.textMuted} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {retailerDropdownOpen ? (
                    <View style={styles.retailerComboDropdown}>
                      {retailerLoading && retailers.length === 0 ? (
                        <View style={styles.retailerComboEmpty}>
                          <ActivityIndicator color={colors.accentPrimary} size="small" />
                          <Text style={styles.pickMeta}>Searching…</Text>
                        </View>
                      ) : retailers.length === 0 ? (
                        <View style={styles.retailerComboEmpty}>
                          <Text style={styles.pickMeta}>No retailers found</Text>
                          <TouchableOpacity
                            style={styles.addRetailerEmptyButton}
                            onPress={() => {
                              setRetailerDropdownOpen(false);
                              openAddRetailer();
                            }}
                          >
                            <Plus color="#ffffff" size={15} />
                            <Text style={styles.addRetailerEmptyText}>Add Retailer</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <ScrollView
                          style={styles.retailerComboScroll}
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                        >
                          {retailers.slice(0, 30).map((retailer) => {
                            const isSelected = selectedRetailer?.id === retailer.id;
                            return (
                              <TouchableOpacity
                                key={retailer.id}
                                style={[
                                  styles.retailerComboItem,
                                  isSelected ? styles.retailerComboItemSelected : null,
                                ]}
                                onPress={() => {
                                  setSelectedRetailer(retailer);
                                  setRetailerQ(retailer.name);
                                  setRetailerDropdownOpen(false);
                                }}
                              >
                                <View style={styles.retailerAvatar}>
                                  <Text style={styles.retailerAvatarText}>
                                    {retailer.name.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.pickName} numberOfLines={1}>
                                    {retailer.name}
                                  </Text>
                                  <Text style={styles.pickMeta}>{retailer.phone || '—'}</Text>
                                </View>
                                {isSelected ? (
                                  <Check color={colors.accentPrimary} size={17} strokeWidth={3} />
                                ) : null}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.addRetailerButton}
                  onPress={openAddRetailer}
                  accessibilityLabel="Add retailer"
                >
                  <Plus color="#ffffff" size={21} strokeWidth={2.7} />
                </TouchableOpacity>
              </View>

              {selectedRetailer ? (
                <View style={styles.selectedRetailerCard}>
                  <View style={styles.selectedRetailerTop}>
                    <View style={styles.selectedRetailerAvatar}>
                      <Text style={styles.selectedRetailerAvatarText}>
                        {selectedRetailer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.selectedRetailerNameRow}>
                        <Text style={styles.selectedName}>{selectedRetailer.name}</Text>
                        <View style={styles.assignedBadge}>
                          <Check color="#059669" size={12} strokeWidth={3} />
                          <Text style={styles.assignedBadgeText}>Assigned</Text>
                        </View>
                      </View>
                      <Text style={styles.selectedMeta}>{selectedRetailer.phone || 'No phone'}</Text>
                    </View>
                  </View>
                  <View style={styles.retailerBalanceRow}>
                    <View style={styles.retailerBalanceItem}>
                      <Text style={styles.retailerBalanceLabel}>Advance</Text>
                      <Text style={[styles.retailerBalanceValue, { color: '#059669' }]}>
                        {money(Number(selectedRetailer.advanceBalance || 0))}
                      </Text>
                    </View>
                    <View style={styles.retailerBalanceDivider} />
                    <View style={styles.retailerBalanceItem}>
                      <Text style={styles.retailerBalanceLabel}>Current Due</Text>
                      <Text style={[styles.retailerBalanceValue, { color: '#e11d48' }]}>
                        {money(Number(selectedRetailer.totalDue || 0))}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedRetailer(null);
                      setRetailerQ('');
                      setRetailerDropdownOpen(true);
                    }}
                  >
                    <Text style={[styles.link, { textAlign: 'center' }]}>Change retailer</Text>
                  </TouchableOpacity>
                </View>
              ) : !retailerDropdownOpen ? (
                <View style={styles.retailerEmptyState}>
                  <UserPlus color={colors.textMuted} size={34} strokeWidth={1.4} />
                  <Text style={styles.emptyTitle}>No retailer selected</Text>
                  <Text style={styles.pickMeta}>
                    Tap the search box above to pick a retailer
                  </Text>
                </View>
              ) : null}

              {selectedRetailer && todaysOrderLoading ? (
                <Text style={styles.searchHint}>Checking today's order...</Text>
              ) : null}
              {selectedRetailer && todaysOrder && !todaysOrderLoading ? (
                <View style={styles.todayOrderBanner}>
                  <Text style={styles.todayOrderText}>
                    Items will be added to today's order ({todaysOrder.orderNo}).
                  </Text>
                </View>
              ) : null}

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Assign employee</Text>
              {isEmployeeUser ? (
                <View style={styles.employeeLocked}>
                  <Text style={styles.pickMeta}>You (assigned automatically)</Text>
                </View>
              ) : (
                <>
                  <View style={styles.retailerSearchBar}>
                    <Search color={colors.accentPrimary} size={18} />
                    <TextInput
                      style={styles.productSearchInput}
                      value={employeeQ}
                      onChangeText={setEmployeeQ}
                      placeholder="Search or select employee (optional)..."
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {employeesLoading ? (
                      <ActivityIndicator color={colors.accentPrimary} size="small" />
                    ) : selectedEmployeeId ? (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedEmployeeId(null);
                          setEmployeeQ('');
                        }}
                        hitSlop={8}
                      >
                        <X color={colors.textMuted} size={17} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {filteredEmployees.slice(0, 8).map((employee) => {
                    const selected = selectedEmployeeId === employee.id;
                    return (
                      <TouchableOpacity
                        key={employee.id}
                        style={[
                          styles.retailerCard,
                          selected ? styles.retailerComboItemSelected : null,
                        ]}
                        onPress={() => {
                          setSelectedEmployeeId(employee.id);
                          setEmployeeQ(employee.fullName);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickName}>{employee.fullName}</Text>
                          {employee.employeeId ? (
                            <Text style={styles.pickMeta}>{employee.employeeId}</Text>
                          ) : null}
                        </View>
                        {selected ? (
                          <Check color={colors.accentPrimary} size={17} strokeWidth={3} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {activeTcItems.length > 0 ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                    Terms & Conditions
                  </Text>
                  <TouchableOpacity
                    style={styles.tcNoneRow}
                    onPress={() => setAddModalTcId('')}
                  >
                    <Text style={styles.pickName}>None</Text>
                    {!addModalTcId ? (
                      <Check color={colors.accentPrimary} size={17} strokeWidth={3} />
                    ) : null}
                  </TouchableOpacity>
                  {activeTcItems.map((tc) => {
                    const selected = addModalTcId === tc.id;
                    return (
                      <TouchableOpacity
                        key={tc.id}
                        style={[
                          styles.retailerCard,
                          selected ? styles.retailerComboItemSelected : null,
                        ]}
                        onPress={() => setAddModalTcId(tc.id)}
                      >
                        <Text style={[styles.pickName, { flex: 1 }]}>{tc.name}</Text>
                        {selected ? (
                          <Check color={colors.accentPrimary} size={17} strokeWidth={3} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : null}

              <View style={styles.cartSummary}>
                <Text style={styles.sectionLabel}>Cart summary</Text>
                {cart.map((item) => (
                  <View key={`summary-${item.key}`} style={styles.summaryRow}>
                    <Text style={styles.summaryName} numberOfLines={1}>
                      {item.productName}
                      {item.serialNumbers?.[0] ? ` · ${item.serialNumbers[0]}` : ''}
                    </Text>
                    <Text style={styles.summaryAmount}>
                      {item.quantity} × {money(item.unitPrice)}
                    </Text>
                  </View>
                ))}
                <View style={styles.summaryTotalRow}>
                  <Text style={styles.selectedName}>Grand total</Text>
                  <Text style={styles.cartTotal}>{money(cartTotal)}</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.modalFooter}>
          {step === 1 ? (
            <View style={styles.stepOneFooter}>
              <TouchableOpacity
                style={styles.cartFooterButton}
                onPress={() => setCartOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.cartFooterLeft}>
                  <View style={styles.cartFooterIcon}>
                    <ShoppingCart color={colors.accentPrimary} size={19} />
                    {cart.length ? (
                      <View style={styles.cartCountBadge}>
                        <Text style={styles.cartCountText}>{cart.length}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View>
                    <Text style={styles.cartFooterTitle}>
                      {cart.length ? `${cart.length} cart item${cart.length === 1 ? '' : 's'}` : 'Cart is empty'}
                    </Text>
                    <Text style={styles.cartFooterHint}>
                      {cart.length ? 'Tap to review and edit' : 'Tap a product to add'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cartFooterTotal}>{money(cartTotal)}</Text>
              </TouchableOpacity>
              <Button
                title="Next · Assign Retailer"
                disabled={cart.length === 0}
                onPress={goToRetailerStep}
              />
            </View>
          ) : (
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.backStepButton} onPress={() => setStep(1)}>
                <ArrowLeft color={colors.textPrimary} size={17} />
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Button
                  title={
                    todaysOrder
                      ? `Add to ${todaysOrder.orderNo}`
                      : `Create · ${money(cartTotal)}`
                  }
                  loading={busy || todaysOrderLoading}
                  disabled={!selectedRetailer || cart.length === 0 || todaysOrderLoading}
                  onPress={() => void createOrder()}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAware>
    </Modal>

    <Modal
      visible={open && cartOpen}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setCartOpen(false)}
    >
      {/* Backdrop Pressable must NOT wrap the drawer — it steals vertical pan/scroll. */}
      <View style={styles.cartDrawerOverlay}>
        <Pressable
          style={styles.cartDrawerBackdrop}
          onPress={() => setCartOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close cart"
        />
        <View style={styles.cartDrawer}>
          <View style={styles.cartDrawerHandle} />
          <View style={styles.cartDrawerHeader}>
            <View style={styles.cartDrawerTitleRow}>
              <View style={styles.cartDrawerIcon}>
                <ShoppingCart color={colors.accentPrimary} size={21} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cartDrawerTitle}>Order cart</Text>
                <Text style={styles.cartDrawerSub}>
                  {cart.length} item{cart.length === 1 ? '' : 's'} · edit quantity and price
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCartOpen(false)}>
              <X color={colors.textPrimary} size={19} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.cartDrawerScroll}
            contentContainerStyle={styles.cartDrawerContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            bounces
            showsVerticalScrollIndicator
          >
            {cart.length ? (
              cart.map((item) => (
                <CartItem
                  key={item.key}
                  item={item}
                  onPriceChange={setLinePrice}
                  onIncrease={incLine}
                  onDecrease={decLine}
                  onRemove={removeLine}
                />
              ))
            ) : (
              <View style={styles.cartDrawerEmpty}>
                <ShoppingCart color={colors.textMuted} size={38} strokeWidth={1.4} />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.pickMeta}>Close the cart and tap a product to add it</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.cartDrawerFooter}>
            <View style={styles.cartGrandTotalRow}>
              <View>
                <Text style={styles.cartGrandTotalLabel}>Grand total</Text>
                <Text style={styles.cartGrandTotalItems}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} total unit(s)
                </Text>
              </View>
              <Text style={styles.cartGrandTotalValue}>{money(cartTotal)}</Text>
            </View>
            <Button
              title={cart.length ? 'Done · Continue shopping' : 'Continue shopping'}
              onPress={() => setCartOpen(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

function CartItem({
  item,
  onPriceChange,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartLine;
  onPriceChange: (key: string, price: number) => void;
  onIncrease: (key: string) => void;
  onDecrease: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  const [price, setPrice] = React.useState(String(item.unitPrice));

  React.useEffect(() => {
    setPrice(String(item.unitPrice));
  }, [item.unitPrice]);

  const commitPrice = () => {
    const value = Number(price.replace(/,/g, ''));
    if (Number.isFinite(value) && value >= 0) onPriceChange(item.key, value);
    else setPrice(String(item.unitPrice));
  };

  const atStockLimit =
    !item.hasSerial &&
    item.stockQuantity != null &&
    item.quantity >= Math.max(0, Math.floor(Number(item.stockQuantity)));

  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cartItemName} numberOfLines={2}>{item.productName}</Text>
          <Text style={styles.cartItemVariant} numberOfLines={1}>
            {item.variantDisplay || item.sku || '—'}
          </Text>
        </View>
        <TouchableOpacity style={styles.cartRemoveButton} onPress={() => onRemove(item.key)}>
          <Trash2 color={colors.statusError} size={17} />
        </TouchableOpacity>
      </View>

      {item.serialNumbers?.length ? (
        <View style={styles.cartSerialBox}>
          <Cpu color={colors.accentPrimary} size={13} />
          <Text style={styles.cartSerialText} numberOfLines={3}>
            {item.serialNumbers.join(', ')}
          </Text>
        </View>
      ) : null}

      <View style={styles.cartItemControls}>
        {item.hasSerial ? (
          <View style={styles.fixedQuantity}>
            <Text style={styles.fixedQuantityValue}>{item.quantity}</Text>
            <Text style={styles.fixedQuantityLabel}>IMEI fixed</Text>
          </View>
        ) : (
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onDecrease(item.key)}
            >
              <Minus color={colors.textPrimary} size={15} />
            </TouchableOpacity>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, atStockLimit && styles.quantityButtonDisabled]}
              onPress={() => onIncrease(item.key)}
              disabled={atStockLimit}
            >
              <Plus color={atStockLimit ? colors.textMuted : colors.textPrimary} size={15} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cartPriceWrap}>
          <Text style={styles.cartPriceLabel}>Unit price</Text>
          <View style={styles.cartPriceInputWrap}>
            <Text style={styles.cartCurrency}>৳</Text>
            <TextInput
              style={styles.cartPriceInput}
              value={price}
              onChangeText={setPrice}
              onEndEditing={commitPrice}
              onSubmitEditing={commitPrice}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
        </View>
      </View>

      <View style={styles.cartLineTotalRow}>
        <Text style={styles.cartLineFormula}>
          {item.quantity} × {money(item.unitPrice)}
        </Text>
        <Text style={styles.cartLineTotal}>{money(item.quantity * item.unitPrice)}</Text>
      </View>
    </View>
  );
}
