import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { exhaustMap, from, mergeMap, switchMap, tap } from 'rxjs';
import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJob,
} from '../../core/models/recommended-job.model';
import { RecommendationsService } from '../../core/services/recommendations.service';
import { recommendationsEvents } from './recommendations.events';

type RecommendationsState = {
  /** Untouched AI recommendations (no referral status) — the Recommended list. */
  items: RecommendedJob[];
  /** Recommendations already referred (a lifecycle status is set) — the Referred list. */
  referrals: RecommendedJob[];
  loading: boolean;
  generating: boolean;
  /** Ids of recommendations with an in-flight relevance update. */
  updatingIds: string[];
  error: string | null;
};

const initialState: RecommendationsState = {
  items: [],
  referrals: [],
  loading: false,
  generating: false,
  updatingIds: [],
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** Replace the matching row by id, or prepend it when it isn't in the list yet. */
const upsertById = (list: RecommendedJob[], item: RecommendedJob): RecommendedJob[] =>
  list.some((existing) => existing.id === item.id)
    ? list.map((existing) => (existing.id === item.id ? item : existing))
    : [item, ...list];

export const RecommendationsStore = signalStore(
  withState(initialState),
  withReducer(
    on(recommendationsEvents.load, () => ({ loading: true, error: null })),
    on(recommendationsEvents.loadSuccess, ({ payload }) => ({
      items: payload.recommended,
      referrals: payload.referred,
      loading: false,
      error: null,
    })),
    on(recommendationsEvents.loadFailed, ({ payload }) => ({ loading: false, error: payload })),

    on(recommendationsEvents.generate, () => ({ generating: true, error: null })),
    on(recommendationsEvents.generateSuccess, ({ payload }) => ({
      // Generate only refreshes the untouched recommendations; the referred list
      // is unaffected (the backend excludes already-referred jobs from the set).
      items: payload,
      generating: false,
      error: null,
    })),
    on(recommendationsEvents.generateFailed, ({ payload }) => ({
      generating: false,
      error: payload,
    })),

    on(recommendationsEvents.referSuccess, ({ payload }, state) => ({
      // A manual referral becomes a referred row and leaves the Recommended list:
      // drop any recommendation/referral for the same job, then surface it on top.
      items: state.items.filter((item) => item.job?.id !== payload.job?.id),
      referrals: [
        payload,
        ...state.referrals.filter(
          (item) => item.job?.id !== payload.job?.id && item.id !== payload.id,
        ),
      ],
      error: null,
    })),
    on(recommendationsEvents.referFailed, ({ payload }) => ({ error: payload })),

    on(recommendationsEvents.setRelevance, ({ payload }, state) => ({
      updatingIds: [...state.updatingIds, payload.id],
      error: null,
    })),
    on(recommendationsEvents.setRelevanceSuccess, ({ payload }, state) => ({
      // Relevance never changes the referral status, so update in place wherever
      // the row currently lives.
      items: state.items.map((item) => (item.id === payload.id ? payload : item)),
      referrals: state.referrals.map((item) => (item.id === payload.id ? payload : item)),
      updatingIds: state.updatingIds.filter((id) => id !== payload.id),
    })),
    on(recommendationsEvents.setRelevanceFailed, ({ payload }, state) => ({
      updatingIds: state.updatingIds.filter((id) => id !== payload.id),
      error: payload.message,
    })),

    on(recommendationsEvents.setStatus, ({ payload }, state) => ({
      updatingIds: [...state.updatingIds, payload.id],
      error: null,
    })),
    on(recommendationsEvents.setStatusSuccess, ({ payload }, state) => {
      // Setting a status moves the row into the Referred list (and out of the
      // Recommended one); clearing it back to null moves it the other way.
      const isReferred = payload.status !== null;
      return {
        items: isReferred
          ? state.items.filter((item) => item.id !== payload.id)
          : upsertById(state.items, payload),
        referrals: isReferred
          ? upsertById(state.referrals, payload)
          : state.referrals.filter((item) => item.id !== payload.id),
        updatingIds: state.updatingIds.filter((id) => id !== payload.id),
      };
    }),
    on(recommendationsEvents.setStatusFailed, ({ payload }, state) => ({
      updatingIds: state.updatingIds.filter((id) => id !== payload.id),
      error: payload.message,
    })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      recommendationsService = inject(RecommendationsService),
      snackBar = inject(MatSnackBar),
    ) => ({
      load$: events.on(recommendationsEvents.load).pipe(
        switchMap(({ payload }) =>
          from(
            Promise.all([
              recommendationsService.list(payload.applicantId, false),
              recommendationsService.list(payload.applicantId, true),
            ]),
          ).pipe(
            mapResponse({
              next: ([recommended, referred]) =>
                recommendationsEvents.loadSuccess({ recommended, referred }),
              error: (error: unknown) =>
                recommendationsEvents.loadFailed(
                  errorMessage(error, 'Failed to load recommendations.'),
                ),
            }),
          ),
        ),
      ),
      generate$: events.on(recommendationsEvents.generate).pipe(
        exhaustMap(({ payload }) =>
          from(recommendationsService.generate(payload.applicantId, payload.topK ?? 5)).pipe(
            mapResponse({
              next: (items) => recommendationsEvents.generateSuccess(items),
              error: (error: unknown) =>
                recommendationsEvents.generateFailed(
                  errorMessage(error, 'Failed to generate recommendations.'),
                ),
            }),
          ),
        ),
      ),
      refer$: events.on(recommendationsEvents.refer).pipe(
        mergeMap(({ payload }) =>
          from(recommendationsService.refer(payload.applicantId, payload.jobId)).pipe(
            mapResponse({
              next: (recommendation) => recommendationsEvents.referSuccess(recommendation),
              error: (error: unknown) =>
                recommendationsEvents.referFailed(
                  errorMessage(error, 'Failed to refer applicant.'),
                ),
            }),
          ),
        ),
      ),
      setRelevance$: events.on(recommendationsEvents.setRelevance).pipe(
        mergeMap(({ payload }) =>
          from(recommendationsService.setRelevance(payload.id, payload.isRelevant)).pipe(
            mapResponse({
              next: (recommendation) => recommendationsEvents.setRelevanceSuccess(recommendation),
              error: (error: unknown) =>
                recommendationsEvents.setRelevanceFailed({
                  id: payload.id,
                  message: errorMessage(error, 'Failed to update recommendation.'),
                }),
            }),
          ),
        ),
      ),
      setStatus$: events.on(recommendationsEvents.setStatus).pipe(
        mergeMap(({ payload }) =>
          from(recommendationsService.setStatus(payload.id, payload.status)).pipe(
            mapResponse({
              next: (recommendation) => recommendationsEvents.setStatusSuccess(recommendation),
              error: (error: unknown) =>
                recommendationsEvents.setStatusFailed({
                  id: payload.id,
                  message: errorMessage(error, 'Failed to update referral status.'),
                }),
            }),
          ),
        ),
      ),
      generateSuccess$: events
        .on(recommendationsEvents.generateSuccess)
        .pipe(
          tap(({ payload }) =>
            snackBar.open(
              payload.length > 0
                ? `Generated ${payload.length} recommendation${payload.length === 1 ? '' : 's'}`
                : 'No active jobs to recommend',
              'Close',
              { duration: 3000 },
            ),
          ),
        ),
      setRelevanceSuccess$: events
        .on(recommendationsEvents.setRelevanceSuccess)
        .pipe(
          tap(({ payload }) =>
            snackBar.open(
              payload.is_relevant ? 'Marked as relevant' : 'Marked as not relevant',
              'Close',
              { duration: 2000 },
            ),
          ),
        ),
      setStatusSuccess$: events
        .on(recommendationsEvents.setStatusSuccess)
        .pipe(
          tap(({ payload }) =>
            snackBar.open(
              payload.status === 'referred'
                ? 'Job successfully referred to applicant'
                : payload.status
                  ? `Status updated to ${RECOMMENDED_JOB_STATUS_LABEL[payload.status]}`
                  : 'Referral status cleared',
              'Close',
              { duration: 3000 },
            ),
          ),
        ),
      referSuccess$: events.on(recommendationsEvents.referSuccess).pipe(
        tap(({ payload }) =>
          snackBar.open(`Referred applicant to ${payload.job?.title ?? 'the job'}`, 'Close', {
            duration: 3000,
          }),
        ),
      ),
      failures$: events
        .on(
          recommendationsEvents.loadFailed,
          recommendationsEvents.generateFailed,
          recommendationsEvents.referFailed,
        )
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
      relevanceFailure$: events
        .on(recommendationsEvents.setRelevanceFailed, recommendationsEvents.setStatusFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload.message, 'Close', { duration: 3000 }))),
    }),
  ),
);
