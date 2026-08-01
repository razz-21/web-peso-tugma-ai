import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { injectDispatch } from '@ngrx/signals/events';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../../core/models/company.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { companiesEvents } from '../../../stores/companies/companies.events';
import { CompaniesStore } from '../../../stores/companies/companies.store';

@Component({
  selector: 'app-company-profile',
  imports: [MatButtonModule, MatIconModule, AvatarComponent],
  templateUrl: './company-profile.component.html',
  styleUrl: './company-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyProfileComponent {
  readonly company = input.required<CompanyGet>();

  readonly edit = output<CompanyGet>();
  readonly delete = output<CompanyGet>();

  private readonly dispatch = injectDispatch(companiesEvents);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly typeLabel = computed(() => COMPANY_TYPE_LABELS[this.company().company_type]);
  /** True while an avatar upload is in flight (shared companies store). */
  protected readonly uploading = inject(CompaniesStore).uploadAvatarLoading;

  protected onAvatarSelected(file: File): void {
    this.dispatch.uploadCompanyAvatar({ id: this.company().id, file });
  }

  protected onAvatarInvalid(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
