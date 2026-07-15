import { Injectable, computed, effect, signal } from '@angular/core';
import { disabled, email, form, maxLength, pattern, required } from '@angular/forms/signals';
import { ApplicantPost } from '../../../core/models/applicant.model';
import {
  ApplicantDraft,
  DraftEligibility,
  DraftOccupationIndustry,
  DraftTraining,
  DraftWorkExperience,
  EMPTY_ELIGIBILITY,
  EMPTY_OCCUPATION_INDUSTRY,
  EMPTY_TRAINING,
  EMPTY_WORK_EXPERIENCE,
  INITIAL_DRAFT,
  draftToPayload,
} from './applicant-draft.model';
import { WizardStepKey } from './wizard-steps';

const NAME_MAX = 100;
const MOBILE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
/** Digits only, up to 5 characters (e.g. graduation year). */
const YEAR_PATTERN = /^\d{0,5}$/;

/** Minimal structural view of a Signal Forms field tree for recursive traversal. */
interface FieldTreeLike {
  (): { markAsTouched: () => void; valid: () => boolean; value: () => unknown };
  [key: string]: FieldTreeLike;
}

/** Marks a field and every descendant as touched so validation errors surface. */
function markTreeTouched(field: FieldTreeLike): void {
  field().markAsTouched();
  const value = field().value();
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      markTreeTouched(field[key]);
    }
  }
}

/** Top-level draft fields validated by each wizard step. */
const STEP_FIELDS: Record<WizardStepKey, (keyof ApplicantDraft)[]> = {
  upload: [],
  details: [
    'firstname',
    'lastname',
    'middlename',
    'suffix',
    'date_of_birth',
    'sex',
    'citizenship',
    'height_in_cm',
    'weight_in_kg',
    'present_address',
    'permanent_address',
    'primary_mobile_number',
    'secondary_mobile_number',
    'email_address',
  ],
  preferences: [
    'employment_status',
    'preferred_occupation_industry',
    'preferred_work_location',
    'salary_expectation',
  ],
  education: ['educational_background'],
  eligibility: ['eligibility'],
  work: ['work_experience'],
  skills: ['technical_skills'],
  trainings: ['trainings'],
  confirmation: [],
};

/**
 * Dialog-scoped state for the Create applicant wizard. Owns one Signal Form over
 * the entire applicant draft so each step reads/writes its slice while values
 * persist across step navigation. Provided at the wizard component.
 */
@Injectable()
export class CreateApplicantDraftStore {
  /** When true, the permanent address mirrors the present address and is locked. */
  readonly sameAsPresent = signal(false);

  /** CSV files staged on the Upload step, retained across step navigation. */
  readonly uploadedFiles = signal<readonly File[]>([]);

  private readonly data = signal<ApplicantDraft>(structuredClone(INITIAL_DRAFT));

  readonly form = form(this.data, (p) => {
    disabled(p.permanent_address, () => this.sameAsPresent());

    required(p.firstname, { message: 'First name is required' });
    maxLength(p.firstname, NAME_MAX, { message: `Must be ${NAME_MAX} characters or fewer` });

    required(p.lastname, { message: 'Last name is required' });
    maxLength(p.lastname, NAME_MAX, { message: `Must be ${NAME_MAX} characters or fewer` });

    maxLength(p.middlename, NAME_MAX, { message: `Must be ${NAME_MAX} characters or fewer` });
    maxLength(p.suffix, 20, { message: 'Must be 20 characters or fewer' });

    required(p.date_of_birth, { message: 'Date of birth is required' });
    required(p.sex, { message: 'Sex is required' });

    required(p.email_address, { message: 'Email is required' });
    email(p.email_address, { message: 'Enter a valid email address' });

    required(p.primary_mobile_number, { message: 'Primary mobile number is required' });
    pattern(p.primary_mobile_number, MOBILE_PATTERN, { message: 'Enter a valid mobile number' });
    pattern(p.secondary_mobile_number, MOBILE_PATTERN, { message: 'Enter a valid mobile number' });

    required(p.present_address.province, { message: 'Province is required' });
    required(p.present_address.municipality_city, { message: 'Municipality/City is required' });
    required(p.present_address.baranggay, { message: 'Barangay is required' });
    required(p.present_address.house_no_street, { message: 'House no. / Street is required' });

    pattern(p.educational_background.year_graduated, YEAR_PATTERN, {
      message: 'Enter numbers only (up to 5 digits)',
    });
    pattern(p.educational_background.last_attended, YEAR_PATTERN, {
      message: 'Enter numbers only (up to 5 digits)',
    });
  });

