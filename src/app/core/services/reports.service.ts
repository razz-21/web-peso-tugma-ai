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
  EmploymentSummaryReport,
  EmploymentSummaryReportSchema,
  EstablishmentsRegisteredReport,
  EstablishmentsRegisteredReportSchema,
  JobSolicitedReport,
  JobSolicitedReportSchema,
  PesoAccomplishmentReport,
  PesoAccomplishmentReportSchema,
  ReferralFunnelReport,
  ReferralFunnelReportSchema,
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

  async employmentSummary(params: ReportRangeParams = {}): Promise<EmploymentSummaryReport> {
    const body = await firstValueFrom(
      this.http.get<EmploymentSummaryReport>(`${this.baseUrl}/employment-summary`, {
        params: this.toHttpParams(params),
      }),
    );
    return EmploymentSummaryReportSchema.parse(body);
  }

  async pesoAccomplishment(params: ReportRangeParams = {}): Promise<PesoAccomplishmentReport> {
    const body = await firstValueFrom(
      this.http.get<PesoAccomplishmentReport>(`${this.baseUrl}/peso-accomplishment`, {
        params: this.toHttpParams(params),
      }),
    );
    return PesoAccomplishmentReportSchema.parse(body);
  }

  async referralToPlacementFunnel(params: ReportRangeParams = {}): Promise<ReferralFunnelReport> {
    const body = await firstValueFrom(
      this.http.get<ReferralFunnelReport>(`${this.baseUrl}/referral-to-placement-funnel`, {
        params: this.toHttpParams(params),
      }),
    );
    return ReferralFunnelReportSchema.parse(body);
  }
}
