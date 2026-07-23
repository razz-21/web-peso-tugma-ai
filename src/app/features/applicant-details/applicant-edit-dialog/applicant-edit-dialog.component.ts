import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { CIVIL_STATUSES, EMPLOYMENT_STATUSES, SEXES } from '../../../core/models/applicant.model';
import { CreateApplicantDraftStore } from '../../applicants/create-applicant/create-applicant-draft.store';
import {
  applicantToDraft,
  isPermanentSameAsPresent,
} from '../../applicants/create-applicant/applicant-draft.model';
import { ApplicantEducationComponent } from '../../applicants/create-applicant/applicant-education/applicant-education.component';
import { ApplicantSkillsComponent } from '../../applicants/create-applicant/applicant-skills/applicant-skills.component';
import { ApplicantTrainingsComponent } from '../../applicants/create-applicant/applicant-trainings/applicant-trainings.component';
import { ApplicantWorkExperienceComponent } from '../../applicants/create-applicant/applicant-work-experience/applicant-work-experience.component';
import { ApplicantJobPreferencesComponent } from '../../applicants/create-applicant/applicant-job-preferences/applicant-job-preferences.component';
import { applicantDetailsEvents } from '../../../stores/applicant-details/applicant-details.events';
import { ApplicantEditDialogData, FieldState } from '../types/applicant-edit-dialog.type';
import {
  SECTION_DESCRIPTIONS,
  SECTION_KEYS,
  buildSectionPatch,
} from '../utils/applicant-edit-dialog.util';

@Component({
  selector: 'app-applicant-edit-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    FormField,
    ApplicantEducationComponent,
    ApplicantSkillsComponent,
    ApplicantTrainingsComponent,
    ApplicantWorkExperienceComponent,
    ApplicantJobPreferencesComponent,
  ],
  templateUrl: './applicant-edit-dialog.component.html',
  styleUrl: './applicant-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CreateApplicantDraftStore],
})
export class ApplicantEditDialogComponent {
  protected readonly data = inject<ApplicantEditDialogData>(MAT_DIALOG_DATA);
  protected readonly store = inject(CreateApplicantDraftStore);
  private readonly dialogRef = inject(MatDialogRef<ApplicantEditDialogComponent>);
  private readonly dispatch = injectDispatch(applicantDetailsEvents);
  private readonly events = inject(Events);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sexOptions = SEXES;
  protected readonly civilStatusOptions = CIVIL_STATUSES;
  protected readonly employmentStatusOptions = EMPLOYMENT_STATUSES;
  protected readonly saving = signal(false);
  protected readonly description = SECTION_DESCRIPTIONS[this.data.section];

  constructor() {
    this.store.hydrate(
      applicantToDraft(this.data.applicant),
      isPermanentSameAsPresent(this.data.applicant),
    );

    this.events
      .on(applicantDetailsEvents.updateApplicantSuccess)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));

    this.events
      .on(applicantDetailsEvents.updateApplicantFailed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saving.set(false));
  }

  protected error(field: FieldState): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }

  protected save(): void {
    if (this.saving()) {
      return;
    }
    if (!this.store.validateFields(SECTION_KEYS[this.data.section] as string[])) {
      return;
    }
    const payload = this.store.buildPayload();
    const patch = buildSectionPatch(payload, this.data.section);
    this.saving.set(true);
    this.dispatch.updateApplicant({ id: this.data.applicant.id, patch });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
