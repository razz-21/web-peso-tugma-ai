import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { debounceTime, from, switchMap, exhaustMap, tap } from 'rxjs';
import { ListUsersParams, UserGet, UserRole } from '../../core/models/user.model';
import { UsersService } from '../../core/services/users.service';
import { usersEvents } from './users.events';
import { MatSnackBar } from '@angular/material/snack-bar';

type UsersState = {
  users: UserGet[];
  total: number;
  filter: UsersFilter;
  loading: boolean;
  createUserLoading: boolean;
  deleteUserLoading: boolean;
  inviteUsersLoading: boolean;
  removeMemberLoading: boolean;
  error: string | null;
};

export type UsersFilter = {
  q: string;
  role: 'all' | UserRole;
  pageIndex: number;
  pageSize: number;
};

const initialState: UsersState = {
  users: [],
  total: 0,
  filter: { q: '', role: 'all', pageIndex: 0, pageSize: 10 },
  loading: false,
  createUserLoading: false,
  deleteUserLoading: false,
  inviteUsersLoading: false,
  removeMemberLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: UsersFilter): ListUsersParams => ({
  limit: filter.pageSize,
  offset: filter.pageIndex * filter.pageSize,
  q: filter.q || undefined,
  role: filter.role === 'all' ? undefined : filter.role,
});

const SEARCH_DEBOUNCE_MS = 600;

export const UsersStore = signalStore(
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
      const end = store.offset() + store.users().length;
      return `${start}–${end} of ${total}`;
    }),
  })),
  withReducer(
    on(usersEvents.loadUser, ({ payload }, state) => ({
      filter: {
        q: payload?.q ?? state.filter.q,
        role: payload?.role ?? state.filter.role,
        pageIndex: payload?.pageIndex ?? state.filter.pageIndex,
        pageSize: payload?.pageSize ?? state.filter.pageSize,
      },
      loading: true,
      error: null,
    })),
    on(usersEvents.loadUserSuccess, ({ payload }) => ({
      users: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(usersEvents.loadUserFailed, ({ payload }) => ({
      users: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(usersEvents.searchUser, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload, pageIndex: 0 },
      loading: true,
      error: null,
    })),
    on(usersEvents.searchUserSuccess, ({ payload }) => ({
      users: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(usersEvents.searchUserFailed, ({ payload }) => ({
      users: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(usersEvents.createUser, () => ({
      createUserLoading: true,
      error: null,
    })),
    on(usersEvents.createUserSuccess, ({ payload }, state) => ({
      users: [...state.users, payload],
      total: state.total + 1,
      createUserLoading: false,
      error: null,
    })),
    on(usersEvents.createUserFailed, ({ payload }) => ({
      createUserLoading: false,
      error: payload,
    })),
    on(usersEvents.inviteUsers, () => ({ inviteUsersLoading: true, error: null })),
    on(usersEvents.inviteUsersSuccess, ({ payload }, state) => {
      const updated = new Map(payload.map((user) => [user.id, user]));
      return {
        users: state.users.map((user) => updated.get(user.id) ?? user),
        inviteUsersLoading: false,
        error: null,
      };
    }),
    on(usersEvents.inviteUsersFailed, ({ payload }) => ({
      inviteUsersLoading: false,
      error: payload,
    })),
    on(usersEvents.deleteUser, () => ({ deleteUserLoading: true, error: null })),
    on(usersEvents.deleteUserSuccess, () => ({ deleteUserLoading: false, error: null })),
    on(usersEvents.deleteUserFailed, ({ payload }) => ({
      deleteUserLoading: false,
      error: payload,
    })),
    on(usersEvents.removeMember, () => ({ removeMemberLoading: true, error: null })),
    on(usersEvents.removeMemberSuccess, ({ payload: id }, state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, workspace: null } : user)),
      removeMemberLoading: false,
      error: null,
    })),
    on(usersEvents.removeMemberFailed, ({ payload }) => ({
      removeMemberLoading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      usersService = inject(UsersService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadUsers$: events.on(usersEvents.loadUser, usersEvents.deleteUserSuccess).pipe(
        switchMap(() =>
          from(usersService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => usersEvents.loadUserSuccess(list),
              error: (error: unknown) =>
                usersEvents.loadUserFailed(errorMessage(error, 'Failed to load users.')),
            }),
          ),
        ),
      ),
      loadUserFailed$: events.on(usersEvents.loadUserFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      searchUsers$: events.on(usersEvents.searchUser).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(usersService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => usersEvents.searchUserSuccess(list),
              error: (error: unknown) =>
                usersEvents.searchUserFailed(errorMessage(error, 'Failed to search users.')),
            }),
          ),
        ),
      ),
      searchUserFailed$: events.on(usersEvents.searchUserFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      createUser$: events.on(usersEvents.createUser).pipe(
        switchMap(({ payload }) =>
          from(usersService.create(payload)).pipe(
            mapResponse({
              next: (user) => usersEvents.createUserSuccess(user),
              error: (error: unknown) =>
                usersEvents.createUserFailed(errorMessage(error, 'Failed to create user.')),
            }),
          ),
        ),
      ),
      createUserSuccess$: events.on(usersEvents.createUserSuccess).pipe(
        tap(() => {
          snackBar.open('User created successfully', 'Close', { duration: 3000 });
        }),
      ),
      createUserFailed$: events.on(usersEvents.createUserFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      inviteUsers$: events.on(usersEvents.inviteUsers).pipe(
        exhaustMap(({ payload }) =>
          from(
            Promise.all(
              payload.userIds.map((id) =>
                usersService.update(id, { workspace_id: payload.workspaceId }),
              ),
            ),
          ).pipe(
            mapResponse({
              next: (users) => usersEvents.inviteUsersSuccess(users),
              error: (error: unknown) =>
                usersEvents.inviteUsersFailed(errorMessage(error, 'Failed to invite members.')),
            }),
          ),
        ),
      ),
      inviteUsersSuccess$: events.on(usersEvents.inviteUsersSuccess).pipe(
        tap(({ payload }) => {
          const label = payload.length === 1 ? 'member' : 'members';
          snackBar.open(`Invited ${payload.length} ${label}`, 'Close', { duration: 3000 });
        }),
      ),
      inviteUsersFailed$: events.on(usersEvents.inviteUsersFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      removeMember$: events.on(usersEvents.removeMember).pipe(
        exhaustMap(({ payload: id }) =>
          from(usersService.update(id, { workspace_id: null })).pipe(
            mapResponse({
              next: () => usersEvents.removeMemberSuccess(id),
              error: (error: unknown) =>
                usersEvents.removeMemberFailed(errorMessage(error, 'Failed to remove member.')),
            }),
          ),
        ),
      ),
      removeMemberSuccess$: events.on(usersEvents.removeMemberSuccess).pipe(
        tap(() => {
          snackBar.open('Member removed', 'Close', { duration: 3000 });
        }),
      ),
      removeMemberFailed$: events.on(usersEvents.removeMemberFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteUser$: events.on(usersEvents.deleteUser).pipe(
        exhaustMap(({ payload: id }) =>
          from(usersService.delete(id)).pipe(
            mapResponse({
              next: () => usersEvents.deleteUserSuccess(id),
              error: (error: unknown) =>
                usersEvents.deleteUserFailed(errorMessage(error, 'Failed to delete user.')),
            }),
          ),
        ),
      ),
      deleteUserFailed$: events.on(usersEvents.deleteUserFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteUserSuccess$: events.on(usersEvents.deleteUserSuccess).pipe(
        tap(() => {
          snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
