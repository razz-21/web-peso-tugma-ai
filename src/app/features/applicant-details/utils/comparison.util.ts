import { RequirementStatus } from '../types/comparison.type';

const MET_COLOR = 'var(--app-success)';
const PARTIAL_COLOR = 'var(--app-warning)';
const UNMET_COLOR = 'var(--mat-sys-error)';
const UNKNOWN_COLOR = 'var(--mat-sys-outline)';

/** Status from a 0–100 coverage score, for non-skills requirements. */
export const statusFromScore = (score: number): RequirementStatus =>
  score >= 80 ? 'met' : score >= 40 ? 'partial' : 'unmet';

export const statusColor = (status: RequirementStatus): string =>
  status === 'met'
    ? MET_COLOR
    : status === 'partial'
      ? PARTIAL_COLOR
      : status === 'unmet'
        ? UNMET_COLOR
        : UNKNOWN_COLOR;

export const STATUS_LABEL: Record<RequirementStatus, string> = {
  met: 'Met',
  partial: 'Partial',
  unmet: 'Not met',
  unknown: 'No data',
};
