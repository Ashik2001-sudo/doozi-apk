import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  loading?: boolean;
};

export type WholesaleEmployee = {
  id: string;
  fullName: string;
  employeeId?: string;
};

export type WholesaleTcItem = {
  id: string;
  name: string;
  status?: string;
};

const PAGE_SIZE = 20;

function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== 'string') return [];
  const value = raw.trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [value];
  } catch {
    return [value];
  }
}

function normSerial(value: string) {
  return String(value).trim().toLowerCase();
}

function serialInCart(cart: CartLine[], serial: string) {
  const needle = normSerial(serial);
  if (!needle) return false;
  return cart.some((row) =>
    (row.serialNumbers || []).some((sn) => normSerial(String(sn)) === needle),
  );
}

export function useWholesaleCreate(branchId: string, onCreated: () => void | Promise<void>) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [retailers, setRetailers] = useState<WholesaleRetailer[]>([]);
  const [retailerQ, setRetailerQ] = useState('');
  const [retailerLoading, setRetailerLoading] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<WholesaleRetailer | null>(null);
  const selectedRetailerRef = useRef<WholesaleRetailer | null>(null);
  const retailerRequestRef = useRef(0);
  const retailerAbortRef = useRef<AbortController | null>(null);
  const [addRetailerOpen, setAddRetailerOpen] = useState(false);
  const [retailerForm, setRetailerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
  });
  const [retailerFormBusy, setRetailerFormBusy] = useState(false);
  const [retailerFormError, setRetailerFormError] = useState<string | null>(null);
  const [productQ, setProductQ] = useState('');
  const [products, setProducts] = useState<PosProductLite[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const lastLoadedPageRef = useRef(0);
  const loadingMoreInFlightRef = useRef(false);
  const hasMoreRef = useRef(false);
  const productSearchFetchGen = useRef(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [serialPick, setSerialPick] = useState<SerialPick | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [pendingSerials, setPendingSerials] = useState<string[]>([]);
  const [todaysOrder, setTodaysOrder] = useState<{ id: string; orderNo: string } | null>(null);
  const [todaysOrderLoading, setTodaysOrderLoading] = useState(false);
  const [employees, setEmployees] = useState<WholesaleEmployee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeQ, setEmployeeQ] = useState('');
  const [tcItems, setTcItems] = useState<WholesaleTcItem[]>([]);
  const [addModalTcId, setAddModalTcId] = useState('');

  const user = getUserData<{ role?: string; id?: string }>();
  const isEmployeeUser = (user?.role || '').toLowerCase() === 'employee';
  const currentUserEmployeeId = isEmployeeUser && user?.id ? user.id : null;

  const cartTotal = useMemo(
    () =>
      Math.round(
        cart.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice * 100) / 100, 0) *
          100,
      ) / 100,
    [cart],
  );
  const cartSerials = useMemo(
    () =>
      new Set(
        cart.flatMap((item) => item.serialNumbers || []).map((serial) => String(serial).trim()),
      ),
    [cart],
  );
  const unavailableSerials = useMemo(
    () => new Set([...cartSerials, ...pendingSerials.map((serial) => String(serial).trim())]),
    [cartSerials, pendingSerials],
  );

  useEffect(() => {
    selectedRetailerRef.current = selectedRetailer;
  }, [selectedRetailer]);

  const loadPendingSerials = useCallback(async () => {
    try {
      const response = await authorizedFetch(
        `${API_BASE_URL}/wholesale-orders/pending-serial-numbers`,
      );
      const json = await response.json().catch(() => ({}));
      setPendingSerials(
        response.ok && Array.isArray(json?.serialNumbers) ? json.serialNumbers : [],
      );
    } catch {
      setPendingSerials([]);
    }
  }, []);

  const resolveUnitPrice = useCallback(
    async (variantId: string, existing?: number) => {
      if (existing != null && existing > 0) return existing;
      if (!branchId) return existing ?? 0;
      try {
        const priceRes = await authorizedFetch(
          `${API_BASE_URL}/product-prices?variantId=${variantId}&branchId=${branchId}`,
        );
        if (!priceRes.ok) return existing ?? 0;
        const priceData = await priceRes.json();
        const prices = priceData.data || priceData || [];
        const price = Array.isArray(prices) ? prices[0] : prices;
        return price?.sellingPrice != null ? Number(price.sellingPrice) : existing ?? 0;
      } catch {
        return existing ?? 0;
      }
    },
    [branchId],
  );

  const enrichPosProductList = useCallback(
    async (rawList: any[]): Promise<PosProductLite[]> => {
      return Promise.all(
        rawList.map(async (p) => {
          const variants = await Promise.all(
            (p.variants || []).map(async (v: any) => {
              const existing = Number(v.prices?.[0]?.sellingPrice ?? v.price?.sellingPrice ?? 0);
              const sellingPrice = await resolveUnitPrice(v.id, existing);
              return {
                id: v.id,
                sku: v.sku,
                stockQuantity: Number(v.stockQuantity ?? 0),
                images: parseImages(v.images),
                price: { sellingPrice },
                attributes: (v.attributes || []).map((a: any) => ({
                  attributeName: a.name || a.attributeName || '',
                  attributeValue: a.value || a.attributeValue || '',
                  name: a.name || a.attributeName || '',
                  value: a.value || a.attributeValue || '',
                })),
                serialNumbers: v.serialNumbers || [],
              };
            }),
          );
          return {
            id: p.id,
            name: p.name,
            hasSerialNumber: !!p.hasSerialNumber,
            images: parseImages(p.images),
            sellerBrand: p.sellerBrand,
            brand: p.brand,
            variants,
          };
        }),
      );
    },
    [resolveUnitPrice],
  );

  const searchRetailers = useCallback(
    async (q: string) => {
      const query = q.trim();
      if (!branchId && !query) return;
      const requestId = ++retailerRequestRef.current;
      retailerAbortRef.current?.abort();
      const controller = new AbortController();
      retailerAbortRef.current = controller;
      setRetailerLoading(true);
      try {
        const params = new URLSearchParams();
        if (branchId) params.set('branchId', branchId);
        if (query) params.set('search', query);
        params.set('limit', '20');
        const res = await authorizedFetch(`${API_BASE_URL}/retailers?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list = data.data || data.retailers || data || [];
        const mapped = (Array.isArray(list) ? list : []).map((r: any) => ({
          id: r.id,
          name: r.name || r.companyName || 'Retailer',
          phone: r.phone,
          advanceBalance: Number(r.advanceBalance ?? 0),
          totalDue: Number(r.totalDue ?? 0),
        }));
        if (requestId === retailerRequestRef.current) {
          setRetailers(() => {
            const sel = selectedRetailerRef.current;
            if (sel?.id && !mapped.some((retailer: WholesaleRetailer) => retailer.id === sel.id)) {
              return [sel, ...mapped];
            }
            return mapped;
          });
        }
      } catch (error) {
        if ((error as { name?: string })?.name === 'AbortError') return;
      } finally {
        if (requestId === retailerRequestRef.current) setRetailerLoading(false);
      }
    },
    [branchId],
  );

  const openAddRetailer = useCallback(() => {
    setRetailerForm({ name: '', phone: '', email: '', address: '', city: '' });
    setRetailerFormError(null);
    setAddRetailerOpen(true);
  }, []);

  const updateRetailerForm = useCallback(
    (field: keyof typeof retailerForm, value: string) => {
      setRetailerForm((current) => ({ ...current, [field]: value }));
      setRetailerFormError(null);
    },
    [],
  );

  const createRetailer = useCallback(async () => {
    const name = retailerForm.name.trim();
    const phone = retailerForm.phone.trim();
    if (!name || !phone) {
      setRetailerFormError('Name and phone are required');
      return;
    }
    if (!branchId) {
      setRetailerFormError('Select a branch first');
      return;
    }
    setRetailerFormBusy(true);
    setRetailerFormError(null);
    try {
      const response = await authorizedFetch(`${API_BASE_URL}/retailers`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          branchId,
          ...(retailerForm.email.trim() ? { email: retailerForm.email.trim() } : {}),
          ...(retailerForm.address.trim() ? { address: retailerForm.address.trim() } : {}),
          ...(retailerForm.city.trim() ? { city: retailerForm.city.trim() } : {}),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.message || 'Failed to add retailer');
      const raw = json?.data ?? json;
      const created: WholesaleRetailer = {
        id: raw.id,
        name: raw.name || name,
        phone: raw.phone || phone,
        advanceBalance: Number(raw.advanceBalance ?? 0),
        totalDue: Number(raw.totalDue ?? 0),
      };
      setRetailers((current) => [
        created,
        ...current.filter((retailer) => retailer.id !== created.id),
      ]);
      setSelectedRetailer(created);
      setRetailerQ(created.name);
      setAddRetailerOpen(false);
    } catch (error) {
      setRetailerFormError(error instanceof Error ? error.message : 'Failed to add retailer');
    } finally {
      setRetailerFormBusy(false);
    }
  }, [branchId, retailerForm]);

  const searchProducts = useCallback(
    async (q: string, opts?: { append?: boolean }) => {
      const append = opts?.append === true;
      const trimmed = q.trim();
      if (!branchId && !trimmed) return [];

      if (append) {
        if (!hasMoreRef.current || loadingMoreInFlightRef.current) return [];
        loadingMoreInFlightRef.current = true;
        setProductsLoadingMore(true);
        try {
          const nextPage = lastLoadedPageRef.current + 1;
          const params = new URLSearchParams({
            branchId,
            page: String(nextPage),
            limit: String(PAGE_SIZE),
          });
          if (trimmed) params.set('search', trimmed);
          const res = await authorizedFetch(`${API_BASE_URL}/products/pos?${params}`);
          if (!res.ok) throw new Error();
          const json = await res.json();
          const regularList = json.products ?? json.data?.products ?? [];
          const pagination = json.pagination ?? json.data?.pagination;
          const currentPage = Number(pagination?.page ?? nextPage) || nextPage;
          const totalPages = Math.max(0, Number(pagination?.pages ?? 0));
          lastLoadedPageRef.current = currentPage;
          const more = totalPages > 0 && currentPage < totalPages;
          setProductsHasMore(more);
          hasMoreRef.current = more;
          const mapped = await enrichPosProductList(Array.isArray(regularList) ? regularList : []);
          setProducts((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...mapped.filter((p) => !ids.has(p.id))];
          });
          return mapped;
        } catch {
          return [];
        } finally {
          loadingMoreInFlightRef.current = false;
          setProductsLoadingMore(false);
        }
      }

      productSearchFetchGen.current += 1;
      const gen = productSearchFetchGen.current;
      setProductsLoading(true);
      setProductsHasMore(false);
      hasMoreRef.current = false;
      lastLoadedPageRef.current = 0;
      try {
        const params = new URLSearchParams({
          branchId,
          page: '1',
          limit: String(PAGE_SIZE),
        });
        if (trimmed) params.set('search', trimmed);
        const serialParams = new URLSearchParams({ branchId, serial: trimmed });
        const [res, serialRes] = await Promise.all([
          authorizedFetch(`${API_BASE_URL}/products/pos?${params}`),
          trimmed
            ? authorizedFetch(`${API_BASE_URL}/products/pos/by-serial?${serialParams}`)
            : Promise.resolve(null),
        ]);
        if (!res.ok) throw new Error();
        const json = await res.json();
        const regularList = json.products ?? json.data?.products ?? [];
        const pagination = json.pagination ?? json.data?.pagination;
        const currentPage = Number(pagination?.page ?? 1) || 1;
        const totalPages = Math.max(0, Number(pagination?.pages ?? 0));
        lastLoadedPageRef.current = currentPage;
        const more = totalPages > 0 && currentPage < totalPages;
        setProductsHasMore(more);
        hasMoreRef.current = more;
        const serialJson = serialRes?.ok ? await serialRes.json().catch(() => ({})) : {};
        const serialList = serialJson.products ?? serialJson.data?.products ?? [];
        const merged = [
          ...(Array.isArray(serialList) ? serialList : []),
          ...(Array.isArray(regularList) ? regularList : []),
        ].filter(
          (product, index, list) =>
            product?.id && list.findIndex((candidate) => candidate?.id === product.id) === index,
        );
        const mapped = await enrichPosProductList(merged);
        if (gen === productSearchFetchGen.current) setProducts(mapped);
        return mapped;
      } catch {
        if (gen === productSearchFetchGen.current) setProducts([]);
        return [];
      } finally {
        if (gen === productSearchFetchGen.current) setProductsLoading(false);
      }
    },
    [branchId, enrichPosProductList],
  );

  const loadMoreWholesaleProducts = useCallback(() => {
    if (!hasMoreRef.current || productsLoading || productsLoadingMore || loadingMoreInFlightRef.current) {
      return;
    }
    void searchProducts(productQ, { append: true });
  }, [productQ, productsLoading, productsLoadingMore, searchProducts]);

  useEffect(() => {
    if (!open || step !== 2) return;
    const t = setTimeout(() => void searchRetailers(retailerQ), 300);
    return () => clearTimeout(t);
  }, [open, step, retailerQ, searchRetailers]);

  useEffect(
    () => () => {
      retailerAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!open || step !== 1) return;
    if (!branchId && !productQ.trim()) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    const t = setTimeout(() => void searchProducts(productQ), 300);
    return () => clearTimeout(t);
  }, [open, step, productQ, searchProducts, branchId]);

  useEffect(() => {
    if (!open || step !== 2 || !selectedRetailer?.id || !branchId) {
      setTodaysOrder(null);
      return;
    }
    let cancelled = false;
    setTodaysOrderLoading(true);
    setTodaysOrder(null);
    void (async () => {
      try {
        const res = await authorizedFetch(
          `${API_BASE_URL}/wholesale-orders/today-for-retailer?retailerId=${encodeURIComponent(
            selectedRetailer.id,
          )}&branchId=${encodeURIComponent(branchId)}`,
        );
        const data = res.ok ? await res.json().catch(() => null) : null;
        if (!cancelled && data?.id) {
          setTodaysOrder({ id: data.id, orderNo: data.orderNo });
        }
      } catch {
        if (!cancelled) setTodaysOrder(null);
      } finally {
        if (!cancelled) setTodaysOrderLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step, selectedRetailer?.id, branchId]);

  useEffect(() => {
    if (!open || step !== 2 || !branchId || isEmployeeUser) return;
    setEmployeesLoading(true);
    void (async () => {
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/employees?page=1&limit=500`);
        const data = res.ok ? await res.json() : { data: [], employees: [] };
        const list = data.data ?? data.employees ?? [];
        setEmployees(
          Array.isArray(list)
            ? list
                .filter((e: { fullName?: string; name?: string }) => e.fullName || e.name)
                .map((e: { id: string; fullName?: string; name?: string; employeeId?: string }) => ({
                  id: e.id,
                  fullName: e.fullName || e.name || '',
                  employeeId: e.employeeId,
                }))
            : [],
        );
      } catch {
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    })();
  }, [open, step, branchId, isEmployeeUser]);

  useEffect(() => {
    if (!open || !branchId) return;
    void (async () => {
      try {
        const params = new URLSearchParams({ branchId, usageType: 'sale' });
        const res = await authorizedFetch(`${API_BASE_URL}/terms-and-conditions?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const list: WholesaleTcItem[] = Array.isArray(json.data) ? json.data : [];
        setTcItems(list);
        setAddModalTcId((current) => {
          if (current) return current;
          const active = list.filter((t) => t.status === 'active');
          const last = active[active.length - 1] || list[list.length - 1];
          return last?.id || '';
        });
      } catch {
        setTcItems([]);
      }
    })();
  }, [open, branchId]);

  const displayProductCards = useMemo(() => {
    const available = products.flatMap((product) =>
      (product.variants || [])
        .filter((variant) => Number(variant.stockQuantity ?? 0) > 0)
        .map((variant) => ({ product, variant })),
    );
    const query = productQ.trim().toLowerCase();
    if (!query) return available;

    const matches = ({ product, variant }: (typeof available)[number], exact: boolean) => {
      const compare = (value: string | undefined) => {
        const normalized = (value || '').trim().toLowerCase();
        return exact ? normalized === query : normalized.includes(query);
      };
      if (compare(product.name) || compare(variant.sku)) return true;
      if (!product.hasSerialNumber) return false;
      return (variant.serialNumbers || []).some((row) => {
        const serial = typeof row === 'string' ? row : row.serialNumber;
        return compare(serial);
      });
    };

    const exact = available.filter((item) => matches(item, true));
    return exact.length ? exact : available.filter((item) => matches(item, false));
  }, [productQ, products]);

  const filteredEmployees = useMemo(() => {
    const q = employeeQ.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        (e.employeeId || '').toLowerCase().includes(q),
    );
  }, [employeeQ, employees]);

  const openModal = useCallback(() => {
    if (!branchId) {
      Alert.alert('Branch required', 'Select a branch first');
      return;
    }
    setOpen(true);
    setStep(1);
    setSelectedRetailer(null);
    setCart([]);
    setProductQ('');
    setProducts([]);
    setRetailerQ('');
    setEmployeeQ('');
    setSelectedEmployeeId(currentUserEmployeeId);
    setTodaysOrder(null);
    setAddModalTcId('');
    void loadPendingSerials();
    void searchRetailers('');
  }, [branchId, currentUserEmployeeId, loadPendingSerials, searchRetailers]);

  const closeModal = useCallback(() => setOpen(false), []);

  const addVariantToCart = useCallback(
    async (
      product: PosProductLite,
      variant: PosProductLite['variants'][0],
      serialNumbers?: string[],
    ) => {
      let unitPrice = Number(variant.price?.sellingPrice ?? 0);
      if (!unitPrice) unitPrice = await resolveUnitPrice(variant.id);
      const stock = Number(variant.stockQuantity ?? 0);
      const display = (variant.attributes || [])
        .map((a) => a.attributeValue || a.value)
        .filter(Boolean)
        .join(' · ');

      setCart((prev) => {
        if (serialNumbers?.length) {
          const inCart = new Set(
            prev.flatMap((row) => (row.serialNumbers || []).map((sn) => normSerial(String(sn)))),
          );
          const fresh = serialNumbers.filter((sn) => !inCart.has(normSerial(String(sn))));
          if (!fresh.length) {
            queueMicrotask(() =>
              Alert.alert('Already in cart', 'This IMEI/serial is already in the cart'),
            );
            return prev;
          }
          if (fresh.length < serialNumbers.length) {
            queueMicrotask(() =>
              Alert.alert(
                'Partial add',
                `Added ${fresh.length} IMEI(s) — ${serialNumbers.length - fresh.length} already in cart`,
              ),
            );
          }
          const newEntries: CartLine[] = fresh.map((serial) => ({
            key: `${product.id}:${variant.id}:${normSerial(serial)}`,
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            sku: variant.sku,
            variantDisplay: display,
            quantity: 1,
            unitPrice,
            stockQuantity: stock,
            hasSerial: true,
            serialNumbers: [serial],
          }));
          return [...prev, ...newEntries];
        }

        if (!product.hasSerialNumber && stock < 1) {
          queueMicrotask(() =>
            Alert.alert('Out of stock', 'No stock available for this variant'),
          );
          return prev;
        }

        const existing = prev.find(
          (c) =>
            c.productId === product.id &&
            c.variantId === variant.id &&
            !c.serialNumbers?.length,
        );
        if (existing) {
          const nextQty = existing.quantity + 1;
          if (stock > 0 && nextQty > stock) {
            queueMicrotask(() => Alert.alert('Stock', `Only ${stock} available`));
            return prev;
          }
          return prev.map((c) =>
            c.key === existing.key ? { ...c, quantity: nextQty, stockQuantity: stock } : c,
          );
        }

        return [
          ...prev,
          {
            key: `${product.id}:${variant.id}`,
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            sku: variant.sku,
            variantDisplay: display,
            quantity: 1,
            unitPrice,
            stockQuantity: stock,
            hasSerial: false,
            serialNumbers: undefined,
          },
        ];
      });
    },
    [resolveUnitPrice],
  );

  const setLinePrice = useCallback((key: string, price: number) => {
    const value = Number(price);
    if (value < 0 || Number.isNaN(value)) return;
    setCart((prev) => prev.map((x) => (x.key === key ? { ...x, unitPrice: value } : x)));
  }, []);

  const decLine = useCallback((key: string) => {
    setCart((prev) =>
      prev
        .map((x) => (x.key === key ? { ...x, quantity: Math.max(0, x.quantity - 1) } : x))
        .filter((x) => x.quantity > 0),
    );
  }, []);

  const incLine = useCallback((key: string) => {
    setCart((prev) => {
      let stockLimit: number | null = null;
      const next = prev.map((x) => {
        if (x.key !== key || x.serialNumbers?.length) return x;
        const max = x.stockQuantity ?? 9999;
        if (x.quantity + 1 > max) {
          stockLimit = max;
          return x;
        }
        return { ...x, quantity: x.quantity + 1 };
      });
      if (stockLimit != null) {
        queueMicrotask(() => Alert.alert('Stock limit', `Only ${stockLimit} available`));
      }
      return next;
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((x) => x.key !== key));
  }, []);

  const fetchSerialsForPicker = useCallback(
    async (product: PosProductLite, variant: PosProductLite['variants'][0]) => {
      if (!branchId) return [];
      try {
        const params = new URLSearchParams({
          productId: product.id,
          variantId: variant.id,
          branchId,
          status: 'in_stock',
        });
        const [serialsRes, pendingRes] = await Promise.all([
          authorizedFetch(`${API_BASE_URL}/product-serials?${params}`),
          authorizedFetch(`${API_BASE_URL}/wholesale-orders/pending-serial-numbers`),
        ]);
        const list = serialsRes.ok
          ? await serialsRes.json().then((d) => d.data || d || []).catch(() => [])
          : [];
        const inStock = Array.isArray(list) ? list : [];
        let pendingSet = new Set(pendingSerials.map((s) => String(s).trim()));
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json().catch(() => ({}));
          pendingSet = new Set(
            (pendingData?.serialNumbers ?? []).map((s: string) => String(s).trim()),
          );
          setPendingSerials(Array.from(pendingSet));
        }
        return inStock
          .map((s: any) => (typeof s === 'string' ? s : s.serialNumber))
          .filter(
            (serial: string) =>
              Boolean(serial) &&
              !pendingSet.has(String(serial).trim()) &&
              !cartSerials.has(String(serial).trim()),
          ) as string[];
      } catch {
        return [];
      }
    },
    [branchId, cartSerials, pendingSerials],
  );

  const pickProduct = useCallback(
    (product: PosProductLite, variant: PosProductLite['variants'][0]) => {
      if (product.hasSerialNumber) {
        setSerialPick({ product, variant, selected: [], loading: true });
        void (async () => {
          const available = await fetchSerialsForPicker(product, variant);
          if (!available.length) {
            setSerialPick(null);
            Alert.alert('No serials', 'No available in-stock serials for this variant');
            return;
          }
          setSerialPick({
            product,
            variant: { ...variant, serialNumbers: available },
            selected: [],
            loading: false,
          });
        })();
        return;
      }
      void addVariantToCart(product, variant);
    },
    [addVariantToCart, fetchSerialsForPicker],
  );

  const tryAddFromSearchLocal = useCallback(
    async (query: string): Promise<boolean> => {
      const exact = query.trim().toLowerCase();
      if (!exact) return false;

      const serialMatches: Array<{
        product: PosProductLite;
        variant: PosProductLite['variants'][0];
        serial: string;
      }> = [];
      for (const product of products) {
        if (!product.hasSerialNumber) continue;
        for (const variant of product.variants || []) {
          for (const row of variant.serialNumbers || []) {
            const serial = typeof row === 'string' ? row : row?.serialNumber;
            if (serial && serial.toLowerCase() === exact) {
              serialMatches.push({ product, variant, serial });
            }
          }
        }
      }
      if (serialMatches.length === 1) {
        const hit = serialMatches[0];
        if (serialInCart(cart, hit.serial)) {
          setProductQ('');
          Alert.alert('Already in cart', 'This IMEI/serial is already in the cart');
          return true;
        }
        await addVariantToCart(hit.product, hit.variant, [hit.serial]);
        setProductQ('');
        return true;
      }
      if (serialMatches.length > 1) {
        Alert.alert('Multiple matches', 'Multiple exact IMEI matches found. Please select manually.');
        return true;
      }

      const skuMatches: Array<{
        product: PosProductLite;
        variant: PosProductLite['variants'][0];
      }> = [];
      for (const product of products) {
        if (product.hasSerialNumber) continue;
        for (const variant of product.variants || []) {
          if ((variant.sku || '').toLowerCase() === exact) {
            skuMatches.push({ product, variant });
          }
        }
      }
      if (skuMatches.length === 1) {
        await addVariantToCart(skuMatches[0].product, skuMatches[0].variant);
        setProductQ('');
        return true;
      }
      if (skuMatches.length > 1) {
        Alert.alert('Multiple matches', 'Multiple exact SKU matches found. Please select manually.');
        return true;
      }
      return false;
    },
    [addVariantToCart, cart, products],
  );

  const tryAddByExactSerialApi = useCallback(
    async (query: string): Promise<boolean> => {
      const trimmed = query.trim();
      if (!trimmed || !branchId) return false;
      try {
        const sp = new URLSearchParams({ serial: trimmed, branchId });
        const serialRes = await authorizedFetch(`${API_BASE_URL}/products/pos/by-serial?${sp}`);
        if (!serialRes.ok) return false;
        const serialData = await serialRes.json().catch(() => ({}));
        const serialProducts = Array.isArray(serialData?.products) ? serialData.products : [];
        const exact = trimmed.toLowerCase();
        const matches: Array<{
          product: PosProductLite;
          variant: PosProductLite['variants'][0];
          serial: string;
        }> = [];
        const mapped = await enrichPosProductList(serialProducts);
        for (const product of mapped) {
          if (!product.hasSerialNumber) continue;
          for (const variant of product.variants || []) {
            for (const row of variant.serialNumbers || []) {
              const serial = typeof row === 'string' ? row : row?.serialNumber;
              if (serial && String(serial).trim().toLowerCase() === exact) {
                matches.push({ product, variant, serial: String(serial) });
              }
            }
          }
        }
        if (matches.length === 1) {
          const hit = matches[0];
          if (serialInCart(cart, hit.serial)) {
            setProductQ('');
            Alert.alert('Already in cart', 'This IMEI/serial is already in the cart');
            return true;
          }
          await addVariantToCart(hit.product, hit.variant, [hit.serial]);
          setProductQ('');
          return true;
        }
        if (matches.length > 1) {
          Alert.alert('Multiple matches', 'Multiple exact IMEI matches found. Please select manually.');
          return true;
        }
      } catch {
        // fall through
      }
      return false;
    },
    [addVariantToCart, branchId, cart, enrichPosProductList],
  );

  const addByImei = useCallback(
    async (imei: string): Promise<boolean> => {
      const trimmed = imei?.trim();
      if (!trimmed) return false;
      if (!branchId) {
        Alert.alert('Branch required', 'Select a branch first');
        return false;
      }
      try {
        const res = await authorizedFetch(
          `${API_BASE_URL}/product-serials/search/${encodeURIComponent(trimmed)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return false;
        }
        const serial = data?.data ?? data;
        if (serial?.status !== 'in_stock') {
          Alert.alert('Unavailable', 'This serial is not available (not in stock)');
          return true;
        }
        const serialBranchId = serial?.branch?.id;
        if (serialBranchId && serialBranchId !== branchId) {
          Alert.alert('Wrong branch', 'Serial is not available in the selected branch');
          return true;
        }
        const productId = serial?.productId ?? serial?.product?.id;
        const variantId = serial?.variantId ?? serial?.variant?.id;
        const productName = serial?.product?.name ?? '';
        const sku = serial?.variant?.sku ?? '';
        const serialNumber = serial?.serialNumber ?? trimmed;
        if (!productId || !variantId) {
          Alert.alert('Invalid', 'Invalid serial data');
          return true;
        }
        if (serialInCart(cart, serialNumber)) {
          setProductQ('');
          Alert.alert('Already in cart', 'This IMEI/serial is already in the cart');
          return true;
        }
        const pendingRes = await authorizedFetch(
          `${API_BASE_URL}/wholesale-orders/pending-serial-numbers`,
        );
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json().catch(() => ({}));
          const pendingList: string[] = pendingData?.serialNumbers ?? [];
          const normalized = String(serialNumber).trim();
          if (pendingList.some((s) => String(s).trim() === normalized)) {
            Alert.alert(
              'Pending order',
              'This IMEI is in a pending order. Only pending items cannot be added again.',
            );
            return true;
          }
        }
        const product: PosProductLite = {
          id: productId,
          name: productName,
          hasSerialNumber: true,
          variants: [{ id: variantId, sku, stockQuantity: 1, price: { sellingPrice: 0 }, serialNumbers: [] }],
        };
        await addVariantToCart(product, product.variants[0], [serialNumber]);
        setProductQ('');
        return true;
      } catch {
        return false;
      }
    },
    [addVariantToCart, branchId, cart],
  );

  const tryAddByExactSkuApi = useCallback(
    async (query: string): Promise<boolean> => {
      const trimmed = query.trim();
      if (!trimmed || !branchId) return false;
      try {
        const params = new URLSearchParams({
          branchId,
          search: trimmed,
          page: '1',
          limit: '20',
        });
        const res = await authorizedFetch(`${API_BASE_URL}/products/pos?${params}`);
        if (!res.ok) return false;
        const data = await res.json().catch(() => ({}));
        const list = data.products || data.data?.products || [];
        const productsWithPrices = await enrichPosProductList(Array.isArray(list) ? list : []);
        const exact = trimmed.toLowerCase();
        const skuMatches: Array<{
          product: PosProductLite;
          variant: PosProductLite['variants'][0];
        }> = [];
        for (const product of productsWithPrices) {
          if (product.hasSerialNumber) continue;
          for (const variant of product.variants || []) {
            if ((variant.sku || '').trim().toLowerCase() === exact) {
              skuMatches.push({ product, variant });
            }
          }
        }
        if (skuMatches.length === 1) {
          await addVariantToCart(skuMatches[0].product, skuMatches[0].variant);
          setProductQ('');
          return true;
        }
        if (skuMatches.length > 1) {
          Alert.alert('Multiple matches', 'Multiple exact SKU matches found. Please select manually.');
          return true;
        }
      } catch {
        // fall through
      }
      return false;
    },
    [addVariantToCart, branchId, enrichPosProductList],
  );

  const addByCode = useCallback(
    async (rawValue?: string) => {
      const value = (rawValue ?? productQ).trim();
      if (!value) return;
      if (await tryAddFromSearchLocal(value)) return;
      if (await tryAddByExactSerialApi(value)) return;
      if (await addByImei(value)) return;
      if (await tryAddByExactSkuApi(value)) return;
      Alert.alert('Not found', 'No exact IMEI/SKU match found.');
    },
    [
      addByImei,
      productQ,
      tryAddByExactSerialApi,
      tryAddByExactSkuApi,
      tryAddFromSearchLocal,
    ],
  );

  const goToRetailerStep = useCallback(() => {
    if (!cart.length) {
      Alert.alert('Cart is empty', 'Add at least one product first');
      return;
    }
    setStep(2);
    setRetailerQ('');
    void searchRetailers('');
  }, [cart.length, searchRetailers]);

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
    void addVariantToCart(serialPick.product, serialPick.variant, serialPick.selected);
    setSerialPick(null);
  }, [serialPick, addVariantToCart]);

  const buildItemsPayload = useCallback(
    () =>
      cart.map((c) => ({
        productId: c.productId,
        variantId: c.variantId,
        productName: c.productName,
        sku: c.sku,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        serialNumbers: c.serialNumbers?.length ? c.serialNumbers : undefined,
      })),
    [cart],
  );

  const addToExistingOrder = useCallback(
    async (orderId: string) => {
      if (!selectedRetailer?.id || !cart.length) return;
      setBusy(true);
      try {
        const res = await authorizedFetch(`${API_BASE_URL}/wholesale-orders/${orderId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: buildItemsPayload() }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message || 'Failed to add items');
        setOpen(false);
        setStep(1);
        setCart([]);
        setSelectedRetailer(null);
        await onCreated();
      } catch (err) {
        Alert.alert('Add failed', err instanceof Error ? err.message : 'Failed');
      } finally {
        setBusy(false);
      }
    },
    [buildItemsPayload, cart.length, onCreated, selectedRetailer?.id],
  );

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

    if (todaysOrder?.id) {
      await addToExistingOrder(todaysOrder.id);
      return;
    }

    setBusy(true);
    try {
      const effectiveEmployeeId = selectedEmployeeId || currentUserEmployeeId || undefined;
      const payload = {
        orderNo: generateWholesaleOrderNo(),
        retailerId: selectedRetailer.id,
        retailerName: selectedRetailer.name || null,
        retailerPhone: selectedRetailer.phone || null,
        branchId,
        paymentStatus: 'due',
        orderStatus: 'pending',
        grandTotal: cartTotal,
        paidAmount: 0,
        dueAmount: cartTotal,
        notes: 'Wholesale order',
        ...(effectiveEmployeeId ? { assignedEmployeeId: effectiveEmployeeId } : {}),
        ...(addModalTcId ? { termsAndConditionId: addModalTcId } : {}),
        items: buildItemsPayload(),
      };
      const res = await authorizedFetch(`${API_BASE_URL}/wholesale-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Failed to create order');
      setOpen(false);
      setStep(1);
      setCart([]);
      setSelectedRetailer(null);
      await onCreated();
    } catch (err) {
      Alert.alert('Create failed', err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }, [
    addModalTcId,
    addToExistingOrder,
    branchId,
    buildItemsPayload,
    cart.length,
    cartTotal,
    currentUserEmployeeId,
    onCreated,
    selectedEmployeeId,
    selectedRetailer,
    todaysOrder?.id,
  ]);

  return {
    open,
    step,
    setStep,
    openModal,
    closeModal,
    retailers,
    retailerQ,
    setRetailerQ,
    retailerLoading,
    selectedRetailer,
    setSelectedRetailer,
    addRetailerOpen,
    setAddRetailerOpen,
    openAddRetailer,
    retailerForm,
    updateRetailerForm,
    retailerFormBusy,
    retailerFormError,
    createRetailer,
    productQ,
    setProductQ,
    products,
    displayProductCards,
    productsLoading,
    productsLoadingMore,
    productsHasMore,
    loadMoreWholesaleProducts,
    cart,
    cartTotal,
    busy,
    serialPick,
    setSerialPick,
    scannerOpen,
    setScannerOpen,
    pickProduct,
    addByCode,
    goToRetailerStep,
    toggleSerial,
    confirmSerials,
    setLinePrice,
    incLine,
    decLine,
    removeLine,
    createOrder,
    todaysOrder,
    todaysOrderLoading,
    employees,
    employeesLoading,
    filteredEmployees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    employeeQ,
    setEmployeeQ,
    isEmployeeUser,
    tcItems,
    addModalTcId,
    setAddModalTcId,
    unavailableSerials,
  };
}

export type UseWholesaleCreate = ReturnType<typeof useWholesaleCreate>;
