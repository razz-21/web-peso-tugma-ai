import { HttpErrorResponse } from '@angular/common/http';
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
  uploadAvatarLoading: boolean;
  error: string | null;
};

const initialState: MeState = {
  user: null,
  loading: false,
  saving: false,
  uploadAvatarLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string => {
  // FastAPI surfaces the reason in `error.error.detail`; prefer it over the
  // generic HttpErrorResponse message so users see e.g. "Current password is
  // incorrect" instead of "Failed to update your profile."
  if (error instanceof HttpErrorResponse) {
    const detail = (error.error as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string' && detail) {
      return detail;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

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
    on(meEvents.uploadAvatar, () => ({ uploadAvatarLoading: true, error: null })),
    on(meEvents.uploadAvatarSuccess, ({ payload }) => ({
      user: payload,
      uploadAvatarLoading: false,
      error: null,
    })),
    on(meEvents.uploadAvatarFailed, ({ payload }) => ({
      uploadAvatarLoading: false,
      error: payload,
    })),
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
      uploadAvatar$: events.on(meEvents.uploadAvatar).pipe(
        switchMap(({ payload }) =>
          from(meService.uploadAvatar(payload.file)).pipe(
            mapResponse({
              next: (user) => meEvents.uploadAvatarSuccess(user),
              error: (error: unknown) =>
                meEvents.uploadAvatarFailed(errorMessage(error, 'Failed to upload avatar.')),
            }),
          ),
        ),
      ),
      uploadAvatarSuccess$: events
        .on(meEvents.uploadAvatarSuccess)
        .pipe(tap(() => snackBar.open('Avatar updated successfully', 'Close', { duration: 3000 }))),
      failures$: events
        .on(meEvents.loadMeFailed, meEvents.updateMeFailed, meEvents.uploadAvatarFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
