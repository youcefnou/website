/**
 * Format currency amounts for Algerian Dinar (DZD)
 * Always displays in Latin letters (DA or DZD) instead of Arabic
 * 
 * @param amount - The numeric amount to format
 * @param useShort - If true, uses "DA", otherwise uses "DZD" (default: true)
 * @returns Formatted currency string, e.g., "1,234.56 DA"
 */
export function formatCurrency(amount: number, useShort: boolean = true): string {
  // Handle edge cases
  if (!isFinite(amount)) {
    return useShort ? '0.00 DA' : '0.00 DZD';
  }
  
  const formatted = amount.toFixed(2);
  const currency = useShort ? 'DA' : 'DZD';
  return `${formatted} ${currency}`;
}

/**
 * Format currency with French locale number formatting
 * Uses spaces as thousand separators and comma as decimal separator
 * 
 * @param amount - The numeric amount to format
 * @param useShort - If true, uses "DA", otherwise uses "DZD" (default: true)
 * @returns Formatted currency string with French locale, e.g., "1 234,56 DA"
 */
export function formatCurrencyLocale(amount: number, useShort: boolean = true): string {
  // Handle edge cases
  if (!isFinite(amount)) {
    return useShort ? '0,00 DA' : '0,00 DZD';
  }
  
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const currency = useShort ? 'DA' : 'DZD';
  return `${formatted} ${currency}`;
}

// SKU display constants
const SKU_DISPLAY_THRESHOLD = 12;
const SKU_DISPLAY_LENGTH = 8;

/**
 * Format SKU or description for display
 * Returns description if available, otherwise returns a shortened SKU
 * 
 * @param description - Optional variant description
 * @param sku - SKU string to display if description is not available
 * @returns Formatted display string
 */
export function formatVariantLabel(description: string | null, sku: string): string {
  if (description) {
    return description;
  }
  
  // Return shortened SKU if it's too long
  if (sku.length > SKU_DISPLAY_THRESHOLD) {
    return `SKU: ${sku.substring(0, SKU_DISPLAY_LENGTH)}...`;
  }
  
  return `SKU: ${sku}`;
}
