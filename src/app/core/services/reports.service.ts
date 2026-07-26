import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicantPlacedReport,
  ApplicantPlacedReportSchema,
  ApplicantReferredReport,
  ApplicantReferredReportSchema,
  ApplicantRegisteredReport,
  ApplicantRegisteredReportSchema,
  EstablishmentsRegisteredReport,
  EstablishmentsRegisteredReportSchema,
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

  async applicantPlaced(params: ReportRangeParams = {}): Promise<ApplicantPlacedReport> {
    const body = await firstValueFrom(
      this.http.get<ApplicantPlacedReport>(`${this.baseUrl}/applicant-placed`, {
        params: this.toHttpParams(params),
      }),
    );
    return ApplicantPlacedReportSchema.parse(body);
  }

  async applicantRegistered(params: ReportRangeParams = {}): Promise<ApplicantRegisteredReport> {
    const body = await firstValueFrom(
      this.http.get<ApplicantRegisteredReport>(`${this.baseUrl}/applicant-registered`, {
        params: this.toHttpParams(params),
      }),
    );
    return ApplicantRegisteredReportSchema.parse(body);
  }

  async establishmentsRegistered(
    params: ReportRangeParams = {},
  ): Promise<EstablishmentsRegisteredReport> {
    const body = await firstValueFrom(
      this.http.get<EstablishmentsRegisteredReport>(`${this.baseUrl}/establishments-registered`, {
        params: this.toHttpParams(params),
      }),
    );
    return EstablishmentsRegisteredReportSchema.parse(body);
  }
}
