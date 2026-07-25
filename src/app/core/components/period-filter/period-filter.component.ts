import { ChangeDetectionStrategy, Component, OnInit, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** An inclusive start/end date range. */
export interface DateRange {
  start: Date;
  end: Date;
}

/** A resolved range plus the label shown in the trigger button. */
export interface DateRangeSelection extends DateRange {
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

/** Fallback default: the 1st of the current month through today. */
const currentMonthToDate = (): DateRange => {
  const today = startOfDay(new Date());
  return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
};

/**
 * A reusable date-range filter. Renders a pill trigger that opens a Material
 * range picker; emits `rangeChange` with the resolved window (start at the day's
 * start, end at the day's end) plus a display label.
 *
 * Emits once on init with the default range (`initialRange`, or the current
 * month-to-date) so consumers can load immediately.
 */
@Component({
  selector: 'app-period-filter',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './period-filter.component.html',
  styleUrl: './period-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodFilterComponent implements OnInit {
  /** Starting window; defaults to the current month-to-date when not provided. */
  readonly initialRange = input<DateRange | null>(null);
  /** Accessible label for the trigger button. */
  readonly triggerAriaLabel = input('Filter by date range');
  /** Emits whenever the user picks a complete range (and once on init). */
  readonly rangeChange = output<DateRangeSelection>();

  protected readonly label = signal('');
  protected readonly customStart = new FormControl<Date | null>(null);
  protected readonly customEnd = new FormControl<Date | null>(null);

  public ngOnInit(): void {
    // Emit the default window on init. Must run here, not in the constructor:
    // the parent only subscribes to this output after the component is built.
    const range = this.initialRange() ?? currentMonthToDate();
    this.customStart.setValue(range.start);
    this.customEnd.setValue(range.end);
    this.emit(range.start, range.end);
  }

  protected applyCustomRange(): void {
    const start = this.customStart.value;
    const end = this.customEnd.value;
    if (!start || !end) return;
    this.emit(start, end);
  }

  private emit(start: Date, end: Date): void {
    const label = formatRange(start, end);
    this.label.set(label);
    this.rangeChange.emit({ start: startOfDay(start), end: endOfDay(end), label });
  }
}
