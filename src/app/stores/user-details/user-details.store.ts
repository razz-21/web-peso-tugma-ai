import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserGet, UserPatch } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { userDetailsEvents } from './user-details.events';

export type UpdateUserPayload = {
  id: string;
  data: UserPatch;
  /** Snackbar message shown on success (e.g. "Changes saved"). */
  message: string;
};

type UserDetailsState = {
  user: UserGet | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: UserDetailsState = {
  user: null,
  loading: false,
  saving: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const UserDetailsStore = signalStore(
  withState(initialState),
  withReducer(
    on(userDetailsEvents.loadUserDetails, () => ({ loading: true, error: null })),
    on(userDetailsEvents.loadUserDetailsSuccess, ({ payload }) => ({
      user: payload,
      loading: false,
      error: null,
    })),
    on(userDetailsEvents.loadUserDetailsFailed, ({ payload }) => ({
      user: null,
      loading: false,
      error: payload,
    })),
    on(userDetailsEvents.updateUser, () => ({ saving: true, error: null })),
    on(userDetailsEvents.updateUserSuccess, ({ payload }) => ({
      user: payload.user,
      saving: false,
      error: null,
    })),
    on(userDetailsEvents.updateUserFailed, ({ payload }) => ({ saving: false, error: payload })),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      usersService = inject(UsersService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadUserDetails$: events.on(userDetailsEvents.loadUserDetails).pipe(
        switchMap(({ payload }) =>
          from(usersService.get(payload.id)).pipe(
            mapResponse({
              next: (user) => userDetailsEvents.loadUserDetailsSuccess(user),
              error: (error: unknown) =>
                userDetailsEvents.loadUserDetailsFailed(
                  errorMessage(error, 'Failed to load user.'),
                ),
            }),
          ),
        ),
      ),
      updateUser$: events.on(userDetailsEvents.updateUser).pipe(
        switchMap(({ payload }) =>
          from(usersService.update(payload.id, payload.user)).pipe(
            mapResponse({
              next: (user) =>
                userDetailsEvents.updateUserSuccess({
                  id: payload.id,
                  user,
                  message: payload.message,
                }),
              error: (error: unknown) =>
                userDetailsEvents.updateUserFailed(errorMessage(error, 'Failed to update user.')),
            }),
          ),
        ),
      ),
      updateUserSuccess$: events
        .on(userDetailsEvents.updateUserSuccess)
        .pipe(tap(({ payload }) => snackBar.open(payload.message, 'Close', { duration: 3000 }))),
      failures$: events
        .on(userDetailsEvents.loadUserDetailsFailed, userDetailsEvents.updateUserFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
