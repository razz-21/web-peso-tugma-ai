import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../../core/models/company.model';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { CompaniesStore } from '../../../stores/companies/companies.store';

interface CompanyRow {
  company: CompanyGet;
  typeLabel: string;
}

@Component({
  selector: 'app-companies-table',
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './companies-table.component.html',
  styleUrl: './companies-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesTableComponent {
  private readonly companiesStore = inject(CompaniesStore);

  readonly view = output<CompanyGet>();
  readonly edit = output<CompanyGet>();
  readonly delete = output<CompanyGet>();

  protected readonly companies = computed(() => this.companiesStore.companies());
  protected readonly loading = computed(() => this.companiesStore.loading());

  protected readonly rows = computed<CompanyRow[]>(() =>
    this.companies().map((company) => ({
      company,
      typeLabel: COMPANY_TYPE_LABELS[company.company_type],
    })),
  );

  protected readonly displayedColumns = [
    'company_name',
    'company_type',
    'email',
    'created_at',
    'updated_at',
    'actions',
  ] as const;
}
