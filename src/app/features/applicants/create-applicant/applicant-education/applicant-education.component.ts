import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

type FieldState = {
  touched: () => boolean;
  valid: () => boolean;
  errors: () => ReadonlyArray<{ message?: string }>;
};

/** Selectable highest education levels. */
const EDUCATION_LEVELS = [
  'Elementary',
  'Junior High School',
  'Senior High School',
  'Vocational / Technical',
  "College / Bachelor's Degree",
  "Post-Graduate / Master's",
  'Doctorate',
] as const;

@Component({
  selector: 'app-applicant-education',
  imports: [MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormField],
  templateUrl: './applicant-education.component.html',
  styleUrl: '../wizard-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantEducationComponent {
  protected readonly store = inject(CreateApplicantDraftStore);
  protected readonly educationLevels = EDUCATION_LEVELS;

  protected get education() {
    return this.store.form.educational_background;
  }

  protected error(field: FieldState): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }
}
