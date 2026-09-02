import {
  ApplicantImportItem,
  ApplicantPost,
  ReferralStatus,
} from '../../../core/models/applicant.model';
import { headerAccessor, readImportRows, splitList } from '../../../core/utils/spreadsheet.util';

export { readImportRows };

/**
 * One imported applicant awaiting review before it is saved. CSV-derived fields
 * are editable in the review table; `companyId`/`jobId`/`status` capture the
 * optional job assignment the officer makes per row.
 */
export interface ImportReviewRow {
  /** Stable local id (row index) — used for trackBy and per-row edits. */
  id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  suffix: string;
  fullName: string;
  initials: string;
  educationLevel: string;
  courseProgram: string;
  gender: string;
  civilStatus: string[];
  address: string;
  skills: string[];
  contactNumber: string;
  /** Registered date (editable; defaults to today when the file omits it). */
  registered: Date | null;
  companyId: string | null;
  jobId: string | null;
  status: string | null;
}

/** Assignment statuses selectable per row (map to backend referral statuses). */
export const ASSIGNMENT_STATUSES = ['Referred', 'For interview', 'Hired', 'Not hired'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

/** Map a review-row status label to the backend referral status. */
const STATUS_TO_REFERRAL: Record<AssignmentStatus, ReferralStatus> = {
  Referred: 'referred',
  'For interview': 'interview_scheduled',
  Hired: 'hired',
  'Not hired': 'not_hired',
};

/** Parse a date cell (ISO `2026-06-21`, `6/21/2026`, etc.), or null when unset. */
function parseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format a picked date as an ISO datetime at UTC midnight of that calendar day,
 * or null when unset — keeps the chosen day stable regardless of timezone.
 */
function toDateTimeString(value: Date | null): string | null {
  if (!value || Number.isNaN(value.getTime())) {
    return null;
  }
  const year = value.getFullYear().toString().padStart(4, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00+00:00`;
}

/**
 * Build the import payload for a row. When `assign` is true and the row has a
 * job selected, it carries a referral (status defaults to `referred`); otherwise
 * `job_id`/`status` are null and the applicant is saved as registered only.
 */
export function toImportItem(row: ImportReviewRow, assign: boolean): ApplicantImportItem {
  const applicant: ApplicantPost = {
    firstname: row.firstname,
    lastname: row.lastname,
    middlename: row.middlename || null,
    suffix: row.suffix || null,
    sex: row.gender === 'Male' || row.gender === 'Female' ? row.gender : null,
    civil_status: row.civilStatus.length > 0 ? row.civilStatus.join(', ') : null,
    present_address: row.address ? { house_no_street: row.address } : undefined,
    primary_mobile_number: row.contactNumber || null,
    technical_skills: row.skills,
    educational_background:
      row.educationLevel || row.courseProgram
        ? {
            current_in_school: false,
            highest_education_level: row.educationLevel || null,
            course_program: row.courseProgram || null,
          }
        : null,
    status: 'active',
  };

  const jobId = assign ? row.jobId : null;
  const status: ReferralStatus | null = jobId
    ? (row.status && STATUS_TO_REFERRAL[row.status as AssignmentStatus]) || 'referred'
    : null;

  return { applicant, job_id: jobId, status, date_registered: toDateTimeString(row.registered) };
}

function initialsOf(firstname: string, lastname: string): string {
  const first = firstname.trim().charAt(0);
  const last = lastname.trim().charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
}

/** Accepted header spellings for each field, so slightly different CSVs still map. */
const COLUMN_ALIASES: Record<string, readonly string[]> = {
  firstname: ['firstname', 'first name', 'first_name', 'given name'],
  middlename: ['middlename', 'middle name', 'middle_name'],
  lastname: ['lastname', 'last name', 'last_name', 'surname', 'family name'],
  suffix: ['suffix', 'name suffix'],
  address: ['address', 'present address', 'home address'],
  skills: ['skills', 'technical skills', 'skill'],
  gender: ['gender', 'sex'],
  civil_status: ['civil_status', 'civil status', 'marital status'],
  highest_education_level: ['highest_education_level', 'highest education level', 'education'],
  course_program: ['course_program', 'course / program', 'course', 'program'],
  date_registered: ['date_registered', 'date registered', 'registered', 'registration date'],
  contact_number: ['contact_number', 'contact number', 'contact', 'mobile', 'phone'],
};

/**
 * Map parsed CSV rows to review rows using the header to resolve columns, so the
 * order in the file can vary. Rows missing both a first and last name are
 * skipped as blank/spacer lines.
 */
export function toReviewRows(parsed: string[][]): ImportReviewRow[] {
  if (parsed.length === 0) {
    return [];
  }

  const at = headerAccessor(parsed[0], COLUMN_ALIASES);

  const rows: ImportReviewRow[] = [];
  for (let r = 1; r < parsed.length; r++) {
    const cells = parsed[r];
    const firstname = at(cells, 'firstname');
    const lastname = at(cells, 'lastname');
    if (!firstname && !lastname) {
      continue;
    }

    const middlename = at(cells, 'middlename');
    const suffix = at(cells, 'suffix');
    const fullName = [firstname, middlename, lastname, suffix]
      .filter((part) => part.length > 0)
      .join(' ');

    rows.push({
      id: String(rows.length),
      firstname,
      middlename,
      lastname,
      suffix,
      fullName: fullName || 'Unnamed applicant',
      initials: initialsOf(firstname, lastname),
      educationLevel: at(cells, 'highest_education_level'),
      courseProgram: at(cells, 'course_program'),
      gender: at(cells, 'gender'),
      civilStatus: splitList(at(cells, 'civil_status')),
      address: at(cells, 'address'),
      skills: splitList(at(cells, 'skills')),
      contactNumber: at(cells, 'contact_number'),
      // Default to today when the file omits a registered date.
      registered: parseDate(at(cells, 'date_registered')) ?? new Date(),
      companyId: null,
      jobId: null,
      status: null,
    });
  }

  return rows;
}
