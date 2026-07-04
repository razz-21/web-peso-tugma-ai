import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { ROLE_LABELS, STATUS_LABELS } from '../../core/models/user.model';
import { MeStore } from '../../stores/me/me.store';

@Component({
  selector: 'app-profile',
  imports: [MatCardModule, AvatarComponent],
  template: `
    <section class="profile">
      <h1 class="profile__title">My Profile</h1>

      @if (user(); as u) {
        <mat-card class="profile__card" appearance="outlined">
          <mat-card-content class="profile__content">
            <div class="profile__identity">
              <app-avatar [name]="u.fullname" />
              <div class="profile__heading">
                <p class="profile__name">{{ u.fullname }}</p>
                <p class="profile__role">{{ roleLabel() }}</p>
              </div>
            </div>

            <dl class="profile__details">
              <div class="profile__row">
                <dt>Email</dt>
                <dd>{{ u.email }}</dd>
              </div>
              <div class="profile__row">
                <dt>Role</dt>
                <dd>{{ roleLabel() }}</dd>
              </div>
              <div class="profile__row">
                <dt>Status</dt>
                <dd>{{ statusLabel() }}</dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>
      } @else {
        <p class="profile__empty">No profile information is available.</p>
      }
    </section>
  `,
  styles: `
    .profile {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 40rem;
    }

    .profile__title {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .profile__content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile__identity {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile__heading {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }

    .profile__name {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .profile__role {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .profile__details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin: 0;
    }

    .profile__row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;

      dt {
        color: var(--mat-sys-on-surface-variant);
      }

      dd {
        margin: 0;
        font-weight: 600;
        color: var(--mat-sys-on-surface);
      }
    }

    .profile__empty {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly store = inject(MeStore);

  protected readonly user = this.store.user;
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  protected readonly statusLabel = computed(() => {
    const status = this.user()?.status;
    return status ? STATUS_LABELS[status] : '';
  });
}
