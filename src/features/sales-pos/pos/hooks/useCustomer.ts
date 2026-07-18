import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { POSCustomer } from '../types/pos.types';

async function loadCustomerBranchStats(
  customerId: string,
  branchId: string,
): Promise<{ totalOrders: number; totalSpent: number }> {
  const [ordersResponse, quickSellsResponse] = await Promise.all([
    authorizedFetch(
      `${API_BASE_URL}/sale-orders?customerId=${customerId}&branchId=${branchId}`,
    ),
    authorizedFetch(
      `${API_BASE_URL}/quick-sells?customerId=${customerId}&branchId=${branchId}&status=all`,
    ),
  ]);

  let orders: any[] = [];
  if (ordersResponse.ok) {
    const ordersJson = await ordersResponse.json();
    const raw = ordersJson.data ?? ordersJson ?? [];
    orders = Array.isArray(raw) ? raw : [];
  }
  let quickSells: any[] = [];
  if (quickSellsResponse.ok) {
    const quickSellsJson = await quickSellsResponse.json();
    const raw = quickSellsJson.data ?? quickSellsJson ?? [];
    quickSells = Array.isArray(raw) ? raw : [];
  }

  const saleTotalSpent = orders.reduce(
    (sum: number, order: any) => sum + Number(order.grandTotal || 0),
    0,
  );
  const legacyQuickSells = quickSells.filter(
    (q: { status: string; saleOrderId?: string }) => q.status !== 'returned' && !q.saleOrderId,
  );
  const quickSellTotalSpent = legacyQuickSells.reduce(
    (sum: number, q: { totalAmount?: number }) => sum + Number(q.totalAmount || 0),
    0,
  );

  return {
    totalOrders: orders.length + legacyQuickSells.length,
    totalSpent: saleTotalSpent + quickSellTotalSpent,
  };
}

export function useCustomer(branchId: string | null) {
  const [customer, setCustomer] = useState<POSCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumberState] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsGenerationRef = useRef(0);

  const fetchCustomerByPhone = useCallback(
    async (phone: string) => {
      if (!phone || phone.length < 10) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append('search', phone);

        const response = await authorizedFetch(`${API_BASE_URL}/customers?${params.toString()}`);

        if (!response.ok) throw new Error('Failed to fetch customer');

        const result = await response.json();
        const raw = result.data ?? result;
        const customers = Array.isArray(raw) ? raw : [];

        if (customers.length > 0) {
          const foundCustomer = customers[0];
          if (branchId) {
            try {
              const { totalOrders, totalSpent } = await loadCustomerBranchStats(
                foundCustomer.id,
                branchId,
              );
              setCustomer({ ...foundCustomer, totalOrders, totalSpent });
            } catch {
              setCustomer(foundCustomer);
            }
          } else {
            setCustomer(foundCustomer);
          }
        } else {
          setCustomer(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch customer');
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    },
    [branchId],
  );

  const handlePhoneChange = useCallback(
    (phone: string) => {
      setPhoneNumberState(phone);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        if (phone.trim().length >= 10) {
          if (!customer || customer.phone !== phone.trim()) {
            void fetchCustomerByPhone(phone.trim());
          }
        } else if (phone.trim().length === 0) {
          setCustomer(null);
        }
      }, 500);
    },
    [fetchCustomerByPhone, customer],
  );

  const clearCustomer = useCallback(() => {
    setCustomer(null);
    setPhoneNumberState('');
    statsGenerationRef.current += 1;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const setCustomerDirect = useCallback(
    (selectedCustomer: POSCustomer | null) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      statsGenerationRef.current += 1;
      const gen = statsGenerationRef.current;

      setCustomer(selectedCustomer);
      if (selectedCustomer?.phone) {
        setPhoneNumberState(selectedCustomer.phone);
      } else {
        setPhoneNumberState('');
      }

      if (selectedCustomer?.id && branchId) {
        void (async () => {
          try {
            const { totalOrders, totalSpent } = await loadCustomerBranchStats(
              selectedCustomer.id,
              branchId,
            );
            if (gen !== statsGenerationRef.current) return;
            setCustomer((prev) =>
              prev && prev.id === selectedCustomer.id
                ? { ...prev, totalOrders, totalSpent }
                : prev,
            );
          } catch {
            /* keep customer without stats */
          }
        })();
      }
    },
    [branchId],
  );

  return {
    customer,
    phoneNumber,
    loading,
    error,
    setPhoneNumber: handlePhoneChange,
    setCustomer: setCustomerDirect,
    clearCustomer,
    isWalkingCustomer: !customer && phoneNumber === '',
  };
}
