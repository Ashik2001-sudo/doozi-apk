import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Hash, Minus, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { ProductImage } from '@/components/ui/product-image';
import { CartItem } from '@/features/sales-pos/pos/types/pos.types';
import { getEffectiveUnitPrice } from '@/features/sales-pos/pos/utils/calculations';
import { formatCurrency } from '@/features/sales-pos/pos/utils/formatters';
import { colors, radius, shadows } from '@/theme/tokens';

interface CartLineItemProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (itemId: string, quantity: number, batchNumbers?: string[]) => void;
  onAddOneMore?: (item: CartItem) => void;
  onRemove: (itemId: string) => void;
  onRemoveSerial?: (itemId: string, serial: string) => void;
  onEditUnitPrice: (item: CartItem) => void;
}

export function CartLineItem({
  item,
  index,
  onUpdateQuantity,
  onAddOneMore,
  onRemove,
  onRemoveSerial,
  onEditUnitPrice,
}: CartLineItemProps) {
  const isSerial = !!item.serialNumbers?.length;
  const effectiveUnit = getEffectiveUnitPrice(item.lineTotal, item.quantity);

  const confirmRemove = () => {
    Alert.alert('Remove item', `Remove "${item.productName}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
    ]);
  };

  /** Decrease qty and remove one batchNumber occurrence (seller-admin parity) */
  const handleDecrease = () => {
    if (item.quantity <= 1) {
      onUpdateQuantity(item.id, 0);
      return;
    }
    const currentBatchNumbers =
      item.batchNumbers && item.batchNumbers.length > 0
        ? item.batchNumbers
        : item.batchNumber
          ? [item.batchNumber]
          : [];
    if (currentBatchNumbers.length > 0) {
      const newBatchNumbers = currentBatchNumbers.slice(0, -1);
      onUpdateQuantity(item.id, item.quantity - 1, newBatchNumbers);
    } else {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  /** Increase qty via FIFO batch selection (seller-admin parity) */
  const handleIncrease = () => {
    if (item.quantity + 1 > item.stockAvailable) {
      Alert.alert('Stock', `Only ${item.stockAvailable} available`);
      return;
    }
    if (onAddOneMore) {
      onAddOneMore(item);
      return;
    }
    const currentBatchNumbers =
      item.batchNumbers && item.batchNumbers.length > 0
        ? item.batchNumbers
        : item.batchNumber
          ? [item.batchNumber]
          : [];
    onUpdateQuantity(
      item.id,
      item.quantity + 1,
      currentBatchNumbers.length > 0
        ? [...currentBatchNumbers, currentBatchNumbers[currentBatchNumbers.length - 1]]
        : undefined,
    );
  };

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.topRow}>
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <ProductImage src={item.image} size={58} borderRadius={12} iconSize={22} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.productName}
          </Text>
          {item.variantName ? (
            <Text style={styles.variant} numberOfLines={1}>
              ({item.variantName})
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.unitPriceRow}
            onPress={() => onEditUnitPrice(item)}
            activeOpacity={0.75}
          >
            <Text style={styles.unitPrice}>
              {formatCurrency(effectiveUnit)}
              <Text style={styles.unitLabel}> each</Text>
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.lineTotal}>{formatCurrency(item.lineTotal)}</Text>
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={() => onEditUnitPrice(item)}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Pencil color={colors.accentPrimary} size={15} />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmRemove} style={styles.deleteBtn} hitSlop={8}>
              <Trash2 color={colors.statusError} size={15} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isSerial ? (
        <View style={styles.imeiSection}>
          <Text style={styles.imeiLabel}>IMEI / Serial</Text>
          <View style={styles.imeiChips}>
            {item.serialNumbers!.map((sn) => (
              <View key={sn} style={styles.imeiChip}>
                <Hash color={colors.accentPrimary} size={10} />
                <Text style={styles.imeiText} numberOfLines={1}>
                  {sn}
                </Text>
                {onRemoveSerial ? (
                  <TouchableOpacity
                    onPress={() => onRemoveSerial(item.id, sn)}
                    style={styles.imeiRemove}
                    hitSlop={6}
                  >
                    <X color={colors.statusError} size={12} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.qtySection}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtyStepper}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrease}>
              <Minus color={colors.textPrimary} size={14} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrease}>
              <Plus color={colors.textPrimary} size={14} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  indexText: { color: colors.accentPrimary, fontSize: 10, fontWeight: '800' },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  variant: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  unitPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  unitPrice: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  unitLabel: { color: colors.textMuted, fontWeight: '500' },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  lineTotal: { color: colors.accentPrimary, fontWeight: '800', fontSize: 15 },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imeiSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  imeiLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  imeiChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  imeiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  imeiText: {
    color: colors.accentPrimary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    flexShrink: 1,
  },
  imeiRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtySection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qtyValue: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    minWidth: 28,
    textAlign: 'center',
  },
});
