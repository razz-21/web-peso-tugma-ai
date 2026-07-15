import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';
import { toDateString } from '../applicant-draft.model';

@Component({
  selector: 'app-applicant-confirmation',
  templateUrl: './applicant-confirmation.component.html',
  styleUrl: './applicant-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantConfirmationComponent {
  private readonly store = inject(CreateApplicantDraftStore);

  protected readonly draft = computed(() => this.store.form().value());

  protected readonly fullName = computed(() => {
    const d = this.draft();
    return [d.firstname, d.middlename, d.lastname, d.suffix]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join(' ');
  });

  protected readonly rows = computed(() => {
    const d = this.draft();
    return [
      { label: 'Name', value: this.fullName() || '—' },
      { label: 'Email', value: d.email_address || '—' },
      { label: 'Primary mobile', value: d.primary_mobile_number || '—' },
      { label: 'Date of birth', value: toDateString(d.date_of_birth) ?? '—' },
      { label: 'Sex', value: d.sex || '—' },
      { label: 'Occupations', value: `${d.preferred_occupation_industry.length}` },
      { label: 'Work locations', value: `${d.preferred_work_location.length}` },
      { label: 'Eligibilities', value: `${d.eligibility.length}` },
      { label: 'Work experience', value: `${d.work_experience.length}` },
      { label: 'Skills', value: `${d.technical_skills.length}` },
      { label: 'Trainings', value: `${d.trainings.length}` },
    ];
  });
}
