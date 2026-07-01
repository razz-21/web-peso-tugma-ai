import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import {
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_LABELS,
  WorkspaceGet,
  WorkspacePost,
  WorkspaceStatus,
} from '../../../core/models/workspace.model';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { workspacesEvents } from '../../../stores/workspaces/workspaces.events';
import { WorkspacesStore } from '../../../stores/workspaces/workspaces.store';

type WorkspaceFormValue = {
  name: string;
  description: string;
  status: WorkspaceStatus;
};

const INITIAL_VALUE: WorkspaceFormValue = {
  name: '',
  description: '',
  status: 'active',
};

@Component({
  selector: 'app-workspace-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormField,
  ],
  templateUrl: './workspace-form.component.html',
  styleUrl: './workspace-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceFormComponent {
  private readonly dispatch = injectDispatch(workspacesEvents);
  private readonly dialogRef =
    inject<MatDialogRef<WorkspaceFormComponent, WorkspaceGet>>(MatDialogRef);
  private readonly events = inject(Events);
  protected readonly workspaceStore = inject(WorkspacesStore);

  protected readonly statusOptions: ReadonlyArray<{ value: WorkspaceStatus; label: string }> =
    WORKSPACE_STATUSES.map((status) => ({ value: status, label: WORKSPACE_STATUS_LABELS[status] }));

  protected readonly serverError = signal<string | null>(null);

  private readonly data = signal<WorkspaceFormValue>(INITIAL_VALUE);

  protected readonly createWorkspaceLoading = computed(() =>
    this.workspaceStore.createWorkspaceLoading(),
  );

  protected readonly workspaceForm = form(this.data, (p) => {
    required(p.name, { message: 'Name is required' });
    maxLength(p.name, 100, { message: 'Name must be 100 characters or fewer' });

    maxLength(p.description, 500, { message: 'Description must be 500 characters or fewer' });

    required(p.status, { message: 'Status is required' });
  });

  protected readonly canSubmit = computed(() => !this.createWorkspaceLoading());

  protected readonly nameError = computed(() => this.fieldError(this.workspaceForm.name()));
  protected readonly descriptionError = computed(() =>
    this.fieldError(this.workspaceForm.description()),
  );
  protected readonly statusError = computed(() => this.fieldError(this.workspaceForm.status()));

  protected submit(event: Event): void {
    event.preventDefault();
    this.workspaceForm().markAsTouched();

    if (!this.workspaceForm().valid()) {
      return;
    }

    this.serverError.set(null);

    const value = this.workspaceForm().value();
    const description = value.description.trim();
    const payload: WorkspacePost = {
      name: value.name.trim(),
      description: description || null,
      avatar: null,
      status: value.status,
    };
    this.dispatch.createWorkspace(payload);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private fieldError(field: {
    touched: () => boolean;
    valid: () => boolean;
    errors: () => ReadonlyArray<{ message?: string }>;
  }): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }

  #onCreateWorkspaceSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close())))(
    this.events.on(workspacesEvents.createWorkspaceSuccess),
  );
}
