import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Visual tone applied to an entry's icon tile and category chip. */
type AuditTone = 'red' | 'green' | 'amber' | 'grey';

/** Category an audit event belongs to; drives the filter chips. */
type AuditCategory =
  | 'company'
  | 'job'
  | 'referral'
  | 'applicant'
  | 'settings'
  | 'security'
  | 'reports';

/** A record referenced by an event, rendered as an inline highlighted name. */
interface AuditRecord {
  label: string;
}

/** A before → after change shown inside an event's detail block. */
interface AuditDiffRow {
  label: string;
  from: string;
  to: string;
}

interface AuditEntry {
  id: string;
  icon: string;
  iconTone: AuditTone;
  chipTone: AuditTone;
  category: AuditCategory;
  categoryLabel: string;
  actor: string;
  /** Action phrase between the actor and the referenced records. */
  action: string;
  /** Highlighted record names shown after the action, joined with `·`. */
  records: AuditRecord[];
  time: string;
  /** Extra inline facts (IP, browser…) shown after the time. */
  meta?: string[];
  /** Free-text detail rendered in a tinted block. */
  note?: string;
  /** Before → after changes rendered in a tinted block. */
  diff?: AuditDiffRow[];
}

interface AuditGroup {
  /** Pre-formatted heading, e.g. `TODAY · JUL 25, 2026`. */
  label: string;
  entries: AuditEntry[];
}

interface AuditFilter {
  label: string;
  /** `null` for the "All" chip. */
  value: AuditCategory | null;
}

