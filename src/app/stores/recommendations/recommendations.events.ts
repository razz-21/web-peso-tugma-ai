import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { RecommendedJob } from '../../core/models/recommended-job.model';

export const recommendationsEvents = eventGroup({
  source: 'Recommendations',
  events: {
    // Load the applicant's existing recommendations.
    load: type<{ applicantId: string }>(),
    loadSuccess: type<RecommendedJob[]>(),
    loadFailed: type<string>(),

    // (Re)generate the Top-K recommendations for the applicant.
    generate: type<{ applicantId: string; topK?: number }>(),
    generateSuccess: type<RecommendedJob[]>(),
    generateFailed: type<string>(),

    // Human-in-the-Loop relevance assessment for a single recommendation.
    setRelevance: type<{ id: string; isRelevant: boolean }>(),
    setRelevanceSuccess: type<RecommendedJob>(),
    setRelevanceFailed: type<{ id: string; message: string }>(),
  },
});
