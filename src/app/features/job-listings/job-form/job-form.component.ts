import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormField, disabled, form, max, maxLength, min, required } from '@angular/forms/signals';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import {
  CIVIL_STATUS_OPTIONS,
  JOB_TITLE_MAX,
  JOB_VACANCIES_MAX,
  MINIMUM_EDUCATION_OPTIONS,
  SEXES,
  SEX_LABELS,
  JobGet,
  JobPatch,
  JobPost,
  JobStatus,
  Sex,
} from '../../../core/models/job.model';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../../core/models/company.model';
import { CompaniesService } from '../../../core/services/companies.service';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { jobsEvents } from '../../../stores/jobs/jobs.events';
import { JobsStore } from '../../../stores/jobs/jobs.store';

/** Dialog input for the job form. */
export interface JobFormData {
  /** Existing job to edit; omit or null to create a new one. */
  job?: JobGet | null;
  /**
   * Preselect and lock the company (create-under-company flow). When set, the
   * company select is pre-filled with this company and disabled.
   */
  lockedCompany?: CompanyGet | null;
}

/** Character limit shown under the description field. */
const DESCRIPTION_MAX = 2000;
/** Upper cap for the SMALLINT-backed monthly salary; guards obvious typos. */
const SALARY_MAX = 100_000_000;

type JobFormValue = {
  title: string;
  company_id: string;
  no_of_vacancies: number;
  salary_per_month: number | null;
  location: string;
  minimum_education_attainment: string[];
  course_program: string;
  experience_required: string;
  description: string;
  age_range: string;
  sex: Sex | '';
  civil_status: string[];
  eligibility: string;
};

const INITIAL_VALUE: JobFormValue = {
  title: '',
  company_id: '',
  no_of_vacancies: 1,
  salary_per_month: null,
  location: '',
  minimum_education_attainment: [],
  course_program: '',
  experience_required: '',
  description: '',
  age_range: '',
  sex: '',
  civil_status: [],
  eligibility: '',
};

