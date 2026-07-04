import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyGet } from '../../core/models/company.model';
import { CompaniesService } from '../../core/services/companies.service';
import { companyDetailsEvents } from './company-details.events';

type CompanyDetailsState = {
  company: CompanyGet | null;
  loading: boolean;
  error: string | null;
};

const initialState: CompanyDetailsState = {
  company: null,
  loading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const CompanyDetailsStore = signalStore(
  withState(initialState),
  withReducer(
    on(companyDetailsEvents.loadCompanyDetails, () => ({ loading: true, error: null })),
    on(companyDetailsEvents.loadCompanyDetailsSuccess, ({ payload }) => ({
      company: payload,
      loading: false,
      error: null,
    })),
    on(companyDetailsEvents.loadCompanyDetailsFailed, ({ payload }) => ({
      company: null,
      loading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      companiesService = inject(CompaniesService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadCompanyDetails$: events.on(companyDetailsEvents.loadCompanyDetails).pipe(
        switchMap(({ payload }) =>
          from(companiesService.get(payload.id)).pipe(
            mapResponse({
              next: (company) => companyDetailsEvents.loadCompanyDetailsSuccess(company),
              error: (error: unknown) =>
                companyDetailsEvents.loadCompanyDetailsFailed(
                  errorMessage(error, 'Failed to load company.'),
                ),
            }),
          ),
        ),
      ),
      failures$: events
        .on(companyDetailsEvents.loadCompanyDetailsFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
