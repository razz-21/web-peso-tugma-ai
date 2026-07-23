/** Visual severity of the match assessment banner. */
export type AssessmentTone = 'positive' | 'caution' | 'critical';

export interface Assessment {
  readonly tone: AssessmentTone;
  /** Short band label, e.g. "Moderate match". */
  readonly title: string;
  /** One-line rationale derived from the strongest / weakest factors. */
  readonly summary: string;
}
