import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FunnelStage } from '../../../core/models/dashboard.model';
import { useSystemChartFont } from '../chart-font';

/** Bar color per funnel stage; unknown keys fall back to a neutral grey. */
const STAGE_COLORS: Record<string, string> = {
  referred: '#3f5a1f',
  interviewed: '#2c5a57',
  hired: '#b0860f',
  withdrawn: '#8a8f86',
  not_hired: '#b45454',
};
const FALLBACK_COLOR = '#8a8f86';

/** Renders `<count> (<pct>%)` immediately to the right of each bar's tip. */
const funnelLabelsPlugin: Plugin<'bar'> = {
  id: 'funnelValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const values = (chart.data.datasets[0]?.data ?? []) as number[];
    const base = values[0] || 0;
    ctx.save();
    ctx.font = `600 13px ${Chart.defaults.font.family}`;
    ctx.fillStyle = '#1f2723';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    meta.data.forEach((bar, index) => {
      const value = values[index] ?? 0;
      const pct = base > 0 ? Math.round((value / base) * 100) : 0;
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
      [data]="data()"
      [options]="options()"
      [plugins]="plugins"
      role="img"
      [attr.aria-label]="ariaLabel()"
    ></canvas>
  </div>`,
  styles: `
    .matching-funnel {
      position: relative;
      height: 18rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchingFunnelComponent {
  /** Ordered funnel stages (Referred first) from the dashboard API. */
  readonly stages = input.required<FunnelStage[]>();

  constructor() {
    // Axis ticks and the value-label plugin both read the system font.
    useSystemChartFont();
  }

  protected readonly plugins = [funnelLabelsPlugin];

  private readonly base = computed(() => this.stages()[0]?.count ?? 0);

  protected readonly data = computed<ChartData<'bar'>>(() => {
    const stages = this.stages();
    return {
      labels: stages.map((stage) => stage.label),
      datasets: [
        {
          data: stages.map((stage) => stage.count),
          backgroundColor: stages.map((stage) => STAGE_COLORS[stage.key] ?? FALLBACK_COLOR),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 34,
          categoryPercentage: 0.7,
          barPercentage: 0.9,
        },
      ],
    };
  });

  protected readonly options = computed<ChartConfiguration<'bar'>['options']>(() => ({
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
        max: this.base() || undefined,
        grid: { display: false },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#3c4a3a', font: { size: 14 } },
      },
    },
  }));

  protected readonly ariaLabel = computed(() => {
    const base = this.base();
    const parts = this.stages().map((stage) => {
      const pct = base > 0 ? Math.round((stage.count / base) * 100) : 0;
      return `${stage.count} ${stage.label.toLowerCase()} (${pct}%)`;
    });
    return `Matching funnel: ${parts.join(', ')}.`;
  });
}
