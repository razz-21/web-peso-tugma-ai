import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User, UserGet, UserRole } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { UsersStore } from '../../../stores/users/users.store';

interface UserRow {
  user: UserGet;
  roleLabel: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  officer: 'Officer',
};

@Component({
  selector: 'app-users-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  private readonly usersStore = inject(UsersStore);

  readonly view = output<User>();
  readonly delete = output<User>();

  protected readonly users = computed(() => this.usersStore.users());
  protected readonly loading = computed(() => this.usersStore.loading());

  protected readonly displayedColumns = [
    'name',
    'email',
    'role',
    'created_at',
    'updated_at',
    'actions',
  ] as const;

  protected readonly rows = computed<UserRow[]>(() =>
    this.users().map((user) => ({
      user,
      roleLabel: ROLE_LABELS[user.role],
    })),
  );

  /** Rows shown in the table — hidden while loading so stale data isn't visible. */
  protected readonly visibleRows = computed<UserRow[]>(() => (this.loading() ? [] : this.rows()));
}
