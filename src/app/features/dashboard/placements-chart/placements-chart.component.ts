import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MonthlyPlacement } from '../../../core/models/dashboard.model';
import { useSystemChartFont } from '../chart-font';

const BAR_LIGHT = '#c7e59c';
const BAR_HIGHLIGHT = '#43681f';

/** Draws each bar's value just above its top edge, matching the mock. */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'placementsValueLabels',
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

/** Round the y-axis max up to a clean value above the tallest bar. */
const axisMax = (values: number[]): number => {
  const peak = Math.max(0, ...values);
  const step = 50;
  return Math.max(step, Math.ceil((peak * 1.15) / step) * step);
};

@Component({
  selector: 'app-placements-chart',
  imports: [BaseChartDirective],
  template: `<div class="placements-chart">
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
    .placements-chart {
      position: relative;
      height: 20rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacementsChartComponent {
  /** Twelve months (Jan–Dec) of hire counts from the dashboard API. */
  readonly months = input.required<MonthlyPlacement[]>();

  constructor() {
    // Axis ticks and the value-label plugin both read the system font.
    useSystemChartFont();
  }

  protected readonly plugins = [valueLabelsPlugin];

  private readonly labels = computed(() => this.months().map((month) => month.label));
  private readonly values = computed(() => this.months().map((month) => month.count));

  protected readonly data = computed<ChartData<'bar'>>(() => {
    const values = this.values();
    // Highlight the month with the most hires (the latest peak in the mock).
    const peakIndex = values.reduce((best, value, i) => (value > values[best] ? i : best), 0);
    return {
      labels: this.labels(),
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, index) =>
            index === peakIndex ? BAR_HIGHLIGHT : BAR_LIGHT,
          ),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 64,
          categoryPercentage: 0.65,
          barPercentage: 0.9,
        },
      ],
    };
  });

  protected readonly options = computed<ChartConfiguration<'bar'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 28 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: axisMax(this.values()),
        ticks: { color: '#7c857a', font: { size: 13 } },
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
      `Bar chart of applicants hired per month: ${this.months()
        .map((month) => `${month.label} ${month.count}`)
        .join(', ')}.`,
  );
}
