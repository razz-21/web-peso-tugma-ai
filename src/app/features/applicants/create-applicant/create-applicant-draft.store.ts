import { Injectable, computed, effect, signal } from '@angular/core';
import { disabled, email, form, maxLength, pattern, required } from '@angular/forms/signals';
import { ApplicantPost, ResumeExtraction } from '../../../core/models/applicant.model';
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
  parseIsoDate,
} from './applicant-draft.model';
import { WizardStepKey } from './wizard-steps';

/** Draft fields the resume parser can prefill; drives the "review" flagging. */
type PrefillKey =
  | 'firstname'
  | 'middlename'
  | 'lastname'
  | 'suffix'
  | 'sex'
  | 'date_of_birth'
  | 'email_address'
  | 'primary_mobile_number'
  | 'educational_background'
  | 'technical_skills'
  | 'work_experience'
  | 'trainings'
  | 'eligibility';

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
    'civil_status',
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

  /** Resume PDF staged on the Upload step, uploaded after the applicant is created. */
  readonly resumeFile = signal<File | null>(null);

  /** Draft fields that were prefilled from the resume — the officer should review these. */
  readonly prefilledFields = signal<ReadonlySet<PrefillKey>>(new Set());

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

  /** Replace the draft with seeded values (used when editing an existing applicant). */
  hydrate(draft: ApplicantDraft, sameAsPresent: boolean): void {
    this.sameAsPresent.set(sameAsPresent);
    this.data.set(structuredClone(draft));
  }

  // --- Resume upload + extraction ------------------------------------------

  /** Stage the resume PDF (uploaded after the applicant is created). */
  setResumeFile(file: File): void {
    this.resumeFile.set(file);
  }

  /** Clear the staged resume and any prefill flags. */
  clearResume(): void {
    this.resumeFile.set(null);
    this.prefilledFields.set(new Set());
  }

  /**
   * Merge parsed resume fields into the draft, filling **only empty fields** so
   * anything the officer already typed is never overwritten. Records which
   * fields were prefilled so the UI can flag them for review.
   */
  applyExtraction(extraction: ResumeExtraction): void {
    const draft = structuredClone(this.data());
    const filled = new Set<PrefillKey>();

    const fillString = (
      key:
        | 'firstname'
        | 'middlename'
        | 'lastname'
        | 'suffix'
        | 'email_address'
        | 'primary_mobile_number',
      value: string | null | undefined,
    ): void => {
      if (value && draft[key].trim().length === 0) {
        draft[key] = value;
        filled.add(key);
      }
    };

    fillString('firstname', extraction.firstname);
    fillString('middlename', extraction.middlename);
    fillString('lastname', extraction.lastname);
    fillString('suffix', extraction.suffix);
    fillString('email_address', extraction.email_address);
    fillString('primary_mobile_number', extraction.primary_mobile_number);

    if (extraction.sex && draft.sex === '') {
      draft.sex = extraction.sex;
      filled.add('sex');
    }
    if (extraction.date_of_birth && draft.date_of_birth === null) {
      const parsed = parseIsoDate(extraction.date_of_birth);
      if (parsed) {
        draft.date_of_birth = parsed;
        filled.add('date_of_birth');
      }
    }

    const source = extraction.educational_background;
    if (source) {
      const education = draft.educational_background;
      let touched = false;
      const keys = [
        'highest_education_level',
        'year_graduated',
        'last_attended',
        'school_university',
        'course_program',
      ] as const;
      for (const key of keys) {
        const value = source[key];
        if (value && education[key].trim().length === 0) {
          education[key] = value;
          touched = true;
        }
      }
      if (touched) {
        filled.add('educational_background');
      }
    }

    if (extraction.technical_skills.length > 0 && draft.technical_skills.length === 0) {
      draft.technical_skills = [...extraction.technical_skills];
      filled.add('technical_skills');
    }
    if (extraction.work_experience.length > 0 && draft.work_experience.length === 0) {
      draft.work_experience = extraction.work_experience.map((item) => ({
        company: item.company ?? '',
        address: item.address ?? '',
        position: item.position ?? '',
        start_date: parseIsoDate(item.start_date),
        end_date: parseIsoDate(item.end_date),
        status_of_appointment: item.status_of_appointment ?? '',
      }));
      filled.add('work_experience');
    }
    if (extraction.trainings.length > 0 && draft.trainings.length === 0) {
      draft.trainings = extraction.trainings.map((item) => ({
        training_title: item.training_title ?? '',
        duration_start: parseIsoDate(item.duration_start),
        duration_end: parseIsoDate(item.duration_end),
        institution: item.institution ?? '',
        certificate_received: item.certificate_received ?? '',
        completed: item.completed ?? false,
      }));
      filled.add('trainings');
    }
    if (extraction.eligibility.length > 0 && draft.eligibility.length === 0) {
      draft.eligibility = extraction.eligibility.map((item) => ({
        title: item.title ?? '',
        license_number: item.license_number ?? '',
        expiry_date: parseIsoDate(item.expiry_date),
      }));
      filled.add('eligibility');
    }

    this.data.set(draft);
    this.prefilledFields.set(filled);
  }

  /** Marks the step's fields touched and returns whether they are all valid. */
  validateStep(key: WizardStepKey): boolean {
    return this.validateFields(STEP_FIELDS[key] as string[]);
  }

  /** Marks the given top-level fields touched and returns whether they are all valid. */
  validateFields(fields: readonly string[]): boolean {
    const tree = this.form as unknown as Record<string, FieldTreeLike>;
    let valid = true;
    for (const name of fields) {
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
