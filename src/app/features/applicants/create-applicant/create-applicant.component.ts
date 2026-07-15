import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogRef } from '@angular/material/dialog';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { ApplicantsStore } from '../../../stores/applicants/applicants.store';
import { applicantsEvents } from '../../../stores/applicants/applicants.events';
import { CreateApplicantHeaderComponent } from './create-applicant-header.component';
import { CreateApplicantStepperComponent } from './create-applicant-stepper.component';
import { CreateApplicantFooterComponent } from './create-applicant-footer.component';
import { ApplicantPersonalInfoComponent } from './applicant-personal-info/applicant-personal-info.component';
import { ApplicantJobPreferencesComponent } from './applicant-job-preferences/applicant-job-preferences.component';
import { ApplicantEducationComponent } from './applicant-education/applicant-education.component';
import { ApplicantEligibilityComponent } from './applicant-eligibility/applicant-eligibility.component';
import { ApplicantWorkExperienceComponent } from './applicant-work-experience/applicant-work-experience.component';
import { ApplicantSkillsComponent } from './applicant-skills/applicant-skills.component';
import { ApplicantTrainingsComponent } from './applicant-trainings/applicant-trainings.component';
import { ApplicantConfirmationComponent } from './applicant-confirmation/applicant-confirmation.component';
import { ApplicantUploadFilesComponent } from './applicant-upload-files/applicant-upload-files.component';
import { CreateApplicantDraftStore } from './create-applicant-draft.store';
import { WIZARD_STEPS } from './wizard-steps';

@Component({
  selector: 'app-create-applicant',
  imports: [
    CreateApplicantHeaderComponent,
    CreateApplicantStepperComponent,
    CreateApplicantFooterComponent,
    ApplicantPersonalInfoComponent,
    ApplicantJobPreferencesComponent,
    ApplicantEducationComponent,
    ApplicantEligibilityComponent,
    ApplicantWorkExperienceComponent,
    ApplicantSkillsComponent,
    ApplicantTrainingsComponent,
    ApplicantConfirmationComponent,
    ApplicantUploadFilesComponent,
  ],
  providers: [CreateApplicantDraftStore],
  templateUrl: './create-applicant.component.html',
  styleUrl: './create-applicant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApplicantComponent {
  private readonly dialogRef = inject<MatDialogRef<CreateApplicantComponent>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly events = inject(Events);
  private readonly dispatch = injectDispatch(applicantsEvents);
  protected readonly draft = inject(CreateApplicantDraftStore);
  protected readonly applicantsStore = inject(ApplicantsStore);

  protected readonly steps = WIZARD_STEPS;
  protected readonly currentIndex = signal(0);

  protected readonly currentStep = computed(() => this.steps[this.currentIndex()]);
  protected readonly stepNumber = computed(() => this.currentIndex() + 1);
  protected readonly stepLabel = computed(
    () => `Step ${this.stepNumber()} of ${this.steps.length} · ${this.currentStep().label}`,
  );
  protected readonly canBack = computed(() => this.currentIndex() > 0);
  protected readonly isLast = computed(() => this.currentIndex() === this.steps.length - 1);
  protected readonly submitting = this.applicantsStore.createApplicantLoading;

  constructor() {
    // Close the dialog once the applicant is created.
    this.events
      .on(applicantsEvents.createApplicantSuccess)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close());
  }

  protected goTo(index: number): void {
    this.currentIndex.set(index);
  }

  protected onBack(): void {
    this.currentIndex.update((i) => Math.max(0, i - 1));
  }

  protected onNext(): void {
    if (!this.draft.validateStep(this.currentStep().key)) {
      return;
    }

    if (this.isLast()) {
      this.submit();
      return;
    }
    this.currentIndex.update((i) => Math.min(this.steps.length - 1, i + 1));
  }

  private submit(): void {
    // Personal Information is the only step with required fields, so guard it
    // even when submitting from the confirmation step.
    if (!this.draft.validateStep('details')) {
      const detailsIndex = this.steps.findIndex((step) => step.key === 'details');
      if (detailsIndex >= 0) {
        this.currentIndex.set(detailsIndex);
      }
      return;
    }
    this.dispatch.createApplicant(this.draft.buildPayload());
  }

  protected onSaveDraft(): void {
    // TODO: persist a draft once draft storage is available.
  }

  protected onClose(): void {
    this.dialogRef.close();
  }
}
