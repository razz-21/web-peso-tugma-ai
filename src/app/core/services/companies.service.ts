import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompanyGet,
  CompanyGetSchema,
  CompanyList,
  CompanyListSchema,
  CompanyPatch,
  CompanyPost,
  ListCompaniesParams,
} from '../models/company.model';
import {
  CompanyApplicantList,
  CompanyApplicantListSchema,
  ListCompanyApplicantsParams,
} from '../models/company-applicant.model';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/companies`;

  async list(params: ListCompaniesParams = {}): Promise<CompanyList> {
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
      this.http.get<CompanyList>(this.baseUrl, { params: httpParams }),
    );
    return CompanyListSchema.parse(body);
  }

  async get(id: string): Promise<CompanyGet> {
    const body = await firstValueFrom(this.http.get<CompanyGet>(`${this.baseUrl}/${id}`));
    return CompanyGetSchema.parse(body);
  }

  async create(payload: CompanyPost): Promise<CompanyGet> {
    const body = await firstValueFrom(this.http.post<CompanyGet>(this.baseUrl, payload));
    return CompanyGetSchema.parse(body);
  }

  async update(id: string, payload: CompanyPatch): Promise<CompanyGet> {
    const body = await firstValueFrom(
      this.http.patch<CompanyGet>(`${this.baseUrl}/${id}`, payload),
    );
    return CompanyGetSchema.parse(body);
  }

  async delete(id: string): Promise<boolean> {
    const body = await firstValueFrom(this.http.delete<boolean>(`${this.baseUrl}/${id}`));
    return body;
  }

  /** Upload a new avatar image for the company and return the updated record. */
  async uploadAvatar(id: string, file: File): Promise<CompanyGet> {
    const formData = new FormData();
    formData.append('file', file);
    const body = await firstValueFrom(
      this.http.post<CompanyGet>(`${this.baseUrl}/${id}/avatar`, formData),
    );
    return CompanyGetSchema.parse(body);
  }

  /** Remove the company's avatar and return the updated record. */
  async removeAvatar(id: string): Promise<CompanyGet> {
    const body = await firstValueFrom(this.http.delete<CompanyGet>(`${this.baseUrl}/${id}/avatar`));
    return CompanyGetSchema.parse(body);
  }

  /** List the applicants referred to this company's jobs. */
  async listApplicants(
    id: string,
    params: ListCompanyApplicantsParams = {},
  ): Promise<CompanyApplicantList> {
    let httpParams = new HttpParams();
    if (params.limit != null) {
      httpParams = httpParams.set('limit', params.limit);
    }
    if (params.offset != null) {
      httpParams = httpParams.set('offset', params.offset);
    }

    const body = await firstValueFrom(
      this.http.get<CompanyApplicantList>(`${this.baseUrl}/${id}/applicants`, {
        params: httpParams,
      }),
    );
    return CompanyApplicantListSchema.parse(body);
  }
}
