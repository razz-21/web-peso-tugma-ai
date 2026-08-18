import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MePatch, UserGet, UserGetSchema } from '../models/user.model';

/** Access to the authenticated user's own profile via `GET`/`PATCH /me`. */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/me`;

  async get(): Promise<UserGet> {
    const body = await firstValueFrom(this.http.get<unknown>(this.baseUrl));
    return UserGetSchema.parse(body);
  }

  async patch(payload: MePatch): Promise<UserGet> {
    const body = await firstValueFrom(this.http.patch<unknown>(this.baseUrl, payload));
    return UserGetSchema.parse(body);
  }

  /** Upload a new avatar image for the current user and return the updated profile. */
  async uploadAvatar(file: File): Promise<UserGet> {
    const formData = new FormData();
    formData.append('file', file);
    const body = await firstValueFrom(this.http.post<unknown>(`${this.baseUrl}/avatar`, formData));
    return UserGetSchema.parse(body);
  }

  /** Remove the current user's avatar and return the updated profile. */
  async removeAvatar(): Promise<UserGet> {
    const body = await firstValueFrom(this.http.delete<unknown>(`${this.baseUrl}/avatar`));
    return UserGetSchema.parse(body);
  }
}
