import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField } from '@angular/forms/signals';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

@Component({
  selector: 'app-applicant-job-preferences',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './applicant-job-preferences.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantJobPreferencesComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
}
