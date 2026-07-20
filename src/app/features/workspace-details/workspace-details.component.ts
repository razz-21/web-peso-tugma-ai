import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { injectDispatch } from '@ngrx/signals/events';
import { WorkspaceGet } from '../../core/models/workspace.model';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { WorkspaceDetailsStore } from '../../stores/workspace-details/workspace-details.store';
import { workspaceDetailsEvents } from '../../stores/workspace-details/workspace-details.events';
import { workspacesEvents } from '../../stores/workspaces/workspaces.events';
import { WorkspaceFormComponent } from '../workspaces/workspace-form/workspace-form.component';
import { WorkspaceOverviewComponent } from './workspace-overview/workspace-overview.component';
import { MatchScoringComponent } from './match-scoring/match-scoring.component';

@Component({
  selector: 'app-workspace-details',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    AvatarComponent,
    WorkspaceOverviewComponent,
    MatchScoringComponent,
  ],
  templateUrl: './workspace-details.component.html',
  styleUrl: './workspace-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [WorkspaceDetailsStore],
})
export class WorkspaceDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly store = inject(WorkspaceDetailsStore);
  private readonly dispatch = injectDispatch(workspaceDetailsEvents);
  private readonly workspacesDispatch = injectDispatch(workspacesEvents);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadWorkspaceDetails({ id });
    }
  }

  protected onEdit(workspace: WorkspaceGet): void {
    // The store applies the update directly via workspacesEvents.updateWorkspaceSuccess,
    // so there's nothing to do on close.
    this.dialog.open<WorkspaceFormComponent, WorkspaceGet, WorkspaceGet>(WorkspaceFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: workspace,
    });
  }

  protected onDelete(workspace: WorkspaceGet): void {
    const data: ConfirmDialogData = {
      title: 'Delete workspace',
      message: `Are you sure you want to delete <strong>${workspace.name}</strong>? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.workspacesDispatch.deleteWorkspace(workspace.id);
          this.router.navigate([APP_ROUTES.workspaces]);
        }
      });
  }
}
