import { inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { from, switchMap, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WorkspaceGet } from '../../core/models/workspace.model';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { workspaceDetailsEvents } from './workspace-details.events';
import { workspacesEvents } from '../workspaces/workspaces.events';

type WorkspaceDetailsState = {
  workspace: WorkspaceGet | null;
  loading: boolean;
  error: string | null;
};

const initialState: WorkspaceDetailsState = {
  workspace: null,
  loading: false,
  error: null,
};

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const WorkspaceDetailsStore = signalStore(
  withState(initialState),
  withReducer(
    on(workspaceDetailsEvents.loadWorkspaceDetails, () => ({ loading: true, error: null })),
    on(workspaceDetailsEvents.loadWorkspaceDetailsSuccess, ({ payload }) => ({
      workspace: payload,
      loading: false,
      error: null,
    })),
    on(workspaceDetailsEvents.loadWorkspaceDetailsFailed, ({ payload }) => ({
      workspace: null,
      loading: false,
      error: payload,
    })),
    // The workspace is edited through the shared workspace form (global workspaces
    // store). Apply the updated workspace directly instead of refetching.
    on(workspacesEvents.updateWorkspaceSuccess, ({ payload }, state) =>
      state.workspace !== null && state.workspace.id === payload.id ? { workspace: payload } : {},
    ),
  ),
  withEventHandlers(
    (
      _store,
      events = inject(Events),
      workspacesService = inject(WorkspacesService),
      snackBar = inject(MatSnackBar),
    ) => ({
      loadWorkspaceDetails$: events.on(workspaceDetailsEvents.loadWorkspaceDetails).pipe(
        switchMap(({ payload }) =>
          from(workspacesService.get(payload.id)).pipe(
            mapResponse({
              next: (workspace) => workspaceDetailsEvents.loadWorkspaceDetailsSuccess(workspace),
              error: (error: unknown) =>
                workspaceDetailsEvents.loadWorkspaceDetailsFailed(
                  errorMessage(error, 'Failed to load workspace.'),
                ),
            }),
          ),
        ),
      ),
      failures$: events
        .on(workspaceDetailsEvents.loadWorkspaceDetailsFailed)
        .pipe(tap(({ payload }) => snackBar.open(payload, 'Close', { duration: 3000 }))),
    }),
  ),
);
