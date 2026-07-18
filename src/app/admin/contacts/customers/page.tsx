import React from 'react';
import { FlatList, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/config';
import { AdminScreenShell } from '@/components/common/AdminScreenShell';
import { colors, spacing } from '@/theme/tokens';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function CustomersPage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await apiFetch<Customer[] | { data?: Customer[] }>('/customers?page=1&limit=50');
      if (Array.isArray(res.data)) return res.data;
      return [];
    },
  });

  return (
    <AdminScreenShell title="Customers" routePath="/admin/contacts/customers">
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
              {item.name} {item.phone ? `· ${item.phone}` : ''}
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
