/**
 * Shared currency (৳) constant and formatters.
 * Use formatTaka() for string output (CSV, invoice HTML, etc).
 * Use <CurrencySymbol /> or <FormattedTaka /> from @/components/common/CurrencySymbol for JSX (bold, correct size).
 */

export const CURRENCY_SYMBOL = '৳';

/** South Asian grouping: 1,00,000 (lakh) instead of 100,000 (en-US). */
export const TAKA_NUMBER_LOCALE = 'en-IN' as const;

export interface FormatTakaOptions {
  /** Decimal places (default 2) */
  decimals?: number;
  /** Locale for number (default en-IN = lakh/crore-style commas) */
  locale?: string;
  /** Return only the number part (no symbol) */
  numberOnly?: boolean;
}

/**
 * Format amount as taka string. Use for non-JSX (invoice HTML, CSV, etc).
 * Whole numbers show without .00; decimals shown when present.
 * For JSX with styled symbol use <FormattedTaka value={amount} /> instead.
 */
export function formatTaka(
  amount: number,
  options: FormatTakaOptions = {}
): string {
  const { decimals = 2, locale = TAKA_NUMBER_LOCALE, numberOnly = false } = options;
  const n = Number(amount);
  if (isNaN(n)) return numberOnly ? '0' : `${CURRENCY_SYMBOL}0`;
  const formatted = n
    .toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: decimals })
    .replace(/\.00$/, '');
  return numberOnly ? formatted : `${CURRENCY_SYMBOL}${formatted}`;
}
