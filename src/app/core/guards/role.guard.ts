import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { MeStore } from '../../stores/me/me.store';
import { APP_ROUTES } from '../constants/routes.constant';

/**
 * Builds a guard that admits only the given roles. Anyone else (e.g. an officer
 * reaching a super-admin/admin-only area) is redirected to the dashboard.
 *
 * The parent `/main` route's `meGuard` resolves the current user before any
 * child guard runs, so `MeStore.user()` is populated here.
 */
export const roleGuard =
  (...allowedRoles: readonly UserRole[]): CanActivateFn =>
  () => {
    const user = inject(MeStore).user();
    const router = inject(Router);

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }
    return router.createUrlTree([APP_ROUTES.dashboard]);
  };
