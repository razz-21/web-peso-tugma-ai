/** Visual severity of the match assessment banner. */
export type AssessmentTone = 'positive' | 'caution' | 'critical';

export interface Assessment {
  readonly tone: AssessmentTone;
  /** Short band label, e.g. "Moderate match". */
  readonly title: string;
  /** One-line rationale derived from the strongest / weakest factors. */
  readonly summary: string;
}

/**
 * Information-retrieval ranking-quality metrics for a score-ranked
 * recommendation list, evaluated at a cutoff K (the rank of the recommendation
 * being viewed) with the officer's relevant / not-relevant judgments as ground
 * truth. All ratios are 0–1.
 */
export interface RankingMetrics {
  /** Cutoff rank the metrics are evaluated at (1-based). */
  readonly k: number;
  /** Precision@K — fraction of the top-K recommendations judged relevant. */
  readonly precision: number;
  /** Recall@K — fraction of all relevant recommendations captured in the top-K. */
  readonly recall: number;
  /** F1@K — harmonic mean of precision and recall. */
  readonly f1: number;
  /** nDCG@K — normalized discounted cumulative gain over the top-K. */
  readonly ndcg: number;
  /** Relevant recommendations within the top-K. */
  readonly relevantInK: number;
  /** Relevant recommendations across the whole ranked list. */
  readonly totalRelevant: number;
  /** Recommendations in the list that carry a relevance judgment. */
  readonly assessedCount: number;
}
