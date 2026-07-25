import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '@/features/sales-pos/sales-history/components/OrderDetailScreen';

export default function OrderDetailPage() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  return <OrderDetailScreen orderId={String(orderId || '')} />;
}
