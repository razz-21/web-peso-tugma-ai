import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
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
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { ApplicantGet } from '../../core/models/applicant.model';
import { JobGet } from '../../core/models/job.model';
import { RecommendedJobStatus } from '../../core/models/recommended-job.model';
import { APP_ROUTES, jobDetailsRoute } from '../../core/constants/routes.constant';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { SkeletonComponent } from '../../core/components/skeleton/skeleton.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ApplicantDetailsStore } from '../../stores/applicant-details/applicant-details.store';
import { applicantDetailsEvents } from '../../stores/applicant-details/applicant-details.events';
import { applicantsEvents } from '../../stores/applicants/applicants.events';
import { RecommendationsStore } from '../../stores/recommendations/recommendations.store';
import { recommendationsEvents } from '../../stores/recommendations/recommendations.events';
import { DetailFieldComponent } from './detail-field/detail-field.component';
import { ReferredJobsComponent } from './referred-jobs/referred-jobs.component';
import { MatchDetailsComponent } from './match-details/match-details.component';
import { ComparisonComponent } from './comparison/comparison.component';
import { ManualReferralComponent } from './manual-referral/manual-referral.component';
import { ApplicantEditDialogComponent } from './applicant-edit-dialog/applicant-edit-dialog.component';
import { JobMatch } from './types/job-match.type';
import { SectionLink } from './types/applicant-details.type';
import { ComparisonDialogData } from './types/comparison.type';
import { ManualReferralDialogData } from './types/manual-referral.type';
import { ReferralStatusChange } from './types/referred-jobs.type';
import { ApplicantEditDialogData, EditSectionId } from './types/applicant-edit-dialog.type';
import { toJobMatch } from './utils/job-match.util';
import { addressLines, sameAddress } from './utils/address.util';

