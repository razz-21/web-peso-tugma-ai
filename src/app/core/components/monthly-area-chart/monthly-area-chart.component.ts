import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { useSystemChartFont } from '../../../features/dashboard/chart-font';

/** One point: a short label and its value. */
export interface MonthlyAreaPoint {
  label: string;
  count: number;
}

const LINE_COLOR = '#43681f';
const FILL_COLOR = 'rgba(67, 104, 31, 0.08)';

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
  readonly points = input.required<MonthlyAreaPoint[]>();
  /** Prefix for the chart's screen-reader description, e.g. "Registrations per month". */
  readonly ariaLabelPrefix = input('Monthly totals');
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
        borderColor: LINE_COLOR,
        backgroundColor: FILL_COLOR,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: LINE_COLOR,
        pointBorderColor: LINE_COLOR,
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'line'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 16 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: axisMax(this.values(), this.axisStep()),
        ticks: { stepSize: this.axisStep(), color: '#7c857a', font: { size: 13 } },
        grid: { color: '#eef1ea' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#7c857a', font: { size: 14 } },
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
