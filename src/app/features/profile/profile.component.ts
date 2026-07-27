import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { ROLE_LABELS, STATUS_LABELS } from '../../core/models/user.model';
import { MeStore } from '../../stores/me/me.store';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { EditProfileDialogComponent } from './edit-profile-dialog/edit-profile-dialog.component';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, MatButtonModule, MatIconModule, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly store = inject(MeStore);
  private readonly dialog = inject(MatDialog);

  protected readonly user = this.store.user;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  protected readonly statusLabel = computed(() => {
    const status = this.user()?.status;
    return status ? STATUS_LABELS[status] : '';
  });
  protected readonly isActive = computed(() => this.user()?.status === 'active');

  protected editProfile(): void {
    this.dialog.open(EditProfileDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      restoreFocus: true,
    });
  }

  protected changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      restoreFocus: true,
    });
  }
}
