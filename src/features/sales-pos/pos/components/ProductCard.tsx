import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Cpu } from 'lucide-react-native';
import { ProductImage } from '@/components/ui/product-image';
import { POSProduct } from '@/features/sales-pos/pos/types/pos.types';
import {
  formatCurrency,
  getFinalSellingPrice,
  getVariantDisplayName,
} from '@/features/sales-pos/pos/utils/formatters';
import { colors, radius, shadows } from '@/theme/tokens';

interface ProductCardProps {
  product: POSProduct;
  onPress: (product: POSProduct) => void;
}

function stockTone(qty: number) {
  if (qty <= 10) return { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: String(qty) };
  return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: String(qty) };
}

function SkeletonBlock({ style }: { style: object }) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return <Animated.View style={[styles.skeletonBlock, style, animatedStyle]} />;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const variant = product.variants?.[0];
  if (!variant) return null;

  const stock = variant.stockQuantity ?? 0;
  const sellingPrice = variant.price?.sellingPrice ?? 0;
  const discountValue = variant.price?.discountValue ?? 0;
  const discountType = variant.price?.discountType;
  const finalPrice = getFinalSellingPrice(sellingPrice, discountType, discountValue);
  const rawImage = variant.images?.[0] || product.images?.[0];
  const variantName = getVariantDisplayName(variant.attributes);
  const brandName = product.sellerBrand?.name || product.brand?.name;
  const stockStyle = stockTone(stock);

  return (
    <TouchableOpacity style={styles.wrap} onPress={() => onPress(product)} activeOpacity={0.88}>
      <View style={[styles.card, shadows.soft]}>
        <View style={styles.imageBox}>
          <ProductImage src={rawImage} fill borderRadius={0} style={styles.image} />

          {product.hasSerialNumber ? (
            <View style={styles.imeiBadge}>
              <Cpu color="#fff" size={11} />
              <Text style={styles.imeiText}>IMEI</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {brandName ? (
            <Text style={styles.brand} numberOfLines={1}>
              {brandName}
            </Text>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {variantName ? (
            <Text style={styles.variant} numberOfLines={1}>
              ({variantName})
            </Text>
          ) : null}

          <View style={styles.footer}>
            <View style={styles.priceCol}>
              <Text style={styles.price}>{formatCurrency(finalPrice)}</Text>
              {discountValue > 0 ? (
                <Text style={styles.oldPrice}>{formatCurrency(sellingPrice)}</Text>
              ) : null}
            </View>
            <View style={[styles.stockPill, { backgroundColor: stockStyle.bg }]}>
              <Text style={[styles.stockText, { color: stockStyle.text }]}>{stockStyle.label}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, styles.skeletonCard, shadows.soft]}>
        <View style={styles.skeletonImage}>
          <SkeletonBlock style={styles.skeletonImageFill} />
        </View>
        <View style={styles.body}>
          <SkeletonBlock style={styles.skeletonLineShort} />
          <SkeletonBlock style={styles.skeletonLine} />
          <SkeletonBlock style={styles.skeletonLineNarrow} />
          <View style={styles.skeletonFooter}>
            <SkeletonBlock style={styles.skeletonPrice} />
            <SkeletonBlock style={styles.skeletonPill} />
          </View>
        </View>
      </View>
    </View>
  );
}

const SKELETON_ITEMS = Array.from({ length: 6 }, (_, i) => i);

export function ProductGridSkeleton() {
  return (
    <FlatList
      data={SKELETON_ITEMS}
      keyExtractor={(item) => String(item)}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.skeletonRow}
      contentContainerStyle={styles.skeletonList}
      renderItem={() => <ProductCardSkeleton />}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    margin: 5,
    maxWidth: '50%',
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    padding: 10,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imeiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(79,70,229,0.92)',
  },
  imeiText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  body: { gap: 3 },
  brand: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  variant: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  priceCol: { flex: 1, minWidth: 0 },
  price: { color: colors.accentPrimary, fontWeight: '800', fontSize: 15, letterSpacing: -0.3 },
  oldPrice: {
    color: colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  stockText: { fontSize: 10, fontWeight: '700' },
  skeletonCard: {
    borderColor: colors.borderLight,
    backgroundColor: '#fff',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  skeletonImageFill: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  skeletonBlock: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  skeletonLineShort: {
    height: 8,
    width: '40%',
    marginBottom: 6,
  },
  skeletonLine: {
    height: 10,
    width: '92%',
    marginBottom: 4,
  },
  skeletonLineNarrow: {
    height: 8,
    width: '55%',
    marginBottom: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  skeletonPrice: {
    height: 14,
    width: 64,
    borderRadius: 6,
  },
  skeletonPill: {
    height: 18,
    width: 28,
    borderRadius: 6,
  },
  skeletonRow: {
    justifyContent: 'space-between',
  },
  skeletonList: {
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
});
