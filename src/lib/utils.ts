import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with Saudi Riyal symbol or SAR code
 */
export function formatCurrency(amount: number, lang: 'en' | 'ar' = 'en'): string {
  const rounded = Number(amount || 0).toFixed(0);
  if (lang === 'ar') {
    return `${rounded} ر.س`;
  }
  return `SAR ${rounded}`;
}

/**
 * Generates human-friendly sequential or random order numbers e.g. #TH1024
 */
export function generateOrderNumber(orderCount: number = 0): string {
  const base = 1000 + orderCount + 1;
  return `#TH${base}`;
}

/**
 * Formats a readable date and time
 */
export function formatOrderDate(dateString: string, lang: 'en' | 'ar' = 'en'): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Saudi VAT Calculation (15% Included in Menu Prices)
 * Country: Saudi Arabia, Currency: SAR, VAT Rate: 15%
 *
 * All existing menu prices are VAT-inclusive.
 * Formula:
 *   VAT Amount = Gross Total * 15 / 115
 *   Net Amount = Gross Total / 1.15
 */
export function calculateSaudiVat(grossItemsTotal: number, deliveryFee: number = 0) {
  const safeItems = Math.max(0, Number(grossItemsTotal) || 0);
  const safeDelivery = Math.max(0, Number(deliveryFee) || 0);
  const grossTotal = safeItems + safeDelivery;

  // Exact 2-decimal halala precision
  const vatAmount = Math.round(((grossTotal * 15) / 115) * 100) / 100;
  const subtotalExclVat = Math.round((grossTotal - vatAmount) * 100) / 100;

  return {
    grossTotal,
    subtotalExclVat,
    vatRate: 0.15,
    vatAmount,
    deliveryFee: safeDelivery,
  };
}

/**
 * Format currency with exact halala (2 decimals) for invoices and receipts
 */
export function formatCurrencyDetailed(amount: number, lang: 'en' | 'ar' = 'en'): string {
  const val = Number(amount || 0).toFixed(2);
  if (lang === 'ar') {
    return `${val} ر.س`;
  }
  return `SAR ${val}`;
}
