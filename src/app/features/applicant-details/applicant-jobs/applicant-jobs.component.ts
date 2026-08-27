import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe, PercentPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { ReferredJobsComponent } from '../referred-jobs/referred-jobs.component';
import { JobMatch } from '../types/job-match.type';
import { RankingMetrics } from '../types/match-details.type';
import { ReferralStatusChange } from '../types/referred-jobs.type';

/**
 * Jobs tab: the applicant's referred jobs accordion plus the AI Recommended
 * jobs card. Presentational — all data arrives via inputs and every action is
 * bubbled up for the parent to run against the store.
 */
@Component({
  selector: 'app-applicant-jobs',
  imports: [
    DatePipe,
    PercentPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SkeletonComponent,
    ReferredJobsComponent,
  ],
  templateUrl: './applicant-jobs.component.html',
  styleUrl: './applicant-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantJobsComponent {
  /** When true, referrals/recommendations are read-only (e.g. inactive applicant). */
  readonly disabled = input<boolean>(false);
  /** Whether the current user may delete referrals (admins / super admins only). */
  readonly canDelete = input<boolean>(false);
  /** True during the initial recommendations/referrals fetch. */
  readonly loading = input<boolean>(false);
  /** True while a fresh set of recommendations is being generated. */
  readonly generating = input<boolean>(false);
  /** Every referral for the applicant, most-recent first. */
  readonly referrals = input<readonly JobMatch[]>([]);
  /** AI recommendations ranked by fit (referred jobs excluded). */
  readonly recommendations = input<readonly JobMatch[]>([]);
  /**
   * Applicant-level ranking metrics (Precision@K / Recall@K / F1@K / nDCG@K) over
   * the generated Top-K recommendations. Null until recommendations exist.
   */
  readonly metrics = input<RankingMetrics | null>(null);
  /** When the current recommendations were generated, shown in the footer. */
  readonly generatedAt = input<Date | null>(null);

  readonly referralStatus = output<ReferralStatusChange>();
  readonly viewComparison = output<JobMatch>();
  readonly viewJob = output<JobMatch>();
  readonly newReferral = output<void>();
  readonly deleteReferral = output<JobMatch>();
  readonly generate = output<void>();
  readonly selectMatch = output<JobMatch>();

  /** Placeholder rows rendered while recommendations load. */
  protected readonly skeletonRows = [0, 1, 2] as const;

  /**
   * Four ranking metrics as display rows (value 0–1), with a supporting hint and
   * a plain-language tooltip describing what the metric measures.
   */
  protected readonly metricRows = computed<
    readonly { key: string; label: string; value: number; hint: string; tooltip: string }[]
  >(() => {
    const metrics = this.metrics();
    if (!metrics) {
      return [];
    }
    const k = metrics.k;
    return [
      {
        key: 'precision',
        label: 'Precision@K',
        value: metrics.precision,
        hint: `${metrics.relevantInK} of top ${k} relevant`,
        tooltip: `Out of the top ${k} jobs suggested, this is how many are actually a good fit for the applicant. A higher score means the list has fewer jobs that don't suit them.`,
      },
      {
        key: 'recall',
        label: 'Recall@K',
        value: metrics.recall,
        hint:
          metrics.totalRelevant > 0
            ? `${metrics.relevantInK} of ${metrics.totalRelevant} relevant found`
            : 'no relevant items yet',
        tooltip: `Of all the jobs that are a good fit for the applicant, this is how many the system managed to show in the top ${k}. A higher score means it misses fewer good jobs.`,
      },
      {
        key: 'f1',
        label: 'F1@K',
        value: metrics.f1,
        hint: 'balance of precision & recall',
        tooltip: `A single overall score that combines the two above. It only goes high when the list is both accurate (few bad jobs) and complete (few missed good jobs).`,
      },
      {
        key: 'ndcg',
        label: 'nDCG@K',
        value: metrics.ndcg,
        hint: 'rank-weighted quality',
        tooltip: `This checks the order of the list, not just what's in it. It's higher when the best-fitting jobs are placed near the top where people look first.`,
      },
    ];
  });
}
