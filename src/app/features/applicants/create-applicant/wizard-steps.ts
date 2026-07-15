/** Stable identifier used to select the body rendered for a step. */
export type WizardStepKey =
  | 'upload'
  | 'details'
  | 'education'
  | 'eligibility'
  | 'work'
  | 'preferences'
  | 'skills'
  | 'trainings'
  | 'confirmation';

/** A single step in the Create applicant wizard. */
export interface WizardStep {
  /** Stable key used to switch the step body. */
  readonly key: WizardStepKey;
  /** Short label shown in the left stepper rail. */
  readonly label: string;
  /** Eyebrow category shown above the content title (e.g. "PERSONAL"). */
  readonly category: string;
  /** Content heading for the step. */
  readonly title: string;
  /** One-line description shown under the content heading. */
  readonly subtitle: string;
  /** Marks a step the user may skip. */
  readonly optional?: boolean;
}

/** Ordered steps for creating an applicant. */
export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    key: 'upload',
    label: 'Upload Files',
    category: 'FILES',
    title: 'Upload Files',
    subtitle: 'Attach a resume or supporting documents to prefill later steps.',
    optional: true,
  },
  {
    key: 'details',
    label: 'Personal Information',
    category: 'PERSONAL',
    title: 'Personal Information',
    subtitle: 'Basic identity and contact information.',
  },
  {
    key: 'preferences',
    label: 'Job Preferences',
    category: 'PREFERENCES',
    title: 'Job Preferences',
    subtitle: 'Desired roles, locations, and expected salary.',
  },
  {
    key: 'education',
    label: 'Education',
    category: 'BACKGROUND',
    title: 'Education',
    subtitle: 'Schools attended and degrees earned.',
  },
  {
    key: 'eligibility',
    label: 'Eligibility',
    category: 'BACKGROUND',
    title: 'Eligibility',
    subtitle: 'Government eligibilities, licenses, and certifications.',
  },
  {
    key: 'work',
    label: 'Work Experience',
    category: 'BACKGROUND',
    title: 'Work Experience',
    subtitle: 'Previous roles and responsibilities.',
  },
  {
    key: 'skills',
    label: 'Skills',
    category: 'PROFILE',
    title: 'Skills',
    subtitle: 'Technical and soft skills.',
  },
  {
    key: 'trainings',
    label: 'Trainings & Certs',
    category: 'PROFILE',
    title: 'Trainings & Certifications',
    subtitle: 'Completed programs and credentials.',
  },
  {
    key: 'confirmation',
    label: 'Confirmation',
    category: 'REVIEW',
    title: 'Confirmation',
    subtitle: 'Review the details before creating the applicant.',
  },
];
