import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { ApplicantGet } from '../../core/models/applicant.model';
import { applicantDetailsRoute } from '../../core/constants/routes.constant';
import { ApplicantsStore } from '../../stores/applicants/applicants.store';
import { applicantsEvents } from '../../stores/applicants/applicants.events';
import { ApplicantsTableComponent } from './applicants-table/applicants-table.component';
import { CreateApplicantComponent } from './create-applicant/create-applicant.component';
import { ImportApplicantsComponent } from './import-applicants/import-applicants.component';
import {
  ImportReviewComponent,
  ImportReviewData,
} from './import-applicants/import-review.component';
import { readImportRows, toReviewRows } from './import-applicants/import-review.model';

@Component({
  selector: 'app-applicants',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    ApplicantsTableComponent,
  ],
  templateUrl: './applicants.component.html',
  styleUrl: './applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicantsComponent implements OnInit {
  protected readonly store = inject(ApplicantsStore);
  private readonly dispatch = injectDispatch(applicantsEvents);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly pageSizeOptions = [10, 25, 50] as const;

  public ngOnInit(): void {
    this.dispatch.loadApplicant({ q: '', pageIndex: 0, pageSize: 10 });
  }

  protected onSearch(event: Event): void {
    this.dispatch.searchApplicant((event.target as HTMLInputElement).value);
  }

  protected onPage(event: PageEvent): void {
    this.dispatch.loadApplicant({
      pageIndex: event.pageIndex,
      pageSize: event.pageSize,
      q: this.store.filter.q(),
    });
  }

  protected onView(applicant: ApplicantGet): void {
    this.router.navigateByUrl(applicantDetailsRoute(applicant.id));
  }

  protected onAddApplicant(): void {
    this.dialog.open(CreateApplicantComponent, {
      panelClass: 'create-applicant-dialog',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Create applicant',
    });
  }

  protected onImport(): void {
    const dialogRef = this.dialog.open<ImportApplicantsComponent, unknown, File>(
      ImportApplicantsComponent,
      {
        panelClass: 'import-applicants-dialog',
        width: '640px',
        maxWidth: '92vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Import applicants',
      },
    );

    dialogRef.afterClosed().subscribe((file) => {
      if (!file) {
        return;
      }
      void this.openReview(file);
    });
  }

  private async openReview(file: File): Promise<void> {
    let rows;
    try {
      rows = toReviewRows(await readImportRows(file));
    } catch {
      this.snackBar.open('Could not read the import file.', 'Dismiss', { duration: 5000 });
      return;
    }

    if (rows.length === 0) {
      this.snackBar.open(
        'No applicant rows found. Fill in the template before importing.',
        'Dismiss',
        { duration: 6000 },
      );
      return;
    }

    const reviewRef = this.dialog.open<ImportReviewComponent, ImportReviewData>(
      ImportReviewComponent,
      {
        panelClass: 'import-review-dialog',
        width: '100vw',
        maxWidth: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Review imported applicants',
        data: { rows },
      },
    );

    reviewRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      // Imported applicants were persisted by the dialog — reload the first page
      // so the new records surface immediately.
      this.dispatch.loadApplicant({
        q: this.store.filter.q(),
        pageIndex: 0,
        pageSize: this.store.filter.pageSize(),
      });
    });
  }
}
