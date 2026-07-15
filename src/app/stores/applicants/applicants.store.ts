import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, exhaustMap, from, switchMap, tap } from 'rxjs';
import { ApplicantGet, ListApplicantsParams } from '../../core/models/applicant.model';
import { ApplicantsService } from '../../core/services/applicants.service';
import { applicantsEvents } from './applicants.events';

type ApplicantsState = {
  applicants: ApplicantGet[];
  total: number;
  filter: ApplicantsFilter;
  loading: boolean;
  createApplicantLoading: boolean;
  deleteApplicantLoading: boolean;
  error: string | null;
};

export type ApplicantsFilter = {
  q: string;
  pageIndex: number;
  pageSize: number;
};

const initialState: ApplicantsState = {
  applicants: [],
  total: 0,
  filter: { q: '', pageIndex: 0, pageSize: 10 },
  loading: false,
  createApplicantLoading: false,
  deleteApplicantLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: ApplicantsFilter): ListApplicantsParams => ({
  limit: filter.pageSize,
  offset: filter.pageIndex * filter.pageSize,
  q: filter.q || undefined,
});

const SEARCH_DEBOUNCE_MS = 600;

export const ApplicantsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(applicantsEvents.loadApplicant, ({ payload }, state) => ({
      filter: {
        q: payload?.q ?? state.filter.q,
        pageIndex: payload?.pageIndex ?? state.filter.pageIndex,
        pageSize: payload?.pageSize ?? state.filter.pageSize,
      },
      loading: true,
      error: null,
    })),
    on(applicantsEvents.loadApplicantSuccess, ({ payload }) => ({
      applicants: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(applicantsEvents.loadApplicantFailed, ({ payload }) => ({
      applicants: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(applicantsEvents.searchApplicant, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload, pageIndex: 0 },
      loading: true,
      error: null,
    })),
    on(applicantsEvents.searchApplicantSuccess, ({ payload }) => ({
      applicants: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(applicantsEvents.searchApplicantFailed, ({ payload }) => ({
      applicants: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(applicantsEvents.createApplicant, () => ({
      createApplicantLoading: true,
      error: null,
    })),
    on(applicantsEvents.createApplicantSuccess, ({ payload }, state) => ({
      applicants: [payload, ...state.applicants],
      total: state.total + 1,
      createApplicantLoading: false,
      error: null,
    })),
    on(applicantsEvents.createApplicantFailed, ({ payload }) => ({
      createApplicantLoading: false,
      error: payload,
    })),
    on(applicantsEvents.deleteApplicant, () => ({ deleteApplicantLoading: true, error: null })),
    on(applicantsEvents.deleteApplicantSuccess, ({ payload: id }, state) => ({
      applicants: state.applicants.filter((applicant) => applicant.id !== id),
      total: Math.max(0, state.total - 1),
      deleteApplicantLoading: false,
      error: null,
    })),
    on(applicantsEvents.deleteApplicantFailed, ({ payload }) => ({
      deleteApplicantLoading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      applicantsService = inject(ApplicantsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadApplicants$: events.on(applicantsEvents.loadApplicant).pipe(
        switchMap(() =>
          from(applicantsService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => applicantsEvents.loadApplicantSuccess(list),
              error: (error: unknown) =>
                applicantsEvents.loadApplicantFailed(
                  errorMessage(error, 'Failed to load applicants.'),
                ),
            }),
          ),
        ),
      ),
      loadApplicantFailed$: events.on(applicantsEvents.loadApplicantFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      searchApplicants$: events.on(applicantsEvents.searchApplicant).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(applicantsService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => applicantsEvents.searchApplicantSuccess(list),
              error: (error: unknown) =>
                applicantsEvents.searchApplicantFailed(
                  errorMessage(error, 'Failed to search applicants.'),
                ),
            }),
          ),
        ),
      ),
      searchApplicantFailed$: events.on(applicantsEvents.searchApplicantFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      createApplicant$: events.on(applicantsEvents.createApplicant).pipe(
        switchMap(({ payload }) =>
          from(applicantsService.create(payload)).pipe(
            mapResponse({
              next: (applicant: ApplicantGet) => applicantsEvents.createApplicantSuccess(applicant),
              error: (error: unknown) =>
                applicantsEvents.createApplicantFailed(
                  errorMessage(error, 'Failed to create applicant.'),
                ),
            }),
          ),
        ),
      ),
      createApplicantSuccess$: events.on(applicantsEvents.createApplicantSuccess).pipe(
        tap(() => {
          snackBar.open('Applicant created successfully', 'Close', { duration: 3000 });
        }),
      ),
      createApplicantFailed$: events.on(applicantsEvents.createApplicantFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteApplicant$: events.on(applicantsEvents.deleteApplicant).pipe(
        exhaustMap(({ payload: id }) =>
          from(applicantsService.delete(id)).pipe(
            mapResponse({
              next: () => applicantsEvents.deleteApplicantSuccess(id),
              error: (error: unknown) =>
                applicantsEvents.deleteApplicantFailed(
                  errorMessage(error, 'Failed to delete applicant.'),
                ),
            }),
          ),
        ),
      ),
      deleteApplicantSuccess$: events.on(applicantsEvents.deleteApplicantSuccess).pipe(
        tap(() => {
          snackBar.open('Applicant deleted successfully', 'Close', { duration: 3000 });
        }),
      ),
      deleteApplicantFailed$: events.on(applicantsEvents.deleteApplicantFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
