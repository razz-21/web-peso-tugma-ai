import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { COURSE_PROGRAM_GROUPS } from '../../../../core/constants/courses.constant';
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
  imports: [
    MatAutocompleteModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormField,
  ],
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

  /**
   * Course/program suggestions filtered by what's typed. Empty groups are
   * dropped. The field stays free-text, so off-list courses are still allowed.
   */
  protected readonly filteredCourseGroups = computed(() => {
    const query = this.education.course_program().value().trim().toLowerCase();
    if (!query) {
      return COURSE_PROGRAM_GROUPS;
    }
    return COURSE_PROGRAM_GROUPS.map((group) => ({
      category: group.category,
      courses: group.courses.filter((course) => course.toLowerCase().includes(query)),
    })).filter((group) => group.courses.length > 0);
  });

  protected error(field: FieldState): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }
}
