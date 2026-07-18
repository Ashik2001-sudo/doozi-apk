import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { colors } from '@/theme/tokens';
import { styles } from '../styles';
import { money } from '../types';
import type { UseWholesaleCreate } from '../hooks/useWholesaleCreate';

export function AddOrderModal({ create }: { create: UseWholesaleCreate }) {
  const {
    open,
    closeModal,
    retailers,
    retailerQ,
    setRetailerQ,
    selectedRetailer,
    setSelectedRetailer,
    productQ,
    setProductQ,
    products,
    productsLoading,
    cart,
    cartTotal,
    busy,
    pickProduct,
    setLinePrice,
    incLine,
    decLine,
    removeLine,
    createOrder,
  } = create;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={closeModal}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHead}>
          <View>
            <Text style={styles.modalTitle}>New Wholesale Order</Text>
            <Text style={styles.modalSub}>Assign retailer, add products, then create</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
            <X color={colors.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionLabel}>Retailer</Text>
          <TextInput
            style={styles.input}
            value={retailerQ}
            onChangeText={setRetailerQ}
            placeholder="Search retailer…"
            placeholderTextColor={colors.textMuted}
          />
          {selectedRetailer ? (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedName}>{selectedRetailer.name}</Text>
              <Text style={styles.selectedMeta}>
                {selectedRetailer.phone || 'No phone'}
                {Number(selectedRetailer.advanceBalance) > 0
                  ? ` · Advance ${money(Number(selectedRetailer.advanceBalance))}`
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedRetailer(null)}>
                <Text style={styles.link}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            retailers.slice(0, 8).map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.pickRow}
                onPress={() => setSelectedRetailer(r)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{r.name}</Text>
                  <Text style={styles.pickMeta}>{r.phone || '—'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {selectedRetailer ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Products</Text>
              <TextInput
                style={styles.input}
                value={productQ}
                onChangeText={setProductQ}
                placeholder="Search product / SKU…"
                placeholderTextColor={colors.textMuted}
              />
              {productsLoading ? (
                <ActivityIndicator color={colors.accentPrimary} style={{ marginVertical: 12 }} />
              ) : (
                products.slice(0, 12).map((p) =>
                  (p.variants || []).map((v) => (
                    <TouchableOpacity
                      key={`${p.id}-${v.id}`}
                      style={styles.pickRow}
                      onPress={() => pickProduct(p, v)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickName}>{p.name}</Text>
                        <Text style={styles.pickMeta}>
                          {v.sku}
                          {(v.attributes || []).length
                            ? ` · ${(v.attributes || [])
                                .map((a) => a.attributeValue || a.value)
                                .filter(Boolean)
                                .join(' · ')}`
                            : ''}
                          {' · '}Stock {v.stockQuantity ?? 0}
                        </Text>
                      </View>
                      <Text style={styles.pickPrice}>{money(Number(v.price?.sellingPrice ?? 0))}</Text>
                    </TouchableOpacity>
                  )),
                )
              )}

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                Cart ({cart.length}) · {money(cartTotal)}
              </Text>
              {cart.map((c) => (
                <View key={c.key} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickName}>{c.productName}</Text>
                    <Text style={styles.pickMeta}>
                      {c.variantDisplay || c.sku} · Qty {c.quantity}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.priceMini}
                    value={String(c.unitPrice)}
                    keyboardType="decimal-pad"
                    onChangeText={(v) => setLinePrice(c.key, parseFloat(v) || 0)}
                  />
                  {!c.hasSerial ? (
                    <View style={styles.qtyBtns}>
                      <TouchableOpacity onPress={() => decLine(c.key)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => incLine(c.key)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity onPress={() => removeLine(c.key)}>
                    <Trash2 color={colors.statusError} size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title={`Create · ${money(cartTotal)}`}
            loading={busy}
            disabled={!selectedRetailer || cart.length === 0}
            onPress={() => void createOrder()}
          />
        </View>
      </View>
    </Modal>
  );
}
