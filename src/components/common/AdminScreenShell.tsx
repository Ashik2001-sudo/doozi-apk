import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

interface AdminScreenShellProps {
  title: string;
  routePath: string;
  dynamic?: boolean;
  children?: React.ReactNode;
}

export function AdminScreenShell({ title, routePath, children }: AdminScreenShellProps) {
  const params = useLocalSearchParams();
  const paramText = Object.keys(params).length
    ? Object.entries(params)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient colors={['#eef2ff', '#f8fafc']} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{routePath}</Text>
        {paramText ? <Text style={styles.params}>{paramText}</Text> : null}
      </LinearGradient>
      {children ?? (
        <View style={[styles.placeholder, shadows.soft]}>
          <Text style={styles.placeholderTitle}>Coming soon</Text>
          <Text style={styles.placeholderText}>
            This screen mirrors seller-admin. Full mobile UI loads here next.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingBottom: spacing.xl * 2 },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginBottom: spacing.md,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  params: { color: colors.accentPrimary, fontSize: 12, marginTop: 8 },
  placeholder: {
    marginHorizontal: spacing.md,
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  placeholderTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 6 },
  placeholderText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
