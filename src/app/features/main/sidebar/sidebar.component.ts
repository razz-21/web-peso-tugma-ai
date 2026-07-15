import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { injectDispatch } from '@ngrx/signals/events';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_LABELS } from '../../../core/models/user.model';
import { APP_ROUTES } from '../../../core/constants/routes.constant';
import { MeStore } from '../../../stores/me/me.store';
import { meEvents } from '../../../stores/me/me.events';

type NavItem = {
  label: string;
  icon: string;
  link: string;
};

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

@Component({
  selector: 'app-sidebar',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly store = inject(MeStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dispatch = injectDispatch(meEvents);

  protected readonly routes = APP_ROUTES;
  protected readonly navItems: readonly NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: APP_ROUTES.dashboard },
    { label: 'Companies', icon: 'apartment', link: APP_ROUTES.companies },
    { label: 'Job Listings', icon: 'work', link: APP_ROUTES.jobListings },
    { label: 'Applicants', icon: 'group', link: APP_ROUTES.applicants },
    { label: 'User Management', icon: 'groups', link: APP_ROUTES.userManagement },
    { label: 'Workspaces', icon: 'computer_arrow_up', link: APP_ROUTES.workspaces },
  ];

  protected readonly user = this.store.user;
  protected readonly initials = computed(() => initialsOf(this.user()?.fullname ?? ''));
  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  protected async logout(): Promise<void> {
    await this.auth.logout();
    this.dispatch.resetMe();
    await this.router.navigateByUrl(APP_ROUTES.login);
  }
}
