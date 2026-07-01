import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { debounceTime, from, switchMap, exhaustMap, tap } from 'rxjs';
import { ListWorkspacesParams, WorkspaceGet } from '../../core/models/workspace.model';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { workspacesEvents } from './workspaces.events';
import { MatSnackBar } from '@angular/material/snack-bar';

type WorkspacesState = {
  workspaces: WorkspaceGet[];
  total: number;
  filter: WorkspacesFilter;
  loading: boolean;
  createWorkspaceLoading: boolean;
  deleteWorkspaceLoading: boolean;
  error: string | null;
};

export type WorkspacesFilter = {
  q: string;
  pageIndex: number;
  pageSize: number;
};

const initialState: WorkspacesState = {
  workspaces: [],
  total: 0,
  filter: { q: '', pageIndex: 0, pageSize: 10 },
  loading: false,
  createWorkspaceLoading: false,
  deleteWorkspaceLoading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

const toListParams = (filter: WorkspacesFilter): ListWorkspacesParams => ({
  limit: filter.pageSize,
  offset: filter.pageIndex * filter.pageSize,
  q: filter.q || undefined,
});

const SEARCH_DEBOUNCE_MS = 600;

export const WorkspacesStore = signalStore(
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
      const end = store.offset() + store.workspaces().length;
      return `${start}–${end} of ${total}`;
    }),
  })),
  withReducer(
    on(workspacesEvents.loadWorkspace, ({ payload }, state) => ({
      filter: {
        q: payload?.q ?? state.filter.q,
        pageIndex: payload?.pageIndex ?? state.filter.pageIndex,
        pageSize: payload?.pageSize ?? state.filter.pageSize,
      },
      loading: true,
      error: null,
    })),
    on(workspacesEvents.loadWorkspaceSuccess, ({ payload }) => ({
      workspaces: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(workspacesEvents.loadWorkspaceFailed, ({ payload }) => ({
      workspaces: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(workspacesEvents.searchWorkspace, ({ payload }, state) => ({
      filter: { ...state.filter, q: payload, pageIndex: 0 },
      loading: true,
      error: null,
    })),
    on(workspacesEvents.searchWorkspaceSuccess, ({ payload }) => ({
      workspaces: payload.items,
      total: payload.total,
      loading: false,
      error: null,
    })),
    on(workspacesEvents.searchWorkspaceFailed, ({ payload }) => ({
      workspaces: [],
      total: 0,
      loading: false,
      error: payload,
    })),
    on(workspacesEvents.createWorkspace, () => ({
      createWorkspaceLoading: true,
      error: null,
    })),
    on(workspacesEvents.createWorkspaceSuccess, ({ payload }, state) => ({
      workspaces: [...state.workspaces, payload],
      total: state.total + 1,
      createWorkspaceLoading: false,
      error: null,
    })),
    on(workspacesEvents.createWorkspaceFailed, ({ payload }) => ({
      createWorkspaceLoading: false,
      error: payload,
    })),
    on(workspacesEvents.deleteWorkspace, () => ({ deleteWorkspaceLoading: true, error: null })),
    on(workspacesEvents.deleteWorkspaceSuccess, () => ({
      deleteWorkspaceLoading: false,
      error: null,
    })),
    on(workspacesEvents.deleteWorkspaceFailed, ({ payload }) => ({
      deleteWorkspaceLoading: false,
      error: payload,
    })),
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      workspacesService = inject(WorkspacesService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadWorkspaces$: events
        .on(workspacesEvents.loadWorkspace, workspacesEvents.deleteWorkspaceSuccess)
        .pipe(
          switchMap(() =>
            from(workspacesService.list(toListParams(store.filter()))).pipe(
              mapResponse({
                next: (list) => workspacesEvents.loadWorkspaceSuccess(list),
                error: (error: unknown) =>
                  workspacesEvents.loadWorkspaceFailed(
                    errorMessage(error, 'Failed to load workspaces.'),
                  ),
              }),
            ),
          ),
        ),
      loadWorkspaceFailed$: events.on(workspacesEvents.loadWorkspaceFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      searchWorkspaces$: events.on(workspacesEvents.searchWorkspace).pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap(() =>
          from(workspacesService.list(toListParams(store.filter()))).pipe(
            mapResponse({
              next: (list) => workspacesEvents.searchWorkspaceSuccess(list),
              error: (error: unknown) =>
                workspacesEvents.searchWorkspaceFailed(
                  errorMessage(error, 'Failed to search workspaces.'),
                ),
            }),
          ),
        ),
      ),
      searchWorkspaceFailed$: events.on(workspacesEvents.searchWorkspaceFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      createWorkspace$: events.on(workspacesEvents.createWorkspace).pipe(
        switchMap(({ payload }) =>
          from(workspacesService.create(payload)).pipe(
            mapResponse({
              next: (workspace) => workspacesEvents.createWorkspaceSuccess(workspace),
              error: (error: unknown) =>
                workspacesEvents.createWorkspaceFailed(
                  errorMessage(error, 'Failed to create workspace.'),
                ),
            }),
          ),
        ),
      ),
      createWorkspaceSuccess$: events.on(workspacesEvents.createWorkspaceSuccess).pipe(
        tap(() => {
          snackBar.open('Workspace created successfully', 'Close', { duration: 3000 });
        }),
      ),
      createWorkspaceFailed$: events.on(workspacesEvents.createWorkspaceFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteWorkspace$: events.on(workspacesEvents.deleteWorkspace).pipe(
        exhaustMap(({ payload: id }) =>
          from(workspacesService.delete(id)).pipe(
            mapResponse({
              next: () => workspacesEvents.deleteWorkspaceSuccess(id),
              error: (error: unknown) =>
                workspacesEvents.deleteWorkspaceFailed(
                  errorMessage(error, 'Failed to delete workspace.'),
                ),
            }),
          ),
        ),
      ),
      deleteWorkspaceFailed$: events.on(workspacesEvents.deleteWorkspaceFailed).pipe(
        tap(({ payload }) => {
          snackBar.open(payload, 'Close', { duration: 3000 });
        }),
      ),
      deleteWorkspaceSuccess$: events.on(workspacesEvents.deleteWorkspaceSuccess).pipe(
        tap(() => {
          snackBar.open('Workspace deleted successfully', 'Close', { duration: 3000 });
        }),
      ),
    }),
  ),
);
