import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { APPLICANT_STATUS_LABELS, ApplicantGet } from '../../core/models/applicant.model';
import { JobGet } from '../../core/models/job.model';
import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJob,
  RecommendedJobStatus,
} from '../../core/models/recommended-job.model';
import { DEFAULT_MATCHING_SCORE, MatchingScore } from '../../core/models/workspace.model';
import { WorkspacesService } from '../../core/services/workspaces.service';
import { MeStore } from '../../stores/me/me.store';
import { APP_ROUTES, jobDetailsRoute } from '../../core/constants/routes.constant';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import {
  LoadingDialogComponent,
  LoadingDialogData,
} from '../../core/components/loading-dialog/loading-dialog.component';
import { ApplicantDetailsStore } from '../../stores/applicant-details/applicant-details.store';
import { applicantDetailsEvents } from '../../stores/applicant-details/applicant-details.events';
import { applicantsEvents } from '../../stores/applicants/applicants.events';
import { RecommendationsStore } from '../../stores/recommendations/recommendations.store';
import { recommendationsEvents } from '../../stores/recommendations/recommendations.events';
import { MatchDetailsComponent } from './match-details/match-details.component';
import { ApplicantJobsComponent } from './applicant-jobs/applicant-jobs.component';
import { ApplicantInfoComponent } from './applicant-info/applicant-info.component';
import { ApplicantFilesComponent } from './applicant-files/applicant-files.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { ManualReferralComponent } from './manual-referral/manual-referral.component';
import { ApplicantEditDialogComponent } from './applicant-edit-dialog/applicant-edit-dialog.component';
import { JobMatch } from './types/job-match.type';
import { ComparisonDialogData } from './types/comparison.type';
import { ManualReferralDialogData } from './types/manual-referral.type';
import { ReferralStatusChange } from './types/referred-jobs.type';
import { isTerminalStatus } from './utils/referred-jobs.util';
import { ApplicantEditDialogData, EditSectionId } from './types/applicant-edit-dialog.type';
import { RankingMetrics } from './types/match-details.type';
import { toJobMatch } from './utils/job-match.util';
import { EVALUATION_K, rankingMetricsAtK } from './utils/ranking-metrics.util';