const SECTIONS: readonly SectionLink[] = [
  { id: 'personal', label: 'Personal information', icon: 'person' },
  { id: 'contact', label: 'Contact', icon: 'call' },
  { id: 'address', label: 'Address', icon: 'location_on' },
  { id: 'education', label: 'Educational background', icon: 'school' },
  { id: 'skills', label: 'Skills & training', icon: 'edit' },
  { id: 'work', label: 'Work experience', icon: 'work' },
  { id: 'preferences', label: 'Job preferences', icon: 'star' },
];

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
    AvatarComponent,
    SkeletonComponent,
    DetailFieldComponent,
    ReferredJobsComponent,
    MatchDetailsComponent,
  ],
  templateUrl: './applicant-details.component.html',
  styleUrl: './applicant-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApplicantDetailsStore, RecommendationsStore],
})
export class ApplicantDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly sections = SECTIONS;
  protected readonly store = inject(ApplicantDetailsStore);
  private readonly dispatch = injectDispatch(applicantDetailsEvents);
  private readonly applicantsDispatch = injectDispatch(applicantsEvents);
  private readonly recommendationsStore = inject(RecommendationsStore);
  private readonly recommendationsDispatch = injectDispatch(recommendationsEvents);
  private readonly events = inject(Events);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  /** The match-details drawer, closed once a referral it triggered succeeds. */
  private readonly matchDrawer = viewChild(MatDrawer);
  /** Recommendation id of an in-flight drawer referral (null when none pending). */
  private readonly pendingReferralId = signal<string | null>(null);

  /** Open manual-referral dialog, closed once its referral succeeds. */
  private manualReferralRef: MatDialogRef<ManualReferralComponent> | null = null;
  /** True while a manual referral is in flight, so its success closes the dialog. */
  private readonly pendingManualReferral = signal(false);

  protected readonly applicant = this.store.applicant;

  /** AI recommendations for this applicant, ranked by MatchScore (desc). */
  protected readonly recommendations = computed<readonly JobMatch[]>(() => {
    const updating = new Set(this.recommendationsStore.updatingIds());
    return [...this.recommendationsStore.items()]
      .sort((a, b) => b.score - a.score)
      .map((recommendation) => toJobMatch(recommendation, updating.has(recommendation.id)));
  });

  protected readonly generating = computed(() => this.recommendationsStore.generating());

  /** True during the initial recommendations fetch, before any items arrive. */
  protected readonly loadingRecommendations = computed(() => this.recommendationsStore.loading());

  /** Placeholder rows rendered while recommendations/referrals load. */
  protected readonly skeletonRows = [0, 1, 2] as const;

  /**
   * Every recommendation the officer has referred (status set), most-recently
   * referred first, for the Referred jobs accordion. Sorted by `updatedAt` so a
   * freshly referred job (whether newly created or an advanced recommendation)
   * jumps to the top. Empty until someone is referred.
   */
  protected readonly referrals = computed<readonly JobMatch[]>(() =>
    this.recommendations()
      .filter((match) => match.status !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
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
  protected readonly selectedMatch = computed<JobMatch | null>(
    () =>
      this.recommendations().find((match) => match.recommendationId === this.selectedId()) ?? null,
  );

  protected selectMatch(match: JobMatch): void {
    this.selectedId.set(match.recommendationId);
  }

  /** Section currently in view, highlighted in the Sections rail. */
  protected readonly activeSection = signal<string>(SECTIONS[0].id);

  private readonly sectionEls = viewChildren<ElementRef<HTMLElement>>('section');

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

  // --- Detail section derived values --------------------------------------

  protected readonly dobLabel = computed(() => {
    const dob = this.applicant()?.date_of_birth;
    if (!dob) {
      return null;
    }
    const formatted = this.datePipe.transform(dob, 'MMM d, y');
    const age = this.age();
    return age === null ? formatted : `${formatted} (${age})`;
  });

  protected readonly heightLabel = computed(() => {
    const height = this.applicant()?.height_in_cm;
    return height === null || height === undefined ? null : `${height} cm`;
  });

  protected readonly weightLabel = computed(() => {
    const weight = this.applicant()?.weight_in_kg;
    return weight === null || weight === undefined ? null : `${weight} kg`;
  });

  protected readonly presentAddressLines = computed(() =>
    addressLines(this.applicant()?.present_address ?? null),
  );

  protected readonly permanentSameAsPresent = computed(() => {
    const a = this.applicant();
    if (!a) {
      return false;
    }
    return a.permanent_address === null || sameAddress(a.present_address, a.permanent_address);
  });

  protected readonly permanentAddressLines = computed(() => {
    const a = this.applicant();
    if (!a) {
      return [];
    }
    return this.permanentSameAsPresent()
      ? addressLines(a.present_address)
      : addressLines(a.permanent_address);
  });

  protected readonly applicantId = computed(() => this.applicant()?.id.slice(0, 8) ?? '');

  constructor() {
    // Scroll-spy: highlight the section nearest the top of the viewport.
    effect((onCleanup) => {
      const els = this.sectionEls();
      if (els.length === 0) {
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            this.activeSection.set(visible[0].target.id);
          }
        },
        { rootMargin: '-88px 0px -60% 0px', threshold: 0 },
      );
      for (const el of els) {
        observer.observe(el.nativeElement);
      }
      onCleanup(() => observer.disconnect());
    });

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

  protected scrollToSection(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  protected onViewResume(): void {
    // TODO: wire to the applicant's stored résumé once file persistence is available.
    this.snackBar.open('No résumé is available for this applicant yet.', 'Close', {
      duration: 3000,
    });
  }

  protected onGenerate(): void {
    const applicant = this.applicant();
    if (!applicant || this.generating()) {
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
    this.onSetStatus(change.match, change.status);
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
        this.recommendations()
          .filter((match) => match.status !== null && match.jobId)
          .map((match) => match.jobId as string),
      ),
  );

  /** "Manual referral" opens the full-page screening dialog to pick a job to refer. */
  protected onNewReferral(): void {
    const applicant = this.applicant();
    if (!applicant) {
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
    if (!applicant) {
      return;
    }
    if (this.referredJobIds().has(job.id)) {
      this.snackBar.open('Applicant is already referred to this job.', 'Close', { duration: 3000 });
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
