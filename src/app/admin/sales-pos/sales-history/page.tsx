import React from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/config';
import { colors, spacing } from '@/theme/tokens';

interface SaleOrder {
  id: string;
  invoiceNo: string;
  orderNo: string;
  grandTotal: number;
  orderDate: string;
  customerName?: string;
  paymentStatus: string;
}

export default function SalesHistoryPage() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales-history'],
    queryFn: async () => {
      const res = await apiFetch<{ orders?: SaleOrder[]; data?: SaleOrder[] }>(
        '/sale-orders?page=1&limit=50',
      );
      const payload = res.data as { orders?: SaleOrder[] } | SaleOrder[] | undefined;
      if (Array.isArray(payload)) return payload;
      return payload?.orders ?? [];
    },
  });

  if (isLoading) return <ActivityIndicator color={colors.accentPrimary} style={{ marginTop: 40 }} />;

  return (
    <FlatList
      style={styles.list}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.accentPrimary} />
      }
      ListEmptyComponent={<Text style={styles.empty}>No sales found</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push(`/admin/sales-pos/sales-history/${item.id}` as never)}
        >
          <View>
            <Text style={styles.invoice}>{item.invoiceNo || item.orderNo}</Text>
            <Text style={styles.meta}>
              {item.customerName || 'Walk-in'} · {new Date(item.orderDate).toLocaleDateString('en-BD')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.total}>৳{item.grandTotal.toLocaleString()}</Text>
            <Text style={styles.status}>{item.paymentStatus}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bgPrimary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  invoice: { color: colors.textPrimary, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  total: { color: colors.accentPrimary, fontWeight: '700' },
  status: { color: colors.textMuted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
