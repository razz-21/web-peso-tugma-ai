import { RequirementState, RequirementStatus } from '../types/comparison.type';

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

/** Status-tag icon per requirement status. */
export const STATUS_ICON: Record<RequirementStatus, string> = {
  met: 'check_circle',
  partial: 'error',
  unmet: 'cancel',
  unknown: 'remove',
};

/** Tag tone (a RequirementStatus color) for a primary-requirement gate outcome. */
export const GATE_TONE: Record<RequirementState, RequirementStatus> = {
  pass: 'met',
  fail: 'unmet',
  na: 'unknown',
  unknown: 'unknown',
};

export const GATE_ICON: Record<RequirementState, string> = {
  pass: 'check_circle',
  fail: 'cancel',
  na: 'remove',
  unknown: 'help',
};

export const GATE_LABEL: Record<RequirementState, string> = {
  pass: 'Pass',
  fail: 'Fail',
  na: 'No limit',
  unknown: 'No data',
};
