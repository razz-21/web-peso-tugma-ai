import { RankingMetrics } from '../types/match-details.type';

/**
 * Operational top-K cut-off for the ranking metrics, per Chapter 3 of the
 * manuscript ("with K = 5 as the operational cut-off"). Recommendations are
 * generated as a Top-5 list, so K caps at the list length when fewer exist.
 */
export const EVALUATION_K = 5;

/** A ranked recommendation reduced to the only field the metrics need. */
interface RankedRelevance {
  /** Officer's relevance judgment; null until the recommendation is assessed. */
  readonly isRelevant: boolean | null;
}

const log2 = (n: number): number => Math.log(n) / Math.LN2;

/**
 * Precision@K, Recall@K, F1@K and nDCG@K for a score-ranked recommendation
 * list, using the officer's relevant / not-relevant judgments as ground truth.
 *
 * `ranked` must already be ordered best-first (highest MatchScore first). `k` is
 * the 1-based cutoff — the rank of the recommendation being inspected — so each
 * recommendation reports the cumulative ranking quality up to and including its
 * own position. A recommendation counts as relevant only when explicitly judged
 * relevant (`isRelevant === true`); unassessed (`null`) and not-relevant rows
 * contribute a gain of 0.
 */
export function rankingMetricsAtK(ranked: readonly RankedRelevance[], k: number): RankingMetrics {
  const cutoff = Math.max(0, Math.min(k, ranked.length));
  const gains: number[] = ranked.map((row) => (row.isRelevant === true ? 1 : 0));
  const totalRelevant = gains.reduce((sum, gain) => sum + gain, 0);
  const assessedCount = ranked.reduce(
    (count, row) => (row.isRelevant === null ? count : count + 1),
    0,
  );

  let relevantInK = 0;
  let dcg = 0;
  for (let i = 0; i < cutoff; i++) {
    relevantInK += gains[i];
    // Discount by log2(rank + 1); ranks are 1-based, so index i maps to i + 2.
    dcg += gains[i] / log2(i + 2);
  }

  // Ideal DCG: the same gains reordered to place every relevant item first.
  const idealGains = [...gains].sort((a, b) => b - a);
  let idcg = 0;
  for (let i = 0; i < cutoff; i++) {
    idcg += idealGains[i] / log2(i + 2);
  }

  const precision = cutoff > 0 ? relevantInK / cutoff : 0;
  const recall = totalRelevant > 0 ? relevantInK / totalRelevant : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const ndcg = idcg > 0 ? dcg / idcg : 0;

  return { k: cutoff, precision, recall, f1, ndcg, relevantInK, totalRelevant, assessedCount };
}
