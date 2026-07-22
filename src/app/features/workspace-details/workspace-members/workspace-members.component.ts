import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { ROLE_LABELS, STATUS_LABELS, UserGet } from '../../../core/models/user.model';
import { UsersService } from '../../../core/services/users.service';
import { UsersStore } from '../../../stores/users/users.store';
import { usersEvents } from '../../../stores/users/users.events';
import { WorkspaceGet } from '../../../core/models/workspace.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../core/components/confirm-dialog/confirm-dialog.component';
import {
  InviteMembersDialogComponent,
  InviteMembersDialogData,
} from './invite-members-dialog/invite-members-dialog.component';

/** Upper bound on members fetched for the table. */
const MEMBERS_LIMIT = 100;

/**
 * Members tab for a workspace. Loads the users assigned to this workspace on
 * activation and renders them in a table.
 */
@Component({
  selector: 'app-workspace-members',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './workspace-members.component.html',
  styleUrl: './workspace-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMembersComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly usersService = inject(UsersService);
  private readonly usersStore = inject(UsersStore);
  private readonly dispatch = injectDispatch(usersEvents);
  private readonly events = inject(Events);
  private readonly destroyRef = inject(DestroyRef);

  readonly workspace = input.required<WorkspaceGet>();

  protected readonly members = signal<UserGet[]>([]);
  protected readonly loading = signal(true);
  protected readonly removing = computed(() => this.usersStore.removeMemberLoading());

  protected readonly displayedColumns = ['name', 'role', 'status', 'joined', 'actions'] as const;

  protected roleLabel(member: UserGet): string {
    return ROLE_LABELS[member.role];
  }

  protected statusLabel(member: UserGet): string {
    return STATUS_LABELS[member.status];
  }

  ngOnInit(): void {
    void this.loadMembers();
  }

  protected openInvite(): void {
    this.dialog
      .open<InviteMembersDialogComponent, InviteMembersDialogData, UserGet[]>(
        InviteMembersDialogComponent,
        {
          width: '560px',
          maxWidth: '95vw',
          autoFocus: 'first-tabbable',
          restoreFocus: true,
          data: { workspace: this.workspace() },
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((invited) => {
        // Refresh the table when someone was actually invited.
        if (invited?.length) {
          void this.loadMembers();
        }
      });
  }

  protected onRemove(member: UserGet): void {
    if (this.removing()) {
      return;
    }

    const data: ConfirmDialogData = {
      title: 'Remove member',
      message: `Remove <strong>${member.fullname}</strong> from <strong>${this.workspace().name}</strong>? They will lose access to this workspace.`,
      confirmLabel: 'Remove',
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
          this.dispatch.removeMember(member.id);
        }
      });
  }

  private async loadMembers(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.usersService.list({
        workspace_id: this.workspace().id,
        limit: MEMBERS_LIMIT,
      });
      this.members.set(list.items);
    } catch {
      this.members.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  // Drop a member from the table once its removal is confirmed by the store.
  #onRemoveSuccess = rxMethod<{ payload: string }>(
    pipe(
      tap(({ payload: id }) =>
        this.members.update((list) => list.filter((member) => member.id !== id)),
      ),
    ),
  )(this.events.on(usersEvents.removeMemberSuccess));
}
