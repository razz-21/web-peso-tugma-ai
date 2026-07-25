import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicantReferredReport,
  ApplicantReferredReportSchema,
  JobSolicitedReport,
  JobSolicitedReportSchema,
  ReportRangeParams,
} from '../models/reports.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/reports`;

  private toHttpParams(params: ReportRangeParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }
    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }
    return httpParams;
  }

  async jobSolicited(params: ReportRangeParams = {}): Promise<JobSolicitedReport> {
    const body = await firstValueFrom(
      this.http.get<JobSolicitedReport>(`${this.baseUrl}/job-solicited`, {
        params: this.toHttpParams(params),
      }),
    );
    return JobSolicitedReportSchema.parse(body);
  }

  async applicantReferred(params: ReportRangeParams = {}): Promise<ApplicantReferredReport> {
    const body = await firstValueFrom(
      this.http.get<ApplicantReferredReport>(`${this.baseUrl}/applicant-referred`, {
        params: this.toHttpParams(params),
      }),
    );
    return ApplicantReferredReportSchema.parse(body);
  }
}
