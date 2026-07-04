import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { CompanyGet } from '../../core/models/company.model';
import { APP_ROUTES } from '../../core/constants/routes.constant';
import { CompaniesStore } from '../../stores/companies/companies.store';
import { companiesEvents } from '../../stores/companies/companies.events';
import { CompaniesTableComponent } from './companies-table/companies-table.component';
import { CompanyFormComponent } from './company-form/company-form.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-companies',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    CompaniesTableComponent,
  ],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesComponent implements OnInit {
  protected readonly store = inject(CompaniesStore);
  private readonly dispatch = injectDispatch(companiesEvents);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly pageSizeOptions = [10, 25, 50] as const;

  public ngOnInit(): void {
    this.dispatch.loadCompany({ q: '', pageIndex: 0, pageSize: 10 });
  }

  protected onSearch(event: Event): void {
    this.dispatch.searchCompany((event.target as HTMLInputElement).value);
  }

  protected onPage(event: PageEvent): void {
    this.dispatch.loadCompany({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      q: this.store.filter.q(),
    });
  }

  protected onView(company: CompanyGet): void {
    this.router.navigate([APP_ROUTES.companies, company.id]);
  }

  protected onAddCompany(): void {
    this.dialog.open<CompanyFormComponent, CompanyGet | null, CompanyGet>(CompanyFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: null,
    });
  }

  protected onEdit(company: CompanyGet): void {
    this.dialog.open<CompanyFormComponent, CompanyGet, CompanyGet>(CompanyFormComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: company,
    });
  }

  protected onDelete(company: CompanyGet): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        width: '420px',
        maxWidth: '95vw',
        restoreFocus: true,
        data: {
          title: 'Delete company',
          message: `Are you sure you want to delete <strong>${company.company_name}</strong>? This action cannot be undone.`,
          confirmLabel: 'Delete',
          destructive: true,
        },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dispatch.deleteCompany(company.id);
        }
      });
  }
}
