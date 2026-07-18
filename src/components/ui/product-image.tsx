import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Package } from 'lucide-react-native';
import { getValidImageSrc } from '@/features/sales-pos/pos/utils/formatters';
import { colors } from '@/theme/tokens';

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

export function ProductImage({
  src,
  size,
  fill = false,
  style,
  imageStyle,
  borderRadius = 12,
  iconSize,
}: ProductImageProps) {
  const uri = getValidImageSrc(src);
  const [loading, setLoading] = useState(!!uri);
  const [error, setError] = useState(false);

  const resolvedIcon = iconSize ?? (size ? Math.round(size * 0.42) : 48);

  const boxStyle: ViewStyle = fill
    ? { ...StyleSheet.absoluteFill, borderRadius }
    : size
      ? { width: size, height: size, borderRadius }
      : { flex: 1, borderRadius };

  if (!uri || error) {
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
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accentPrimary} size="small" />
        </View>
      ) : null}
      <Image
        source={{ uri }}
        style={[
          styles.image,
          fill ? StyleSheet.absoluteFill : size ? { width: size, height: size } : { flex: 1 },
          { borderRadius },
          imageStyle,
        ]}
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </View>
  );
}

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
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241,245,249,0.85)',
    zIndex: 1,
  },
});
