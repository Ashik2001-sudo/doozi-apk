/**
 * Shared rules for adding inventory lines (stock adjustment, stock transfer, etc.):
 * - Single product: one API store row — no option picker; SKU from that row.
 * - Variable product: picker shows attribute values only (no SKU in dropdown).
 */

export type InventoryVariantRow = {
  id: string;
  sku: string;
  stockQuantity?: number;
  attributes?: Array<{
    attribute?: { name?: string };
    attributeValue?: { value?: string; displayName?: string };
    value?: string;
  }>;
};

export type InventoryProductRow = {
  id: string;
  name: string;
  productType?: 'single' | 'variable';
  variants: InventoryVariantRow[];
};

export function isVariableProduct(
  p: Pick<InventoryProductRow, 'productType'> | undefined,
): boolean {
  return String(p?.productType ?? '').toLowerCase() === 'variable';
}

export function needsAttributePicker(p: InventoryProductRow | undefined): boolean {
  return isVariableProduct(p) && (p?.variants?.length ?? 0) > 0;
}

/** Variable option dropdown: attribute values only (no SKU). */
export function attributeValuesOnly(v: InventoryVariantRow): string {
  const parts =
    v.attributes
      ?.map((a) =>
        String(a?.attributeValue?.displayName ?? a?.attributeValue?.value ?? a?.value ?? '').trim(),
      )
      .filter(Boolean) ?? [];
  return parts.join(' · ');
}

/** Row title: single = product name; variable = name + (values). */
export function lineProductDisplayName(
  product: InventoryProductRow,
  variant: InventoryVariantRow,
): string {
  if (!isVariableProduct(product)) return product.name;
  const v = attributeValuesOnly(variant);
  return v ? `${product.name} (${v})` : product.name;
}
