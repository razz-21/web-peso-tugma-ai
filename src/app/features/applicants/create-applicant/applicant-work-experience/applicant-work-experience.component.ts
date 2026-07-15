import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

/** Common statuses of appointment for prior employment (PESO NSRP form). */
const APPOINTMENT_STATUSES = [
  'Permanent',
  'Probationary',
  'Contractual',
  'Casual',
  'Temporary',
  'Job Order',
  'Contract of Service',
  'Part-time',
  'Project-based',
  'Seasonal',
] as const;

@Component({
  selector: 'app-applicant-work-experience',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    FormField,
  ],
  templateUrl: './applicant-work-experience.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantWorkExperienceComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  protected readonly appointmentStatuses = APPOINTMENT_STATUSES;
}
