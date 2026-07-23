import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { JobMatch } from '../types/job-match.type';
import { Assessment } from '../types/match-details.type';
import { MAX_MATCH_SCORE } from '../utils/job-match.util';
import { DIMENSION_PHRASE } from '../utils/match-details.util';
import { capitalize, joinList } from '../utils/text.util';
import { VectorComparisonComponent } from './vector-comparison/vector-comparison.component';

/**
 * Match-details panel: score-band banner, weighted score breakdown, running
 * total and a relevance assessment. Presentation-only — the host owns the data
 * and reacts to the emitted intents.
 */
@Component({
  selector: 'app-match-details',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    AvatarComponent,
    VectorComparisonComponent,
  ],
  templateUrl: './match-details.component.html',
  styleUrl: './match-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetailsComponent {
  readonly match = input.required<JobMatch>();

  /** User dismissed the panel. */
  readonly closed = output<void>();
  /** User graded the recommendation's relevance (thumbs up / down). */
  readonly relevanceChange = output<boolean>();
  /** User asked to open the full applicant-vs-job comparison view. */
  readonly viewComparison = output<void>();
  /** User referred the applicant to this job. */
  readonly refer = output<void>();

  protected readonly maxScore = MAX_MATCH_SCORE;

  /**
   * Ineligibility notice shown under Assessment. Null when the applicant meets
   * the job's eligibility requirement (or the job states none), so the message
   * only appears when there is a real eligibility gap.
   */
  protected readonly eligibilityNotice = computed<string | null>(() => {
    const match = this.match();
    if (match.eligible) {
      return null;
    }
    const requirement = match.eligibilityRequired?.trim();
    return requirement
      ? `This applicant is not eligible for this job, which requires ${requirement}.`
      : 'This applicant is not eligible for this job.';
  });

  /** Header meta line under the company: salary · location. */
  protected readonly metaSegments = computed<readonly string[]>(() => {
    const match = this.match();
    const salary = match.salary === null ? null : `₱${match.salary.toLocaleString('en-US')}/mo`;
    return [salary, match.location].filter((segment): segment is string => Boolean(segment));
  });

  /** Derived score-band banner: label, tone and a strengths/weaknesses summary. */
  protected readonly assessment = computed<Assessment>(() => {
    const match = this.match();
    const strong = match.breakdown
      .filter((dimension) => dimension.value >= 85)
      .map((dimension) => DIMENSION_PHRASE[dimension.key]);
    const weak = match.breakdown
      .filter((dimension) => dimension.value < 50)
      .map((dimension) => DIMENSION_PHRASE[dimension.key]);

    let summary: string;
    if (strong.length > 0 && weak.length > 0) {
      summary = `${capitalize(joinList(strong))} ${strong.length === 1 ? 'lines' : 'line'} up well, but ${joinList(weak)} ${weak.length === 1 ? 'falls' : 'fall'} short of the ideal.`;
    } else if (strong.length > 0) {
      summary = `${capitalize(joinList(strong))} ${strong.length === 1 ? 'lines' : 'line'} up well across the board.`;
    } else if (weak.length > 0) {
      summary = `${capitalize(joinList(weak))} ${weak.length === 1 ? 'falls' : 'fall'} short of the ideal for this role.`;
    } else {
      summary = 'This role is a partial fit based on the weighted factors.';
    }

    const score = match.score;
    if (score >= 85) {
      return { tone: 'positive', title: 'Strong match', summary };
    }
    if (score >= 70) {
      return { tone: 'positive', title: 'Good match', summary };
    }
    if (score >= 50) {
      return { tone: 'caution', title: 'Moderate match', summary };
    }
    return { tone: 'critical', title: 'Low match', summary };
  });
}
