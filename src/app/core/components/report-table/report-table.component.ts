import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/** A selectable report-table column. `key` indexes into each row's cell map. */
export interface ReportTableColumn {
  key: string;
  label: string;
  /** Cap this column's width and wrap long text (for free-text columns). */
  wrap?: boolean;
  /** Override the wrapped column's max-width (any CSS length, e.g. "30rem"). */
  maxWidth?: string;
}

/** One table row: display text keyed by column key. */
export type ReportTableRow = Record<string, string>;

/**
 * A reusable report table with a column-visibility filter and CSV export.
 *
 * Rows are passed pre-formatted (cell text keyed by column key) so the parent
 * owns all value formatting; the table only handles layout, the "#" index,
 * column toggling, and exporting the currently visible columns.
 */
@Component({
  selector: 'app-report-table',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, MatMenuModule],
  templateUrl: './report-table.component.html',
  styleUrl: './report-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportTableComponent {
  readonly title = input('');
  readonly columns = input.required<ReportTableColumn[]>();
  readonly rows = input.required<ReportTableRow[]>();
  /** Base name for the exported file (without extension). */
  readonly fileName = input('report');
  /** Message shown when there are no rows. */
  readonly emptyMessage = input('No records for this period.');

  /** Visible column keys; seeded from `columns` and updated by the filter menu. */
  protected readonly visibleKeys = linkedSignal<ReportTableColumn[], string[]>({
    source: this.columns,
    computation: (columns) => columns.map((column) => column.key),
  });

  protected readonly visibleColumns = computed<ReportTableColumn[]>(() => {
    const keys = new Set(this.visibleKeys());
    // Preserve the canonical column order regardless of toggle order.
    return this.columns().filter((column) => keys.has(column.key));
  });

  protected isVisible(key: string): boolean {
    return this.visibleKeys().includes(key);
  }

  protected toggleColumn(key: string): void {
    this.visibleKeys.update((keys) =>
      keys.includes(key) ? keys.filter((current) => current !== key) : [...keys, key],
    );
  }

  /** Export the table as CSV, honouring the currently visible columns. */
  protected onExport(): void {
    const columns = this.visibleColumns();
    const cells: string[][] = [
      ['#', ...columns.map((column) => column.label)],
      ...this.rows().map((row, index) => [
        String(index + 1),
        ...columns.map((column) => {
          const value = row[column.key] ?? '';
          return value === '—' ? '' : value;
        }),
      ]),
    ];

    const csv = cells
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.fileName()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
