import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

type ReferralStatus = 'Referred' | 'Interview scheduled' | 'Hired' | 'Withdrawn' | 'Not hired';

interface StatusOption {
  readonly value: ReferralStatus;
  readonly icon: string;
  readonly danger?: boolean;
}

type StepState = 'done' | 'current' | 'pending' | 'failed' | 'withdrawn';

interface StepNode {
  readonly label: string;
  readonly sub: string;
  readonly state: StepState;
  /** Color of the connector line to the next step. */
  readonly line?: 'green' | 'red';
}

interface PreviousReferral {
  readonly code: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: string;
  readonly tone: 'neutral' | 'danger';
}

const STATUS_INDEX: Record<ReferralStatus, number> = {
  Referred: 0,
  'Interview scheduled': 1,
  Hired: 2,
  Withdrawn: 0,
  'Not hired': 0,
};

const STEP_META: readonly { label: string; sub: string }[] = [
  { label: 'Referred', sub: 'Jul 13' },
  { label: 'Interview', sub: 'Jul 15' },
  { label: 'Hired', sub: 'Pending' },
];

/** Assigned job card with a status timeline and previous referrals (mock data). */
@Component({
  selector: 'app-assigned-job',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './assigned-job.component.html',
  styleUrl: './assigned-job.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignedJobComponent {
  protected readonly statusOptions: readonly StatusOption[] = [
    { value: 'Referred', icon: 'send' },
    { value: 'Interview scheduled', icon: 'calendar_today' },
    { value: 'Hired', icon: 'check' },
    { value: 'Withdrawn', icon: 'undo' },
    { value: 'Not hired', icon: 'close', danger: true },
  ];

  protected readonly job = {
    code: 'C1',
    title: 'Frontend Developer',
    company: 'Company 1sadadasd',
    location: 'Cagayan de Oro City',
    salary: 100000,
    assignedOn: 'Jul 13, 2026',
    assignedBy: 'Ernesto Razo',
    matchScore: 96,
  };

  protected readonly previousReferrals: readonly PreviousReferral[] = [
    {
      code: 'C3',
      title: 'Jpb asdasd',
      subtitle: 'Company 3 · Referred Mar 2, 2026',
      status: 'Not hired',
      tone: 'danger',
    },
    {
      code: 'CP',
      title: 'IT Support Specialist',
      subtitle: 'Cebu Pacific Logistics · Referred Jan 18, 2026',
      status: 'Withdrawn',
      tone: 'neutral',
    },
  ];

  protected readonly status = signal<ReferralStatus>('Referred');

  protected readonly steps = computed<StepNode[]>(() => {
    const status = this.status();

    // "Not hired" / "Withdrawn" are terminal outcomes: the first two steps are
    // completed and the final step is replaced with the terminal node.
    let base: { label: string; sub: string; state: StepState }[];
    if (status === 'Not hired' || status === 'Withdrawn') {
      base = [
        { label: 'Referred', sub: 'Jul 13', state: 'done' },
        { label: 'Interview', sub: 'Jul 15', state: 'done' },
        {
          label: status,
          sub: 'Jul 16',
          state: status === 'Not hired' ? 'failed' : 'withdrawn',
        },
      ];
    } else {
      base = STEP_META.map((meta, index) => {
        const activeIndex = STATUS_INDEX[status];
        const state: StepState =
          index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'pending';
        return { ...meta, state };
      });
    }

    return base.map((step, index) => {
      const next = base[index + 1];
      let line: StepNode['line'] | undefined;
      if (next) {
        if (next.state === 'failed') {
          line = 'red';
        } else if (next.state === 'withdrawn') {
          line = undefined;
        } else if (step.state === 'done') {
          line = 'green';
        }
      }
      return { ...step, line };
    });
  });

  protected setStatus(status: ReferralStatus): void {
    // TODO: persist the referral status once the backend endpoint exists.
    this.status.set(status);
  }
}
