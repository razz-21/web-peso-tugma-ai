import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { exhaustMap, from, map, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyGet } from '../../core/models/company.model';
import { JobGet } from '../../core/models/job.model';
import { CompaniesService } from '../../core/services/companies.service';
import { JobsService } from '../../core/services/jobs.service';
import { companyDetailsEvents } from './company-details.events';
import { jobsEvents } from '../jobs/jobs.events';
import { companiesEvents } from '../companies/companies.events';

/** Upper bound for a single company's job list; well above realistic counts. */
const COMPANY_JOBS_LIMIT = 100;

type CompanyDetailsState = {
  company: CompanyGet | null;
  loading: boolean;
  error: string | null;
  jobs: JobGet[];
  jobsLoading: boolean;
  jobsError: string | null;
  deleteJobLoading: boolean;
};

const initialState: CompanyDetailsState = {
  company: null,
  loading: false,
  error: null,
  jobs: [],
  jobsLoading: false,
  jobsError: null,
  deleteJobLoading: false,
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
    // The company is edited through the shared company form (global companies
    // store). Apply the updated company directly instead of refetching.
    on(companiesEvents.updateCompanySuccess, ({ payload }, state) =>
      state.company !== null && state.company.id === payload.id ? { company: payload } : {},
    ),
    on(companyDetailsEvents.loadCompanyJobs, () => ({ jobsLoading: true, jobsError: null })),
    on(companyDetailsEvents.loadCompanyJobsSuccess, ({ payload }) => ({
      jobs: payload,
      jobsLoading: false,
      jobsError: null,
    })),
    on(companyDetailsEvents.loadCompanyJobsFailed, ({ payload }) => ({
      jobs: [],
      jobsLoading: false,
      jobsError: payload,
    })),
    on(companyDetailsEvents.deleteCompanyJob, () => ({ deleteJobLoading: true })),
    on(companyDetailsEvents.deleteCompanyJobSuccess, ({ payload }, state) => ({
      jobs: state.jobs.filter((job) => job.id !== payload.id),
      deleteJobLoading: false,
    })),
    on(companyDetailsEvents.deleteCompanyJobFailed, () => ({ deleteJobLoading: false })),
    // Create/update run through the shared job form (global jobs store). Rather than
    // refetching, patch this company's list directly from the returned job.
    on(jobsEvents.createJobSuccess, ({ payload }, state) =>
      state.company !== null && payload.company?.id === state.company.id
        ? { jobs: [payload, ...state.jobs] }
        : {},
    ),
    on(jobsEvents.updateJobSuccess, ({ payload }, state) => ({
      jobs: state.jobs.map((job) => (job.id === payload.id ? payload : job)),
    })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      companiesService = inject(CompaniesService),
      jobsService = inject(JobsService),
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
      // Once the company resolves, load its job listings.
      loadJobsOnCompany$: events
        .on(companyDetailsEvents.loadCompanyDetailsSuccess)
        .pipe(
          map(({ payload }) => companyDetailsEvents.loadCompanyJobs({ companyId: payload.id })),
        ),
      loadCompanyJobs$: events.on(companyDetailsEvents.loadCompanyJobs).pipe(
        switchMap(({ payload }) =>
          from(jobsService.list({ company_id: payload.companyId, limit: COMPANY_JOBS_LIMIT })).pipe(
            mapResponse({
              next: (list) => companyDetailsEvents.loadCompanyJobsSuccess(list.items),
              error: (error: unknown) =>
                companyDetailsEvents.loadCompanyJobsFailed(
                  errorMessage(error, 'Failed to load jobs.'),
                ),
            }),
          ),
        ),
      ),
      deleteCompanyJob$: events.on(companyDetailsEvents.deleteCompanyJob).pipe(
        exhaustMap(({ payload }) =>
          from(jobsService.delete(payload.id)).pipe(
            mapResponse({
              next: () => companyDetailsEvents.deleteCompanyJobSuccess({ id: payload.id }),
              error: (error: unknown) =>
                companyDetailsEvents.deleteCompanyJobFailed(
                  errorMessage(error, 'Failed to delete job.'),
                ),
            }),
          ),
        ),
      ),
      deleteJobSuccess$: events
        .on(companyDetailsEvents.deleteCompanyJobSuccess)
        .pipe(tap(() => snackBar.open('Job deleted successfully', 'Close', { duration: 3000 }))),
      failures$: events
        .on(
          companyDetailsEvents.loadCompanyDetailsFailed,
          companyDetailsEvents.loadCompanyJobsFailed,
          companyDetailsEvents.deleteCompanyJobFailed,
        )
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
