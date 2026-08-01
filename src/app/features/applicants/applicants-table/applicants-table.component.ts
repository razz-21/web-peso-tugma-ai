import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { APPLICANT_STATUS_LABELS, ApplicantGet } from '../../../core/models/applicant.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';
import { ApplicantsStore } from '../../../stores/applicants/applicants.store';

interface ApplicantRow {
  applicant: ApplicantGet;
  fullName: string;
  occupationLabel: string;
  educationLabel: string;
  statusLabel: string;
  isActive: boolean;
}

@Component({
  selector: 'app-applicants-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './applicants-table.component.html',
  styleUrl: './applicants-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantsTableComponent {
  private readonly applicantsStore = inject(ApplicantsStore);

  readonly view = output<ApplicantGet>();

  protected readonly applicants = computed(() => this.applicantsStore.applicants());
  protected readonly loading = computed(() => this.applicantsStore.loading());

  protected readonly rows = computed<ApplicantRow[]>(() =>
    this.applicants().map((applicant) => ({
      applicant,
      fullName: fullNameOf(applicant),
      occupationLabel: occupationLabelOf(applicant),
      educationLabel: applicant.educational_background?.highest_education_level || '—',
      statusLabel: APPLICANT_STATUS_LABELS[applicant.status || 'active'],
      isActive: (applicant.status || 'active') === 'active',
    })),
  );

  protected readonly displayedColumns = [
    'name',
    'email',
    'occupation',
    'education',
    'status',
    'updated_at',
    'actions',
  ] as const;
}

const fullNameOf = (applicant: ApplicantGet): string =>
  [applicant.firstname, applicant.lastname].filter(Boolean).join(' ').trim();

const occupationLabelOf = (applicant: ApplicantGet): string => {
  const occupations = applicant.preferred_occupation_industry
    .map((item) => item.occupation?.trim())
    .filter((occupation): occupation is string => Boolean(occupation));
  return occupations.length > 0 ? occupations.join(', ') : '—';
};
