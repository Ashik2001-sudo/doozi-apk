import { ProductAttribute, ProductAttributeValue } from '@/types/product.types';

/**
 * Generate SKU from product name and variant attributes
 * Example: "Samsung Galaxy S23" + [Color: Red, Storage: 128GB] = "SGS23-RED-128GB"
 */
export const generateVariantSKU = (
  productName: string,
  attributes: Array<{
    attributeId: string;
    attributeValueId: string;
  }>,
  availableAttributes: ProductAttribute[]
): string => {
  // Generate base SKU from product name
  const baseSKU = productName
    .split(' ')
    .map(word => word.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 10);

  // Generate attribute part
  const attributeParts: string[] = [];
  
  attributes.forEach(attr => {
    const attribute = availableAttributes.find(a => a.id === attr.attributeId);
    if (attribute && attribute.values) {
      const value = attribute.values.find(v => v.id === attr.attributeValueId);
      if (value) {
        // Use display name or value, clean and uppercase
        const valuePart = (value.displayName || value.value)
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .substring(0, 6);
        attributeParts.push(valuePart);
      }
    }
  });

  // Combine base SKU with attribute parts
  if (attributeParts.length > 0) {
    return `${baseSKU}-${attributeParts.join('-')}`;
  }

  return baseSKU;
};

/**
 * Generate variant name from attributes
 * Example: [Color: Red, Storage: 128GB] = "Red - 128GB"
 */
export const generateVariantName = (
  attributes: Array<{
    attributeId: string;
    attributeValueId: string;
  }>,
  availableAttributes: ProductAttribute[]
): string => {
  const nameParts: string[] = [];
  
  attributes.forEach(attr => {
    const attribute = availableAttributes.find(a => a.id === attr.attributeId);
    if (attribute && attribute.values) {
      const value = attribute.values.find(v => v.id === attr.attributeValueId);
      if (value) {
        nameParts.push(value.displayName || value.value);
      }
    }
  });

  return nameParts.join(' - ');
};

/**
 * Validate SKU uniqueness
 */
export const isUniqueSKU = (sku: string, existingSKUs: string[]): boolean => {
  return !existingSKUs.includes(sku);
};

/**
 * Generate unique SKU by adding suffix if needed
 */
export const generateUniqueSKU = (baseSKU: string, existingSKUs: string[]): string => {
  if (isUniqueSKU(baseSKU, existingSKUs)) {
    return baseSKU;
  }

  let counter = 1;
  let uniqueSKU = `${baseSKU}-${counter}`;
  
  while (!isUniqueSKU(uniqueSKU, existingSKUs)) {
    counter++;
    uniqueSKU = `${baseSKU}-${counter}`;
  }

  return uniqueSKU;
};

/**
 * Generate all possible variant combinations from attributes
 */
export const generateVariantCombinations = (
  attributeSelections: Array<{
    attributeId: string;
    selectedValueIds: string[];
  }>,
  availableAttributes: ProductAttribute[]
): Array<{
  attributes: Array<{
    attributeId: string;
    attributeValueId: string;
  }>;
  name: string;
  sku: string;
}> => {
  if (attributeSelections.length === 0) {
    return [];
  }

  // Generate all combinations
  const combinations: Array<Array<{
    attributeId: string;
    attributeValueId: string;
  }>> = [];

  const generateCombos = (
    index: number,
    current: Array<{
      attributeId: string;
      attributeValueId: string;
    }>
  ) => {
    if (index === attributeSelections.length) {
      combinations.push([...current]);
      return;
    }

    const selection = attributeSelections[index];
    for (const valueId of selection.selectedValueIds) {
      current.push({
        attributeId: selection.attributeId,
        attributeValueId: valueId
      });
      generateCombos(index + 1, current);
      current.pop();
    }
  };

  generateCombos(0, []);

  // Generate SKU and name for each combination
  return combinations.map(combo => ({
    attributes: combo,
    name: generateVariantName(combo, availableAttributes),
    sku: '' // SKU will be generated with product name later
  }));
};

