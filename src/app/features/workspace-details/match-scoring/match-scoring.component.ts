import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { injectDispatch } from '@ngrx/signals/events';
import {
  DEFAULT_MATCHING_SCORE,
  MatchingScore,
  WorkspaceGet,
} from '../../../core/models/workspace.model';
import { WorkspacesStore } from '../../../stores/workspaces/workspaces.store';
import { workspacesEvents } from '../../../stores/workspaces/workspaces.events';

/** Keys of the workspace's matching-score weights. */
type FactorKey = keyof MatchingScore;

/** A single match-scoring factor and its presentation. */
interface Factor {
  readonly key: FactorKey;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
}

const FACTORS: readonly Factor[] = [
  {
    key: 'semantic_similarity',
    label: 'Semantic Similarity',
    description: 'Meaning-level match of the applicant profile to the job description.',
    icon: 'auto_awesome',
    color: '#4c6b2f',
  },
  {
    key: 'skills_match',
    label: 'Skills Match',
    description: "Overlap between required skills and the applicant's skills.",
    icon: 'edit',
    color: '#46697c',
  },
  {
    key: 'experience_match',
    label: 'Experience Match',
    description: 'Relevance of prior work experience to the role.',
    icon: 'work',
    color: '#b28a35',
  },
  {
    key: 'educational_match',
    label: 'Educational Match',
    description: 'Whether the applicant meets the minimum education.',
    icon: 'school',
    color: '#6e7a46',
  },
  {
    key: 'location_preference',
    label: 'Location Preference',
    description: "Alignment with the applicant's preferred work locations.",
    icon: 'location_on',
    color: '#b06a3f',
  },
];

const clampWeight = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
};

/**
 * Editor for the workspace's match-scoring weights. State is local for now —
 * there is no backing model/service yet, so "Save changes" is a placeholder.
 */
@Component({
  selector: 'app-match-scoring',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './match-scoring.component.html',
  styleUrl: './match-scoring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchScoringComponent {
  private readonly dispatch = injectDispatch(workspacesEvents);
  private readonly workspacesStore = inject(WorkspacesStore);

  readonly workspace = input.required<WorkspaceGet>();

  protected readonly factors = FACTORS;

  // Editable local copy of the workspace's saved weights. Resets whenever the
  // source workspace changes (e.g. after a successful save reloads it).
  protected readonly weights = linkedSignal<MatchingScore>(() => ({
    ...this.workspace().matching_score,
  }));

  protected readonly saving = computed(() => this.workspacesStore.updateWorkspaceLoading());

  protected readonly total = computed(() =>
    FACTORS.reduce((sum, factor) => sum + this.weights()[factor.key], 0),
  );
  protected readonly isBalanced = computed(() => this.total() === 100);

  protected readonly totalMessage = computed(() => {
    const total = this.total();
    if (total === 100) {
      return 'All five factors add up to 100%.';
    }
    if (total > 100) {
      return `Currently ${total}% — over by ${total - 100}%.`;
    }
    return `Currently ${total}% — under by ${100 - total}%.`;
  });

  protected setWeight(key: FactorKey, event: Event): void {
    const value = clampWeight((event.target as HTMLInputElement).valueAsNumber);
    this.weights.update((current) => ({ ...current, [key]: value }));
  }

  /** Restore the standard profile and persist it immediately. */
  protected reset(): void {
    if (this.saving()) {
      return;
    }
    this.weights.set({ ...DEFAULT_MATCHING_SCORE });
    this.persist(DEFAULT_MATCHING_SCORE);
  }

  /** Proportionally rescale the current weights so they total exactly 100%. */
  protected balance(): void {
    const current = this.weights();
    const total = this.total();

    if (total === 0) {
      // Nothing to scale from — spread evenly.
      const even = Math.floor(100 / FACTORS.length);
      const balanced = {} as MatchingScore;
      FACTORS.forEach((factor, index) => {
        balanced[factor.key] = index === 0 ? 100 - even * (FACTORS.length - 1) : even;
      });
      this.weights.set(balanced);
      return;
    }

    const scaled = FACTORS.map((factor) => (current[factor.key] * 100) / total);
    const floored = scaled.map((value) => Math.floor(value));
    let remainder = 100 - floored.reduce((sum, value) => sum + value, 0);

    // Hand the leftover points to the largest fractional parts first.
    const order = scaled
      .map((value, index) => ({ index, frac: value - floored[index] }))
      .sort((a, b) => b.frac - a.frac);

    for (let i = 0; i < remainder; i++) {
      floored[order[i].index]++;
    }
    remainder = 0;

    const balanced = {} as MatchingScore;
    FACTORS.forEach((factor, index) => {
      balanced[factor.key] = floored[index];
    });
    this.weights.set(balanced);
  }

  protected save(): void {
    if (!this.isBalanced() || this.saving()) {
      return;
    }
    this.persist(this.weights());
  }

  private persist(matchingScore: MatchingScore): void {
    this.dispatch.updateWorkspace({
      id: this.workspace().id,
      workspace: { matching_score: matchingScore },
    });
  }
}
