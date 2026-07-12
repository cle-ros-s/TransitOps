import { format, parseISO, differenceInDays, isValid } from 'date-fns';

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, 'dd MMM yyyy, hh:mm a');
}

export function daysUntil(dateStr: string): number {
  try {
    const d = parseISO(dateStr);
    return differenceInDays(d, new Date());
  } catch {
    return 0;
  }
}

export function isExpired(dateStr: string): boolean {
  return daysUntil(dateStr) < 0;
}

export function isExpiringSoon(dateStr: string, days = 30): boolean {
  const d = daysUntil(dateStr);
  return d >= 0 && d <= days;
}

export function getLicenseStatus(expiryDate: string): 'valid' | 'expiring_soon' | 'expired' {
  if (isExpired(expiryDate)) return 'expired';
  if (isExpiringSoon(expiryDate)) return 'expiring_soon';
  return 'valid';
}