@Component({
  selector: 'app-applicant-details',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTabsModule,
    MatTooltipModule,
    AvatarComponent,
    MatchDetailsComponent,
    ApplicantJobsComponent,
    ApplicantInfoComponent,
    ApplicantFilesComponent,
  ],
  templateUrl: './applicant-details.component.html',
  styleUrl: './applicant-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApplicantDetailsStore, RecommendationsStore],
})
export class ApplicantDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly statusLabels = APPLICANT_STATUS_LABELS;
  protected readonly store = inject(ApplicantDetailsStore);
  private readonly dispatch = injectDispatch(applicantDetailsEvents);
  private readonly applicantsDispatch = injectDispatch(applicantsEvents);
  private readonly recommendationsStore = inject(RecommendationsStore);
  private readonly recommendationsDispatch = injectDispatch(recommendationsEvents);
  private readonly meStore = inject(MeStore);
  private readonly workspacesService = inject(WorkspacesService);
  private readonly events = inject(Events);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** The match-details drawer, closed once a referral it triggered succeeds. */
  private readonly matchDrawer = viewChild(MatDrawer);
  /** Recommendation id of an in-flight drawer referral (null when none pending). */
  private readonly pendingReferralId = signal<string | null>(null);

  /** Blocking "please wait" loader shown while a referral / status update runs. */
  private loadingDialogRef: MatDialogRef<LoadingDialogComponent> | null = null;

  /** Open manual-referral dialog, closed once its referral succeeds. */
  private manualReferralRef: MatDialogRef<ManualReferralComponent> | null = null;
  /** True while a manual referral is in flight, so its success closes the dialog. */
  private readonly pendingManualReferral = signal(false);

  protected readonly applicant = this.store.applicant;

  /**
   * The active workspace's scoring weights, used to score recommendations.
   * Loaded from the workspace's `matching_score` so the officer's saved weights
   * (not a hard-coded profile) drive the scores; defaults until it resolves.
   */
  private readonly matchingWeights = signal<MatchingScore>(DEFAULT_MATCHING_SCORE);

  /** Map persisted recommendation rows to view models, tagging in-flight updates. */
  private toMatches(rows: readonly RecommendedJob[]): JobMatch[] {
    const updating = new Set(this.recommendationsStore.updatingIds());
    const weights = this.matchingWeights();
    return rows.map((row) => toJobMatch(row, updating.has(row.id), weights));
  }

  /**
   * The untouched AI recommendations for the Recommended list, ranked by
   * MatchScore (desc). Referred jobs are excluded server-side, so they never
   * appear here — no frontend status filtering needed.
   */
  protected readonly recommendations = computed<readonly JobMatch[]>(() =>
    this.toMatches(this.recommendationsStore.items()).sort((a, b) => b.score - a.score),
  );

  /**
   * Whether the signed-in user may delete referrals. Only admins / super admins
   * qualify — officers manage the referral lifecycle but can't remove referrals.
   * Mirrored by the backend, which rejects the delete for other roles with a 403.
   */
  protected readonly canDeleteReferral = computed(() => {
    const role = this.meStore.user()?.role;
    return role === 'super_admin' || role === 'admin';
  });

  protected readonly generating = computed(() => this.recommendationsStore.generating());

  /** True during the initial recommendations fetch, before any items arrive. */
  protected readonly loadingRecommendations = computed(() => this.recommendationsStore.loading());

  /** Placeholder rows rendered while recommendations/referrals load. */
  protected readonly skeletonRows = [0, 1, 2] as const;

  /**
   * Every recommendation the officer has referred (status set), most-recently
   * referred first, for the Referred jobs accordion. Sorted by `referredAt` so a
   * freshly referred job (whether newly created or an advanced recommendation)
   * jumps to the top and later lifecycle updates don't reshuffle the list. Empty
   * until someone is referred.
   */
  protected readonly referrals = computed<readonly JobMatch[]>(() =>
    this.toMatches(this.recommendationsStore.referrals()).sort(
      (a, b) => new Date(b.referredAt).getTime() - new Date(a.referredAt).getTime(),
    ),
  );

  /** When the current recommendations were generated, shown in the card footer. */
  protected readonly generatedAt = computed<Date | null>(() => {
    const times = this.recommendationsStore
      .items()
      .map((recommendation) => new Date(recommendation.created_at).getTime())
      .filter((time) => !Number.isNaN(time));
    return times.length > 0 ? new Date(Math.max(...times)) : null;
  });

  /** Recommendation id shown in the details drawer; the match is derived live. */
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selectedMatch = computed<JobMatch | null>(() => {
    const id = this.selectedId();
    // Search both lists: a match referred from the drawer moves to `referrals`.
    return (
      this.recommendations().find((match) => match.recommendationId === id) ??
      this.referrals().find((match) => match.recommendationId === id) ??
      null
    );
  });

  protected selectMatch(match: JobMatch): void {
    this.selectedId.set(match.recommendationId);
  }

  /**
   * Applicant-level Precision@K / Recall@K / F1@K / nDCG@K over the generated
   * Top-K recommendations (K = 5, the manuscript's operational cut-off), judged
   * against the officers' relevant / not-relevant feedback. Per Chapter 3 the
   * metrics evaluate the system's Top-K generation, which is exactly the
   * Recommended jobs list — `recommendations()`, already ranked by MatchScore.
   *
   * Referred jobs are intentionally excluded: they leave the Recommended list
   * once referred, so folding them back in would let unassessed referrals occupy
   * top-K slots and understate the metrics. Null until a recommendation exists.
   */
  protected readonly rankingMetrics = computed<RankingMetrics | null>(() => {
    const ranked = this.recommendations();
    return ranked.length === 0 ? null : rankingMetricsAtK(ranked, EVALUATION_K);
  });

  protected readonly fullName = computed(() => {
    const a = this.applicant();
    if (!a) {
      return '';
    }
    return [a.firstname, a.middlename, a.lastname, a.suffix]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part))
      .join(' ');
  });

  protected readonly role = computed(() => {
    const items = this.applicant()?.preferred_occupation_industry ?? [];
    return items.map((item) => item.occupation?.trim()).find((occupation) => Boolean(occupation));
  });

  protected readonly age = computed(() => {
    const dob = this.applicant()?.date_of_birth;
    if (!dob) {
      return null;
    }
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) {
      return null;
    }
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      years -= 1;
    }
    return years >= 0 ? years : null;
  });

  protected readonly city = computed(() => this.applicant()?.present_address?.municipality_city);

  /** Subtitle segments shown under the name: role · age · city. */
  protected readonly subtitle = computed(() => {
    const age = this.age();
    return [this.role(), age === null ? null : `${age} years old`, this.city()].filter(
      (segment): segment is string => Boolean(segment),
    );
  });

  protected readonly salaryLabel = computed(() => {
    const raw = this.applicant()?.salary_expectation?.trim();
    if (!raw) {
      return '—';
    }
    const digits = raw.replace(/[^\d.]/g, '');
    const value = Number(digits);
    return digits && !Number.isNaN(value) ? `₱${value.toLocaleString('en-PH')}` : raw;
  });

  protected readonly employmentStatus = computed(() => this.applicant()?.employment_status || '—');

  protected readonly education = computed(
    () => this.applicant()?.educational_background?.highest_education_level || '—',
  );

  constructor() {
    // Load the active workspace's `matching_score` weights so recommendation
    // scores reflect the officer's saved weighting. Re-runs if the user's
    // workspace changes; picks up edited weights on the next visit.
    effect(() => {
      const workspaceId = this.meStore.user()?.workspace?.id;
      if (!workspaceId) {
        return;
      }
      this.workspacesService
        .get(workspaceId)
        .then((workspace) => this.matchingWeights.set(workspace.matching_score))
        .catch(() => this.matchingWeights.set(DEFAULT_MATCHING_SCORE));
    });

    // Open a blocking "please wait" loader the moment a referral or referral-
    // status update is dispatched: referring the applicant to a job (manual
    // `refer`, or advancing a recommendation to `referred`), or changing a
    // referred job's lifecycle status. The message reflects which action ran.
    this.events
      .on(recommendationsEvents.setStatus)
      .pipe(takeUntilDestroyed())
      .subscribe(({ payload }) =>
        payload.status === 'referred'
          ? this.openLoading('Referring applicant', 'Sending the referral')
          : this.openLoading('Updating referral', 'Saving the new status'),
      );
    this.events
      .on(recommendationsEvents.refer)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.openLoading('Referring applicant', 'Sending the referral'));
    this.events
      .on(recommendationsEvents.deleteReferral)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.openLoading('Deleting referral', 'Removing the referral'));

    // Dismiss the loader once the referral / status update settles (either way).
    this.events
      .on(
        recommendationsEvents.setStatusSuccess,
        recommendationsEvents.setStatusFailed,
        recommendationsEvents.referSuccess,
        recommendationsEvents.referFailed,
        recommendationsEvents.deleteReferralSuccess,
        recommendationsEvents.deleteReferralFailed,
      )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.closeLoading());

    // Close the match-details drawer once the referral it started persists.
    this.events
      .on(recommendationsEvents.setStatusSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(({ payload }) => {
        if (payload.id === this.pendingReferralId()) {
          this.pendingReferralId.set(null);
          this.matchDrawer()?.close();
        }
      });

    // Close the manual-referral dialog once the referral it started persists
    // (either a freshly created referral or an advanced recommendation).
    this.events
      .on(recommendationsEvents.referSuccess, recommendationsEvents.setStatusSuccess)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.pendingManualReferral()) {
          this.pendingManualReferral.set(false);
          this.manualReferralRef?.close();
          this.manualReferralRef = null;
        }
      });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadApplicantDetails({ id });
      this.recommendationsDispatch.load({ applicantId: id });
    }
  }

  protected onEditSection(section: EditSectionId, label: string): void {
    const applicant = this.applicant();
    if (!applicant) {
      return;
    }
    this.dialog.open<ApplicantEditDialogComponent, ApplicantEditDialogData>(
      ApplicantEditDialogComponent,
      {
        width: '760px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        panelClass: 'applicant-edit-dialog',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: { section, sectionLabel: label, applicant },
      },
    );
  }

  protected onSelectMatch(match: JobMatch): void {
    if (this.applicant()?.status === 'inactive') {
      return;
    }
    this.selectMatch(match);
    this.matchDrawer()?.open();
  }

  protected onGenerate(): void {
    const applicant = this.applicant();
    if (!applicant || applicant.status === 'inactive' || this.generating()) {
      return;
    }
    this.recommendationsDispatch.generate({ applicantId: applicant.id, topK: 5 });
  }

  protected onSetRelevance(match: JobMatch, isRelevant: boolean): void {
    if (match.updating) {
      return;
    }
    this.recommendationsDispatch.setRelevance({ id: match.recommendationId, isRelevant });
  }

  /** Advance a referral's lifecycle status (Referred → Interview → Hired, …). */
  protected onSetStatus(match: JobMatch, status: RecommendedJobStatus): void {
    if (match.updating) {
      return;
    }
    this.recommendationsDispatch.setStatus({ id: match.recommendationId, status });
  }

  protected onReferralStatus(change: ReferralStatusChange): void {
    if (this.applicant()?.status === 'inactive') {
      return;
    }
    const { match, status } = change;
    // Terminal statuses (Withdrawn / Not hired / Resigned) are final — once set,
    // the referral can no longer be updated — so confirm before committing.
    if (!isTerminalStatus(status)) {
      this.onSetStatus(match, status);
      return;
    }
    const label = RECOMMENDED_JOB_STATUS_LABEL[status];
    const data: ConfirmDialogData = {
      title: `Mark as ${label}?`,
      message: `Are you sure you want to set <strong>${match.title}</strong> to <strong>${label}</strong>? This is final — you won't be able to update the status again.`,
      confirmLabel: label,
      destructive: true,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.onSetStatus(match, status);
        }
      });
  }

  /** Delete a referral outright (admins / super admins only), after confirming. */
  protected onDeleteReferral(match: JobMatch): void {
    // Defense in depth: the button is hidden for officers and the backend
    // enforces the role, but guard here too in case the handler is reached.
    if (!this.canDeleteReferral()) {
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Delete referral',
      message: `Are you sure you want to delete the referral to <strong>${match.title}</strong>? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.recommendationsDispatch.deleteReferral({ id: match.recommendationId });
        }
      });
  }

  /** Open a referred job's detail page. */
  protected onViewJob(match: JobMatch): void {
    if (match.jobId) {
      this.router.navigate([jobDetailsRoute(match.jobId)]);
    }
  }

  /** Job ids the applicant is already referred to, for the manual-referral screen. */
  protected readonly referredJobIds = computed<ReadonlySet<string>>(
    () =>
      new Set(
        this.referrals()
          .filter((match) => match.jobId)
          .map((match) => match.jobId as string),
      ),
  );

  /** "Manual referral" opens the full-page screening dialog to pick a job to refer. */
  protected onNewReferral(): void {
    const applicant = this.applicant();
    if (!applicant || applicant.status === 'inactive') {
      return;
    }
    this.pendingManualReferral.set(false);
    this.manualReferralRef = this.dialog.open<ManualReferralComponent, ManualReferralDialogData>(
      ManualReferralComponent,
      {
        panelClass: 'manual-referral-dialog',
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Manual referral',
        data: {
          applicant,
          referredJobIds: this.referredJobIds,
          onRefer: (job) => this.onReferJob(job),
        },
      },
    );
    this.manualReferralRef.afterClosed().subscribe(() => {
      this.manualReferralRef = null;
      this.pendingManualReferral.set(false);
    });
  }

  /** Confirm, then manually refer the applicant to the chosen workspace job. */
  private onReferJob(job: JobGet): void {
    const applicant = this.applicant();
    if (!applicant || applicant.status === 'inactive') {
      return;
    }
    if (this.referredJobIds().has(job.id)) {
      this.snackBar.open('Applicant is already referred to this job.', 'Close', { duration: 3000 });
      return;
    }
    if (job.status !== 'active') {
      this.snackBar.open('This job is no longer active and cannot take referrals.', 'Close', {
        duration: 3000,
      });
      return;
    }
    const data: ConfirmDialogData = {
      title: 'Refer applicant?',
      message: `Are you sure you want to refer <strong>${this.fullName()}</strong> to <strong>${job.title}</strong>?`,
      confirmLabel: 'Refer',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        // Reuse an existing (e.g. AI-generated) recommendation for this job so we
        // advance it to 'referred' rather than creating a duplicate; otherwise
        // create a fresh manual referral.
        this.pendingManualReferral.set(true);
        const existing = this.recommendations().find((match) => match.jobId === job.id);
        if (existing) {
          this.recommendationsDispatch.setStatus({
            id: existing.recommendationId,
            status: 'referred',
          });
        } else {
          this.recommendationsDispatch.refer({ applicantId: applicant.id, jobId: job.id });
        }
      });
  }

  protected onViewComparison(match: JobMatch): void {
    const applicant = this.applicant();
    if (!applicant) {
      return;
    }
    this.dialog.open<ComparisonComponent, ComparisonDialogData>(ComparisonComponent, {
      panelClass: 'comparison-dialog',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Applicant and job comparison',
      data: { applicant, match },
    });
  }

  protected onReferApplicant(match: JobMatch): void {
    if (this.applicant()?.status === 'inactive') {
      this.snackBar.open('This applicant is inactive and cannot be referred to jobs.', 'Close', {
        duration: 3000,
      });
      return;
    }
    // A closed job can't take referrals — the drawer button is already disabled
    // for it, but guard here too in case the handler is reached another way.
    if (!match.active) {
      this.snackBar.open('This job is no longer active and cannot take referrals.', 'Close', {
        duration: 3000,
      });
      return;
    }
    // Always confirm before referring. An ineligible applicant gets a stronger,
    // destructive warning that surfaces why they failed the job's requirement.
    const data: ConfirmDialogData = match.eligible
      ? {
          title: 'Refer applicant?',
          message: `Are you sure you want to refer <strong>${this.fullName()}</strong> to <strong>${match.title}</strong>?`,
          confirmLabel: 'Refer',
        }
      : {
          title: 'Refer despite ineligibility?',
          message: (() => {
            const requirement = match.eligibilityRequired?.trim();
            const reason = requirement
              ? `they are not eligible for this job, which requires <strong>${requirement}</strong>`
              : 'they are not eligible for this job';
            return `Are you sure you want to refer <strong>${this.fullName()}</strong>? Based on the assessment, ${reason}.`;
          })(),
          confirmLabel: 'Refer anyway',
          destructive: true,
        };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.sendReferral(match);
        }
      });
  }

  private sendReferral(match: JobMatch): void {
    // Referring the applicant to this job starts its referral lifecycle by
    // setting the recommendation's status to 'referred' (persisted via PATCH).
    // Flag it as pending so the drawer closes once the update succeeds.
    this.pendingReferralId.set(match.recommendationId);
    this.recommendationsDispatch.setStatus({ id: match.recommendationId, status: 'referred' });
  }

  /** Show the blocking "please wait" loader (a no-op if one is already open). */
  private openLoading(message: string, hint?: string): void {
    if (this.loadingDialogRef) {
      return;
    }
    this.loadingDialogRef = this.dialog.open<LoadingDialogComponent, LoadingDialogData>(
      LoadingDialogComponent,
      {
        width: '380px',
        maxWidth: '90vw',
        disableClose: true,
        restoreFocus: true,
        ariaLabel: message,
        data: { message, hint },
      },
    );
  }

  /** Dismiss the blocking loader once the referral / status update settles. */
  private closeLoading(): void {
    this.loadingDialogRef?.close();
    this.loadingDialogRef = null;
  }

  protected onToggleStatus(applicant: ApplicantGet): void {
    const deactivating = (applicant.status ?? 'active') === 'active';
    const status = deactivating ? 'inactive' : 'active';
    const name = this.fullName() || 'this applicant';

    const data: ConfirmDialogData = deactivating
      ? {
          title: 'Deactivate applicant',
          message: `Deactivate <strong>${name}</strong>? They will be marked as inactive and excluded from job recommendations.`,
          confirmLabel: 'Deactivate applicant',
          destructive: true,
        }
      : {
          title: 'Activate applicant',
          message: `Activate <strong>${name}</strong>? They will be marked as active again.`,
          confirmLabel: 'Activate applicant',
        };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dispatch.updateApplicant({ id: applicant.id, patch: { status } });
        }
      });
  }

  protected onDelete(applicant: ApplicantGet): void {
    const data: ConfirmDialogData = {
      title: 'Delete applicant',
      message: `Are you sure you want to delete <strong>${this.fullName()}</strong>? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.applicantsDispatch.deleteApplicant(applicant.id);
          this.router.navigate([APP_ROUTES.applicants]);
        }
      });
  }
}
