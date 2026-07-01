import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

// Endpoints that obtain/clear the session — never retry these on a 401, or a
// failed refresh would loop.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Single-flight refresh: concurrent 401s share one in-flight refresh call.
let refresh$: Observable<unknown> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Only touch our own API; leave third-party requests untouched.
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  // Send the httpOnly auth cookies with every API request.
  const withCreds = req.clone({ withCredentials: true });

  if (AUTH_ENDPOINTS.some((path) => req.url.includes(path))) {
    return next(withCreds);
  }

  return next(withCreds).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      refresh$ ??= auth.refresh().pipe(
        tap({
          error: () => (refresh$ = null),
          complete: () => (refresh$ = null),
        }),
        shareReplay(1),
      );

      return refresh$.pipe(
        switchMap(() => next(req.clone({ withCredentials: true }))),
        catchError((refreshError: unknown) => {
          void auth.logout();
          void router.navigateByUrl('/auth/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
