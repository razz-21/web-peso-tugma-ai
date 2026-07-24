import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { from, switchMap, tap } from 'rxjs';
import {
  DashboardActivity,
  DashboardSummary,
  MatchingFunnel,
  PlacementsOverTime,
} from '../../core/models/dashboard.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { dashboardEvents } from './dashboard.events';

type DashboardState = {
  summary: DashboardSummary | null;
  placements: PlacementsOverTime | null;
  funnel: MatchingFunnel | null;
  activity: DashboardActivity | null;
  loading: boolean;
  error: string | null;
};

const initialState: DashboardState = {
  summary: null,
  placements: null,
  funnel: null,
  activity: null,
  loading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(dashboardEvents.load, () => ({ loading: true, error: null })),
    on(dashboardEvents.loadSuccess, ({ payload }) => ({
      summary: payload.summary,
      placements: payload.placements,
      funnel: payload.funnel,
      activity: payload.activity,
      loading: false,
      error: null,
    })),
    on(dashboardEvents.loadFailed, ({ payload }) => ({ loading: false, error: payload })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      dashboardService = inject(DashboardService),
      snackBar = inject(MatSnackBar),
    ) => ({
      // Fetch all four widgets in parallel for the requested range. `switchMap`
      // cancels an in-flight load when the range changes again.
      load$: events.on(dashboardEvents.load).pipe(
        switchMap(({ payload }) =>
          from(
            Promise.all([
              dashboardService.summary(payload),
              dashboardService.placementsOverTime(payload),
              dashboardService.matchingFunnel(payload),
              dashboardService.activity(payload),
            ]),
          ).pipe(
            mapResponse({
              next: ([summary, placements, funnel, activity]) =>
                dashboardEvents.loadSuccess({ summary, placements, funnel, activity }),
              error: (error: unknown) =>
                dashboardEvents.loadFailed(errorMessage(error, 'Failed to load dashboard.')),
            }),
          ),
        ),
      ),
      loadFailed$: events.on(dashboardEvents.loadFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
