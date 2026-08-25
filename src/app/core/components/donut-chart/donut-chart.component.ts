import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ArcElement, Chart, ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { useSystemChartFont } from '../../../features/dashboard/chart-font';

/** One ring segment: a label, its value, and the arc colour. */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const CENTER_VALUE_COLOR = '#1f2723';
const CENTER_CAPTION_COLOR = '#7c857a';
const SEGMENT_LABEL_COLOR = '#ffffff';

/**
 * A reusable doughnut chart with text stacked in the ring's hole and optional
 * per-segment percentage labels drawn on the arcs. The parent owns the legend
 * (counts/percentages below the chart); this component draws only the ring and
 * its centre text so it can serve every donut on the Employment Summary page.
 */
@Component({
  selector: 'app-donut-chart',
  imports: [BaseChartDirective],
  template: `<div class="donut-chart">
    <canvas
      baseChart
      type="doughnut"
      [data]="data()"
      [options]="options()"
      [plugins]="plugins"
      role="img"
      [attr.aria-label]="ariaLabel()"
    ></canvas>
  </div>`,
  styles: `
    .donut-chart {
      position: relative;
      height: 14rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  /** Large text shown in the ring's hole, e.g. "1,284" or "36.5%". */
  readonly centerValue = input('');
  /** Caption shown under the centre value, e.g. "registered". */
  readonly centerCaption = input('');
  /** Draw each segment's share (e.g. "81%") in white on the arc. */
  readonly showSegmentLabels = input(false);
  /** Prefix for the chart's screen-reader description, e.g. "Employment status". */
  readonly ariaLabelPrefix = input('Breakdown');

  constructor() {
    useSystemChartFont();
  }

  private readonly total = computed(() =>
    this.segments().reduce((sum, segment) => sum + segment.value, 0),
  );

  protected readonly data = computed<ChartData<'doughnut'>>(() => ({
    labels: this.segments().map((segment) => segment.label),
    datasets: [
      {
        data: this.segments().map((segment) => segment.value),
        backgroundColor: this.segments().map((segment) => segment.color),
        borderWidth: 0,
        spacing: 2,
      },
    ],
  }));

  protected readonly options = computed<ChartConfiguration<'doughnut'>['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }));

  protected readonly plugins: Plugin<'doughnut'>[] = [
    { id: 'donutSegmentLabels', afterDatasetsDraw: (chart) => this.drawSegmentLabels(chart) },
    { id: 'donutCenterText', afterDatasetsDraw: (chart) => this.drawCenterText(chart) },
  ];

  protected readonly ariaLabel = computed(() => {
    const total = this.total();
    const parts = this.segments().map((segment) => {
      const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
      return `${segment.label} ${segment.value} (${pct}%)`;
    });
    return `${this.ariaLabelPrefix()}: ${parts.join(', ')}.`;
  });

  private drawCenterText(chart: Chart<'doughnut'>): void {
    const value = this.centerValue();
    if (!value) return;
    const { ctx, chartArea } = chart;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    const caption = this.centerCaption();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = CENTER_VALUE_COLOR;
    ctx.font = `700 26px ${Chart.defaults.font.family}`;
    ctx.fillText(value, cx, caption ? cy - 6 : cy);
    if (caption) {
      ctx.fillStyle = CENTER_CAPTION_COLOR;
      ctx.font = `500 13px ${Chart.defaults.font.family}`;
      ctx.fillText(caption, cx, cy + 16);
    }
    ctx.restore();
  }

  private drawSegmentLabels(chart: Chart<'doughnut'>): void {
    if (!this.showSegmentLabels()) return;
    const total = this.total();
    if (total <= 0) return;

    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = SEGMENT_LABEL_COLOR;
    ctx.font = `700 13px ${Chart.defaults.font.family}`;
    meta.data.forEach((element, index) => {
      const value = this.segments()[index]?.value ?? 0;
      const pct = Math.round((value / total) * 100);
      // Skip slivers too thin to hold a legible label.
      if (pct < 6) return;
      const { x, y } = (element as ArcElement).tooltipPosition(true);
      ctx.fillText(`${pct}%`, x, y);
    });
    ctx.restore();
  }
}
