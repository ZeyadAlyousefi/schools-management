/**
 * Centralized formatting utilities for Methqal Tech School SaaS.
 * Complies with strict currency requirements:
 * - Arabic: X,XXX ر.ي
 * - English: X,XXX YER
 * - No confusing "K" suffixes beside currency abbreviations.
 */

export function formatCurrency(
  amount: number | string | null | undefined,
  language: 'ar' | 'en' = 'ar'
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0)) || 0;
  
  const formatted = num.toLocaleString(language === 'ar' ? 'ar-YE' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (language === 'ar') {
    return `${formatted} ر.ي`;
  }
  return `${formatted} YER`;
}

export function formatNumber(
  num: number | string | null | undefined,
  language: 'ar' | 'en' = 'ar'
): string {
  const n = typeof num === 'number' ? num : parseFloat(String(num || 0)) || 0;
  return n.toLocaleString(language === 'ar' ? 'ar-YE' : 'en-US');
}
