import { ChangeDetectionStrategy, Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ROLE_LABELS, USER_ROLES, User, UserGet, UserRole } from '../../core/models/user.model';
import { UsersStore } from '../../stores/users/users.store';
import { usersEvents } from '../../stores/users/users.events';
import { injectDispatch } from '@ngrx/signals/events';
import { UsersTableComponent } from './users-table/users-table.component';
import { UserFormComponent } from './user-form/user-form.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    UsersTableComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  protected readonly store = inject(UsersStore);
  private readonly dispatch = injectDispatch(usersEvents);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSizeOptions = [10, 25, 50] as const;
  protected readonly roleOptions: ReadonlyArray<{ value: 'all' | UserRole; label: string }> = [
    { value: 'all', label: 'All' },
    ...USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
  ];

  public ngOnInit(): void {
    this.dispatch.loadUser({ q: '', role: 'all', pageIndex: 0, pageSize: 10 });
  }

  protected onSearch(event: Event): void {
    this.dispatch.searchUser((event.target as HTMLInputElement).value);
  }

  protected onRoleFilter(value: 'all' | UserRole): void {
    this.dispatch.loadUser({ role: value, pageIndex: 0, pageSize: 10, q: '' });
  }

  protected onPage(event: PageEvent): void {
    this.dispatch.loadUser({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      q: '',
      role: 'all',
    });
  }

  protected onRefresh(): void {
    this.dispatch.loadUser({ q: '', role: 'all', pageIndex: 0, pageSize: 10 });
  }

  protected onView(user: User): void {
    // Placeholder for a future user detail view/route (e.g. /main/user-management/:id).
    void user;
  }

  protected onDelete(user: User): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data: {
          title: 'Delete user',
          message: `Are you sure you want to delete <strong>${user.fullname}</strong>? This action cannot be undone.`,
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
          this.dispatch.deleteUser(user.id);
        }
      });
  }

  protected onAddUser(): void {
    this.dialog.open<UserFormComponent, undefined, UserGet>(UserFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}
