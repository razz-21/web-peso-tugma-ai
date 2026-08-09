import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkeletonComponent } from '../../../core/components/skeleton/skeleton.component';
import { ReferredJobsComponent } from '../referred-jobs/referred-jobs.component';
import { JobMatch } from '../types/job-match.type';
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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
  /** True during the initial recommendations/referrals fetch. */
  readonly loading = input<boolean>(false);
  /** True while a fresh set of recommendations is being generated. */
  readonly generating = input<boolean>(false);
  /** Every referral for the applicant, most-recent first. */
  readonly referrals = input<readonly JobMatch[]>([]);
  /** AI recommendations ranked by fit (referred jobs excluded). */
  readonly recommendations = input<readonly JobMatch[]>([]);
  /** When the current recommendations were generated, shown in the footer. */
  readonly generatedAt = input<Date | null>(null);

  readonly referralStatus = output<ReferralStatusChange>();
  readonly viewComparison = output<JobMatch>();
  readonly viewJob = output<JobMatch>();
  readonly newReferral = output<void>();
  readonly generate = output<void>();
  readonly selectMatch = output<JobMatch>();

  /** Placeholder rows rendered while recommendations load. */
  protected readonly skeletonRows = [0, 1, 2] as const;
}
