import { MonthlyCount } from '../../core/models/reports.model';

/** Format a Date as a local `YYYY-MM-DD` (avoids the UTC shift of toISOString). */
export const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** A chart's month span label, e.g. "Jan – Dec 2026" (or spanning two years). */
export const monthlyRangeLabel = (months: MonthlyCount[] | undefined): string => {
  if (!months || months.length === 0) return '';
  const first = months[0];
  const last = months[months.length - 1];
  return first.year === last.year
    ? `${first.label} – ${last.label} ${last.year}`
    : `${first.label} ${first.year} – ${last.label} ${last.year}`;
};

/** Render a `Jul 15, 2026` date from an ISO timestamp; empty string when invalid. */
export const formatReferralDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
