import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  title,
  variant = 'primary',
  loading,
  size = 'md',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={isDisabled}
        style={[isDisabled && styles.disabled, style as ViewStyle]}
        {...props}
      >
        <LinearGradient
          colors={['#6366f1', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles[size], shadows.glow]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.accentPrimary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as 'secondaryText']]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: { paddingVertical: 10, paddingHorizontal: spacing.md },
  md: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: 18, paddingHorizontal: spacing.xl },
  secondary: {
    backgroundColor: colors.bgTertiary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600', fontSize: 15, letterSpacing: 0.2 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  secondaryText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  ghostText: { color: colors.accentPrimary, fontWeight: '600', fontSize: 15 },
  dangerText: { color: colors.statusError, fontWeight: '600', fontSize: 15 },
});
