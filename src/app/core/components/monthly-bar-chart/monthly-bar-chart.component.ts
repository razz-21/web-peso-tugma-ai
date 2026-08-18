import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { useSystemChartFont } from '../../../features/dashboard/chart-font';

/** One bar: a short label and its value. */
export interface MonthlyBarPoint {
  label: string;
  count: number;
}

const DEFAULT_BAR_COLOR = '#43681f';

/** Draws each bar's value just above its top edge. */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'monthlyBarValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data ?? [];
    ctx.save();
    ctx.font = `600 13px ${Chart.defaults.font.family}`;
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    meta.data.forEach((bar, index) => {
      ctx.fillText(String(values[index] ?? ''), bar.x, bar.y - 8);
    });
    ctx.restore();
  },
};

/** Round the y-axis max up to a clean multiple of `step` above the tallest bar. */
const axisMax = (values: number[], step: number): number => {
  const peak = Math.max(0, ...values);
  return Math.max(step, Math.ceil((peak * 1.1) / step) * step);
};

/**
 * A reusable per-month bar chart with value labels above each bar. Consumers
 * pass `points` (label + count per bar); the y-axis rounds up to a clean grid.
 */
@Component({
  selector: 'app-monthly-bar-chart',
  imports: [BaseChartDirective],
  template: `<div class="monthly-bar-chart">
    <canvas
      baseChart
      type="bar"
      [data]="data()"
      [options]="options()"
      [plugins]="plugins"
      role="img"
      [attr.aria-label]="ariaLabel()"
    ></canvas>
  </div>`,
  styles: `
    .monthly-bar-chart {
      position: relative;
      height: 22rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyBarChartComponent {
  readonly points = input.required<MonthlyBarPoint[]>();
  /** Bar fill colour. */
  readonly barColor = input(DEFAULT_BAR_COLOR);
  /** Prefix for the chart's screen-reader description, e.g. "Referrals per month". */
  readonly ariaLabelPrefix = input('Monthly totals');
  /** Noun shown in a bar's tooltip, e.g. "Referrals" → "Referrals: 42". */
  readonly valueLabel = input('Total');
  /** Y-axis grid step. */
  readonly axisStep = input(20);

  constructor() {
    // Axis ticks and the value-label plugin both read the system font.
    useSystemChartFont();
  }

  protected readonly plugins = [valueLabelsPlugin];

  private readonly labels = computed(() => this.points().map((point) => point.label));
  private readonly values = computed(() => this.points().map((point) => point.count));

  protected readonly data = computed<ChartData<'bar'>>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.values(),
        backgroundColor: this.barColor(),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 56,
        categoryPercentage: 0.6,
        barPercentage: 0.9,
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'bar'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 28 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#1f2723',
        titleColor: '#ffffff',
        bodyColor: '#e6ebe2',
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
