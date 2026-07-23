import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, from, switchMap } from 'rxjs';
import { JobGet } from '../../../core/models/job.model';
import { JobsService } from '../../../core/services/jobs.service';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import {
  EligibilityView,
  ExperienceItem,
  GateRow,
  GateState,
  JobCard,
  ManualReferralDialogData,
  StatCell,
  TwoLine,
} from '../types/manual-referral.type';
import { BOTH_SEXES, ageRangeLabel, parseAgeRange } from '../utils/age.util';
import {
  GATE_STATE_LABEL,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  availabilityHint,
  monthsBetween,
  totalExperienceMonths,
  yearsLabel,
  yearsShort,
} from '../utils/manual-referral.util';
import { joinList, norm } from '../utils/text.util';

@Component({
  selector: 'app-manual-referral',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, AvatarComponent],
  templateUrl: './manual-referral.component.html',
  styleUrl: './manual-referral.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualReferralComponent {
  private readonly data = inject<ManualReferralDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ManualReferralComponent>);
  private readonly jobsService = inject(JobsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  protected readonly applicant = this.data.applicant;

  /** Free-text query, sent to the workspace jobs API (debounced). */
  protected readonly query = signal('');

  // --- Workspace jobs (right pane) -----------------------------------------

  /** Raw jobs returned by the workspace API for the current query. */
  private readonly rawJobs = signal<readonly JobGet[]>([]);
  /** Total matching jobs the workspace holds (before the page cap). */
  protected readonly total = signal(0);
  protected readonly loading = signal(true);

  private readonly search$ = new Subject<string>();

  constructor() {
    // Debounce keystrokes, then screen the workspace's jobs against the applicant.
    this.search$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap((q) => from(this.jobsService.list({ limit: PAGE_SIZE, q: q || undefined }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (list) => {
          this.rawJobs.set(list.items);
          this.total.set(list.total);
          this.loading.set(false);
        },
        error: () => {
          this.rawJobs.set([]);
          this.total.set(0);
          this.loading.set(false);
        },
      });
    this.search$.next('');
  }

  // --- Referring applicant summary (left rail) -----------------------------

  protected readonly applicantName = computed(
    () =>
      [
        this.applicant.firstname,
        this.applicant.middlename,
        this.applicant.lastname,
        this.applicant.suffix,
      ]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(' ') || 'Unnamed applicant',
  );

  private readonly age = computed<number | null>(() => {
    const dob = this.applicant.date_of_birth;
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

  private readonly city = computed(() => this.applicant.present_address?.municipality_city ?? null);

  /** Sub-line under the name: "27 · Female · El Salvador City". */
  protected readonly applicantMeta = computed(() =>
    [this.age()?.toString() ?? null, this.applicant.sex, this.city()].filter(
      (part): part is string => Boolean(part),
    ),
  );

  /** Whole months of logged work experience. */
  private readonly experienceMonths = computed(() => totalExperienceMonths(this.applicant));

  /** 2×2 quick-stats grid at the top of the rail. */
  protected readonly stats = computed<readonly StatCell[]>(() => {
    const salary = this.applicantSalary();
    const months = this.experienceMonths();
    const positions = this.applicant.work_experience.length;
    const level = this.applicant.educational_background?.highest_education_level?.trim();
    const status = this.applicant.employment_status?.trim();

    return [
      {
        icon: 'payments',
        label: 'Expects',
        value: salary === null ? '—' : `₱${salary.toLocaleString('en-PH')}`,
        sub: salary === null ? 'not stated' : 'per month',
        accent: salary !== null,
      },
      {
        icon: 'work',
        label: 'Experience',
        value: months > 0 ? yearsLabel(months) : 'None',
        sub:
          positions === 0
            ? 'no roles'
            : `${positions} ${positions === 1 ? 'position' : 'positions'}`,
      },
      {
        icon: 'school',
        label: 'Education',
        value: level || '—',
        sub: 'highest level',
      },
      {
        icon: 'schedule',
        label: 'Status',
        value: status || '—',
        sub: availabilityHint(this.applicant.employment_status),
      },
    ];
  });

  /** Every desired role the applicant listed, de-duplicated. */
  protected readonly desiredRoles = computed<readonly string[]>(() => {
    const seen = new Set<string>();
    const roles: string[] = [];
    for (const item of this.applicant.preferred_occupation_industry) {
      const role = item.occupation?.trim();
      if (role && !seen.has(role.toLowerCase())) {
        seen.add(role.toLowerCase());
        roles.push(role);
      }
    }
    return roles;
  });

  protected readonly educationLevel = computed(
    () => this.applicant.educational_background?.highest_education_level?.trim() || null,
  );

  protected readonly educationCourse = computed(
    () => this.applicant.educational_background?.course_program?.trim() || null,
  );

  protected readonly skills = computed(() => this.applicant.technical_skills);

  protected readonly preferredLocations = computed(() => this.applicant.preferred_work_location);

  /** Full work-experience list, most-recent as entered. */
  protected readonly workExperience = computed<readonly ExperienceItem[]>(() =>
    this.applicant.work_experience.map((work) => ({
      position: work.position?.trim() || 'Position',
      company: work.company?.trim() || null,
      period: this.periodLabel(work.start_date, work.end_date),
      status: work.status_of_appointment?.trim() || null,
    })),
  );

  /** Total logged experience as a compact badge, e.g. "5 yrs". */
  protected readonly experienceBadge = computed(() =>
    this.experienceMonths() > 0 ? yearsShort(this.experienceMonths()) : null,
  );

  /** Format a role's date span: "Jul 2021 – Jul 2026 · 5 yrs". */
  private periodLabel(start: string | null | undefined, end: string | null | undefined): string {
    const startDate = start ? new Date(start) : null;
    const hasStart = startDate !== null && !Number.isNaN(startDate.getTime());
    const startFmt = hasStart ? (this.datePipe.transform(startDate, 'MMM y') ?? '') : '';
    const endDate = end ? new Date(end) : null;
    const hasEnd = endDate !== null && !Number.isNaN(endDate.getTime());
    const endFmt = hasEnd ? (this.datePipe.transform(endDate, 'MMM y') ?? '') : 'Present';
    const range = [startFmt, endFmt].filter(Boolean).join(' – ');
    if (hasStart) {
      const months = monthsBetween(startDate, hasEnd ? endDate : new Date());
      if (months > 0) {
        return `${range} · ${yearsShort(months)}`;
      }
    }
    return range;
  }

  /** Eligibility / licenses list. */
  protected readonly eligibilities = computed<readonly TwoLine[]>(() =>
    this.applicant.eligibility.map((item) => ({
      title: item.title?.trim() || 'Eligibility',
      sub: item.license_number?.trim() ? `License no. ${item.license_number.trim()}` : null,
    })),
  );

  // --- Screened jobs (right pane) ------------------------------------------

  /** Applicant's stated monthly salary expectation as a number (null if none). */
  private readonly applicantSalary = computed<number | null>(() => {
    const raw = this.applicant.salary_expectation?.trim();
    if (!raw) {
      return null;
    }
    const value = Number(raw.replace(/[^\d.]/g, ''));
    return Number.isNaN(value) ? null : value;
  });

  /** All jobs from the workspace (already capped at 10 by the API), screened. */
  protected readonly jobs = computed<readonly JobCard[]>(() => {
    const referred = this.data.referredJobIds();
    return this.rawJobs().map((job) => this.toCard(job, referred.has(job.id)));
  });

  /** The expanded card's id; defaults to the first job. */
  protected readonly openId = signal<string | null>(null);

  protected readonly firstId = computed(() => this.jobs()[0]?.id ?? null);

  protected isOpen(id: string): boolean {
    const open = this.openId();
    return open === null ? id === this.firstId() : open === id;
  }

  protected toggle(id: string): void {
    this.openId.update((current) => {
      const effective = current === null ? this.firstId() : current;
      return effective === id ? '' : id;
    });
  }

  protected onSearch(value: string): void {
    this.query.set(value);
    this.openId.set(null);
    this.loading.set(true);
    this.search$.next(value);
  }

  protected refer(job: JobGet): void {
    this.data.onRefer(job);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private toCard(job: JobGet, referred: boolean): JobCard {
    const salaryText =
      job.salary_per_month === null ? null : `₱${job.salary_per_month.toLocaleString('en-US')}/mo`;
    const vacancyText = `${job.no_of_vacancies} ${
      job.no_of_vacancies === 1 ? 'vacancy' : 'vacancies'
    }`;
    const companyName = job.company?.company_name ?? '—';
    const headerSegments = [companyName, job.location, salaryText, vacancyText].filter(
      (segment): segment is string => Boolean(segment),
    );

    // --- Job requirement details ------------------------------------------
    const experienceText = job.experience_required?.trim() || 'No experience required';
    const educationText =
      job.minimum_education_attainment.length > 0
        ? job.minimum_education_attainment.join(', ')
        : 'No minimum education';
    const location = job.location?.trim() ?? '';
    const locationText = location.length > 0 ? location : 'No location specified';

    // --- Primary requirements (hard gates) ---------------------------------
    const gates: GateRow[] = [
      this.vacancyGate(job.no_of_vacancies),
      this.ageGate(job.age_range),
      this.sexGate(job.sex),
      this.civilStatusGate(job.civil_status),
    ];
    const primaryMet = gates.every((gate) => gate.state !== 'fail');

    return {
      id: job.id,
      job,
      title: job.title,
      companyName,
      seed: job.company?.id ?? job.id,
      headerSegments,
      referred,
      skillsRequired: job.skills_required,
      experienceText,
      educationText,
      locationText,
      salaryText: salaryText ?? 'Salary not specified',
      primaryMet,
      gates,
      eligibility: this.eligibilityView(job.eligibility),
    };
  }

  private gate(
    key: string,
    label: string,
    icon: string,
    state: GateState,
    reason: string,
  ): GateRow {
    return { key, label, icon, state, reason, stateLabel: GATE_STATE_LABEL[state] };
  }

  private vacancyGate(vacancies: number): GateRow {
    if (vacancies > 0) {
      return this.gate(
        'vacancies',
        'Vacancies',
        'event_seat',
        'pass',
        `${vacancies} open ${vacancies === 1 ? 'position' : 'positions'}`,
      );
    }
    return this.gate('vacancies', 'Vacancies', 'event_seat', 'fail', 'No open positions left');
  }

  private ageGate(ageRange: string | null): GateRow {
    const range = ageRange?.trim() ?? '';
    if (range.length === 0) {
      return this.gate('age', 'Age range', 'cake', 'na', 'Open to all ages');
    }
    const [low, high] = parseAgeRange(range);
    if (low === null && high === null) {
      return this.gate('age', 'Age range', 'cake', 'na', `No age limit ("${range}")`);
    }
    const age = this.age();
    if (age === null) {
      return this.gate('age', 'Age range', 'cake', 'unknown', 'Applicant birth date not on file');
    }
    const label = ageRangeLabel(low, high);
    const withinLow = low === null || age >= low;
    const withinHigh = high === null || age <= high;
    return withinLow && withinHigh
      ? this.gate('age', 'Age range', 'cake', 'pass', `Age ${age} fits ${label}`)
      : this.gate('age', 'Age range', 'cake', 'fail', `Age ${age} is outside ${label}`);
  }

  private sexGate(sex: string | null): GateRow {
    const required = sex?.trim() ?? '';
    if (required.length === 0 || required.toLowerCase() === BOTH_SEXES) {
      return this.gate('sex', 'Sex', 'wc', 'na', 'Open to all applicants');
    }
    const applicantSex = this.applicant.sex?.trim() ?? '';
    if (applicantSex.length === 0) {
      return this.gate('sex', 'Sex', 'wc', 'unknown', 'Applicant sex not on file');
    }
    const matches =
      applicantSex.toLowerCase() === BOTH_SEXES ||
      applicantSex.toLowerCase() === required.toLowerCase();
    return matches
      ? this.gate('sex', 'Sex', 'wc', 'pass', `Applicant is ${applicantSex}`)
      : this.gate('sex', 'Sex', 'wc', 'fail', `Requires ${required}, applicant is ${applicantSex}`);
  }

  private civilStatusGate(allowed: readonly string[]): GateRow {
    if (allowed.length === 0) {
      return this.gate(
        'civil_status',
        'Civil status',
        'diversity_1',
        'na',
        'No civil status requirement',
      );
    }
    const applicantCivil = this.applicant.civil_status?.trim() ?? '';
    if (applicantCivil.length === 0) {
      return this.gate(
        'civil_status',
        'Civil status',
        'diversity_1',
        'unknown',
        'Applicant civil status not on file',
      );
    }
    const matches = allowed.some((status) => norm(status) === norm(applicantCivil));
    return matches
      ? this.gate(
          'civil_status',
          'Civil status',
          'diversity_1',
          'pass',
          `${applicantCivil} is accepted`,
        )
      : this.gate(
          'civil_status',
          'Civil status',
          'diversity_1',
          'fail',
          `Requires ${joinList(allowed)}`,
        );
  }

  private eligibilityView(eligibility: string | null): EligibilityView {
    const required = eligibility?.trim() ?? '';
    const applicantHeld = this.applicant.eligibility
      .map((item) => item.title?.trim())
      .filter((title): title is string => Boolean(title));

    if (required.length === 0) {
      return {
        hasRequirement: false,
        required: null,
        applicantHeld,
        state: 'na',
        badge: 'No requirement',
        reason: 'This job lists no eligibility requirement.',
      };
    }
    // Held if any of the applicant's eligibilities overlaps the requirement text.
    const requiredNorm = norm(required);
    const eligible = applicantHeld.some((held) => {
      const heldNorm = norm(held);
      return (
        heldNorm === requiredNorm ||
        requiredNorm.includes(heldNorm) ||
        heldNorm.includes(requiredNorm)
      );
    });
    if (eligible) {
      return {
        hasRequirement: true,
        required,
        applicantHeld,
        state: 'pass',
        badge: 'Eligible',
        reason: `Applicant holds ${joinList(applicantHeld)}.`,
      };
    }
    return {
      hasRequirement: true,
      required,
      applicantHeld,
      state: 'fail',
      badge: 'Not eligible',
      reason:
        applicantHeld.length > 0
          ? `Applicant holds ${joinList(applicantHeld)}, which does not match the requirement.`
          : 'Applicant has no matching eligibility on file.',
    };
  }
}
