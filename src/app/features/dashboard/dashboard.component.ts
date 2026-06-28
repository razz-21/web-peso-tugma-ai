import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `<h1 class="dashboard__title">Welcome to Dashboard</h1>`,
  styles: `
    .dashboard__title {
      margin: 0;
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 700;
      color: var(--mat-sys-on-surface);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {}
