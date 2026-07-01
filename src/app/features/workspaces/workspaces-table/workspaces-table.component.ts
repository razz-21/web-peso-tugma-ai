import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WORKSPACE_STATUS_LABELS, WorkspaceGet } from '../../../core/models/workspace.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { WorkspacesStore } from '../../../stores/workspaces/workspaces.store';

interface WorkspaceRow {
  workspace: WorkspaceGet;
  statusLabel: string;
}

@Component({
  selector: 'app-workspaces-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './workspaces-table.component.html',
  styleUrl: './workspaces-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacesTableComponent {
  private readonly workspacesStore = inject(WorkspacesStore);

  readonly delete = output<WorkspaceGet>();

  protected readonly workspaces = computed(() => this.workspacesStore.workspaces());
  protected readonly loading = computed(() => this.workspacesStore.loading());

  protected readonly displayedColumns = [
    'name',
    'description',
    'status',
    'created_at',
    'updated_at',
    'actions',
  ] as const;

  protected readonly rows = computed<WorkspaceRow[]>(() =>
    this.workspaces().map((workspace) => ({
      workspace,
      statusLabel: WORKSPACE_STATUS_LABELS[workspace.status],
    })),
  );
}