@Component({
  selector: 'app-job-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormField,
    AvatarComponent,
  ],
  templateUrl: './job-form.component.html',
  styleUrl: './job-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobFormComponent {
  private readonly dispatch = injectDispatch(jobsEvents);
  private readonly dialogRef = inject<MatDialogRef<JobFormComponent, JobGet>>(MatDialogRef);
  private readonly events = inject(Events);
  private readonly companiesService = inject(CompaniesService);
  private readonly dialogData = inject<JobFormData | null>(MAT_DIALOG_DATA);
  protected readonly jobsStore = inject(JobsStore);

  private readonly job = this.dialogData?.job ?? null;

  /** When set (create-under-company flow), the company is preselected and locked. */
  private readonly lockedCompany = this.dialogData?.lockedCompany ?? null;
  protected readonly companyLocked = this.lockedCompany !== null;

  protected readonly isEdit = this.job !== null;

  /** Status has no control in this form; preserve on edit, default to active on create. */
  private readonly status: JobStatus = this.job?.status ?? 'active';

  protected readonly educationOptions = MINIMUM_EDUCATION_OPTIONS;
  protected readonly sexOptions = SEXES;
  protected readonly sexLabels = SEX_LABELS;
  protected readonly civilStatusOptions = CIVIL_STATUS_OPTIONS;

  /** Employer options for the company_id select, loaded on open. Seeded with the
   * locked company so its rich trigger renders before the full list resolves. */
  protected readonly companies = signal<CompanyGet[]>(
    this.lockedCompany ? [this.lockedCompany] : [],
  );

  /** Free-text filter applied to the company dropdown. */
  protected readonly companySearch = signal('');

  protected readonly filteredCompanies = computed(() => {
    const query = this.companySearch().trim().toLowerCase();
    const all = this.companies();
    if (!query) {
      return all;
    }
    return all.filter((company) => company.company_name.toLowerCase().includes(query));
  });

  private readonly data = signal<JobFormValue>(
    this.job
      ? {
          title: this.job.title,
          company_id: this.job.company?.id ?? '',
          no_of_vacancies: this.job.no_of_vacancies,
          salary_per_month: this.job.salary_per_month,
          location: this.job.location ?? '',
          minimum_education_attainment: this.job.minimum_education_attainment ?? [],
          course_program: this.job.course_program ?? '',
          experience_required: this.job.experience_required ?? '',
          description: this.job.description ?? '',
          age_range: this.job.age_range ?? '',
          sex: this.job.sex ?? '',
          civil_status: this.job.civil_status ?? [],
          eligibility: this.job.eligibility ?? '',
        }
      : { ...INITIAL_VALUE, company_id: this.lockedCompany?.id ?? '' },
  );

  /** The company backing the current selection, for the rich select trigger. */
  protected readonly selectedCompany = computed(() =>
    this.companies().find((company) => company.id === this.data().company_id),
  );

  protected readonly companyTypeLabels = COMPANY_TYPE_LABELS;

  /** Skills are edited as chips, so they live outside the signal form. */
  protected readonly skills = signal<string[]>(this.job?.skills_required ?? []);
  protected readonly separatorKeysCodes = [ENTER, COMMA] as const;

  protected readonly saving = computed(() =>
    this.isEdit ? this.jobsStore.updateJobLoading() : this.jobsStore.createJobLoading(),
  );

  protected readonly titleMax = JOB_TITLE_MAX;
  protected readonly titleLength = computed(() => this.data().title.length);
  protected readonly descriptionMax = DESCRIPTION_MAX;
  protected readonly descriptionLength = computed(() => this.data().description.length);

  protected readonly jobForm = form(this.data, (p) => {
    required(p.title, { message: 'Title is required' });
    maxLength(p.title, JOB_TITLE_MAX, {
      message: `Title must be ${JOB_TITLE_MAX} characters or fewer`,
    });

    required(p.company_id, { message: 'Company is required' });
    disabled(p.company_id, () => this.companyLocked);

    required(p.no_of_vacancies, { message: 'Vacancies is required' });
    min(p.no_of_vacancies, 1, { message: 'At least 1 vacancy' });
    max(p.no_of_vacancies, JOB_VACANCIES_MAX, {
      message: `No more than ${JOB_VACANCIES_MAX} vacancies`,
    });

    min(p.salary_per_month, 0, { message: 'Salary cannot be negative' });
    max(p.salary_per_month, SALARY_MAX, { message: 'Salary is too large' });

    maxLength(p.description, DESCRIPTION_MAX, {
      message: `Description must be ${DESCRIPTION_MAX} characters or fewer`,
    });
  });

  protected readonly canSubmit = computed(() => !this.saving());

  protected readonly titleError = computed(() => this.fieldError(this.jobForm.title()));
  protected readonly companyError = computed(() => this.fieldError(this.jobForm.company_id()));
  protected readonly vacanciesError = computed(() =>
    this.fieldError(this.jobForm.no_of_vacancies()),
  );
  protected readonly salaryError = computed(() => this.fieldError(this.jobForm.salary_per_month()));
  protected readonly descriptionError = computed(() => this.fieldError(this.jobForm.description()));

  constructor() {
    void this.loadCompanies();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.jobForm().markAsTouched();

    if (!this.jobForm().valid()) {
      return;
    }

    const value = this.jobForm().value();
    const courseProgram = value.course_program.trim();
    const experience = value.experience_required.trim();
    const description = value.description.trim();
    const ageRange = value.age_range.trim();
    const location = value.location.trim();
    const eligibility = value.eligibility.trim();

    const fields = {
      title: value.title.trim(),
      company_id: value.company_id,
      status: this.status,
      no_of_vacancies: value.no_of_vacancies,
      salary_per_month: value.salary_per_month ?? null,
      location: location || null,
      minimum_education_attainment: value.minimum_education_attainment,
      course_program: courseProgram || null,
      experience_required: experience || null,
      skills_required: this.skills(),
      description: description || null,
      age_range: ageRange || null,
      sex: value.sex || null,
      civil_status: value.civil_status,
      eligibility: eligibility || null,
    };

    if (this.job) {
      const job: JobPatch = fields;
      this.dispatch.updateJob({ id: this.job.id, job });
      return;
    }

    const payload: JobPost = fields;
    this.dispatch.createJob(payload);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected onCompanySearch(event: Event): void {
    this.companySearch.set((event.target as HTMLInputElement).value);
  }

  /** Clear the filter whenever the dropdown closes so it reopens showing all. */
  protected onCompanyOpened(opened: boolean): void {
    if (!opened) {
      this.companySearch.set('');
    }
  }

  protected addSkill(event: MatChipInputEvent): void {
    const skill = event.value.trim();
    if (skill && !this.skills().includes(skill)) {
      this.skills.update((current) => [...current, skill]);
    }
    event.chipInput.clear();
  }

  protected removeSkill(skill: string): void {
    this.skills.update((current) => current.filter((item) => item !== skill));
  }

  private async loadCompanies(): Promise<void> {
    try {
      const list = await this.companiesService.list({ limit: 100 });
      this.companies.set(list.items);
    } catch {
      // Non-fatal: the select just stays empty and the required validator blocks submit.
      this.companies.set([]);
    }
  }

  private fieldError(field: {
    touched: () => boolean;
    valid: () => boolean;
    errors: () => ReadonlyArray<{ message?: string }>;
  }): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }

  #onSaveSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close())))(
    this.events.on(jobsEvents.createJobSuccess, jobsEvents.updateJobSuccess),
  );
}
