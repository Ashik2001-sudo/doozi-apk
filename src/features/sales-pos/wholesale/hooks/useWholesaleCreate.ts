import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL, authorizedFetch, getUserData } from '@/lib/config';
import {
  CartLine,
  generateWholesaleOrderNo,
  PosProductLite,
  WholesaleRetailer,
} from '../types';

export type SerialPick = {
  product: PosProductLite;
  variant: PosProductLite['variants'][0];
  selected: string[];
};

export function useWholesaleCreate(branchId: string, onCreated: () => void | Promise<void>) {
  const [open, setOpen] = useState(false);
  const [retailers, setRetailers] = useState<WholesaleRetailer[]>([]);
  const [retailerQ, setRetailerQ] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<WholesaleRetailer | null>(null);
  const [productQ, setProductQ] = useState('');
  const [products, setProducts] = useState<PosProductLite[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [serialPick, setSerialPick] = useState<SerialPick | null>(null);

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    [cart],
  );

  const searchRetailers = useCallback(
    async (q: string) => {
      try {
        const params = new URLSearchParams();
        if (branchId) params.set('branchId', branchId);
        if (q.trim()) params.set('search', q.trim());
        params.set('limit', '30');
        const res = await authorizedFetch(`${API_BASE_URL}/retailers?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = data.data || data.retailers || data || [];
        setRetailers(
          (Array.isArray(list) ? list : []).map((r: any) => ({
            id: r.id,
            name: r.name || r.companyName || 'Retailer',
            phone: r.phone,
            advanceBalance: Number(r.advanceBalance ?? 0),
            totalDue: Number(r.totalDue ?? 0),
          })),
        );
      } catch {
        setRetailers([]);
      }
    },
    [branchId],
  );

  const searchProducts = useCallback(
    async (q: string) => {
      if (!branchId) return;
      setProductsLoading(true);
      try {
        const params = new URLSearchParams({ branchId, page: '1', limit: '20' });
        if (q.trim()) params.set('search', q.trim());
        const res = await authorizedFetch(`${API_BASE_URL}/products/pos?${params}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const list = json.products ?? json.data?.products ?? [];
        setProducts(
          (Array.isArray(list) ? list : []).map((p: any) => ({
            id: p.id,
            name: p.name,
            hasSerialNumber: !!p.hasSerialNumber,
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              sku: v.sku,
              stockQuantity: Number(v.stockQuantity ?? 0),
              price: {
                sellingPrice: Number(v.prices?.[0]?.sellingPrice ?? v.price?.sellingPrice ?? 0),
              },
              attributes: (v.attributes || []).map((a: any) => ({
                attributeName: a.name || a.attributeName || '',
                attributeValue: a.value || a.attributeValue || '',
              })),
              serialNumbers: v.serialNumbers || [],
            })),
          })),
        );
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [branchId],
  );

  useEffect(() => {
    if (!open) return;
    void searchRetailers(retailerQ);
  }, [open, retailerQ, searchRetailers]);

  useEffect(() => {
    if (!open || !selectedRetailer) return;
    const t = setTimeout(() => void searchProducts(productQ), 300);
    return () => clearTimeout(t);
  }, [open, selectedRetailer, productQ, searchProducts]);

  const openModal = useCallback(() => {
    if (!branchId) {
      Alert.alert('Branch required', 'Select a branch first');
      return;
    }
    setOpen(true);
    setSelectedRetailer(null);
    setCart([]);
    setProductQ('');
    setProducts([]);
    setRetailerQ('');
  }, [branchId]);

  const closeModal = useCallback(() => setOpen(false), []);

  const addVariantToCart = useCallback(
    (product: PosProductLite, variant: PosProductLite['variants'][0], serials?: string[]) => {
      const qty = serials?.length || 1;
      const stock = Number(variant.stockQuantity ?? 0);
      if (!product.hasSerialNumber && stock < 1) {
        Alert.alert('Out of stock', 'No stock available for this variant');
        return;
      }
      const key = `${product.id}:${variant.id}`;
      const display = (variant.attributes || [])
        .map((a) => a.attributeValue || a.value)
        .filter(Boolean)
        .join(' · ');
      setCart((prev) => {
        const existing = prev.find((c) => c.key === key && !product.hasSerialNumber);
        if (existing && !product.hasSerialNumber) {
          const nextQty = existing.quantity + 1;
          if (nextQty > stock) {
            Alert.alert('Stock', `Only ${stock} available`);
            return prev;
          }
          return prev.map((c) => (c.key === key ? { ...c, quantity: nextQty } : c));
        }
        return [
          ...prev,
          {
            key: product.hasSerialNumber ? `${key}:${serials?.join(',')}` : key,
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            sku: variant.sku,
            variantDisplay: display,
            quantity: qty,
            unitPrice: Number(variant.price?.sellingPrice ?? 0),
            stockQuantity: stock,
            hasSerial: !!product.hasSerialNumber,
            serialNumbers: serials,
          },
        ];
      });
    },
    [],
  );

  const setLinePrice = useCallback((key: string, price: number) => {
    setCart((prev) => prev.map((x) => (x.key === key ? { ...x, unitPrice: price } : x)));
  }, []);

  const decLine = useCallback((key: string) => {
    setCart((prev) =>
      prev
        .map((x) => (x.key === key ? { ...x, quantity: Math.max(0, x.quantity - 1) } : x))
        .filter((x) => x.quantity > 0),
    );
  }, []);

  const incLine = useCallback((key: string) => {
    setCart((prev) =>
      prev.map((x) => {
        if (x.key !== key) return x;
        const max = x.stockQuantity ?? 9999;
        if (x.quantity + 1 > max) return x;
        return { ...x, quantity: x.quantity + 1 };
      }),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((x) => x.key !== key));
  }, []);

  const pickProduct = useCallback(
    (product: PosProductLite, variant: PosProductLite['variants'][0]) => {
      if (product.hasSerialNumber) {
        const available = (variant.serialNumbers || [])
          .map((s) => (typeof s === 'string' ? s : s.serialNumber))
          .filter(Boolean);
        if (!available.length) {
          Alert.alert('No serials', 'No in-stock serials for this variant');
          return;
        }
        setSerialPick({ product, variant, selected: [] });
        return;
      }
      addVariantToCart(product, variant);
    },
    [addVariantToCart],
  );

  const toggleSerial = useCallback((sn: string) => {
    setSerialPick((prev) => {
      if (!prev) return prev;
      const selected = prev.selected.includes(sn)
        ? prev.selected.filter((x) => x !== sn)
        : [...prev.selected, sn];
      return { ...prev, selected };
    });
  }, []);

  const confirmSerials = useCallback(() => {
    if (!serialPick?.selected.length) return;
    addVariantToCart(serialPick.product, serialPick.variant, serialPick.selected);
    setSerialPick(null);
  }, [serialPick, addVariantToCart]);

  const createOrder = useCallback(async () => {
    if (!selectedRetailer?.id) {
      Alert.alert('Required', 'Select a retailer');
      return;
    }
    if (!cart.length) {
      Alert.alert('Required', 'Add at least one product');
      return;
    }
    if (!branchId) return;
    setBusy(true);
    try {
      const user = getUserData<{ role?: string; id?: string }>();
      const isEmp = (user?.role || '').toLowerCase() === 'employee';
      const items = cart.map((c) => ({
        productId: c.productId,
        variantId: c.variantId,
        productName: c.productName,
        sku: c.sku,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        serialNumbers: c.serialNumbers?.length ? c.serialNumbers : undefined,
      }));
      const grandTotal = Math.round(cartTotal * 100) / 100;
      const payload = {
        orderNo: generateWholesaleOrderNo(),
        retailerId: selectedRetailer.id,
        retailerName: selectedRetailer.name || null,
        retailerPhone: selectedRetailer.phone || null,
        branchId,
        paymentStatus: 'due',
        orderStatus: 'pending',
        grandTotal,
        paidAmount: 0,
        dueAmount: grandTotal,
        notes: 'Wholesale order',
        ...(isEmp && user?.id ? { assignedEmployeeId: user.id } : {}),
        items,
      };
      const res = await authorizedFetch(`${API_BASE_URL}/wholesale-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Failed to create order');
      setOpen(false);
      setCart([]);
      setSelectedRetailer(null);
      await onCreated();
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }, [selectedRetailer, cart, branchId, cartTotal, onCreated]);

  return {
    open,
    openModal,
    closeModal,
    retailers,
    retailerQ,
    setRetailerQ,
    selectedRetailer,
    setSelectedRetailer,
    productQ,
    setProductQ,
    products,
    productsLoading,
    cart,
    cartTotal,
    busy,
    serialPick,
    setSerialPick,
    pickProduct,
    toggleSerial,
    confirmSerials,
    setLinePrice,
    incLine,
    decLine,
    removeLine,
    createOrder,
  };
}

export type UseWholesaleCreate = ReturnType<typeof useWholesaleCreate>;
