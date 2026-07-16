import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { exhaustMap, from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicantGet } from '../../core/models/applicant.model';
import { ApplicantsService } from '../../core/services/applicants.service';
import { applicantDetailsEvents } from './applicant-details.events';

type ApplicantDetailsState = {
  applicant: ApplicantGet | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
};

const initialState: ApplicantDetailsState = {
  applicant: null,
  loading: false,
  updating: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const ApplicantDetailsStore = signalStore(
  withState(initialState),
  withReducer(
    on(applicantDetailsEvents.loadApplicantDetails, () => ({ loading: true, error: null })),
    on(applicantDetailsEvents.loadApplicantDetailsSuccess, ({ payload }) => ({
      applicant: payload,
      loading: false,
      error: null,
    })),
    on(applicantDetailsEvents.loadApplicantDetailsFailed, ({ payload }) => ({
      applicant: null,
      loading: false,
      error: payload,
    })),
    on(applicantDetailsEvents.updateApplicant, () => ({ updating: true, error: null })),
    on(applicantDetailsEvents.updateApplicantSuccess, ({ payload }) => ({
      applicant: payload,
      updating: false,
      error: null,
    })),
    on(applicantDetailsEvents.updateApplicantFailed, ({ payload }) => ({
      updating: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      applicantsService = inject(ApplicantsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadApplicantDetails$: events.on(applicantDetailsEvents.loadApplicantDetails).pipe(
        switchMap(({ payload }) =>
          from(applicantsService.get(payload.id)).pipe(
            mapResponse({
              next: (applicant) => applicantDetailsEvents.loadApplicantDetailsSuccess(applicant),
              error: (error: unknown) =>
                applicantDetailsEvents.loadApplicantDetailsFailed(
                  errorMessage(error, 'Failed to load applicant.'),
                ),
            }),
          ),
        ),
      ),
      loadApplicantDetailsFailed$: events
        .on(applicantDetailsEvents.loadApplicantDetailsFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
      updateApplicant$: events.on(applicantDetailsEvents.updateApplicant).pipe(
        exhaustMap(({ payload }) =>
          from(applicantsService.update(payload.id, payload.patch)).pipe(
            mapResponse({
              next: (applicant) => applicantDetailsEvents.updateApplicantSuccess(applicant),
              error: (error: unknown) =>
                applicantDetailsEvents.updateApplicantFailed(
                  errorMessage(error, 'Failed to update applicant.'),
                ),
            }),
          ),
        ),
      ),
      updateApplicantSuccess$: events
        .on(applicantDetailsEvents.updateApplicantSuccess)
        .pipe(
          tap(() => snackBar.open('Applicant updated successfully', 'Close', { duration: 3000 })),
        ),
      updateApplicantFailed$: events
        .on(applicantDetailsEvents.updateApplicantFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
