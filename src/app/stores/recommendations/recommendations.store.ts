import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { exhaustMap, from, mergeMap, switchMap, tap } from 'rxjs';
import { RecommendedJob } from '../../core/models/recommended-job.model';
import { RecommendationsService } from '../../core/services/recommendations.service';
import { recommendationsEvents } from './recommendations.events';

type RecommendationsState = {
  items: RecommendedJob[];
  loading: boolean;
  generating: boolean;
  /** Ids of recommendations with an in-flight relevance update. */
  updatingIds: string[];
  error: string | null;
};

const initialState: RecommendationsState = {
  items: [],
  loading: false,
  generating: false,
  updatingIds: [],
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const RecommendationsStore = signalStore(
  withState(initialState),
  withReducer(
    on(recommendationsEvents.load, () => ({ loading: true, error: null })),
    on(recommendationsEvents.loadSuccess, ({ payload }) => ({
      items: payload,
      loading: false,
      error: null,
    })),
    on(recommendationsEvents.loadFailed, ({ payload }) => ({ loading: false, error: payload })),

    on(recommendationsEvents.generate, () => ({ generating: true, error: null })),
    on(recommendationsEvents.generateSuccess, ({ payload }) => ({
      items: payload,
      generating: false,
      error: null,
    })),
    on(recommendationsEvents.generateFailed, ({ payload }) => ({
      generating: false,
      error: payload,
    })),

    on(recommendationsEvents.setRelevance, ({ payload }, state) => ({
      updatingIds: [...state.updatingIds, payload.id],
      error: null,
    })),
    on(recommendationsEvents.setRelevanceSuccess, ({ payload }, state) => ({
      items: state.items.map((item) => (item.id === payload.id ? payload : item)),
      updatingIds: state.updatingIds.filter((id) => id !== payload.id),
    })),
    on(recommendationsEvents.setRelevanceFailed, ({ payload }, state) => ({
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
          from(recommendationsService.list(payload.applicantId)).pipe(
            mapResponse({
              next: (items) => recommendationsEvents.loadSuccess(items),
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
      failures$: events
        .on(recommendationsEvents.loadFailed, recommendationsEvents.generateFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
      relevanceFailure$: events
        .on(recommendationsEvents.setRelevanceFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload.message, 'Close', { duration: 3000 }))),
    }),
  ),
);
