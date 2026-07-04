import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserGet } from '../../core/models/user.model';
import { MeService } from '../../core/services/me.service';
import { meEvents } from './me.events';

type MeState = {
  user: UserGet | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: MeState = {
  user: null,
  loading: false,
  saving: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const MeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withReducer(
    on(meEvents.loadMe, () => ({ loading: true, error: null })),
    on(meEvents.loadMeSuccess, ({ payload }) => ({
      user: payload,
      loading: false,
      error: null,
    })),
    on(meEvents.loadMeFailed, ({ payload }) => ({
      user: null,
      loading: false,
      error: payload,
    })),
    on(meEvents.updateMe, () => ({ saving: true, error: null })),
    on(meEvents.updateMeSuccess, ({ payload }) => ({
      user: payload.user,
      saving: false,
      error: null,
    })),
    on(meEvents.updateMeFailed, ({ payload }) => ({ saving: false, error: payload })),
    on(meEvents.resetMe, () => initialState),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      meService = inject(MeService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadMe$: events.on(meEvents.loadMe).pipe(
        switchMap(() =>
          from(meService.get()).pipe(
            mapResponse({
              next: (user) => meEvents.loadMeSuccess(user),
              error: (error: unknown) =>
                meEvents.loadMeFailed(errorMessage(error, 'Failed to load your profile.')),
            }),
          ),
        ),
      ),
      updateMe$: events.on(meEvents.updateMe).pipe(
        switchMap(({ payload }) =>
          from(meService.patch(payload.data)).pipe(
            mapResponse({
              next: (user) => meEvents.updateMeSuccess({ user, message: payload.message }),
              error: (error: unknown) =>
                meEvents.updateMeFailed(errorMessage(error, 'Failed to update your profile.')),
            }),
          ),
        ),
      ),
      updateMeSuccess$: events
        .on(meEvents.updateMeSuccess)
        .pipe(tap(({ payload }) => snackBar.open(payload.message, 'Close', { duration: 3000 }))),
      failures$: events
        .on(meEvents.loadMeFailed, meEvents.updateMeFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
