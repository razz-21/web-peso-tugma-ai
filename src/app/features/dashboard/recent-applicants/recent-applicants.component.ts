import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../core/components/empty-state/empty-state.component';
import { RecentApplicant, RecentApplicantStatus } from '../../../core/models/dashboard.model';

/** Turn an ISO timestamp into a short relative label ("2h ago", "Yesterday"). */
const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** The metadata line, e.g. "UI/UX Designer · Cagayan de Oro · 2h ago". */
const metaLine = (applicant: RecentApplicant): string =>
  [applicant.role, applicant.location, formatRelative(applicant.created_at)]
    .filter(Boolean)
    .join(' · ');

interface RecentApplicantRow {
  id: string;
  name: string;
  meta: string;
  statusLabel: string;
  tone: RecentApplicantStatus;
}

@Component({
  selector: 'app-recent-applicants',
  imports: [AvatarComponent, EmptyStateComponent],
  template: `@if (rows().length === 0) {
      <app-empty-state
        icon="person_search"
        title="No recent applicants"
        text="Newly registered applicants will appear here as they're added to your workspace."
      />
    } @else {
      <ul class="recent-applicants">
        @for (applicant of rows(); track applicant.id) {
          <li class="recent-applicants__row">
            <app-avatar [name]="applicant.name" [seed]="applicant.name" [size]="44" />
            <div class="recent-applicants__body">
              <p class="recent-applicants__name">{{ applicant.name }}</p>
              <p class="recent-applicants__meta">{{ applicant.meta }}</p>
            </div>
            <span
              class="recent-applicants__status"
              [class]="'recent-applicants__status--' + applicant.tone"
            >
              {{ applicant.statusLabel }}
            </span>
          </li>
        }
      </ul>
    }`,
  styleUrl: './recent-applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentApplicantsComponent {
  readonly applicants = input.required<RecentApplicant[]>();

  protected readonly rows = computed<RecentApplicantRow[]>(() =>
    this.applicants().map((applicant) => ({
      id: applicant.id,
      name: applicant.name,
      meta: metaLine(applicant),
      statusLabel: applicant.status_label,
      tone: applicant.status,
    })),
  );
}
