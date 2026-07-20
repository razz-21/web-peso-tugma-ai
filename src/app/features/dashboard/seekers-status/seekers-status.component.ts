import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

interface StatusSlice {
  label: string;
  value: number;
  color: string;
  percent: number;
}

const TOTAL = 1284;
const RAW: Omit<StatusSlice, 'percent'>[] = [
  { label: 'Active', value: 842, color: '#3f5a1f' },
  { label: 'In process', value: 255, color: '#2c5a57' },
  { label: 'Hired', value: 187, color: '#b0860f' },
];
const SLICES: StatusSlice[] = RAW.map((slice) => ({
  ...slice,
  percent: Math.round((slice.value / TOTAL) * 1000) / 10,
}));

/** Draws the "14.6% placed" figure in the doughnut's hole. */
const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'seekersCenterText',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const arc = meta.data[0] as unknown as { x: number; y: number } | undefined;
    if (!arc) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1f2723';
    ctx.font = '700 28px Roboto, "Helvetica Neue", sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('14.6%', arc.x, arc.y + 4);
    ctx.fillStyle = '#7c857a';
    ctx.font = '400 14px Roboto, "Helvetica Neue", sans-serif';
    ctx.fillText('placed', arc.x, arc.y + 26);
    ctx.restore();
  },
};

@Component({
  selector: 'app-seekers-status',
  imports: [BaseChartDirective, DecimalPipe],
  template: `<div class="seekers-status">
    <div class="seekers-status__chart">
      <canvas
        baseChart
        type="doughnut"
        [data]="data"
        [options]="options"
        [plugins]="plugins"
        role="img"
        aria-label="Doughnut chart of job seekers by status: 842 active, 255 in process, 187 hired."
      ></canvas>
    </div>
    <ul class="seekers-status__legend">
      @for (slice of slices; track slice.label) {
        <li class="seekers-status__legend-row">
          <span class="seekers-status__swatch" [style.background]="slice.color"></span>
          <span class="seekers-status__legend-label">{{ slice.label }}</span>
          <span class="seekers-status__legend-value">{{ slice.value | number }}</span>
          <span class="seekers-status__legend-percent">{{ slice.percent }}%</span>
        </li>
      }
    </ul>
  </div>`,
  styleUrl: './seekers-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeekersStatusComponent {
  protected readonly slices = SLICES;
  protected readonly plugins = [centerTextPlugin];

  protected readonly data: ChartData<'doughnut'> = {
    labels: SLICES.map((slice) => slice.label),
    datasets: [
      {
        data: SLICES.map((slice) => slice.value),
        backgroundColor: SLICES.map((slice) => slice.color),
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverOffset: 0,
      },
    ],
  };

  protected readonly options: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };
}
