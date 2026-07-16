import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { EMPLOYMENT_STATUSES } from '../../../../core/models/applicant.model';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

@Component({
  selector: 'app-applicant-job-preferences',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
  ],
  templateUrl: './applicant-job-preferences.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantJobPreferencesComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  protected readonly employmentStatusOptions = EMPLOYMENT_STATUSES;
}
