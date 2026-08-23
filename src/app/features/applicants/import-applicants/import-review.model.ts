import {
  ApplicantImportItem,
  ApplicantPost,
  ReferralStatus,
} from '../../../core/models/applicant.model';

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
  /** Raw registered date string from the CSV (displayed as-is). */
  registered: string;
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

/**
 * Parse a registered-date cell (ISO `2026-06-21`, `6/21/2026`, etc.) into an ISO
 * datetime string, or null when blank/unparseable so the server dates it now.
 */
function toIsoDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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

  return { applicant, job_id: jobId, status, date_registered: toIsoDate(row.registered) };
}

/**
 * Parse CSV text into rows of fields. Handles RFC 4180 quoting: double-quoted
 * fields, escaped quotes (`""`), and commas/newlines inside quotes.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Flush the trailing field/row (files often omit a final newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Read an uploaded import file into a grid of string cells. Excel workbooks
 * (.xlsx/.xls) are parsed with SheetJS (first sheet); .csv falls back to the
 * lightweight parser. Dates are emitted as text so they display as entered.
 */
export async function readImportRows(file: File): Promise<string[][]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  if (isCsv) {
    return parseCsv(await file.text());
  }

  // Load SheetJS on demand so it only ships when an import actually runs.
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const sheet = workbook.Sheets[firstSheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });
  return grid.map((row) => row.map((cell) => (cell == null ? '' : String(cell))));
}

/** Split a multi-value cell into trimmed parts (comma/semicolon/pipe separated). */
function splitList(value: string): string[] {
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
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

/** Normalize a header cell for tolerant matching (collapse spaces, drop punctuation). */
function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Map parsed CSV rows to review rows using the header to resolve columns, so the
 * order in the file can vary. Rows missing both a first and last name are
 * skipped as blank/spacer lines.
 */
export function toReviewRows(parsed: string[][]): ImportReviewRow[] {
  if (parsed.length === 0) {
    return [];
  }

  const header = parsed[0].map(normalizeHeader);
  const index = (field: string): number => {
    const aliases = COLUMN_ALIASES[field] ?? [field];
    for (const alias of aliases) {
      const i = header.indexOf(alias);
      if (i >= 0) {
        return i;
      }
    }
    return -1;
  };
  const at = (cells: string[], field: string): string => {
    const i = index(field);
    return i >= 0 ? (cells[i] ?? '').trim() : '';
  };

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
      registered: at(cells, 'date_registered'),
      companyId: null,
      jobId: null,
      status: null,
    });
  }

  return rows;
}
