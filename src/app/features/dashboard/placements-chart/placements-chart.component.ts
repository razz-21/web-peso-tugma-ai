import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

const BAR_LIGHT = '#c7e59c';
const BAR_HIGHLIGHT = '#43681f';
const LABELS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const VALUES = [120, 138, 155, 162, 174, 187];

/** Draws each bar's value just above its top edge, matching the mock. */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'placementsValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = '600 13px Roboto, "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    meta.data.forEach((bar, index) => {
      ctx.fillText(String(VALUES[index]), bar.x, bar.y - 8);
    });
    ctx.restore();
  },
};

@Component({
  selector: 'app-placements-chart',
  imports: [BaseChartDirective],
  template: `<div class="placements-chart">
    <canvas
      baseChart
      type="bar"
      [data]="data"
      [options]="options"
      [plugins]="plugins"
      role="img"
      aria-label="Bar chart of applicants hired per month, rising from 120 in February to 187 in July."
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
  protected readonly plugins = [valueLabelsPlugin];

  protected readonly data: ChartData<'bar'> = {
    labels: LABELS,
    datasets: [
      {
        data: VALUES,
        backgroundColor: VALUES.map((_, index) =>
          index === VALUES.length - 1 ? BAR_HIGHLIGHT : BAR_LIGHT,
        ),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 64,
        categoryPercentage: 0.65,
        barPercentage: 0.9,
      },
    ],
  };

  protected readonly options: ChartConfiguration<'bar'>['options'] = {
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
        max: 250,
        ticks: { stepSize: 50, color: '#7c857a', font: { size: 13 } },
        grid: { color: '#eef1ea' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#7c857a', font: { size: 14 } },
      },
    },
  };
}
