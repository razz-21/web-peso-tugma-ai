import { RequirementStatus } from '../types/comparison.type';

const MET_COLOR = '#4d6a24';
const PARTIAL_COLOR = '#9a7b1e';
const UNMET_COLOR = '#b3261e';
const UNKNOWN_COLOR = '#7c857a';

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
