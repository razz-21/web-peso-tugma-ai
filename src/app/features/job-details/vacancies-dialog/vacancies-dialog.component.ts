import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { JOB_VACANCIES_MAX, JobGet } from '../../../core/models/job.model';
import { jobDetailsEvents } from '../../../stores/job-details/job-details.events';

/** Dialog input: the job whose vacancy count is being edited. */
export interface VacanciesDialogData {
  job: JobGet;
}

@Component({
  selector: 'app-vacancies-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormField,
  ],
  templateUrl: './vacancies-dialog.component.html',
  styleUrl: './vacancies-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacanciesDialogComponent {
  protected readonly data = inject<VacanciesDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<VacanciesDialogComponent, boolean>>(MatDialogRef);
  private readonly dispatch = injectDispatch(jobDetailsEvents);
  private readonly events = inject(Events);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly vacanciesMax = JOB_VACANCIES_MAX;
  protected readonly saving = signal(false);

  private readonly value = signal<{ no_of_vacancies: number }>({
    no_of_vacancies: this.data.job.no_of_vacancies,
  });

  protected readonly vacanciesForm = form(this.value, (p) => {
    required(p.no_of_vacancies, { message: 'Vacancies is required' });
    min(p.no_of_vacancies, 1, { message: 'At least 1 vacancy' });
    max(p.no_of_vacancies, JOB_VACANCIES_MAX, {
      message: `No more than ${JOB_VACANCIES_MAX} vacancies`,
    });
  });

  protected readonly vacanciesError = computed(() =>
    this.fieldError(this.vacanciesForm.no_of_vacancies()),
  );

  constructor() {
    this.events
      .on(jobDetailsEvents.updateVacanciesSuccess)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dialogRef.close(true));

    this.events
      .on(jobDetailsEvents.updateVacanciesFailed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saving.set(false));
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.saving()) {
      return;
    }

    this.vacanciesForm().markAsTouched();
    if (!this.vacanciesForm().valid()) {
      return;
    }

    const no_of_vacancies = this.vacanciesForm().value().no_of_vacancies;
    this.saving.set(true);
    this.dispatch.updateVacancies({ id: this.data.job.id, no_of_vacancies });
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  private fieldError(field: {
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
