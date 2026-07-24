import { Signal } from '@angular/core';
import { ApplicantGet } from '../../../core/models/applicant.model';
import { JobGet } from '../../../core/models/job.model';

/** Data handed to the full-page manual-referral dialog. */
export interface ManualReferralDialogData {
  readonly applicant: ApplicantGet;
  /** Job ids the applicant is already referred to (live), to mark cards. */
  readonly referredJobIds: Signal<ReadonlySet<string>>;
  /** Referral flow owned by the parent (confirm dialog + dispatch). */
  readonly onRefer: (job: JobGet) => void;
}

/** Outcome of a single hard primary-requirement gate. */
export type GateState = 'pass' | 'fail' | 'na' | 'unknown';

/** One primary-requirement gate row (vacancies / age / sex / civil status). */
export interface GateRow {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly state: GateState;
  readonly reason: string;
  /** Pill caption for the state (Pass / Fail / No limit / No data). */
  readonly stateLabel: string;
}

/** Applicant-vs-job eligibility comparison (licenses / civil-service, ...). */
export interface EligibilityView {
  /** Whether the job states an eligibility requirement at all. */
  readonly hasRequirement: boolean;
  readonly required: string | null;
  /** Titles of the eligibilities the applicant holds. */
  readonly applicantHeld: readonly string[];
  readonly state: GateState;
  readonly badge: string;
  readonly reason: string;
}

/** A single job row screened against the applicant. */
export interface JobCard {
  readonly id: string;
  readonly job: JobGet;
  readonly title: string;
  readonly companyName: string;
  readonly seed: string;
  /** Header meta: company · location · salary · vacancies. */
  readonly headerSegments: readonly string[];
  /** True once the applicant has been referred to this job. */
  readonly referred: boolean;

  // Job requirement details.
  readonly skillsRequired: readonly string[];
  readonly experienceText: string;
  readonly educationText: string;
  readonly locationText: string;
  readonly salaryText: string;

  // Primary requirements (hard gates).
  readonly primaryMet: boolean;
  readonly gates: readonly GateRow[];
  /**
   * Why the referral is blocked, when a hard gate fails (else null). Shown
   * beside the disabled "Refer to this job" button.
   */
  readonly blockedReason: string | null;

  // Eligibility (licenses / civil-service, ...).
  readonly eligibility: EligibilityView;
}

/** A work-experience entry in the rail. */
export interface ExperienceItem {
  readonly position: string;
  readonly company: string | null;
  readonly period: string;
  readonly status: string | null;
}

/** A generic title / sub-line list item (trainings, eligibility). */
export interface TwoLine {
  readonly title: string;
  readonly sub: string | null;
}

/** One cell in the 2×2 quick-stats grid. */
export interface StatCell {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly sub: string;
  /** Accent the value (used for the salary expectation). */
  readonly accent?: boolean;
}
