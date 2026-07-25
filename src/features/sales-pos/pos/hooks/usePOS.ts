import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBranches } from '@/hooks/branch/useBranches';
import { useProducts } from './useProducts';
import { useCart } from './useCart';
import {
  CartItem,
  PaymentMethod,
  POSProduct,
  POSProductVariant,
} from '@/features/sales-pos/pos/types/pos.types';
import {
  calculateOrderSummary,
  generateInvoiceNumber,
  generateOrderNumber,
} from '@/features/sales-pos/pos/utils/calculations';
import { validateCart } from '@/features/sales-pos/pos/utils/validators';
import { getBatchForAddOne } from '@/features/sales-pos/pos/utils/batch-selection';
import { API_BASE_URL, authorizedFetch } from '@/lib/config';
import { useCustomer } from './useCustomer';

export function usePOS() {
  const {
    branches,
    userAccessibleBranches,
    selectedBranchId: storedBranchId,
    setSelectedBranchId,
  } = useBranches();
  const branchesForPOS =
    userAccessibleBranches?.length > 0 ? userAccessibleBranches : branches;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const branchId = storedBranchId || branchesForPOS[0]?.id || null;

  useEffect(() => {
    if (!storedBranchId && branchesForPOS[0]?.id) {
      void setSelectedBranchId(branchesForPOS[0].id);
    }
  }, [storedBranchId, branchesForPOS, setSelectedBranchId]);

  const {
    customer,
    phoneNumber,
    loading: customerLoading,
    setPhoneNumber,
    setCustomer,
    clearCustomer,
    isWalkingCustomer,
  } = useCustomer(branchId);

  const {
    products,
    loading: productsLoading,
    loadingMore: productsLoadingMore,
    error: productsError,
    hasMore,
    loadMore,
    refetch,
    updateStockOptimistically,
  } = useProducts(branchId, selectedCategoryId, searchTerm);

  const {
    cart,
    addToCart: addToCartBase,
    updateQuantity,
    updateUnitPrice,
    removeFromCart,
    removeSerialFromCart,
    clearCart,
  } = useCart();

  const addToCart = useCallback(
    (
      product: POSProduct,
      variant: POSProductVariant,
      serialNumbers?: string[],
      batchNumber?: string,
      batchNumbers?: string[],
      serialBatchMap?: Record<string, string>,
    ) => {
      const quantity = serialNumbers && serialNumbers.length > 0 ? serialNumbers.length : 1;
      return addToCartBase(
        product,
        variant,
        quantity,
        serialNumbers,
        batchNumber,
        batchNumbers,
        serialBatchMap,
      );
    },
    [addToCartBase],
  );

  // Add one more unit — same FIFO batch logic as seller-admin / grid add
  const handleAddOneMore = useCallback(
    async (item: CartItem) => {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants?.find((v) => v.id === item.variantId);
      let useProduct: POSProduct;
      let useVariant: POSProductVariant;
      if (product && variant) {
        useProduct = product;
        useVariant = variant;
      } else {
        useProduct = {
          id: item.productId,
          name: item.productName,
          hasSerialNumber: false,
          images: item.image ? [item.image] : [],
          variants: [],
          status: 'active',
          productType: 'single',
        } as POSProduct;
        useVariant = {
          id: item.variantId,
          productId: item.productId,
          sku: item.sku,
          stockQuantity: item.stockAvailable,
          images: item.image ? [item.image] : [],
          price: {
            sellingPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue ?? 0,
          },
          attributes: [],
        } as POSProductVariant;
      }
      const existingCartItem = cart.find(
        (c) => c.productId === item.productId && c.variantId === item.variantId,
      );
      const { batchNumber, batchNumbers, hasBatches } = await getBatchForAddOne(
        item.productId,
        item.variantId,
        existingCartItem,
        branchId,
      );
      if (hasBatches && batchNumbers.length === 0) {
        return { success: false as const, message: 'No stock available in any batch' };
      }
      return addToCartBase(
        useProduct,
        useVariant,
        1,
        undefined,
        batchNumber,
        batchNumbers.length ? batchNumbers : undefined,
      );
    },
    [products, cart, branchId, addToCartBase],
  );

  const orderSummary = useMemo(
    () => calculateOrderSummary(cart, null, null, [], 0, 0, payments),
    [cart, payments],
  );

  const completeOrder = useCallback(
    async (opts?: {
      advanceApplied?: number;
      payments?: PaymentMethod[];
      paymentStatus?: string;
      responsiblePerson?: string;
      paymentDate?: string;
      paymentNote?: string;
      termsAndConditionId?: string;
    }): Promise<{
      success: boolean;
      message?: string;
      orderId?: string;
      orderData?: Record<string, unknown>;
    }> => {
      const cartValidation = validateCart(cart);
      if (!cartValidation.valid) {
        return { success: false, message: cartValidation.message };
      }

      if (!branchId) {
        return { success: false, message: 'Please select a branch' };
      }

      const isWalking = isWalkingCustomer;
      const effectivePayments = opts?.payments ?? payments;
      const advanceApplied = opts?.advanceApplied ?? 0;
      const paidFromPayments = effectivePayments.reduce((s, p) => s + p.amount, 0);
      const totalPaid = paidFromPayments + advanceApplied;
      const invoicePaidAmount = Math.min(totalPaid, orderSummary.grandTotal);
      const dueAmount = Math.max(0, orderSummary.grandTotal - totalPaid);

      if (isWalking && totalPaid < orderSummary.grandTotal) {
        return {
          success: false,
          message:
            'Walk-in customer must pay the full amount. Due is only allowed for registered customers.',
        };
      }

      setLoading(true);
      try {
        const orderNo = generateOrderNumber();
        const invoiceNo = generateInvoiceNumber();

        const orderItems = cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType || 'fixed',
          discountValue: item.discountValue || 0,
          serialNumbers: item.serialNumbers || [],
          batchNumbers: item.batchNumbers || (item.batchNumber ? [item.batchNumber] : []),
        }));

        const primaryPayment = effectivePayments[0];
        const paymentMethod = effectivePayments.length === 1 ? primaryPayment.type : 'cash';

        const paymentNote = opts?.paymentNote || '';
        const baseNotes = `Coupon: N/A, Gift Card: N/A, Services: N/A${
          advanceApplied > 0 ? `, Advance: ${advanceApplied}` : ''
        }`;

        let paymentsNote = '';
        if (effectivePayments.length > 0) {
          const changeAmount = Math.max(0, totalPaid - orderSummary.grandTotal);
          let remainingChange = changeAmount;
          const adjustedForNotes = effectivePayments
            .filter((p) => p.transactionId && p.amount > 0)
            .map((p) => {
              const isCash = (p.type || '').toLowerCase() === 'cash';
              let adj = p.amount;
              if (isCash && remainingChange > 0) {
                const deduct = Math.min(remainingChange, adj);
                adj -= deduct;
                remainingChange -= deduct;
              }
              return { transactionId: p.transactionId, amount: adj };
            })
            .filter((p) => p.amount > 0);

          const paymentDetails = adjustedForNotes
            .map((p) => `${p.transactionId}:${p.amount}`)
            .join(',');
          if (paymentDetails) {
            paymentsNote = `Payments: ${paymentDetails}`;
          }
        }

        const fullNotes = [baseNotes, paymentsNote, paymentNote ? `Payment Note: ${paymentNote}` : '']
          .filter(Boolean)
          .join(' | ');

        const finalPaymentStatus = opts?.paymentStatus || (dueAmount > 0 ? 'partial' : 'paid');

        const response = await authorizedFetch(`${API_BASE_URL}/sale-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNo,
            invoiceNo,
            customerId: customer?.id || null,
            customerName: customer?.name || null,
            customerPhone: customer?.phone || phoneNumber || null,
            branchId,
            orderType: 'pos',
            orderStatus: 'completed',
            paymentStatus: finalPaymentStatus,
            subtotal: orderSummary.subtotal,
            discountAmount: orderSummary.orderDiscountAmount || 0,
            couponDiscount: orderSummary.couponDiscount || 0,
            taxAmount: orderSummary.taxAmount,
            shippingCost: orderSummary.shippingCost,
            grandTotal: orderSummary.grandTotal,
            paidAmount: invoicePaidAmount,
            dueAmount,
            paymentMethod,
            transactionId: primaryPayment?.transactionId,
            responsiblePerson: opts?.responsiblePerson || null,
            paymentDate: opts?.paymentDate || null,
            termsAndConditionId: opts?.termsAndConditionId || null,
            notes: opts?.paymentNote ? `${fullNotes} | Payment Note: ${opts.paymentNote}` : fullNotes,
            items: orderItems,
            couponId: null,
            giftCardId: null,
            giftCardDiscount: orderSummary.giftCardDiscount || 0,
            vipDiscount: orderSummary.vipDiscount || 0,
            servicesTotal: 0,
            redeemPoints: orderSummary.redeemPoints || 0,
            pointsDiscount: orderSummary.pointsDiscount || 0,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create order');
        }

        const result = await response.json();
        const orderData = (result.data || result) as Record<string, unknown>;
        const orderId = orderData.id as string | undefined;

        // Optimistically update stock quantities instantly (same as seller-admin)
        if (updateStockOptimistically) {
          const stockUpdates = cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          }));
          updateStockOptimistically(stockUpdates);
        }

        clearCart();
        setPayments([]);
        clearCustomer();

        return { success: true, orderId, orderData };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create order';
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [
      branchId,
      cart,
      orderSummary,
      payments,
      clearCart,
      clearCustomer,
      customer,
      phoneNumber,
      isWalkingCustomer,
      updateStockOptimistically,
    ],
  );

  return {
    branches: branchesForPOS,
    selectedBranchId: branchId,
    setSelectedBranchId,
    selectedCategoryId,
    setSelectedCategoryId,
    searchTerm,
    setSearchTerm,
    products,
    productsLoading,
    productsLoadingMore,
    productsError,
    hasMore,
    loadMore,
    refetch,
    cart,
    addToCart,
    handleAddOneMore,
    updateQuantity,
    updateUnitPrice,
    removeFromCart,
    removeSerialFromCart,
    clearCart,
    payments,
    setPayments,
    customer,
    phoneNumber,
    customerLoading,
    setPhoneNumber,
    setCustomer,
    clearCustomer,
    isWalkingCustomer,
    orderSummary,
    completeOrder,
    loading,
  };
}
