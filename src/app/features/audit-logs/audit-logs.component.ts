import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { injectDispatch } from '@ngrx/signals/events';
import { AuditEntity } from '../../core/models/audit-log.model';
import { auditLogsEvents } from '../../stores/audit-logs/audit-logs.events';
import { AuditLogsStore } from '../../stores/audit-logs/audit-logs.store';

/** A filter chip; `null` is the "All" chip. */
interface AuditFilter {
  label: string;
  value: AuditEntity | null;
}

@Component({
  selector: 'app-audit-logs',
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent implements OnInit {
  protected readonly store = inject(AuditLogsStore);
  private readonly dispatch = injectDispatch(auditLogsEvents);

  protected readonly filters: readonly AuditFilter[] = [
    { label: 'All', value: null },
    { label: 'Company', value: 'company' },
    { label: 'Job', value: 'job' },
    { label: 'Referrals', value: 'referrals' },
    { label: 'Applicants', value: 'applicants' },
    { label: 'Settings', value: 'settings' },
    { label: 'Security', value: 'security' },
    { label: 'Workspaces', value: 'workspaces' },
  ];

  public ngOnInit(): void {
    this.dispatch.load();
  }

  protected onSearch(event: Event): void {
    this.dispatch.search((event.target as HTMLInputElement).value);
  }

  protected onSelectFilter(value: AuditEntity | null): void {
    this.dispatch.filterByEntity(value);
  }

  protected onLoadMore(): void {
    this.dispatch.loadMore();
  }
}
