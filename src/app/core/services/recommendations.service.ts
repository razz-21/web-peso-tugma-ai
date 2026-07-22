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

  /** Human-in-the-Loop: flag a recommendation as relevant / not relevant. */
  async setRelevance(id: string, isRelevant: boolean): Promise<RecommendedJob> {
    const body = await firstValueFrom(
      this.http.patch<RecommendedJob>(`${this.baseUrl}/${id}`, { is_relevant: isRelevant }),
    );
    return RecommendedJobSchema.parse(body);
  }
}
