import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/routes.constant';

/**
 * Keeps the public `/auth` area (login, forgot password) out of reach for an
 * already-authenticated user. Reads `AuthService`, which is hydrated from the
 * httpOnly session cookie on startup (`restoreSession`) and kept current through
 * login/refresh/logout — so the check is correct even on a hard load of `/login`.
 * Redirect to the dashboard when a session exists, otherwise allow access.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree([APP_ROUTES.dashboard]) : true;
};
