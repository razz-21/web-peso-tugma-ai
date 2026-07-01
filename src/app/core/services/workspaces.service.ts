import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ListWorkspacesParams,
  WorkspaceGet,
  WorkspaceGetSchema,
  WorkspaceList,
  WorkspaceListSchema,
  WorkspacePatch,
  WorkspacePost,
} from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/workspace`;

  async list(params: ListWorkspacesParams = {}): Promise<WorkspaceList> {
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

    const body = await firstValueFrom(
      this.http.get<WorkspaceList>(this.baseUrl, { params: httpParams }),
    );
    return WorkspaceListSchema.parse(body);
  }

  async get(id: string): Promise<WorkspaceGet> {
    const body = await firstValueFrom(this.http.get<WorkspaceGet>(`${this.baseUrl}/${id}`));
    return WorkspaceGetSchema.parse(body);
  }

  async create(payload: WorkspacePost): Promise<WorkspaceGet> {
    const body = await firstValueFrom(this.http.post<WorkspaceGet>(this.baseUrl, payload));
    return WorkspaceGetSchema.parse(body);
  }

  async update(id: string, payload: WorkspacePatch): Promise<WorkspaceGet> {
    const body = await firstValueFrom(
      this.http.patch<WorkspaceGet>(`${this.baseUrl}/${id}`, payload),
    );
    return WorkspaceGetSchema.parse(body);
  }

  async delete(id: string): Promise<boolean> {
    const body = await firstValueFrom(this.http.delete<boolean>(`${this.baseUrl}/${id}`));
    return body;
  }
}