@Component({
  selector: 'app-audit-logs',
  imports: [MatIconModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent {
  protected readonly query = signal('');
  protected readonly activeCategory = signal<AuditCategory | null>(null);

  protected readonly filters: readonly AuditFilter[] = [
    { label: 'All', value: null },
    { label: 'Company', value: 'company' },
    { label: 'Job', value: 'job' },
    { label: 'Referrals', value: 'referral' },
    { label: 'Applicants', value: 'applicant' },
    { label: 'Settings', value: 'settings' },
    { label: 'Security', value: 'security' },
    { label: 'Reports', value: 'reports' },
  ];

  // Static sample feed; swap for a store-backed source once the audit API lands.
  private readonly groups: readonly AuditGroup[] = [
    {
      label: 'TODAY · JUL 25, 2026',
      entries: [
        {
          id: '1',
          icon: 'apartment',
          iconTone: 'red',
          chipTone: 'red',
          category: 'company',
          categoryLabel: 'Company',
          actor: 'Ernesto Razo',
          action: 'deleted a company',
          records: [{ label: 'Metro Staffing Corp.' }],
          time: '10:20 AM',
          note: 'Permanently removed. Had 0 active job listings at time of deletion.',
        },
        {
          id: '2',
          icon: 'apartment',
          iconTone: 'green',
          chipTone: 'amber',
          category: 'company',
          categoryLabel: 'Company',
          actor: 'Maria Aquino',
          action: 'created a company',
          records: [{ label: 'Sunrise BPO Services' }],
          time: '10:02 AM',
          note: 'Corporation · Services industry · Cagayan de Oro City.',
        },
        {
          id: '3',
          icon: 'toggle_off',
          iconTone: 'amber',
          chipTone: 'green',
          category: 'job',
          categoryLabel: 'Job',
          actor: 'Jerome Tan',
          action: 'deactivated a job listing',
          records: [{ label: 'IT Support Specialist' }, { label: 'Cebu Pacific Logistics' }],
          time: '9:50 AM',
          diff: [{ label: 'Status', from: 'Active', to: 'Inactive' }],
        },
        {
          id: '4',
          icon: 'tune',
          iconTone: 'green',
          chipTone: 'green',
          category: 'settings',
          categoryLabel: 'Settings',
          actor: 'Ernesto Razo',
          action: 'updated the match scoring weights',
          records: [{ label: 'Cagayan de Oro City PESO' }],
          time: '9:42 AM',
          diff: [
            { label: 'Semantic Similarity', from: '50%', to: '45%' },
            { label: 'Skills Match', from: '20%', to: '25%' },
          ],
        },
        {
          id: '5',
          icon: 'send',
          iconTone: 'green',
          chipTone: 'green',
          category: 'referral',
          categoryLabel: 'Referral',
          actor: 'Maria Aquino',
          action: 'referred an applicant to',
          records: [{ label: 'Frontend Developer' }, { label: 'Company 1sadadasd' }],
          time: '9:15 AM',
          note: 'Juan Miguel Dela Cruz referred with a 96% match score.',
        },
        {
          id: '6',
          icon: 'shield',
          iconTone: 'grey',
          chipTone: 'grey',
          category: 'security',
          categoryLabel: 'Security',
          actor: 'Ernesto Razo',
          action: 'signed in',
          records: [],
          time: '8:12 AM',
          meta: ['112.198.x.x', 'Chrome, Windows'],
        },
        {
          id: '7',
          icon: 'person_add',
          iconTone: 'green',
          chipTone: 'green',
          category: 'applicant',
          categoryLabel: 'Applicant',
          actor: 'Maria Aquino',
          action: 'registered an applicant',
          records: [{ label: 'Angela Reyes' }],
          time: '8:05 AM',
          note: 'New job seeker · Cagayan de Oro City · Fresh graduate.',
        },
        {
          id: '8',
          icon: 'download',
          iconTone: 'grey',
          chipTone: 'grey',
          category: 'reports',
          categoryLabel: 'Reports',
          actor: 'Jerome Tan',
          action: 'exported a report',
          records: [{ label: 'Applicant Placed' }],
          time: '7:58 AM',
          note: 'Exported to Excel · Jul 1 – Jul 25, 2026 range.',
        },
      ],
    },
    {
      label: 'YESTERDAY · JUL 24, 2026',
      entries: [
        {
          id: '9',
          icon: 'work',
          iconTone: 'green',
          chipTone: 'green',
          category: 'job',
          categoryLabel: 'Job',
          actor: 'Maria Aquino',
          action: 'created a job listing',
          records: [{ label: 'Warehouse Associate' }, { label: 'Sunrise BPO Services' }],
          time: '4:31 PM',
          note: '3 vacancies · Full-time · Cagayan de Oro City.',
        },
        {
          id: '10',
          icon: 'check_box',
          iconTone: 'green',
          chipTone: 'green',
          category: 'referral',
          categoryLabel: 'Referral',
          actor: 'Ernesto Razo',
          action: 'marked an applicant as placed',
          records: [{ label: 'Frontend Developer' }, { label: 'Metro Staffing Corp.' }],
          time: '2:14 PM',
          diff: [{ label: 'Status', from: 'Referred', to: 'Placed' }],
        },
        {
          id: '11',
          icon: 'lock_reset',
          iconTone: 'amber',
          chipTone: 'amber',
          category: 'security',
          categoryLabel: 'Security',
          actor: 'Jerome Tan',
          action: 'reset a password',
          records: [{ label: 'officer.deleon' }],
          time: '11:47 AM',
          meta: ['112.198.x.x', 'Safari, macOS'],
        },
      ],
    },
  ];

  /** Groups filtered by the active category and search text; empties dropped. */
  protected readonly filteredGroups = computed<AuditGroup[]>(() => {
    const category = this.activeCategory();
    const term = this.query().trim().toLowerCase();

    return this.groups
      .map((group) => ({
        label: group.label,
        entries: group.entries.filter(
          (entry) =>
            (category === null || entry.category === category) &&
            (term === '' || this.haystack(entry).includes(term)),
        ),
      }))
      .filter((group) => group.entries.length > 0);
  });

  /** Total number of events across the filtered groups. */
  protected readonly eventCount = computed(() =>
    this.filteredGroups().reduce((total, group) => total + group.entries.length, 0),
  );

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onSelectFilter(value: AuditCategory | null): void {
    this.activeCategory.set(value);
  }

  private haystack(entry: AuditEntry): string {
    return [
      entry.actor,
      entry.action,
      entry.categoryLabel,
      entry.note ?? '',
      ...entry.records.map((record) => record.label),
      ...(entry.meta ?? []),
    ]
      .join(' ')
      .toLowerCase();
  }
}
