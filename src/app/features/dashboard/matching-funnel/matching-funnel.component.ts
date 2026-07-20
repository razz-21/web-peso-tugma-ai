import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

const STAGES = ['Referred', 'Interviewed', 'Hired'];
const VALUES = [512, 318, 187];
const COLORS = ['#3f5a1f', '#2c5a57', '#b0860f'];
const TOTAL = VALUES[0];

/** Renders `<count> (<pct>%)` immediately to the right of each bar's tip. */
const funnelLabelsPlugin: Plugin<'bar'> = {
  id: 'funnelValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = '600 13px Roboto, "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, index) => {
      const value = VALUES[index];
      const pct = Math.round((value / TOTAL) * 100);
      ctx.fillText(`${value} (${pct}%)`, bar.x + 10, bar.y);
    });
    ctx.restore();
  },
};

@Component({
  selector: 'app-matching-funnel',
  imports: [BaseChartDirective],
  template: `<div class="matching-funnel">
    <canvas
      baseChart
      type="bar"
      [data]="data"
      [options]="options"
      [plugins]="plugins"
      role="img"
      aria-label="Matching funnel: 512 referred (100%), 318 interviewed (62%), 187 hired (37%)."
    ></canvas>
  </div>`,
  styles: `
    .matching-funnel {
      position: relative;
      height: 12rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchingFunnelComponent {
  protected readonly plugins = [funnelLabelsPlugin];

  protected readonly data: ChartData<'bar'> = {
    labels: STAGES,
    datasets: [
      {
        data: VALUES,
        backgroundColor: COLORS,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 34,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      },
    ],
  };

  protected readonly options: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    // Leave room on the right for the "512 (100%)" labels drawn by the plugin.
    layout: { padding: { right: 96 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        display: false,
        max: TOTAL,
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
