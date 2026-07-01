import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { WorkspaceGet, WorkspaceList, WorkspacePost } from '../../core/models/workspace.model';
import { WorkspacesFilter } from './workspaces.store';

export const workspacesEvents = eventGroup({
  source: 'Workspaces',
  events: {
    loadWorkspace: type<WorkspacesFilter>(),
    loadWorkspaceSuccess: type<WorkspaceList>(),
    loadWorkspaceFailed: type<string>(),

    searchWorkspace: type<string>(),
    searchWorkspaceSuccess: type<WorkspaceList>(),
    searchWorkspaceFailed: type<string>(),

    deleteWorkspace: type<string>(),
    deleteWorkspaceSuccess: type<string>(),
    deleteWorkspaceFailed: type<string>(),

    createWorkspace: type<WorkspacePost>(),
    createWorkspaceSuccess: type<WorkspaceGet>(),
    createWorkspaceFailed: type<string>(),
  },
});
