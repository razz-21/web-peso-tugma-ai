import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { WorkspaceGet } from '../../core/models/workspace.model';
import { WorkspacesStore } from '../../stores/workspaces/workspaces.store';
import { workspacesEvents } from '../../stores/workspaces/workspaces.events';
import { injectDispatch } from '@ngrx/signals/events';
import { WorkspacesTableComponent } from './workspaces-table/workspaces-table.component';
import { WorkspaceFormComponent } from './workspace-form/workspace-form.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-workspaces',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    WorkspacesTableComponent,
  ],
  templateUrl: './workspaces.component.html',
  styleUrl: './workspaces.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacesComponent implements OnInit {
  protected readonly store = inject(WorkspacesStore);
  private readonly dispatch = injectDispatch(workspacesEvents);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizeOptions = [10, 25, 50] as const;

  public ngOnInit(): void {
    this.dispatch.loadWorkspace({ q: '', pageIndex: 0, pageSize: 10 });
  }

  protected onSearch(event: Event): void {
    this.dispatch.searchWorkspace((event.target as HTMLInputElement).value);
  }

  protected onPage(event: PageEvent): void {
    this.dispatch.loadWorkspace({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      q: this.store.filter.q(),
    });
  }

  protected onDelete(workspace: WorkspaceGet): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data: {
          title: 'Delete workspace',
          message: `Are you sure you want to delete <strong>${workspace.name}</strong>? This action cannot be undone.`,
          confirmLabel: 'Delete',
          destructive: true,
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dispatch.deleteWorkspace(workspace.id);
        }
      });
  }

  protected onAddWorkspace(): void {
    this.dialog.open<WorkspaceFormComponent, undefined, WorkspaceGet>(WorkspaceFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
