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
}
