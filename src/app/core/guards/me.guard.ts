import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { map, take } from 'rxjs';
import { MeStore } from '../../stores/me/me.store';
import { meEvents } from '../../stores/me/me.events';
import { APP_ROUTES } from '../constants/routes.constant';

/**
 * Gates the `/main` area on an authenticated session. Fetches `GET /me` through
 * the root `MeStore` on each activation and resolves the navigation once the
 * result lands: allow on success, redirect to the login page on failure (no
 * valid session cookie).
 */
export const meGuard: CanActivateFn = () => {
  // Touch the root store so its event handlers are subscribed before dispatch.
  inject(MeStore);
  const router = inject(Router);
  const events = inject(Events);
  const dispatch = injectDispatch(meEvents);

  dispatch.loadMe();

  return events.on(meEvents.loadMeSuccess, meEvents.loadMeFailed).pipe(
    take(1),
    map((event) =>
      event.type === meEvents.loadMeSuccess.type ? true : router.createUrlTree([APP_ROUTES.login]),
    ),
  );
};
