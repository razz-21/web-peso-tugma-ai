import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { injectDispatch } from '@ngrx/signals/events';
import { MeStore } from '../../stores/me/me.store';
import { meEvents } from '../../stores/me/me.events';
import { APP_ROUTES } from '../../core/constants/routes.constant';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <main class="not-found">
      <p class="not-found__code" aria-hidden="true">404</p>
      <h1 class="not-found__title">Page not found</h1>
      <p class="not-found__message">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      @if (loading()) {
        <mat-progress-spinner
          mode="indeterminate"
          diameter="36"
          aria-label="Checking your session"
        />
      } @else {
        <a mat-flat-button color="primary" [routerLink]="homeLink()">
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          {{ homeLabel() }}
        </a>
      }
    </main>
  `,
  styles: `
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      min-height: 100dvh;
      padding: 2rem;
      text-align: center;
      background: var(--mat-sys-surface);
    }

    .not-found__code {
      margin: 0;
      font-size: clamp(4rem, 12vw, 7rem);
      font-weight: 800;
      line-height: 1;
      color: var(--mat-sys-primary);
    }

    .not-found__title {
      margin: 0;
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }

    .not-found__message {
      margin: 0 0 0.75rem;
      max-width: 32rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent implements OnInit {
  private readonly store = inject(MeStore);
  private readonly dispatch = injectDispatch(meEvents);

  protected readonly loading = this.store.loading;
  private readonly isAuthenticated = computed(() => this.store.user() !== null);
  protected readonly homeLink = computed(() =>
    this.isAuthenticated() ? APP_ROUTES.dashboard : APP_ROUTES.login,
  );
  protected readonly homeLabel = computed(() =>
    this.isAuthenticated() ? 'Back to Dashboard' : 'Back to Login',
  );

  ngOnInit(): void {
    // Probe the session so a direct hit to an unknown URL still resolves auth.
    // this.dispatch.loadMe();
  }
}
