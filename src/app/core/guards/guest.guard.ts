import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MeStore } from '../../stores/me/me.store';
import { APP_ROUTES } from '../constants/routes.constant';

/**
 * Keeps the public `/auth` area (login, forgot password) out of reach for an
 * already-authenticated user. Reads the current user from the root `MeStore`
 * without fetching: redirect to the dashboard when a session is already loaded,
 * otherwise allow access.
 */
export const guestGuard: CanActivateFn = () => {
  const store = inject(MeStore);
  const router = inject(Router);

  return store.user() ? router.createUrlTree([APP_ROUTES.dashboard]) : true;
};
