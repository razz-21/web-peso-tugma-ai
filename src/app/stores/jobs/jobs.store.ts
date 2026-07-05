import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, exhaustMap, from, switchMap, tap } from 'rxjs';
import { JobGet, ListJobsParams } from '../../core/models/job.model';
import { JobsService } from '../../core/services/jobs.service';
import { jobsEvents } from './jobs.events';

type JobsState = {
  jobs: JobGet[];
  total: number;
  filter: JobsFilter;
  loading: boolean;
  createJobLoading: boolean;
  updateJobLoading: boolean;
  deleteJobLoading: boolean;
  error: string | null;
};

export type JobsFilter = {
  q: string;
  pageIndex: number;
  pageSize: number;
};

const initialState: JobsState = {
  jobs: [],
  total: 0,
  filter: { q: '', pageIndex: 0, pageSize: 10 },
  loading: false,
  createJobLoading: false,
  updateJobLoading: false,
  deleteJobLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: JobsFilter): ListJobsParams => ({
  limit: filter.pageSize,
  offset: filter.pageIndex * filter.pageSize,
  q: filter.q || undefined,
});

const SEARCH_DEBOUNCE_MS = 600;

export const JobsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    offset: computed(() => store.filter.pageIndex() * store.filter.pageSize()),
  })),
  withComputed((store) => ({
    rangeLabel: computed(() => {
      const total = store.total();
      if (total === 0) {
        return '0 of 0';
      }
      const start = store.offset() + 1;
      const end = store.offset() + store.jobs().length;
      return `${start}–${end} of ${total}`;
    }),
  })),
  withReducer(
    on(jobsEvents.loadJob, ({ payload }, state) => ({
      filter: {
        q: payload?.q ?? state.filter.q,
        pageIndex: payload?.pageIndex ?? state.filter.pageIndex,
        pageSize: payload?.pageSize ?? state.filter.pageSize,
      },
      loading: true,
      error: null,
    })),
    on(jobsEvents.loadJobSuccess, ({ payload }) => ({
      jobs: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(jobsEvents.loadJobFailed, ({ payload }) => ({
      jobs: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(jobsEvents.searchJob, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload, pageIndex: 0 },
      loading: true,
      error: null,
    })),
    on(jobsEvents.searchJobSuccess, ({ payload }) => ({
      jobs: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(jobsEvents.searchJobFailed, ({ payload }) => ({
      jobs: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(jobsEvents.createJob, () => ({
      createJobLoading: true,
      error: null,
    })),
    on(jobsEvents.createJobSuccess, ({ payload }, state) => ({
      jobs: [payload, ...state.jobs],
      total: state.total + 1,
      createJobLoading: false,
      error: null,
    })),
    on(jobsEvents.createJobFailed, ({ payload }) => ({
      createJobLoading: false,
      error: payload,
    })),
    on(jobsEvents.updateJob, () => ({
      updateJobLoading: true,
      error: null,
    })),
    on(jobsEvents.updateJobSuccess, ({ payload }, state) => ({
      jobs: state.jobs.map((job) => (job.id === payload.id ? payload : job)),
      updateJobLoading: false,
      error: null,
    })),
    on(jobsEvents.updateJobFailed, ({ payload }) => ({
      updateJobLoading: false,
      error: payload,
    })),
    on(jobsEvents.deleteJob, () => ({ deleteJobLoading: true, error: null })),
    on(jobsEvents.deleteJobSuccess, () => ({
      deleteJobLoading: false,
      error: null,
    })),
    on(jobsEvents.deleteJobFailed, ({ payload }) => ({
      deleteJobLoading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      jobsService = inject(JobsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadJobs$: events.on(jobsEvents.loadJob, jobsEvents.deleteJobSuccess).pipe(
        switchMap(() =>
          from(jobsService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => jobsEvents.loadJobSuccess(list),
              error: (error: unknown) =>
                jobsEvents.loadJobFailed(errorMessage(error, 'Failed to load jobs.')),
            }),
          ),
        ),
      ),
      loadJobFailed$: events.on(jobsEvents.loadJobFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      searchJobs$: events.on(jobsEvents.searchJob).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(jobsService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => jobsEvents.searchJobSuccess(list),
              error: (error: unknown) =>
                jobsEvents.searchJobFailed(errorMessage(error, 'Failed to search jobs.')),
            }),
          ),
        ),
      ),
      searchJobFailed$: events.on(jobsEvents.searchJobFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      createJob$: events.on(jobsEvents.createJob).pipe(
        switchMap(({ payload }) =>
          from(jobsService.create(payload)).pipe(
            mapResponse({
              next: (job) => jobsEvents.createJobSuccess(job),
              error: (error: unknown) =>
                jobsEvents.createJobFailed(errorMessage(error, 'Failed to create job.')),
            }),
          ),
        ),
      ),
      createJobSuccess$: events.on(jobsEvents.createJobSuccess).pipe(
        tap(() => {
          snackBar.open('Job created successfully', 'Close', { duration: 3000 });
        }),
      ),
      createJobFailed$: events.on(jobsEvents.createJobFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      updateJob$: events.on(jobsEvents.updateJob).pipe(
        switchMap(({ payload }) =>
          from(jobsService.update(payload.id, payload.job)).pipe(
            mapResponse({
              next: (job) => jobsEvents.updateJobSuccess(job),
              error: (error: unknown) =>
                jobsEvents.updateJobFailed(errorMessage(error, 'Failed to update job.')),
            }),
          ),
        ),
      ),
      updateJobSuccess$: events.on(jobsEvents.updateJobSuccess).pipe(
        tap(() => {
          snackBar.open('Job updated successfully', 'Close', { duration: 3000 });
        }),
      ),
      updateJobFailed$: events.on(jobsEvents.updateJobFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteJob$: events.on(jobsEvents.deleteJob).pipe(
        exhaustMap(({ payload: id }) =>
          from(jobsService.delete(id)).pipe(
            mapResponse({
              next: () => jobsEvents.deleteJobSuccess(id),
              error: (error: unknown) =>
                jobsEvents.deleteJobFailed(errorMessage(error, 'Failed to delete job.')),
            }),
          ),
        ),
      ),
      deleteJobSuccess$: events.on(jobsEvents.deleteJobSuccess).pipe(
        tap(() => {
          snackBar.open('Job deleted successfully', 'Close', { duration: 3000 });
        }),
      ),
      deleteJobFailed$: events.on(jobsEvents.deleteJobFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
