import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import { UserGet } from '../../../../core/models/user.model';
import { UsersService } from '../../../../core/services/users.service';
import { UsersStore } from '../../../../stores/users/users.store';
import { usersEvents } from '../../../../stores/users/users.events';
import { WorkspaceGet } from '../../../../core/models/workspace.model';
import { AvatarComponent } from '../../../../core/components/avatar/avatar.component';

/** Dialog input for the invite-members flow. */
export interface InviteMembersDialogData {
  readonly workspace: WorkspaceGet;
}

/** Most users to request/show at a time in the autocomplete dropdown. */
const RESULT_LIMIT = 6;

/** How long to wait after the last keystroke before querying. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-invite-members-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './invite-members-dialog.component.html',
  styleUrl: './invite-members-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteMembersDialogComponent {
  private readonly usersService = inject(UsersService);
  private readonly dispatch = injectDispatch(usersEvents);
  private readonly events = inject(Events);
  private readonly usersStore = inject(UsersStore);
  private readonly dialogRef =
    inject<MatDialogRef<InviteMembersDialogComponent, UserGet[]>>(MatDialogRef);
  protected readonly data = inject<InviteMembersDialogData>(MAT_DIALOG_DATA);

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  /** Current search query; drives the debounced fetch effect below. */
  private readonly searchTerm = signal('');

  private readonly results = signal<UserGet[]>([]);
  protected readonly selected = signal<UserGet[]>([]);
  protected readonly loading = signal(true);

  protected readonly inviting = computed(() => this.usersStore.inviteUsersLoading());

  protected readonly options = computed(() => {
    const chosen = new Set(this.selected().map((user) => user.id));
    return this.results().filter((user) => !chosen.has(user.id));
  });

  #searchEffect = effect((onCleanup) => {
    const query = this.searchTerm();
    let stale = false;

    const handle = setTimeout(() => {
      this.loading.set(true);
      void this.fetchUsers(query).then((users) => {
        if (!stale) {
          this.results.set(users);
          this.loading.set(false);
        }
      });
    }, SEARCH_DEBOUNCE_MS);

    onCleanup(() => {
      stale = true;
      clearTimeout(handle);
    });
  });

  protected onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value.trim());
  }

  protected onSelected(event: MatAutocompleteSelectedEvent): void {
    const user = event.option.value as UserGet;
    if (!this.selected().some((item) => item.id === user.id)) {
      this.selected.update((current) => [...current, user]);
    }
    this.searchInput().nativeElement.value = '';
    // Refresh the default list for the next pick.
    this.searchTerm.set('');
  }

  protected remove(user: UserGet): void {
    this.selected.update((current) => current.filter((item) => item.id !== user.id));
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected invite(): void {
    if (this.selected().length === 0 || this.inviting()) {
      return;
    }

    this.dispatch.inviteUsers({
      userIds: this.selected().map((user) => user.id),
      workspaceId: this.data.workspace.id,
    });
  }

  #onInviteSuccess = rxMethod<{ payload: UserGet[] }>(
    pipe(tap(({ payload }) => this.dialogRef.close(payload))),
  )(this.events.on(usersEvents.inviteUsersSuccess));

  private async fetchUsers(query: string): Promise<UserGet[]> {
    try {
      const list = await this.usersService.list({
        limit: RESULT_LIMIT,
        q: query || undefined,
      });
      return list.items;
    } catch {
      return [];
    }
  }
}
