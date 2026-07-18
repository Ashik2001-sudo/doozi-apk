import React from 'react';
import { FlatList, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/config';
import { AdminScreenShell } from '@/components/common/AdminScreenShell';
import { colors, spacing } from '@/theme/tokens';

interface Product {
  id: string;
  name: string;
  sku?: string;
  status?: string;
}

export default function ManageProductPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiFetch<{ products?: Product[]; data?: Product[] }>('/products?page=1&limit=50');
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      return (payload as { products?: Product[] })?.products ?? [];
    },
  });

  return (
    <AdminScreenShell title="Manage Products" routePath="/admin/inventory/manage-product">
      {isLoading ? (
        <ActivityIndicator color={colors.accentPrimary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.accentPrimary} />
          }
          renderItem={({ item }) => (
            <Text style={styles.row}>
              {item.name} {item.sku ? `· ${item.sku}` : ''}
            </Text>
          )}
        />
      )}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    color: colors.textPrimary,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
  },
});
