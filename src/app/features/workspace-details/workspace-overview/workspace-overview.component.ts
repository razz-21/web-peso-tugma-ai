import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WORKSPACE_STATUS_LABELS, WorkspaceGet } from '../../../core/models/workspace.model';

/** Read-only "Workspace details" card shown on the Overview tab. */
@Component({
  selector: 'app-workspace-overview',
  imports: [DatePipe],
  templateUrl: './workspace-overview.component.html',
  styleUrl: './workspace-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceOverviewComponent {
  readonly workspace = input.required<WorkspaceGet>();

  protected readonly statusLabel = computed(() => WORKSPACE_STATUS_LABELS[this.workspace().status]);
}