  readonly payload = computed<ApplicantPost>(() =>
    draftToPayload(this.form().value(), this.sameAsPresent()),
  );

  constructor() {
    // Mirror the present address into the permanent address while the toggle is on.
    effect(() => {
      if (!this.sameAsPresent()) {
        return;
      }
      const present = this.form.present_address().value();
      this.form.permanent_address().value.set({ ...present });
    });
  }

  setSameAsPresent(checked: boolean): void {
    this.sameAsPresent.set(checked);
  }

  // --- Uploaded files ------------------------------------------------------

  /**
   * Stages CSV files, skipping non-CSV files and duplicates (matched by name and
   * size). Returns how many were added and how many were rejected as non-CSV.
   */
  addFiles(incoming: readonly File[]): { added: number; rejected: number } {
    const csv = incoming.filter((file) => this.isCsv(file));
    const rejected = incoming.length - csv.length;
    const current = this.uploadedFiles();
    const fresh = csv.filter(
      (file) =>
        !current.some((existing) => existing.name === file.name && existing.size === file.size),
    );
    if (fresh.length > 0) {
      this.uploadedFiles.set([...current, ...fresh]);
    }
    return { added: fresh.length, rejected };
  }

  removeFile(index: number): void {
    this.uploadedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  private isCsv(file: File): boolean {
    return (
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.toLowerCase().endsWith('.csv')
    );
  }

  /** Marks the step's fields touched and returns whether they are all valid. */
  validateStep(key: WizardStepKey): boolean {
    const tree = this.form as unknown as Record<string, FieldTreeLike>;
    let valid = true;
    for (const name of STEP_FIELDS[key]) {
      const node = tree[name];
      markTreeTouched(node);
      if (!node().valid()) {
        valid = false;
      }
    }
    return valid;
  }

  buildPayload(): ApplicantPost {
    return this.payload();
  }

  // --- Repeatable sections -------------------------------------------------

  addOccupationIndustry(): void {
    this.push('preferred_occupation_industry', { ...EMPTY_OCCUPATION_INDUSTRY });
  }

  removeOccupationIndustry(index: number): void {
    this.removeAt('preferred_occupation_industry', index);
  }

  addWorkLocation(): void {
    this.push('preferred_work_location', '');
  }

  removeWorkLocation(index: number): void {
    this.removeAt('preferred_work_location', index);
  }

  addEligibility(): void {
    this.push('eligibility', { ...EMPTY_ELIGIBILITY });
  }

  removeEligibility(index: number): void {
    this.removeAt('eligibility', index);
  }

  addWorkExperience(): void {
    this.push('work_experience', { ...EMPTY_WORK_EXPERIENCE });
  }

  removeWorkExperience(index: number): void {
    this.removeAt('work_experience', index);
  }

  addSkill(value: string): void {
    const skill = value.trim();
    if (skill.length === 0) {
      return;
    }
    this.push('technical_skills', skill);
  }

  removeSkill(index: number): void {
    this.removeAt('technical_skills', index);
  }

  addTraining(): void {
    this.push('trainings', { ...EMPTY_TRAINING });
  }

  removeTraining(index: number): void {
    this.removeAt('trainings', index);
  }

  private push<K extends keyof ApplicantDraft>(
    key: K,
    item: ApplicantDraft[K] extends (infer T)[] ? T : never,
  ): void {
    this.data.update((draft) => ({ ...draft, [key]: [...(draft[key] as unknown[]), item] }));
  }

  private removeAt(key: keyof ApplicantDraft, index: number): void {
    this.data.update((draft) => ({
      ...draft,
      [key]: (draft[key] as unknown[]).filter((_, i) => i !== index),
    }));
  }
}

export type { DraftEligibility, DraftOccupationIndustry, DraftTraining, DraftWorkExperience };
