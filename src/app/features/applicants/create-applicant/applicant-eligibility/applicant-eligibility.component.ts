import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormField } from '@angular/forms/signals';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

@Component({
  selector: 'app-applicant-eligibility',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormField,
  ],
  templateUrl: './applicant-eligibility.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantEligibilityComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
}
