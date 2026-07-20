import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { WorkspaceGet } from '../../core/models/workspace.model';

export const workspaceDetailsEvents = eventGroup({
  source: 'Workspace Details',
  events: {
    loadWorkspaceDetails: type<{ id: string }>(),
    loadWorkspaceDetailsSuccess: type<WorkspaceGet>(),
    loadWorkspaceDetailsFailed: type<string>(),
  },
});
