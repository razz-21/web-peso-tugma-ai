import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginCredentials } from '../models/auth.model';
import { UserGet, UserGetSchema } from '../models/user.model';

/**
 * Session state for the cookie-based auth flow. Tokens live only in httpOnly
 * cookies (unreadable by JS), so auth state is tracked via the current user,
 * which is hydrated from `GET /me` on startup and set on login.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1`;

  private readonly user = signal<UserGet | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  /**
   * Authenticate against `POST /auth/login`. The backend expects the OAuth2
   * password form (`username`/`password`) and sets the tokens as httpOnly
   * cookies; the response body is the authenticated user.
   */
  async login(credentials: LoginCredentials): Promise<void> {
    const body = new HttpParams()
      .set('username', credentials.email)
      .set('password', credentials.password)
      .set('remember_me', String(credentials.rememberMe ?? false));

    const raw = await firstValueFrom(
      this.http.post<UserGet>(`${this.baseUrl}/auth/login`, body, { withCredentials: true }),
    );
    this.user.set(UserGetSchema.parse(raw));
  }

  /** Restore the session on app start by probing the token cookie via `/me`. */
  async restoreSession(): Promise<void> {
    try {
      const raw = await firstValueFrom(
        this.http.get<UserGet>(`${this.baseUrl}/me`, { withCredentials: true }),
      );
      this.user.set(UserGetSchema.parse(raw));
    } catch {
      this.user.set(null);
    }
  }

  /** Exchange the refresh cookie for a fresh token pair. Used by the interceptor. */
  refresh(): Observable<UserGet> {
    return this.http
      .post<UserGet>(`${this.baseUrl}/auth/refresh`, null, { withCredentials: true })
      .pipe(
        map((raw) => UserGetSchema.parse(raw)),
        tap((user) => this.user.set(user)),
      );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/auth/logout`, null, { withCredentials: true }),
      );
    } finally {
      this.user.set(null);
    }
  }
}
