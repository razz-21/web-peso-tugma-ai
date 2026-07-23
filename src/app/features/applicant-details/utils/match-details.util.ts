import { RecommendationScores } from '../../../core/models/recommended-job.model';

/** Human-readable phrase for each scoring dimension, used in the summary line. */
export const DIMENSION_PHRASE: Record<keyof RecommendationScores, string> = {
  semantic_similarity: 'overall role fit',
  skills: 'skills',
  experience: 'experience',
  educational_background: 'education',
  location_preference: 'location',
};
