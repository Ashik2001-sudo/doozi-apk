import { Platform, ViewStyle } from 'react-native';

export const colors = {
  accentPrimary: '#4f46e5',
  accentSecondary: '#7c3aed',
  accentSoft: 'rgba(79,70,229,0.1)',
  bgPrimary: '#f8fafc',
  bgSecondary: '#ffffff',
  bgTertiary: '#f1f5f9',
  bgElevated: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  borderLight: '#e2e8f0',
  borderAccent: 'rgba(79,70,229,0.35)',
  statusSuccess: '#059669',
  statusError: '#dc2626',
  statusWarning: '#d97706',
  glassLight: '#ffffff',
  glassMedium: '#f1f5f9',
  glow: 'rgba(79,70,229,0.25)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const shadows = {
  soft: Platform.select<ViewStyle>({
    web: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  })!,
  glow: Platform.select<ViewStyle>({
    web: { boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)' },
    default: {
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
  })!,
};
