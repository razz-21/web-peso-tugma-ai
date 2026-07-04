import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormField, email, form, maxLength, required } from '@angular/forms/signals';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap } from 'rxjs';
import {
  COMPANY_NAME_MAX,
  COMPANY_TYPES,
  COMPANY_TYPE_LABELS,
  CONTACT_NUMBER_MAX,
  CompanyGet,
  CompanyPatch,
  CompanyPost,
  CompanyType,
} from '../../../core/models/company.model';
import { companiesEvents } from '../../../stores/companies/companies.events';
import { CompaniesStore } from '../../../stores/companies/companies.store';

type CompanyFormValue = {
  company_name: string;
  company_type: CompanyType;
  email: string;
  contact_number: string;
  address: string;
  description: string;
  avatar: string;
};

const INITIAL_VALUE: CompanyFormValue = {
  company_name: '',
  company_type: 'sole_proprietorship',
  email: '',
  contact_number: '',
  address: '',
  description: '',
  avatar: '',
};

@Component({
  selector: 'app-company-form',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormField,
  ],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormComponent {
  private readonly dispatch = injectDispatch(companiesEvents);
  private readonly dialogRef = inject<MatDialogRef<CompanyFormComponent, CompanyGet>>(MatDialogRef);
  private readonly events = inject(Events);
  private readonly company = inject<CompanyGet | null>(MAT_DIALOG_DATA);
  protected readonly companiesStore = inject(CompaniesStore);

  protected readonly isEdit = this.company !== null;

  protected readonly typeOptions: ReadonlyArray<{ value: CompanyType; label: string }> =
    COMPANY_TYPES.map((type) => ({ value: type, label: COMPANY_TYPE_LABELS[type] }));

  private readonly data = signal<CompanyFormValue>(
    this.company
      ? {
          company_name: this.company.company_name,
          company_type: this.company.company_type,
          email: this.company.email ?? '',
          contact_number: this.company.contact_number ?? '',
          address: this.company.address ?? '',
          description: this.company.description ?? '',
          avatar: this.company.avatar ?? '',
        }
      : INITIAL_VALUE,
  );

  protected readonly saving = computed(() =>
    this.isEdit
      ? this.companiesStore.updateCompanyLoading()
      : this.companiesStore.createCompanyLoading(),
  );

  protected readonly companyForm = form(this.data, (p) => {
    required(p.company_name, { message: 'Name is required' });
    maxLength(p.company_name, COMPANY_NAME_MAX, {
      message: `Name must be ${COMPANY_NAME_MAX} characters or fewer`,
    });

    required(p.company_type, { message: 'Type is required' });

    email(p.email, { message: 'Enter a valid email address' });

    maxLength(p.contact_number, CONTACT_NUMBER_MAX, {
      message: `Contact number must be ${CONTACT_NUMBER_MAX} characters or fewer`,
    });

    maxLength(p.address, 500, { message: 'Address must be 500 characters or fewer' });
    maxLength(p.description, 500, { message: 'Description must be 500 characters or fewer' });
    maxLength(p.avatar, 2048, { message: 'Avatar URL must be 2048 characters or fewer' });
  });

  protected readonly canSubmit = computed(() => !this.saving());

  protected readonly nameError = computed(() => this.fieldError(this.companyForm.company_name()));
  protected readonly typeError = computed(() => this.fieldError(this.companyForm.company_type()));
  protected readonly emailError = computed(() => this.fieldError(this.companyForm.email()));
  protected readonly contactError = computed(() =>
    this.fieldError(this.companyForm.contact_number()),
  );
  protected readonly addressError = computed(() => this.fieldError(this.companyForm.address()));
  protected readonly descriptionError = computed(() =>
    this.fieldError(this.companyForm.description()),
  );
  protected readonly avatarError = computed(() => this.fieldError(this.companyForm.avatar()));

  protected submit(event: Event): void {
    event.preventDefault();
    this.companyForm().markAsTouched();

    if (!this.companyForm().valid()) {
      return;
    }

    const value = this.companyForm().value();
    const email = value.email.trim();
    const contactNumber = value.contact_number.trim();
    const address = value.address.trim();
    const description = value.description.trim();
    const avatar = value.avatar.trim();

    const fields = {
      company_name: value.company_name.trim(),
      company_type: value.company_type,
      email: email || null,
      contact_number: contactNumber || null,
      address: address || null,
      description: description || null,
      avatar: avatar || null,
    };

    if (this.company) {
      const company: CompanyPatch = fields;
      this.dispatch.updateCompany({ id: this.company.id, company });
      return;
    }

    const payload: CompanyPost = fields;
    this.dispatch.createCompany(payload);
  }

  protected cancel(): void {
    this.dialogRef.close();
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

  #onSaveSuccess = rxMethod<unknown>(pipe(tap(() => this.dialogRef.close())))(
    this.events.on(companiesEvents.createCompanySuccess, companiesEvents.updateCompanySuccess),
  );
}
