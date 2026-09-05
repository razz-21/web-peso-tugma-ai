import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompanyGet } from '../../../core/models/company.model';
import { CompanyApplicant } from '../../../core/models/company-applicant.model';
import {
  RECOMMENDED_JOB_STATUS_LABEL,
  RecommendedJobStatus,
} from '../../../core/models/recommended-job.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';
import { CompanyDetailsStore } from '../../../stores/company-details/company-details.store';
import { applicantDetailsRoute } from '../../../core/constants/routes.constant';

/** Pill color class per referral status (see the component's SCSS). */
const STATUS_CLASS: Record<RecommendedJobStatus, string> = {
  referred: 'company-applicants__status--referred',
  interview_scheduled: 'company-applicants__status--interviewed',
  hired: 'company-applicants__status--hired',
  withdrawn: 'company-applicants__status--withdrawn',
  not_hired: 'company-applicants__status--not-hired',
  resigned: 'company-applicants__status--resigned',
};

/** A referred applicant flattened into the fields the table renders. */
interface ApplicantRow {
  /** Referral (recommended-job) id — the row key. */
  id: string;
  /** Applicant id for the avatar seed and the view navigation (null if gone). */
  applicantId: string | null;
  name: string;
  referredTo: string;
  statusLabel: string;
  statusClass: string;
  dateReferred: string;
}

@Component({
  selector: 'app-company-applicants',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    AvatarComponent,
    EmptyStateComponent,
  ],
  templateUrl: './company-applicants.component.html',
  styleUrl: './company-applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyApplicantsComponent {
  /** The company whose referred applicants are listed. */
  readonly company = input.required<CompanyGet>();

  // The applicant list lives in CompanyDetailsStore (loaded alongside the company).
  private readonly store = inject(CompanyDetailsStore);
  private readonly router = inject(Router);

  protected readonly loading = this.store.applicantsLoading;
  protected readonly search = signal('');

  /** All referred applicants mapped into table rows. */
  private readonly rows = computed<ApplicantRow[]>(() =>
    this.store.applicants().map((referral) => rowOf(referral)),
  );

  /** Rows matching the search box, filtered client-side by name and job. */
  protected readonly filteredRows = computed(() => {
    const query = this.search().trim().toLowerCase();
    const rows = this.rows();
    if (!query) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) || row.referredTo.toLowerCase().includes(query),
    );
  });

  /** Empty-state title when a search yields no matches. */
  protected readonly noMatchTitle = computed(() => `No applicants match "${this.search().trim()}"`);

  protected readonly displayedColumns = [
    'applicant',
    'referred_to',
    'status',
    'date_referred',
    'actions',
  ] as const;

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onView(row: ApplicantRow): void {
    if (row.applicantId) {
      void this.router.navigate([applicantDetailsRoute(row.applicantId)]);
    }
  }
}

const rowOf = (referral: CompanyApplicant): ApplicantRow => ({
  id: referral.id,
  applicantId: referral.applicant?.id ?? null,
  name: referral.applicant?.name ?? '—',
  referredTo: referral.referred_to ?? '—',
  statusLabel: RECOMMENDED_JOB_STATUS_LABEL[referral.status],
  statusClass: STATUS_CLASS[referral.status],
  dateReferred: referral.date_referred,
});
