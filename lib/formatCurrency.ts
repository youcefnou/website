/**
 * Format currency amounts for Algerian Dinar (DZD)
 * Locale-aware formatting (including Arabic symbol/number style)
 * 
 * @param amount - The numeric amount to format
 * @param useShort - If true, uses "DA", otherwise uses "DZD" (default: true)
 * @param locale - Locale code (fr, en, ar). Default: fr
 */
export function formatCurrency(
  amount: number,
  useShort: boolean = true,
  locale: string = 'fr'
): string {
  const normalizedAmount = isFinite(amount) ? amount : 0;
  const localeTag =
    locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-DZ' : 'fr-DZ';

  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: 'DZD',
    currencyDisplay: useShort ? 'narrowSymbol' : 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizedAmount);
}

/**
 * Backwards-compatible alias.
 */
export function formatCurrencyLocale(
  amount: number,
  useShort: boolean = true,
  locale: string = 'fr'
): string {
  return formatCurrency(amount, useShort, locale);
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
