import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { exhaustMap, from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JobGet } from '../../core/models/job.model';
import { JobsService } from '../../core/services/jobs.service';
import { jobDetailsEvents } from './job-details.events';

type JobDetailsState = {
  job: JobGet | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
};

const initialState: JobDetailsState = {
  job: null,
  loading: false,
  updating: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const JobDetailsStore = signalStore(
  withState(initialState),
  withReducer(
    on(jobDetailsEvents.loadJobDetails, () => ({ loading: true, error: null })),
    on(jobDetailsEvents.loadJobDetailsSuccess, ({ payload }) => ({
      job: payload,
      loading: false,
      error: null,
    })),
    on(jobDetailsEvents.loadJobDetailsFailed, ({ payload }) => ({
      job: null,
      loading: false,
      error: payload,
    })),
    on(jobDetailsEvents.updateStatus, () => ({ updating: true, error: null })),
    on(jobDetailsEvents.updateStatusSuccess, ({ payload }) => ({
      job: payload,
      updating: false,
      error: null,
    })),
    on(jobDetailsEvents.updateStatusFailed, ({ payload }) => ({
      updating: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      jobsService = inject(JobsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadJobDetails$: events.on(jobDetailsEvents.loadJobDetails).pipe(
        switchMap(({ payload }) =>
          from(jobsService.get(payload.id)).pipe(
            mapResponse({
              next: (job) => jobDetailsEvents.loadJobDetailsSuccess(job),
              error: (error: unknown) =>
                jobDetailsEvents.loadJobDetailsFailed(errorMessage(error, 'Failed to load job.')),
            }),
          ),
        ),
      ),
      updateStatus$: events.on(jobDetailsEvents.updateStatus).pipe(
        exhaustMap(({ payload }) =>
          from(jobsService.update(payload.id, { status: payload.status })).pipe(
            mapResponse({
              next: (job) => jobDetailsEvents.updateStatusSuccess(job),
              error: (error: unknown) =>
                jobDetailsEvents.updateStatusFailed(
                  errorMessage(error, 'Failed to update job status.'),
                ),
            }),
          ),
        ),
      ),
      updateStatusSuccess$: events
        .on(jobDetailsEvents.updateStatusSuccess)
        .pipe(
          tap(({ payload }) =>
            snackBar.open(payload.status === 'active' ? 'Job activated' : 'Job closed', 'Close', {
              duration: 3000,
            }),
          ),
        ),
      failures$: events
        .on(jobDetailsEvents.loadJobDetailsFailed, jobDetailsEvents.updateStatusFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
