import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { useSystemChartFont } from '../../../features/dashboard/chart-font';

/** One horizontal bar: a category label and its value. */
export interface HorizontalBarPoint {
  label: string;
  count: number;
}

const DEFAULT_BAR_COLOR = '#43681f';

/** Draws each bar's value just past its right edge. */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'horizontalBarValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = chart.data.datasets[0]?.data ?? [];
    ctx.save();
    ctx.font = `600 13px ${Chart.defaults.font.family}`;
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, index) => {
      ctx.fillText(String(values[index] ?? ''), bar.x + 8, bar.y);
    });
    ctx.restore();
  },
};

/** Round the value axis up to a clean multiple of `step`, with headroom for the
 *  value label drawn just past the widest bar. */
const axisMax = (values: number[], step: number): number => {
  const peak = Math.max(0, ...values);
  return Math.max(step, Math.ceil((peak * 1.15) / step) * step);
};

/**
 * A reusable horizontal bar chart with the value drawn at the end of each bar
 * and the category label down the left. Consumers pass `points` (label + count),
 * and optionally `barColors` to tint bars individually (e.g. to emphasise the
 * leaders). The value axis rounds up to a clean grid and the height grows with
 * the number of bars so each keeps a legible thickness.
 */
@Component({
  selector: 'app-horizontal-bar-chart',
  imports: [BaseChartDirective],
  template: `<div class="horizontal-bar-chart" [style.height]="height()">
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
    .horizontal-bar-chart {
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorizontalBarChartComponent {
  readonly points = input.required<HorizontalBarPoint[]>();
  /** Bar fill colour, applied to every bar. */
  readonly barColor = input(DEFAULT_BAR_COLOR);
  /** Per-bar fill colours (one per point); overrides `barColor` when provided. */
  readonly barColors = input<string[] | null>(null);
  /** Prefix for the chart's screen-reader description, e.g. "Top courses". */
  readonly ariaLabelPrefix = input('Breakdown');
  /** Noun shown in a bar's tooltip, e.g. "Applicants" → "Applicants: 138". */
  readonly valueLabel = input('Total');
  /** Value-axis grid step. */
  readonly axisStep = input(20);

  constructor() {
    // Axis ticks and the value-label plugin both read the system font.
    useSystemChartFont();
  }

  protected readonly plugins = [valueLabelsPlugin];

  private readonly labels = computed(() => this.points().map((point) => point.label));
  private readonly values = computed(() => this.points().map((point) => point.count));

  /** Height grows with the number of bars so each keeps a legible thickness. */
  protected readonly height = computed(() => `${Math.max(12, this.points().length * 2.6)}rem`);

  protected readonly data = computed<ChartData<'bar'>>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.values(),
        backgroundColor: this.barColors() ?? this.barColor(),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 26,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'bar'>['options']>(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } },
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
      x: {
        beginAtZero: true,
        max: axisMax(this.values(), this.axisStep()),
        ticks: { display: false },
        grid: { color: '#eef1ea' },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#3c443a', font: { size: 14 } },
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
