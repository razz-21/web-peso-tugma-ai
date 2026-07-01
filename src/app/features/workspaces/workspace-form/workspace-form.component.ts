import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormField, form, maxLength, pattern, readonly, required } from '@angular/forms/signals';
import {
  WORKSPACE_KEY_PATTERN,
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_LABELS,
  WorkspaceGet,
  WorkspacePatch,
  WorkspacePost,
  WorkspaceStatus,
  toWorkspaceKey,
} from '../../../core/models/workspace.model';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { workspacesEvents } from '../../../stores/workspaces/workspaces.events';
import { WorkspacesStore } from '../../../stores/workspaces/workspaces.store';

type WorkspaceFormValue = {
  name: string;
  key: string;
  description: string;
  status: WorkspaceStatus;
};

const INITIAL_VALUE: WorkspaceFormValue = {
  name: '',
  key: '',
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
  private readonly workspace = inject<WorkspaceGet | null>(MAT_DIALOG_DATA);
  protected readonly workspaceStore = inject(WorkspacesStore);

  protected readonly isEdit = this.workspace !== null;

  protected readonly statusOptions: ReadonlyArray<{ value: WorkspaceStatus; label: string }> =
    WORKSPACE_STATUSES.map((status) => ({ value: status, label: WORKSPACE_STATUS_LABELS[status] }));

  protected readonly serverError = signal<string | null>(null);

  private readonly data = signal<WorkspaceFormValue>(
    this.workspace
      ? {
          name: this.workspace.name,
          key: this.workspace.key,
          description: this.workspace.description ?? '',
          status: this.workspace.status,
        }
      : INITIAL_VALUE,
  );

  protected readonly saving = computed(() =>
    this.isEdit
      ? this.workspaceStore.updateWorkspaceLoading()
      : this.workspaceStore.createWorkspaceLoading(),
  );

  protected readonly workspaceForm = form(this.data, (p) => {
    required(p.name, { message: 'Name is required' });
    maxLength(p.name, 100, { message: 'Name must be 100 characters or fewer' });

    readonly(p.key);
    required(p.key, { message: 'Key is required' });
    maxLength(p.key, 100, { message: 'Key must be 100 characters or fewer' });
    pattern(p.key, WORKSPACE_KEY_PATTERN, {
      message: 'Key must be lowercase letters, numbers, and underscores',
    });

    maxLength(p.description, 500, { message: 'Description must be 500 characters or fewer' });

    required(p.status, { message: 'Status is required' });
  });

  protected readonly canSubmit = computed(() => !this.saving());

  protected readonly nameError = computed(() => this.fieldError(this.workspaceForm.name()));
  protected readonly keyError = computed(() => this.fieldError(this.workspaceForm.key()));
  protected readonly descriptionError = computed(() =>
    this.fieldError(this.workspaceForm.description()),
  );
  protected readonly statusError = computed(() => this.fieldError(this.workspaceForm.status()));

  /** Keep the key in sync with the name, formatted as a slug. */
  #autofillKey = effect(() => {
    const { name, key } = this.data();
    const derived = toWorkspaceKey(name);
    if (key !== derived) {
      this.data.update((current) => ({ ...current, key: derived }));
    }
  });

  protected submit(event: Event): void {
    event.preventDefault();
    this.workspaceForm().markAsTouched();

    if (!this.workspaceForm().valid()) {
      return;
    }

    this.serverError.set(null);

    const value = this.workspaceForm().value();
    const description = value.description.trim();

    if (this.workspace) {
      const workspace: WorkspacePatch = {
        name: value.name.trim(),
        key: value.key,
        description: description || null,
        status: value.status,
      };
      this.dispatch.updateWorkspace({ id: this.workspace.id, workspace });
      return;
    }

    const payload: WorkspacePost = {
      name: value.name.trim(),
      key: value.key,
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

  #onSaveSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close())))(
    this.events.on(
      workspacesEvents.createWorkspaceSuccess,
      workspacesEvents.updateWorkspaceSuccess,
    ),
  );
}
