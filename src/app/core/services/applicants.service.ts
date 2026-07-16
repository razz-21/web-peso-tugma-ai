import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicantGet,
  ApplicantGetSchema,
  ApplicantList,
  ApplicantListSchema,
  ApplicantPatch,
  ApplicantPost,
  ListApplicantsParams,
} from '../models/applicant.model';

@Injectable({ providedIn: 'root' })
export class ApplicantsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/applicants`;

  async list(params: ListApplicantsParams = {}): Promise<ApplicantList> {
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
      this.http.get<ApplicantList>(this.baseUrl, { params: httpParams }),
    );
    return ApplicantListSchema.parse(body);
  }

  async get(id: string): Promise<ApplicantGet> {
    const body = await firstValueFrom(this.http.get<ApplicantGet>(`${this.baseUrl}/${id}`));
    return ApplicantGetSchema.parse(body);
  }

  async create(payload: ApplicantPost): Promise<ApplicantGet> {
    const body = await firstValueFrom(this.http.post<ApplicantGet>(this.baseUrl, payload));
    return ApplicantGetSchema.parse(body);
  }

  async update(id: string, patch: ApplicantPatch): Promise<ApplicantGet> {
    const body = await firstValueFrom(
      this.http.patch<ApplicantGet>(`${this.baseUrl}/${id}`, patch),
    );
    return ApplicantGetSchema.parse(body);
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
