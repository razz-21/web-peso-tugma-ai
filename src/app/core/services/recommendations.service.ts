import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RecommendedJob,
  RecommendedJobArraySchema,
  RecommendedJobList,
  RecommendedJobListSchema,
  RecommendedJobSchema,
  RecommendedJobStatus,
} from '../models/recommended-job.model';

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/recommended-jobs`;

  /** Run the AI pipeline and persist the applicant's Top-K recommendations. */
  async generate(applicantId: string, topK = 5): Promise<RecommendedJob[]> {
    const body = await firstValueFrom(
      this.http.post<RecommendedJob[]>(`${this.baseUrl}/generate`, {
        applicant_id: applicantId,
        top_k: topK,
      }),
    );
    return RecommendedJobArraySchema.parse(body);
  }

  /** Load the applicant's previously generated recommendations. */
  async list(applicantId: string): Promise<RecommendedJob[]> {
    const params = new HttpParams().set('applicant_id', applicantId).set('limit', 50);
    const body = await firstValueFrom(this.http.get<RecommendedJobList>(this.baseUrl, { params }));
    return RecommendedJobListSchema.parse(body).items;
  }

  /**
   * Manually refer an applicant to a specific job by creating a recommendation
   * record already marked 'referred' (no AI scoring — this is a manual match).
   * The assessor defaults to the authenticated officer on the server.
   */
  async refer(applicantId: string, jobId: string): Promise<RecommendedJob> {
    const body = await firstValueFrom(
      this.http.post<RecommendedJob>(this.baseUrl, {
        applicant_id: applicantId,
        job_id: jobId,
        status: 'referred',
      }),
    );
    return RecommendedJobSchema.parse(body);
  }

  /** Human-in-the-Loop: flag a recommendation as relevant / not relevant. */
  async setRelevance(id: string, isRelevant: boolean): Promise<RecommendedJob> {
    const body = await firstValueFrom(
      this.http.patch<RecommendedJob>(`${this.baseUrl}/${id}`, { is_relevant: isRelevant }),
    );
    return RecommendedJobSchema.parse(body);
  }

  /** Human-in-the-Loop: set a recommendation's referral lifecycle status. */
  async setStatus(id: string, status: RecommendedJobStatus): Promise<RecommendedJob> {
    const body = await firstValueFrom(
      this.http.patch<RecommendedJob>(`${this.baseUrl}/${id}`, { status }),
    );
    return RecommendedJobSchema.parse(body);
  }
}
