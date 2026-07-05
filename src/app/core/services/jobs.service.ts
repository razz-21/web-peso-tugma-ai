import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  JobGet,
  JobGetSchema,
  JobList,
  JobListSchema,
  JobPatch,
  JobPost,
  ListJobsParams,
} from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/jobs`;

  async list(params: ListJobsParams = {}): Promise<JobList> {
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
    if (params.company_id) {
      httpParams = httpParams.set('company_id', params.company_id);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    const body = await firstValueFrom(this.http.get<JobList>(this.baseUrl, { params: httpParams }));
    return JobListSchema.parse(body);
  }

  async get(id: string): Promise<JobGet> {
    const body = await firstValueFrom(this.http.get<JobGet>(`${this.baseUrl}/${id}`));
    return JobGetSchema.parse(body);
  }

  async create(payload: JobPost): Promise<JobGet> {
    const body = await firstValueFrom(this.http.post<JobGet>(this.baseUrl, payload));
    return JobGetSchema.parse(body);
  }

  async update(id: string, payload: JobPatch): Promise<JobGet> {
    const body = await firstValueFrom(this.http.patch<JobGet>(`${this.baseUrl}/${id}`, payload));
    return JobGetSchema.parse(body);
  }

  async delete(id: string): Promise<boolean> {
    const body = await firstValueFrom(this.http.delete<boolean>(`${this.baseUrl}/${id}`));
    return body;
  }
}
