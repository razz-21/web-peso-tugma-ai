import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ListUsersParams,
  UserList,
  UserPatch,
  UserListSchema,
  UserPost,
  UserGet,
  UserGetSchema,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/users`;

  async list(params: ListUsersParams = {}): Promise<UserList> {
    let httpParams = new HttpParams();
    if (params.limit != null) {
      httpParams = httpParams.set('limit', params.limit);
    }
    if (params.offset != null) {
      httpParams = httpParams.set('offset', params.offset);
    }
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }

    const body = await firstValueFrom(this.http.get<UserGet>(this.baseUrl, { params: httpParams }));
    return UserListSchema.parse(body);
  }

  async get(id: string): Promise<UserGet> {
    const body = await firstValueFrom(this.http.get<UserGet>(`${this.baseUrl}/${id}`));
    return UserGetSchema.parse(body);
  }

  async create(payload: UserPost): Promise<UserGet> {
    const body = await firstValueFrom(this.http.post<UserGet>(this.baseUrl, payload));
    return UserGetSchema.parse(body);
  }

  async update(id: string, payload: UserPatch): Promise<UserGet> {
    const body = await firstValueFrom(this.http.patch<unknown>(`${this.baseUrl}/${id}`, payload));
    return UserGetSchema.parse(body);
  }

  async delete(id: string): Promise<boolean> {
    const body = await firstValueFrom(this.http.delete<boolean>(`${this.baseUrl}/${id}`));
    return body;
  }
}
