import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, exhaustMap, from, switchMap, tap } from 'rxjs';
import { CompanyGet, ListCompaniesParams } from '../../core/models/company.model';
import { CompaniesService } from '../../core/services/companies.service';
import { companiesEvents } from './companies.events';

type CompaniesState = {
  companies: CompanyGet[];
  total: number;
  filter: CompaniesFilter;
  loading: boolean;
  createCompanyLoading: boolean;
  updateCompanyLoading: boolean;
  deleteCompanyLoading: boolean;
  error: string | null;
};

export type CompaniesFilter = {
  q: string;
  pageIndex: number;
  pageSize: number;
};

const initialState: CompaniesState = {
  companies: [],
  total: 0,
  filter: { q: '', pageIndex: 0, pageSize: 10 },
  loading: false,
  createCompanyLoading: false,
  updateCompanyLoading: false,
  deleteCompanyLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: CompaniesFilter): ListCompaniesParams => ({
  limit: filter.pageSize,
  offset: filter.pageIndex * filter.pageSize,
  q: filter.q || undefined,
});

const SEARCH_DEBOUNCE_MS = 600;

export const CompaniesStore = signalStore(
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
      const end = store.offset() + store.companies().length;
      return `${start}–${end} of ${total}`;
    }),
  })),
  withReducer(
    on(companiesEvents.loadCompany, ({ payload }, state) => ({
      filter: {
        q: payload?.q ?? state.filter.q,
        pageIndex: payload?.pageIndex ?? state.filter.pageIndex,
        pageSize: payload?.pageSize ?? state.filter.pageSize,
      },
      loading: true,
      error: null,
    })),
    on(companiesEvents.loadCompanySuccess, ({ payload }) => ({
      companies: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(companiesEvents.loadCompanyFailed, ({ payload }) => ({
      companies: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(companiesEvents.searchCompany, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload, pageIndex: 0 },
      loading: true,
      error: null,
    })),
    on(companiesEvents.searchCompanySuccess, ({ payload }) => ({
      companies: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(companiesEvents.searchCompanyFailed, ({ payload }) => ({
      companies: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(companiesEvents.createCompany, () => ({
      createCompanyLoading: true,
      error: null,
    })),
    on(companiesEvents.createCompanySuccess, ({ payload }, state) => ({
      companies: [payload, ...state.companies],
      total: state.total + 1,
      createCompanyLoading: false,
      error: null,
    })),
    on(companiesEvents.createCompanyFailed, ({ payload }) => ({
      createCompanyLoading: false,
      error: payload,
    })),
    on(companiesEvents.updateCompany, () => ({
      updateCompanyLoading: true,
      error: null,
    })),
    on(companiesEvents.updateCompanySuccess, ({ payload }, state) => ({
      companies: state.companies.map((company) => (company.id === payload.id ? payload : company)),
      updateCompanyLoading: false,
      error: null,
    })),
    on(companiesEvents.updateCompanyFailed, ({ payload }) => ({
      updateCompanyLoading: false,
      error: payload,
    })),
    on(companiesEvents.deleteCompany, () => ({ deleteCompanyLoading: true, error: null })),
    on(companiesEvents.deleteCompanySuccess, () => ({
      deleteCompanyLoading: false,
      error: null,
    })),
    on(companiesEvents.deleteCompanyFailed, ({ payload }) => ({
      deleteCompanyLoading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      companiesService = inject(CompaniesService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadCompanies$: events
        .on(companiesEvents.loadCompany, companiesEvents.deleteCompanySuccess)
        .pipe(
          switchMap(() =>
            from(companiesService.list(toListParams(store.filter()))).pipe(
              mapResponse({
                next: (list) => companiesEvents.loadCompanySuccess(list),
                error: (error: unknown) =>
                  companiesEvents.loadCompanyFailed(
                    errorMessage(error, 'Failed to load companies.'),
                  ),
              }),
            ),
          ),
        ),
      loadCompanyFailed$: events.on(companiesEvents.loadCompanyFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      searchCompanies$: events.on(companiesEvents.searchCompany).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(companiesService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => companiesEvents.searchCompanySuccess(list),
              error: (error: unknown) =>
                companiesEvents.searchCompanyFailed(
                  errorMessage(error, 'Failed to search companies.'),
                ),
            }),
          ),
        ),
      ),
      searchCompanyFailed$: events.on(companiesEvents.searchCompanyFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      createCompany$: events.on(companiesEvents.createCompany).pipe(
        switchMap(({ payload }) =>
          from(companiesService.create(payload)).pipe(
            mapResponse({
              next: (company) => companiesEvents.createCompanySuccess(company),
              error: (error: unknown) =>
                companiesEvents.createCompanyFailed(
                  errorMessage(error, 'Failed to create company.'),
                ),
            }),
          ),
        ),
      ),
      createCompanySuccess$: events.on(companiesEvents.createCompanySuccess).pipe(
        tap(() => {
          snackBar.open('Company created successfully', 'Close', { duration: 3000 });
        }),
      ),
      createCompanyFailed$: events.on(companiesEvents.createCompanyFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      updateCompany$: events.on(companiesEvents.updateCompany).pipe(
        switchMap(({ payload }) =>
          from(companiesService.update(payload.id, payload.company)).pipe(
            mapResponse({
              next: (company) => companiesEvents.updateCompanySuccess(company),
              error: (error: unknown) =>
                companiesEvents.updateCompanyFailed(
                  errorMessage(error, 'Failed to update company.'),
                ),
            }),
          ),
        ),
      ),
      updateCompanySuccess$: events.on(companiesEvents.updateCompanySuccess).pipe(
        tap(() => {
          snackBar.open('Company updated successfully', 'Close', { duration: 3000 });
        }),
      ),
      updateCompanyFailed$: events.on(companiesEvents.updateCompanyFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteCompany$: events.on(companiesEvents.deleteCompany).pipe(
        exhaustMap(({ payload: id }) =>
          from(companiesService.delete(id)).pipe(
            mapResponse({
              next: () => companiesEvents.deleteCompanySuccess(id),
              error: (error: unknown) =>
                companiesEvents.deleteCompanyFailed(
                  errorMessage(error, 'Failed to delete company.'),
                ),
            }),
          ),
        ),
      ),
      deleteCompanySuccess$: events.on(companiesEvents.deleteCompanySuccess).pipe(
        tap(() => {
          snackBar.open('Company deleted successfully', 'Close', { duration: 3000 });
        }),
      ),
      deleteCompanyFailed$: events.on(companiesEvents.deleteCompanyFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
