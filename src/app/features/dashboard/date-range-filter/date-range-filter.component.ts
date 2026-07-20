import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** A resolved date range plus the label shown in the trigger button. */
export interface DashboardDateRange {
  start: Date;
  end: Date;
  label: string;
}

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const RANGE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};
const formatRange = (start: Date, end: Date): string =>
  `${start.toLocaleDateString('en-US', RANGE_FORMAT)} – ${end.toLocaleDateString('en-US', RANGE_FORMAT)}`;

/** Default filter: today and the preceding 30 days. */
const defaultRange = (): { start: Date; end: Date } => {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { start, end };
};

@Component({
  selector: 'app-date-range-filter',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './date-range-filter.component.html',
  styleUrl: './date-range-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeFilterComponent {
  /** Emits once the user picks a complete start/end range. */
  readonly rangeChange = output<DashboardDateRange>();

  private readonly initial = defaultRange();

  protected readonly label = signal(formatRange(this.initial.start, this.initial.end));
  protected readonly customStart = new FormControl<Date | null>(this.initial.start);
  protected readonly customEnd = new FormControl<Date | null>(this.initial.end);

  protected applyCustomRange(): void {
    const start = this.customStart.value;
    const end = this.customEnd.value;
    if (!start || !end) return;
    const label = formatRange(start, end);
    this.label.set(label);
    this.rangeChange.emit({ start: startOfDay(start), end: endOfDay(end), label });
  }
}
