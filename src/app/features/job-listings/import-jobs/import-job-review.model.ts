import { JobPost, Sex } from '../../../core/models/job.model';
import { headerAccessor, splitList } from '../../../core/utils/spreadsheet.util';

export { readImportRows } from '../../../core/utils/spreadsheet.util';

/**
 * One imported job awaiting review before it is saved. All fields are editable
 * in the review table; the company is fixed (the company being imported into).
 */
export interface ImportJobReviewRow {
  /** Stable local id (row index) — used for trackBy and per-row edits. */
  id: string;
  title: string;
  description: string;
  location: string;
  ageRange: string;
  /** '' (Any) | 'Male' | 'Female' | 'Female/Male'. */
  sex: string;
  civilStatus: string[];
  vacancies: number;
  salary: number | null;
  minEducation: string[];
  courseProgram: string;
  skills: string[];
  preferredSkills: string[];
  experienceRequired: string;
  experiencePreferred: string;
  /** Created date parsed from the file (editable; carried into `created_at`). */
  dateCreated: Date | null;
}

/** Accepted header spellings for each job column, so varied files still map. */
const COLUMN_ALIASES: Record<string, readonly string[]> = {
  title: ['title', 'job title', 'position'],
  description: ['description', 'job description'],
  location: ['location', 'work location'],
  age_range: ['age_range', 'age range', 'age'],
  sex: ['sex', 'gender'],
  civil_status: ['civil_status', 'civil status', 'marital status'],
  no_of_vacancies: ['no_of_vacancies', 'vacancies', 'no of vacancies', 'number of vacancies'],
  salary_per_month: ['salary_per_month', 'salary / mo', 'salary', 'monthly salary'],
  minimum_education_attainment: [
    'minimum_education_attainment',
    'min. education',
    'minimum education',
    'education',
  ],
  course_program: ['course_program', 'course / program', 'course', 'program'],
  skills_required: ['skills_required', 'skills required', 'skills'],
  preferred_skills: ['preferred_skills', 'preferred skills'],
  experience_required: ['experience_required', 'experience required', 'experience'],
  experience_preferred: ['experience_preferred', 'experience preferred'],
  date_created: ['date_created', 'date created', 'created', 'created at'],
};

/** Parse a numeric cell (stripping currency/commas), or null when blank/NaN. */
function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.-]/g, '').trim();
  if (!cleaned) {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** Parse a date cell (ISO, `7/25/2026`, etc.) into a Date, or null when unset. */
function parseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Normalize a sex cell to a job Sex option, or '' for "Any"/unspecified. */
function normalizeSex(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === 'male') {
    return 'Male';
  }
  if (value === 'female') {
    return 'Female';
  }
  if (value === 'both' || value === 'female/male' || value === 'male/female' || value === 'any') {
    return value === 'any' ? '' : 'Female/Male';
  }
  return '';
}

/**
 * Map parsed rows to job review rows using the header to resolve columns, so the
 * file's order/spelling can vary. Rows with no title are skipped as blanks.
 */
export function toJobReviewRows(parsed: string[][]): ImportJobReviewRow[] {
  if (parsed.length === 0) {
    return [];
  }

  const at = headerAccessor(parsed[0], COLUMN_ALIASES);
  const rows: ImportJobReviewRow[] = [];
  for (let r = 1; r < parsed.length; r++) {
    const cells = parsed[r];
    const title = at(cells, 'title');
    if (!title) {
      continue;
    }

    const vacancies = parseNumber(at(cells, 'no_of_vacancies'));
    rows.push({
      id: String(rows.length),
      title,
      description: at(cells, 'description'),
      location: at(cells, 'location'),
      ageRange: at(cells, 'age_range'),
      sex: normalizeSex(at(cells, 'sex')),
      civilStatus: splitList(at(cells, 'civil_status')),
      vacancies: vacancies && vacancies >= 1 ? Math.trunc(vacancies) : 1,
      salary: parseNumber(at(cells, 'salary_per_month')),
      minEducation: splitList(at(cells, 'minimum_education_attainment')),
      courseProgram: at(cells, 'course_program'),
      skills: splitList(at(cells, 'skills_required')),
      preferredSkills: splitList(at(cells, 'preferred_skills')),
      experienceRequired: at(cells, 'experience_required'),
      experiencePreferred: at(cells, 'experience_preferred'),
      dateCreated: parseDate(at(cells, 'date_created')),
    });
  }

  return rows;
}

/**
 * Format a picked date as an ISO datetime at UTC midnight of that calendar day,
 * or undefined when unset — keeps the chosen day stable regardless of timezone.
 */
function toDateTimeString(value: Date | null): string | undefined {
  if (!value || Number.isNaN(value.getTime())) {
    return undefined;
  }
  const year = value.getFullYear().toString().padStart(4, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00+00:00`;
}

/** Build the POST /jobs payload for a review row under the given company. */
export function toJobPost(row: ImportJobReviewRow, companyId: string): JobPost {
  return {
    title: row.title.trim(),
    company_id: companyId,
    no_of_vacancies: Math.max(1, row.vacancies),
    salary_per_month: row.salary,
    location: row.location.trim() || null,
    minimum_education_attainment: row.minEducation,
    course_program: row.courseProgram.trim() || null,
    experience_required: row.experienceRequired.trim() || null,
    experience_preferred: row.experiencePreferred.trim() || null,
    skills_required: row.skills,
    preferred_skills: row.preferredSkills,
    description: row.description.trim() || null,
    age_range: row.ageRange.trim() || null,
    sex: (row.sex || null) as Sex | null,
    civil_status: row.civilStatus,
    eligibility: null,
    status: 'active',
    created_at: toDateTimeString(row.dateCreated),
  };
}
