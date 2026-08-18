import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { injectDispatch } from '@ngrx/signals/events';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
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

@Component({
  selector: 'app-sidebar',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    AvatarComponent,
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
  protected readonly user = this.store.user;
  protected readonly workspace = computed(() => this.user()?.workspace ?? null);

  // Super admins browse the full workspace list; admins/officers are scoped to
  // their own workspace, so their link points straight to its details page.
  protected readonly navItems = computed<readonly NavItem[]>(() => {
    const user = this.user();
    const workspaceId = user?.workspace?.id;
    const workspacesLink =
      user?.role !== 'super_admin' && workspaceId
        ? `${APP_ROUTES.workspaces}/${workspaceId}`
        : APP_ROUTES.workspaces;

    // Officers cannot access User Management; hide the entry for them.
    const canManageUsers = user?.role === 'super_admin' || user?.role === 'admin';

    return [
      { label: 'Dashboard', icon: 'dashboard', link: APP_ROUTES.dashboard },
      { label: 'Companies', icon: 'apartment', link: APP_ROUTES.companies },
      { label: 'Job Listings', icon: 'work', link: APP_ROUTES.jobListings },
      { label: 'Applicants', icon: 'group', link: APP_ROUTES.applicants },
      ...(canManageUsers
        ? [{ label: 'User Management', icon: 'groups', link: APP_ROUTES.userManagement }]
        : []),
      { label: 'Reports', icon: 'bar_chart', link: APP_ROUTES.reports },
      { label: 'Audit Logs', icon: 'history', link: APP_ROUTES.auditLogs },
      { label: 'Workspaces', icon: 'computer_arrow_up', link: workspacesLink },
    ];
  });
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
