import { format, formatDistanceToNow } from 'date-fns';
import { enUS, id as idLocale } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n/types';

function toValidDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

const dateFnsLocale = (locale: Locale) => (locale === 'id' ? idLocale : enUS);

export function formatDate(date: string | Date | null | undefined, locale: Locale = 'en'): string {
  const d = toValidDate(date);
  return d ? format(d, 'dd MMM yyyy', { locale: dateFnsLocale(locale) }) : '—';
}

export function formatDateTime(date: string | Date | null | undefined, locale: Locale = 'en'): string {
  const d = toValidDate(date);
  return d ? format(d, 'dd MMM yyyy, HH:mm', { locale: dateFnsLocale(locale) }) : '—';
}

/** Full weekday + date, e.g. "Wednesday, 29 July 2026" — used in the app header. */
export function formatDateLong(date: string | Date | null | undefined, locale: Locale = 'en'): string {
  const d = toValidDate(date);
  return d ? format(d, 'EEEE, d MMMM yyyy', { locale: dateFnsLocale(locale) }) : '—';
}

export function timeAgo(date: string | Date | null | undefined, locale: Locale = 'en'): string {
  const d = toValidDate(date);
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: dateFnsLocale(locale) }) : '—';
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value);
  if (value == null || value === '' || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Rupiah formatting. Line items use full grouped digits ("Rp 1,240,000,000");
 * aggregates/StatCards pass `compact` for abbreviated form ("Rp 4.82 bn").
 */
export function formatRupiah(
  value: number | string | null | undefined,
  options?: { compact?: boolean }
): string {
  const n = Number(value);
  if (value == null || value === '' || Number.isNaN(n)) return '—';

  if (options?.compact) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} bn`;
    if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} mn`;
    if (abs >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}k`;
  }

  return `Rp ${new Intl.NumberFormat('en-US').format(n)}`;
}

export function formatBytes(bytes: number | string | null | undefined): string {
  const n = Number(bytes);
  if (bytes == null || Number.isNaN(n) || n < 0) return '—';
  if (n === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}
