import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

const FIELDS = [
  'Information Technology',
  'Healthcare',
  'Manufacturing',
  'Construction',
  'Retail & Services',
];
const VALUES = [128, 86, 74, 62, 62];
const BAR_COLOR = '#3f5a1f';

/** Draws each field's vacancy count just past the bar's tip. */
const valueLabelsPlugin: Plugin<'bar'> = {
  id: 'occupationsValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = '600 14px Roboto, "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, index) => {
      ctx.fillText(String(VALUES[index]), bar.x + 10, bar.y);
    });
    ctx.restore();
  },
};

@Component({
  selector: 'app-in-demand-occupations',
  imports: [BaseChartDirective],
  template: `<div class="in-demand-occupations">
    <canvas
      baseChart
      type="bar"
      [data]="data"
      [options]="options"
      [plugins]="plugins"
      role="img"
      aria-label="Open vacancies by field: Information Technology 128, Healthcare 86, Manufacturing 74, Construction 62, Retail and Services 62."
    ></canvas>
  </div>`,
  styles: `
    .in-demand-occupations {
      position: relative;
      height: 19rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InDemandOccupationsComponent {
  protected readonly plugins = [valueLabelsPlugin];

  protected readonly data: ChartData<'bar'> = {
    labels: FIELDS,
    datasets: [
      {
        data: VALUES,
        backgroundColor: BAR_COLOR,
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 22,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
    ],
  };

  protected readonly options: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    // Leave room on the right for the value labels drawn by the plugin.
    layout: { padding: { right: 40 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        display: false,
        max: Math.max(...VALUES) * 1.05,
        grid: { display: false },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#3c4a3a', font: { size: 14 } },
      },
    },
  };
}
