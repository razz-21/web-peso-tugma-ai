import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { ROLE_LABELS, STATUS_LABELS } from '../../core/models/user.model';
import { MeStore } from '../../stores/me/me.store';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, MatButtonModule, MatIconModule, AvatarComponent],
  template: `
    <section class="profile">
      @if (user(); as u) {
        <!-- Header card -->
        <div class="card profile__header">
          <app-avatar class="profile__avatar" [name]="u.fullname" [seed]="u.email" [size]="96" />

          <div class="profile__identity">
            <h1 class="profile__name">{{ u.fullname }}</h1>

            <div class="profile__badges">
              <span class="badge badge--role">
                <mat-icon aria-hidden="true">verified_user</mat-icon>
                {{ roleLabel() }}
              </span>
              <span
                class="badge"
                [class.badge--active]="isActive()"
                [class.badge--inactive]="!isActive()"
              >
                <span class="badge__dot" aria-hidden="true"></span>
                {{ statusLabel() }}
              </span>
            </div>

            <p class="profile__meta">
              @if (u.workspace) {
                <span>{{ u.workspace.name }}</span>
                <span class="profile__meta-sep" aria-hidden="true">·</span>
              }
              <span>Member since {{ u.created_at | date: 'MMM d, y' }}</span>
            </p>
          </div>

          <button matButton="tonal" type="button" class="profile__edit">
            <mat-icon>edit</mat-icon>
            Edit profile
          </button>
        </div>

        <!-- Personal information -->
        <div class="card">
          <header class="profile__section-head">
            <mat-icon class="profile__section-icon" aria-hidden="true">person</mat-icon>
            <div>
              <h2 class="card__title">Personal information</h2>
              <p class="card__subtitle">
                Your name and contact details. Role and status are managed by an administrator.
              </p>
            </div>
          </header>

          <dl class="profile__details">
            <div class="profile__row">
              <mat-icon aria-hidden="true">person</mat-icon>
              <dt>Full name</dt>
              <dd>{{ u.fullname }}</dd>
            </div>
            <div class="profile__row">
              <mat-icon aria-hidden="true">mail</mat-icon>
              <dt>Email</dt>
              <dd>
                <a class="profile__link" [href]="'mailto:' + u.email">{{ u.email }}</a>
              </dd>
            </div>
            <div class="profile__row">
              <mat-icon aria-hidden="true">shield</mat-icon>
              <dt>Role</dt>
              <dd>{{ roleLabel() }}</dd>
            </div>
            @if (u.workspace) {
              <div class="profile__row">
                <mat-icon aria-hidden="true">inbox</mat-icon>
                <dt>Workspace</dt>
                <dd>{{ u.workspace.name }}</dd>
              </div>
            }
          </dl>
        </div>
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
      max-width: 56rem;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .card {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 1.25rem;
      padding: 1.5rem;
      background: var(--mat-sys-surface-container-lowest);
    }

    // Header card
    .profile__header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;

      @media (max-width: 640px) {
        flex-wrap: wrap;
      }
    }

    .profile__avatar {
      flex-shrink: 0;
    }

    .profile__identity {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      min-width: 0;
      flex: 1 1 auto;
    }

    .profile__name {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      line-height: 1.15;
      color: var(--mat-sys-on-surface);
    }

    .profile__badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .profile__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin: 0.125rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
    }

    .profile__meta-sep {
      color: var(--mat-sys-outline);
    }

    .profile__edit {
      flex-shrink: 0;
    }

    // Section header (icon + title + subtitle)
    .profile__section-head {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .profile__section-icon {
      color: var(--mat-sys-on-surface);
    }

    .card__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .card__subtitle {
      margin: 0.25rem 0 0;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
      line-height: 1.4;
    }

    // Detail rows
    .profile__details {
      display: flex;
      flex-direction: column;
      margin: 0;
    }

    .profile__row {
      display: grid;
      grid-template-columns: 1.5rem 8.5rem 1fr;
      align-items: center;
      gap: 0.75rem 1rem;
      padding: 1rem 0;

      &:not(:last-child) {
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }

      mat-icon {
        color: var(--mat-sys-on-surface-variant);
      }

      dt {
        color: var(--mat-sys-on-surface-variant);
      }

      dd {
        margin: 0;
        font-weight: 700;
        color: var(--mat-sys-on-surface);
      }

      @media (max-width: 560px) {
        grid-template-columns: 1.5rem 1fr;
        gap: 0.25rem 0.75rem;

        dd {
          grid-column: 2;
        }
      }
    }

    .profile__link {
      color: var(--mat-sys-primary);
      font-weight: 700;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    // Badges
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3125rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1.3;

      mat-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }

      &--role {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }

      &--active {
        background: #cdeede;
        color: #1f5c45;
      }

      &--inactive {
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
      }
    }

    .badge__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
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
  protected readonly isActive = computed(() => this.user()?.status === 'active');
}
