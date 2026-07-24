import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardActivity,
  DashboardActivitySchema,
  DashboardRangeParams,
  DashboardSummary,
  DashboardSummarySchema,
  MatchingFunnel,
  MatchingFunnelSchema,
  PlacementsOverTime,
  PlacementsOverTimeSchema,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/dashboard`;

  private toHttpParams(params: DashboardRangeParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.start_date) {
      httpParams = httpParams.set('start_date', params.start_date);
    }
    if (params.end_date) {
      httpParams = httpParams.set('end_date', params.end_date);
    }
    if (params.limit != null) {
      httpParams = httpParams.set('limit', params.limit);
    }
    return httpParams;
  }

  async summary(params: DashboardRangeParams = {}): Promise<DashboardSummary> {
    const body = await firstValueFrom(
      this.http.get<DashboardSummary>(`${this.baseUrl}/summary`, {
        params: this.toHttpParams(params),
      }),
    );
    return DashboardSummarySchema.parse(body);
  }

  async placementsOverTime(params: DashboardRangeParams = {}): Promise<PlacementsOverTime> {
    const body = await firstValueFrom(
      this.http.get<PlacementsOverTime>(`${this.baseUrl}/placements-over-time`, {
        params: this.toHttpParams(params),
      }),
    );
    return PlacementsOverTimeSchema.parse(body);
  }

  async matchingFunnel(params: DashboardRangeParams = {}): Promise<MatchingFunnel> {
    const body = await firstValueFrom(
      this.http.get<MatchingFunnel>(`${this.baseUrl}/matching-funnel`, {
        params: this.toHttpParams(params),
      }),
    );
    return MatchingFunnelSchema.parse(body);
  }

  async activity(params: DashboardRangeParams = {}): Promise<DashboardActivity> {
    const body = await firstValueFrom(
      this.http.get<DashboardActivity>(`${this.baseUrl}/activity`, {
        params: this.toHttpParams(params),
      }),
    );
    return DashboardActivitySchema.parse(body);
  }
}
