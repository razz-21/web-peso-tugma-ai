import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { useSystemChartFont } from '../../../features/dashboard/chart-font';
import { injectCssColorResolver, withAlpha } from '../../utils/css-color.util';

/** One point: a short label and its value. */
export interface MonthlyAreaPoint {
  label: string;
  count: number;
}

const LINE_COLOR = 'var(--mat-sys-primary)';

/** Round the y-axis max up to a clean multiple of `step` above the tallest point. */
const axisMax = (values: number[], step: number): number => {
  const peak = Math.max(0, ...values);
  return Math.max(step, Math.ceil((peak * 1.1) / step) * step);
};

/**
 * A reusable per-month area/line chart. Consumers pass `points` (label + count);
 * the y-axis rounds up to a clean grid.
 */
@Component({
  selector: 'app-monthly-area-chart',
  imports: [BaseChartDirective],
  template: `<div class="monthly-area-chart">
    <canvas
      baseChart
      type="line"
      [data]="data()"
      [options]="options()"
      role="img"
      [attr.aria-label]="ariaLabel()"
    ></canvas>
  </div>`,
  styles: `
    .monthly-area-chart {
      position: relative;
      height: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyAreaChartComponent {
  /** Resolves theme tokens for the canvas; re-evaluates on a light/dark switch. */
  private readonly colors = injectCssColorResolver();
  private c(color: string): string {
    return this.colors()(color);
  }

  readonly points = input.required<MonthlyAreaPoint[]>();
  /** Prefix for the chart's screen-reader description, e.g. "Registrations per month". */
  readonly ariaLabelPrefix = input('Monthly totals');
  /** Noun shown in a point's tooltip, e.g. "Registrations" → "Registrations: 42". */
  readonly valueLabel = input('Total');
  /** Y-axis grid step. */
  readonly axisStep = input(50);

  constructor() {
    useSystemChartFont();
  }

  private readonly labels = computed(() => this.points().map((point) => point.label));
  private readonly values = computed(() => this.points().map((point) => point.count));

  protected readonly data = computed<ChartData<'line'>>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.values(),
        borderColor: this.c(LINE_COLOR),
        backgroundColor: withAlpha(this.c(LINE_COLOR), 0.08),
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: this.c(LINE_COLOR),
        pointBorderColor: this.c(LINE_COLOR),
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 16 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: this.c('var(--mat-sys-inverse-surface)'),
        titleColor: this.c('var(--mat-sys-inverse-on-surface)'),
        bodyColor: this.c('var(--mat-sys-inverse-on-surface)'),
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: (item) => `${this.valueLabel()}: ${item.formattedValue}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: axisMax(this.values(), this.axisStep()),
        ticks: {
          stepSize: this.axisStep(),
          color: this.c('var(--mat-sys-on-surface-variant)'),
          font: { size: 13 },
        },
        grid: { color: this.c('var(--mat-sys-surface-container-high)') },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: this.c('var(--mat-sys-on-surface-variant)'), font: { size: 14 } },
      },
    },
  }));

  protected readonly ariaLabel = computed(
    () =>
      `${this.ariaLabelPrefix()}: ${this.points()
        .map((point) => `${point.label} ${point.count}`)
        .join(', ')}.`,
  );
}
