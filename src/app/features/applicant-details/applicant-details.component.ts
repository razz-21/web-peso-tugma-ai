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
  viewChildren,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { injectDispatch } from '@ngrx/signals/events';
import { Address, ApplicantGet } from '../../core/models/applicant.model';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { ApplicantDetailsStore } from '../../stores/applicant-details/applicant-details.store';
import { applicantDetailsEvents } from '../../stores/applicant-details/applicant-details.events';
import { applicantsEvents } from '../../stores/applicants/applicants.events';
import { DetailFieldComponent } from './detail-field/detail-field.component';
import { AssignedJobComponent } from './assigned-job/assigned-job.component';
import {
  ApplicantEditDialogComponent,
  ApplicantEditDialogData,
  EditSectionId,
} from './applicant-edit-dialog/applicant-edit-dialog.component';

interface SectionLink {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
}

interface JobMatchTag {
  readonly icon: string;
  readonly label: string;
}

/** A single AI-ranked job recommendation shown in the Recommended jobs list. */
interface JobMatch {
  readonly id: string;
  /** Fit score 0–100. */
  readonly score: number;
  /** Ring color, derived from the score band. */
  readonly color: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  /** Monthly salary in PHP. */
  readonly salary: number;
  readonly tags: readonly JobMatchTag[];
}

const RING_GREEN = '#4d6a24';
const RING_TEAL = '#3f7d88';
const RING_AMBER = '#9a7b1e';

/** Placeholder matches until the recommendation engine is wired to the backend. */
const MOCK_MATCHES: readonly JobMatch[] = [
  {
    id: 'frontend-developer',
    score: 96,
    color: RING_GREEN,
    title: 'Frontend Developer',
    company: 'Company 1sadadasd',
    location: 'Cagayan de Oro City',
    salary: 100000,
    tags: [
      { icon: 'edit', label: 'Skills match' },
      { icon: 'location_on', label: 'Preferred location' },
      { icon: 'payments', label: 'Above expectation' },
      { icon: 'school', label: 'Education met' },
    ],
  },
  {
    id: 'ui-ux-designer',
    score: 91,
    color: RING_GREEN,
    title: 'UI/UX Designer',
    company: 'Northwind Robotics',
    location: 'Remote',
    salary: 65000,
    tags: [
      { icon: 'edit', label: 'Skills match' },
      { icon: 'location_on', label: 'Preferred location' },
      { icon: 'payments', label: 'Above expectation' },
    ],
  },
  {
    id: 'web-developer',
    score: 84,
    color: RING_TEAL,
    title: 'Web Developer',
    company: 'Davao Tech Solutions',
    location: 'Davao City',
    salary: 55000,
    tags: [
      { icon: 'edit', label: 'Partial skills match' },
      { icon: 'location_on', label: 'Preferred location' },
      { icon: 'payments', label: 'Above expectation' },
    ],
  },
  {
    id: 'junior-software-engineer',
    score: 76,
    color: RING_TEAL,
    title: 'Junior Software Engineer',
    company: 'BrightPath Staffing',
    location: 'Cagayan de Oro City',
    salary: 38000,
    tags: [
      { icon: 'edit', label: 'Skills match' },
      { icon: 'location_on', label: 'Preferred location' },
      { icon: 'error_outline', label: 'Below salary expectation' },
    ],
  },
  {
    id: 'it-support-specialist',
    score: 68,
    color: RING_AMBER,
    title: 'IT Support Specialist',
    company: 'Cebu Pacific Logistics',
    location: 'Cagayan de Oro City',
    salary: 30000,
    tags: [
      { icon: 'location_on', label: 'Preferred location' },
      { icon: 'school', label: 'Education met' },
      { icon: 'error_outline', label: 'Different occupation' },
    ],
  },
];

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
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    AvatarComponent,
    DetailFieldComponent,
    AssignedJobComponent,
  ],
  templateUrl: './applicant-details.component.html',
  styleUrl: './applicant-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApplicantDetailsStore],
})
export class ApplicantDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly sections = SECTIONS;
  protected readonly store = inject(ApplicantDetailsStore);
  private readonly dispatch = injectDispatch(applicantDetailsEvents);
  private readonly applicantsDispatch = injectDispatch(applicantsEvents);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  protected readonly applicant = this.store.applicant;

  /** Recommended jobs are generated on demand; empty until the engine is wired. */
  protected readonly recommendations = signal<readonly JobMatch[]>([]);
  protected readonly generating = signal(false);
  /** When the current recommendations were generated, shown in the card footer. */
  protected readonly generatedAt = signal<Date | null>(null);
  /** Match shown in the details drawer. */
  protected readonly selectedMatch = signal<JobMatch | null>(null);

  protected selectMatch(match: JobMatch): void {
    this.selectedMatch.set(match);
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
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadApplicantDetails({ id });
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
    if (this.generating()) {
      return;
    }
    this.generating.set(true);
    // TODO: replace the mock delay with the AI recommendation endpoint.
    setTimeout(() => {
      this.recommendations.set(MOCK_MATCHES);
      this.generatedAt.set(new Date());
      this.generating.set(false);
    }, 700);
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

const addressLines = (address: Address | null): string[] => {
  if (!address) {
    return [];
  }
  return [address.house_no_street, address.baranggay, address.municipality_city, address.province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
};

const sameAddress = (a: Address, b: Address): boolean =>
  (a.house_no_street ?? '') === (b.house_no_street ?? '') &&
  (a.baranggay ?? '') === (b.baranggay ?? '') &&
  (a.municipality_city ?? '') === (b.municipality_city ?? '') &&
  (a.province ?? '') === (b.province ?? '');
