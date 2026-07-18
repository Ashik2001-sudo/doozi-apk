import { useState, useCallback } from 'react';
import { CartItem, POSProduct, POSProductVariant } from '../types/pos.types';
import { calculateLineTotal } from '../utils/calculations';
import { validateStockAvailability } from '../utils/validators';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((
    product: POSProduct,
    variant: POSProductVariant,
    quantity: number = 1,
    serialNumbers?: string[],
    batchNumber?: string,
    batchNumbers?: string[],
    serialBatchMap?: Record<string, string>
  ): { success: boolean; message?: string } => {
    // Validate stock
    const stockValidation = validateStockAvailability(
      cart,
      product.id,
      variant.id,
      quantity,
      variant.stockQuantity
    );

    if (!stockValidation.valid) {
      return { success: false, message: stockValidation.message };
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      item => item.productId === product.id && item.variantId === variant.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cart[existingItemIndex];
      const existingSerials = existingItem.serialNumbers || [];
      const newSerials = serialNumbers || [];
      const norm = (s: string) => String(s).trim().toLowerCase();
      const existingSet = new Set(existingSerials.map((s) => norm(String(s))));

      let mergedSerials: string[];
      let newQuantity: number;
      let mergedBatchNumbers: string[];
      let mergedSerialBatchMap: Record<string, string>;

      if (newSerials.length > 0) {
        const actuallyNewSerials = newSerials.filter((s) => !existingSet.has(norm(String(s))));
        if (actuallyNewSerials.length === 0) {
          return {
            success: false,
            message: 'This IMEI/serial is already in the cart',
          };
        }
        mergedSerials = [
          ...new Set([...existingSerials.map(String), ...actuallyNewSerials.map(String)]),
        ];
        newQuantity = mergedSerials.length;

        const existingBatchNumbers =
          existingItem.batchNumbers || (existingItem.batchNumber ? [existingItem.batchNumber] : []);
        const appendedBatches: string[] = [];
        const map = serialBatchMap || {};
        for (const sn of actuallyNewSerials) {
          const raw = String(sn);
          let b = map[raw];
          if (!b && newSerials.length === 1 && batchNumber) {
            b = batchNumber;
          }
          if (!b && batchNumbers && batchNumbers.length === newSerials.length) {
            const idx = newSerials.findIndex((x) => norm(String(x)) === norm(raw));
            if (idx >= 0 && batchNumbers[idx]) b = String(batchNumbers[idx]);
          }
          if (b) appendedBatches.push(b);
        }
        mergedBatchNumbers = [...existingBatchNumbers, ...appendedBatches];

        mergedSerialBatchMap = { ...(existingItem.serialBatchMap || {}) };
        for (const sn of actuallyNewSerials) {
          const raw = String(sn);
          if (map[raw] !== undefined) mergedSerialBatchMap[raw] = map[raw];
        }
      } else {
        mergedSerials = [...existingSerials.map(String)];
        newQuantity = existingItem.quantity + quantity;
        const existingBatchNumbers =
          existingItem.batchNumbers || (existingItem.batchNumber ? [existingItem.batchNumber] : []);
        const newBatchNumbers = batchNumbers || (batchNumber ? [batchNumber] : []);
        mergedBatchNumbers = [...existingBatchNumbers, ...newBatchNumbers];
        mergedSerialBatchMap = { ...(existingItem.serialBatchMap || {}) };
      }

      if (newQuantity > variant.stockQuantity) {
        return {
          success: false,
          message: `Only ${variant.stockQuantity} items available in stock`,
        };
      }

      const purchaseUnitPrice =
        existingItem.purchaseUnitPrice ?? Number(variant.averageCost ?? 0);

      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...existingItem,
        purchaseUnitPrice,
        quantity: newQuantity,
        serialNumbers: mergedSerials.length > 0 ? mergedSerials : existingItem.serialNumbers,
        batchNumber: mergedBatchNumbers.length > 0 ? mergedBatchNumbers[0] : undefined,
        batchNumbers: mergedBatchNumbers.length > 0 ? mergedBatchNumbers : undefined,
        serialBatchMap:
          Object.keys(mergedSerialBatchMap).length > 0 ? mergedSerialBatchMap : undefined,
        lineTotal: calculateLineTotal(
          newQuantity,
          existingItem.unitPrice,
          existingItem.discountType,
          existingItem.discountValue
        ),
      };

      setCart(updatedCart);
      return { success: true };
    }

    // Add new item
    const unitPrice = variant.price?.sellingPrice || 0;
    const discountType = variant.price?.discountType;
    const discountValue = variant.price?.discountValue || 0;
    
    const variantName = variant.attributes
      ?.map(attr => `${attr.attributeName}: ${attr.attributeValue}`)
      .join(', ') || '';

    // Keep batchNumbers as unique batch list
    const finalBatchNumbers = batchNumbers && batchNumbers.length > 0 
      ? batchNumbers 
      : (batchNumber ? [batchNumber] : undefined);

    const newItem: CartItem = {
      id: `${product.id}-${variant.id}-${Date.now()}`,
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variantName || undefined,
      sku: variant.sku,
      quantity,
      unitPrice,
      purchaseUnitPrice: Number(variant.averageCost ?? 0),
      discountType,
      discountValue,
      lineTotal: calculateLineTotal(quantity, unitPrice, discountType, discountValue),
      stockAvailable: variant.stockQuantity,
      image: variant.images?.[0] || product.images?.[0],
      serialNumbers: serialNumbers || [],
      batchNumber: finalBatchNumbers && finalBatchNumbers.length > 0 ? finalBatchNumbers[0] : undefined,
      batchNumbers: finalBatchNumbers,
      serialBatchMap: serialBatchMap && Object.keys(serialBatchMap).length > 0 ? serialBatchMap : undefined,
    };

    setCart([...cart, newItem]);
    return { success: true };
  }, [cart]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number, batchNumbers?: string[]) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.id === itemId);
      if (itemIndex < 0) return prevCart;

      const item = prevCart[itemIndex];
      
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== itemId);
      }

      if (newQuantity > item.stockAvailable) {
        return prevCart; // Don't update if exceeds stock
      }

      const updatedCart = [...prevCart];
      
      // Update batchNumbers if provided, otherwise keep existing
      const updatedBatchNumbers = batchNumbers !== undefined 
        ? batchNumbers 
        : item.batchNumbers;

      updatedCart[itemIndex] = {
        ...item,
        quantity: newQuantity,
        batchNumbers: updatedBatchNumbers,
        batchNumber: updatedBatchNumbers && updatedBatchNumbers.length > 0 
          ? updatedBatchNumbers[0] 
          : item.batchNumber,
        lineTotal: calculateLineTotal(
          newQuantity,
          item.unitPrice,
          item.discountType,
          item.discountValue
        ),
      };

      return updatedCart;
    });
  }, []);

  /** New value is the price charged per unit (overrides product card discount). */
  const updateUnitPrice = useCallback((itemId: string, newUnitPrice: number) => {
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.id === itemId);
      if (itemIndex < 0) return prevCart;

      const item = prevCart[itemIndex];
      const unitPrice = Math.max(0, Number(newUnitPrice) || 0);
      const purchaseUnitPrice = item.purchaseUnitPrice ?? 0;

      const updatedCart = [...prevCart];
      updatedCart[itemIndex] = {
        ...item,
        purchaseUnitPrice,
        unitPrice,
        discountType: undefined,
        discountValue: 0,
        lineTotal: calculateLineTotal(item.quantity, unitPrice),
      };

      return updatedCart;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  const removeSerialFromCart = useCallback((itemId: string, serial: string) => {
    const target = String(serial).trim().toLowerCase();
    if (!target) return;
    setCart(prevCart => {
      const itemIndex = prevCart.findIndex(item => item.id === itemId);
      if (itemIndex < 0) return prevCart;

      const item = prevCart[itemIndex];
      const currentSerials = item.serialNumbers || [];
      if (currentSerials.length === 0) return prevCart;

      const nextSerials = currentSerials.filter(
        s => String(s).trim().toLowerCase() !== target
      );
      if (nextSerials.length === currentSerials.length) return prevCart;

      if (nextSerials.length === 0) {
        return prevCart.filter(row => row.id !== itemId);
      }

      const prevMap = item.serialBatchMap || {};
      const nextMap: Record<string, string> = {};
      nextSerials.forEach((sn) => {
        if (prevMap[sn] !== undefined) nextMap[sn] = prevMap[sn];
      });

      const nextBatchNumbers = nextSerials
        .map((sn) => nextMap[sn] ?? item.batchNumber)
        .filter((b): b is string => Boolean(b && String(b).trim()));

      const updatedCart = [...prevCart];
      updatedCart[itemIndex] = {
        ...item,
        quantity: nextSerials.length,
        serialNumbers: nextSerials,
        batchNumbers: nextBatchNumbers.length ? nextBatchNumbers : undefined,
        batchNumber: nextBatchNumbers[0] || undefined,
        serialBatchMap: Object.keys(nextMap).length ? nextMap : undefined,
        lineTotal: calculateLineTotal(
          nextSerials.length,
          item.unitPrice,
          item.discountType,
          item.discountValue
        ),
      };
      return updatedCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    removeSerialFromCart,
    clearCart,
    updateUnitPrice,
  };
}

