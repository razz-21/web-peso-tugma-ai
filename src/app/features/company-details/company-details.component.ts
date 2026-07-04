import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { injectDispatch } from '@ngrx/signals/events';
import { COMPANY_TYPE_LABELS, CompanyGet } from '../../core/models/company.model';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { CompanyDetailsStore } from '../../stores/company-details/company-details.store';
import { companyDetailsEvents } from '../../stores/company-details/company-details.events';
import { companiesEvents } from '../../stores/companies/companies.events';
import { CompanyFormComponent } from '../companies/company-form/company-form.component';
import { JOB_STATUS_LABELS, MOCK_COMPANY_JOBS } from './company-jobs.mock';

@Component({
  selector: 'app-company-details',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    AvatarComponent,
  ],
  templateUrl: './company-details.component.html',
  styleUrl: './company-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CompanyDetailsStore],
})
export class CompanyDetailsComponent implements OnInit {
  protected readonly routes = APP_ROUTES;
  protected readonly store = inject(CompanyDetailsStore);
  private readonly dispatch = injectDispatch(companyDetailsEvents);
  private readonly companiesDispatch = injectDispatch(companiesEvents);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly jobs = MOCK_COMPANY_JOBS.map((job) => ({
    ...job,
    statusLabel: JOB_STATUS_LABELS[job.status],
  }));
  protected readonly displayedColumns = [
    'title',
    'description',
    'location',
    'vacancies',
    'status',
  ] as const;

  protected readonly typeLabel = computed(() => {
    const company = this.store.company();
    return company ? COMPANY_TYPE_LABELS[company.company_type] : '';
  });

  /** Open roles and total applicants are derived from the mock job list. */
  protected readonly openRoles = computed(
    () => this.jobs.filter((job) => job.status === 'open').length,
  );
  protected readonly totalApplied = computed(() =>
    this.jobs.reduce((sum, job) => sum + job.applicants, 0),
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadCompanyDetails({ id });
    }
  }

  protected onEdit(company: CompanyGet): void {
    this.dialog
      .open<CompanyFormComponent, CompanyGet, CompanyGet>(CompanyFormComponent, {
        width: '520px',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        data: company,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.dispatch.loadCompanyDetails({ id: company.id }));
  }

  protected onDelete(company: CompanyGet): void {
    const data: ConfirmDialogData = {
      title: 'Delete company',
      message: `Are you sure you want to delete <strong>${company.company_name}</strong>? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    };

    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.companiesDispatch.deleteCompany(company.id);
          this.router.navigate([APP_ROUTES.companies]);
        }
      });
  }
}
