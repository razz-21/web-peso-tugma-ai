import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { injectDispatch } from '@ngrx/signals/events';
import { ApplicantGet } from '../../core/models/applicant.model';
import { applicantDetailsRoute } from '../../core/constants/routes.constant';
import { ApplicantsStore } from '../../stores/applicants/applicants.store';
import { applicantsEvents } from '../../stores/applicants/applicants.events';
import { ApplicantsTableComponent } from './applicants-table/applicants-table.component';
import { CreateApplicantComponent } from './create-applicant/create-applicant.component';

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
}
