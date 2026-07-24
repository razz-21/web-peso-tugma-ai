import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  DashboardActivity,
  DashboardRangeParams,
  DashboardSummary,
  MatchingFunnel,
  PlacementsOverTime,
} from '../../core/models/dashboard.model';

/** The four widget payloads loaded together for one date range. */
export interface DashboardData {
  summary: DashboardSummary;
  placements: PlacementsOverTime;
  funnel: MatchingFunnel;
  activity: DashboardActivity;
}

export const dashboardEvents = eventGroup({
  source: 'Dashboard',
  events: {
    // `undefined` loads the backend's default window (trailing 30 days).
    load: type<DashboardRangeParams | undefined>(),
    loadSuccess: type<DashboardData>(),
    loadFailed: type<string>(),
  },
});
