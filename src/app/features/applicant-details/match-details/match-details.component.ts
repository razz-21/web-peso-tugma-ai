import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { AvatarComponent } from '../../../core/components/avatar/avatar.component';
import { RecommendationScores } from '../../../core/models/recommended-job.model';
import { JobMatch, MAX_MATCH_SCORE } from '../job-match.model';
import { VectorComparisonComponent } from './vector-comparison/vector-comparison.component';

/** Visual severity of the match assessment banner. */
type AssessmentTone = 'positive' | 'caution' | 'critical';

interface Assessment {
  readonly tone: AssessmentTone;
  /** Short band label, e.g. "Moderate match". */
  readonly title: string;
  /** One-line rationale derived from the strongest / weakest factors. */
  readonly summary: string;
}

/** Human-readable phrase for each scoring dimension, used in the summary line. */
const DIMENSION_PHRASE: Record<keyof RecommendationScores, string> = {
  semantic_similarity: 'overall role fit',
  skills: 'skills',
  experience: 'experience',
  educational_background: 'education',
  location_preference: 'location',
};

const capitalize = (text: string): string =>
  text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);

/** Join phrases with commas and a trailing "and": "a, b and c". */
const joinList = (items: readonly string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

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
