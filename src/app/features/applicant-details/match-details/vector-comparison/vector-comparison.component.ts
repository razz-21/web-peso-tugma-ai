import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { VectorBin } from '../../types/vector-comparison.type';
import { cosineSimilarity, poolMagnitudes } from '../../utils/vector.util';
import { injectCssColorResolver, withAlpha } from '../../../../core/utils/css-color.util';

/** Number of embedding dimensions plotted; the dense vectors are pooled down to this. */
const BIN_COUNT = 10;
/** Display band the pooled magnitudes are normalized into, keeping the plot inside its axis. */
const DISPLAY_MIN = 0.15;
const DISPLAY_MAX = 0.75;

const RESUME_COLOR = 'var(--app-success)';
const JOB_COLOR = 'var(--app-warning)';
const AXIS_COLOR = 'var(--mat-sys-on-surface-variant)';
const GRID_COLOR = 'var(--mat-sys-surface-container-high)';

/**
 * Side-by-side line chart of the applicant's résumé embedding against the job's
 * requirements embedding, pooled to {@link BIN_COUNT} dimensions with the
 * divergence between the two series shaded.
 */
@Component({
  selector: 'app-vector-comparison',
  imports: [BaseChartDirective, MatIconModule],
  templateUrl: './vector-comparison.component.html',
  styleUrl: './vector-comparison.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorComparisonComponent {
  /** Resolves theme tokens for the canvas; re-evaluates on a light/dark switch. */
  private readonly colors = injectCssColorResolver();
  private c(color: string): string {
    return this.colors()(color);
  }

  readonly resume = input.required<readonly number[]>();
  readonly job = input.required<readonly number[]>();

  /** Pooled, jointly-normalized display values per dimension. */
  protected readonly bins = computed<readonly VectorBin[]>(() => {
    const resume = this.resume();
    const job = this.job();
    const count = Math.min(BIN_COUNT, resume.length, job.length);
    if (count === 0) {
      return [];
    }
    const resumeMags = poolMagnitudes(resume, count);
    const jobMags = poolMagnitudes(job, count);

    // Normalize both series together so relative structure (and divergence) is
    // preserved while the plot stays within its fixed value axis.
    const all = [...resumeMags, ...jobMags];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min;
    const scale = (value: number): number =>
      span === 0
        ? (DISPLAY_MIN + DISPLAY_MAX) / 2
        : DISPLAY_MIN + ((value - min) / span) * (DISPLAY_MAX - DISPLAY_MIN);

    return resumeMags.map((mag, index) => ({ resume: scale(mag), job: scale(jobMags[index]) }));
  });

  protected readonly cosine = computed(() => cosineSimilarity(this.resume(), this.job()));

  protected readonly cosineLabel = computed(() => this.cosine().toFixed(3));

  /** The two dimensions where résumé and job diverge most, highest first. */
  protected readonly largestDivergence = computed<readonly number[]>(() =>
    this.bins()
      .map((bin, index) => ({ index, gap: Math.abs(bin.resume - bin.job) }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 2)
      .map((entry) => entry.index),
  );

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    const bins = this.bins();
    return {
      labels: bins.map((_, index) => index),
      datasets: [
        {
          label: 'Job',
          data: bins.map((bin) => bin.job),
          borderColor: this.c(JOB_COLOR),
          backgroundColor: this.c(JOB_COLOR),
          pointBackgroundColor: this.c(JOB_COLOR),
          pointBorderColor: this.c(JOB_COLOR),
          pointStyle: 'rect',
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 2.5,
          tension: 0,
          fill: false,
        },
        {
          label: 'Applicant',
          data: bins.map((bin) => bin.resume),
          borderColor: this.c(RESUME_COLOR),
          backgroundColor: withAlpha(this.c('var(--mat-sys-outline)'), 0.16),
          pointBackgroundColor: this.c(RESUME_COLOR),
          pointBorderColor: this.c(RESUME_COLOR),
          pointStyle: 'circle',
          pointRadius: 4,
          pointHoverRadius: 5,
          borderWidth: 2.5,
          tension: 0,
          // Shade the area between this line and the previous (job) dataset.
          fill: '-1',
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => `Dimension ${items[0]?.label ?? ''}`,
          label: (item) => `${item.dataset.label}: ${Number(item.parsed.y).toFixed(3)}`,
        },
      },
    },
    scales: {
      y: {
        min: 0.1,
        max: 0.8,
        title: { display: true, text: 'Value', color: this.c(AXIS_COLOR), font: { size: 13 } },
        ticks: { stepSize: 0.1, color: this.c(AXIS_COLOR), font: { size: 12 } },
        grid: { color: this.c(GRID_COLOR) },
        border: { display: false },
      },
      x: {
        title: {
          display: true,
          text: 'Embedding dimension',
          color: this.c(AXIS_COLOR),
          font: { size: 13 },
        },
        ticks: { color: this.c(AXIS_COLOR), font: { size: 13 } },
        grid: { color: this.c(GRID_COLOR) },
        border: { display: false },
      },
    },
  };
}
