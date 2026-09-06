/**
 * Precision currency utilities avoiding floating-point anomalies
 */

export const formatCurrency = (
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatAmountWithSign = (
  amount: number,
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  currency = 'INR'
): string => {
  const formatted = formatCurrency(Math.abs(amount), currency);
  if (type === 'INCOME') return `+${formatted}`;
  if (type === 'EXPENSE') return `-${formatted}`;
  return formatted;
};

export const parseNumericAmount = (raw: string | number | null | undefined): number => {
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  if (!raw) return 0;
  
  // Strip currency symbols, spaces, commas
  const cleaned = String(raw)
    .replace(/[₹$€£\s,]/g, '')
    .trim();
    
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

