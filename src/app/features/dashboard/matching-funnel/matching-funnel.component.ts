import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FunnelStage } from '../../../core/models/dashboard.model';
import { useSystemChartFont } from '../chart-font';
import { injectCssColorResolver, resolveCssColor } from '../../../core/utils/css-color.util';

/** Bar color per funnel stage; unknown keys fall back to a neutral grey. */
const STAGE_COLORS: Record<string, string> = {
  referred: 'var(--mat-sys-primary)',
  interviewed: 'var(--app-info)',
  hired: 'var(--app-warning)',
  withdrawn: 'var(--mat-sys-outline)',
  not_hired: 'var(--mat-sys-error)',
};
const FALLBACK_COLOR = 'var(--mat-sys-outline)';

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
    ctx.fillStyle = resolveCssColor(chart.canvas, 'var(--mat-sys-on-surface)');
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
  /** Resolves theme tokens for the canvas; re-evaluates on a light/dark switch. */
  private readonly colors = injectCssColorResolver();
  private c(color: string): string {
    return this.colors()(color);
  }

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
          backgroundColor: stages.map((stage) => this.c(STAGE_COLORS[stage.key] ?? FALLBACK_COLOR)),
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
        ticks: { color: this.c('var(--mat-sys-on-surface-variant)'), font: { size: 14 } },
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
