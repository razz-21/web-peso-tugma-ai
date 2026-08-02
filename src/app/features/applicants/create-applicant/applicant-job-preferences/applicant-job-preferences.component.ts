import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
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
    MatChipsModule,
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
  protected readonly separatorKeys = [ENTER, COMMA] as const;

  protected addLocation(event: MatChipInputEvent): void {
    this.store.addWorkLocation(event.value);
    event.chipInput.clear();
  }

  protected error(field: {
    touched: () => boolean;
    valid: () => boolean;
    errors: () => ReadonlyArray<{ message?: string }>;
  }): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }
}
