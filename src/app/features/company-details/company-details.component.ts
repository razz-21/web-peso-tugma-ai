import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { injectDispatch } from '@ngrx/signals/events';
import { CompanyGet } from '../../core/models/company.model';
import { JobGet } from '../../core/models/job.model';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { CompanyDetailsStore } from '../../stores/company-details/company-details.store';
import { companyDetailsEvents } from '../../stores/company-details/company-details.events';
import { companiesEvents } from '../../stores/companies/companies.events';
import { MeStore } from '../../stores/me/me.store';
import { CompanyFormComponent } from '../companies/company-form/company-form.component';
import { CompanyProfileComponent } from './company-profile/company-profile.component';
import { CompanyJobsComponent } from './company-jobs/company-jobs.component';
import { CompanyApplicantsComponent } from './company-applicants/company-applicants.component';
import { CompanyJobDetailsComponent } from './company-job-details/company-job-details.component';

@Component({
  selector: 'app-company-details',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTabsModule,
    CompanyProfileComponent,
    CompanyJobsComponent,
    CompanyApplicantsComponent,
    CompanyJobDetailsComponent,
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
  private readonly meStore = inject(MeStore);

  /** Job shown in the details drawer. */
  protected readonly selectedJob = signal<JobGet | null>(null);

  /**
   * Whether the signed-in user may delete this company. Only admins / super
   * admins qualify — officers can view and edit but can't remove companies.
   * Mirrored by the backend, which rejects the delete for other roles with a 403.
   */
  protected readonly canDelete = computed(() => {
    const role = this.meStore.user()?.role;
    return role === 'super_admin' || role === 'admin';
  });

  protected onViewJob(job: JobGet): void {
    this.selectedJob.set(job);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatch.loadCompanyDetails({ id });
    }
  }

  protected onEdit(company: CompanyGet): void {
    // The store applies the update directly via companiesEvents.updateCompanySuccess,
    // so there's nothing to do on close.
    this.dialog.open<CompanyFormComponent, CompanyGet, CompanyGet>(CompanyFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: company,
    });
  }

  protected onDelete(company: CompanyGet): void {
    // Defense in depth: the button is hidden for officers and the backend
    // enforces the role, but guard here too in case the handler is reached.
    if (!this.canDelete()) {
      return;
    }
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
