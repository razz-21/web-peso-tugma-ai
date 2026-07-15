import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormField } from '@angular/forms/signals';
import { SEXES } from '../../../../core/models/applicant.model';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

type FieldState = {
  touched: () => boolean;
  valid: () => boolean;
  errors: () => ReadonlyArray<{ message?: string }>;
};

@Component({
  selector: 'app-applicant-personal-info',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    FormField,
  ],
  templateUrl: './applicant-personal-info.component.html',
  styleUrl: './applicant-personal-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantPersonalInfoComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  protected readonly sexOptions = SEXES;

  protected error(field: FieldState): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }
}
