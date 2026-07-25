import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { getValidImageSrc } from '@/features/sales-pos/pos/utils/formatters';

interface ProductImageProps {
  src: string | null | undefined;
  alt?: string;
  size?: number;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderRadius?: number;
  iconSize?: number;
}

function ProductImageInner({
  src,
  size,
  fill = false,
  style,
  imageStyle,
  borderRadius = 12,
  iconSize,
}: ProductImageProps) {
  const uri = getValidImageSrc(src);
  const resolvedIcon = iconSize ?? (size ? Math.round(size * 0.42) : 48);

  const boxStyle = useMemo<ViewStyle>(
    () =>
      fill
        ? { ...StyleSheet.absoluteFill, borderRadius }
        : size
          ? { width: size, height: size, borderRadius }
          : { flex: 1, borderRadius },
    [borderRadius, fill, size],
  );

  if (!uri) {
    return (
      <View style={[styles.placeholder, boxStyle, style]}>
        <View
          style={[
            styles.placeholderRing,
            {
              width: resolvedIcon * 1.55,
              height: resolvedIcon * 1.55,
              borderRadius: resolvedIcon * 0.78,
            },
          ]}
        >
          <Package color="#94a3b8" size={resolvedIcon} strokeWidth={1.25} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, boxStyle, style]}>
      <Image
        source={{ uri }}
        style={[
          styles.image,
          fill ? StyleSheet.absoluteFill : size ? { width: size, height: size } : { flex: 1 },
          { borderRadius },
          imageStyle as any,
        ]}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={uri}
        transition={0}
      />
    </View>
  );
}

export const ProductImage = React.memo(ProductImageInner);

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  placeholderRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8edf3',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
