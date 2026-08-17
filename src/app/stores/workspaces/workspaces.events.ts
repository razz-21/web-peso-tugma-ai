import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  WorkspaceGet,
  WorkspaceList,
  WorkspacePatch,
  WorkspacePost,
} from '../../core/models/workspace.model';
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

    updateWorkspace: type<{ id: string; workspace: WorkspacePatch }>(),
    updateWorkspaceSuccess: type<WorkspaceGet>(),
    updateWorkspaceFailed: type<string>(),

    // Avatar upload reuses updateWorkspaceSuccess to apply the returned workspace,
    // so every view bound to it (list + details) refreshes with the new image.
    uploadWorkspaceAvatar: type<{ id: string; file: File }>(),
    uploadWorkspaceAvatarFailed: type<string>(),

    // Avatar removal likewise reuses updateWorkspaceSuccess to apply the returned
    // workspace (now without an avatar) across every view bound to it.
    removeWorkspaceAvatar: type<{ id: string }>(),
    removeWorkspaceAvatarFailed: type<string>(),
  },
});
