import { ApplicantGet } from '../../../core/models/applicant.model';
import { GateState } from '../types/manual-referral.type';

/** Number of workspace jobs to pull per screening. */
export const PAGE_SIZE = 10;

/** How long to wait after the last keystroke before hitting the jobs API. */
export const SEARCH_DEBOUNCE_MS = 400;

export const GATE_STATE_LABEL: Record<GateState, string> = {
  pass: 'Pass',
  fail: 'Fail',
  na: 'No limit',
  unknown: 'No data',
};

/** Long-form duration, e.g. "5 years", "3 months", "—". */
export const yearsLabel = (months: number): string => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  if (rest > 0) {
    return `${rest} ${rest === 1 ? 'month' : 'months'}`;
  }
  return '—';
};

/** Compact duration for a badge, e.g. "5 yrs", "3 mos". */
export const yearsShort = (months: number): string => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years > 0) {
    return `${years} ${years === 1 ? 'yr' : 'yrs'}`;
  }
  return `${rest} ${rest === 1 ? 'mo' : 'mos'}`;
};

/** Whole months between two dates, floored at zero. */
export const monthsBetween = (start: Date, end: Date): number => {
  const span = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return span > 0 ? span : 0;
};

/** "available now" / "currently working" hint derived from employment status. */
export const availabilityHint = (status: string | null): string => {
  const value = status?.trim().toLowerCase() ?? '';
  if (value.length === 0) {
    return '';
  }
  return ['employed', 'self-employed', 'underemployed'].some((working) => value.includes(working))
    ? 'currently working'
    : 'available now';
};

/** Total work experience in whole months, summed across every logged role. */
export const totalExperienceMonths = (applicant: ApplicantGet): number => {
  let months = 0;
  for (const work of applicant.work_experience) {
    if (!work.start_date) {
      continue;
    }
    const start = new Date(work.start_date);
    if (Number.isNaN(start.getTime())) {
      continue;
    }
    const end = work.end_date ? new Date(work.end_date) : new Date();
    if (Number.isNaN(end.getTime())) {
      continue;
    }
    const span =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (span > 0) {
      months += span;
    }
  }
  return months;
};
