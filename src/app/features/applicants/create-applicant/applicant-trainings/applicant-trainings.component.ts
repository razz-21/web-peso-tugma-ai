import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormField } from '@angular/forms/signals';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

@Component({
  selector: 'app-applicant-trainings',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FormField,
  ],
  templateUrl: './applicant-trainings.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantTrainingsComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
}
