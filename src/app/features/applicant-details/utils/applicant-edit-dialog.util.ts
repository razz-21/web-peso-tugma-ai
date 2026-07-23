import { ApplicantPatch, ApplicantPost } from '../../../core/models/applicant.model';
import { EditSectionId } from '../types/applicant-edit-dialog.type';

/** Helper subtext shown under the dialog title for each section. */
export const SECTION_DESCRIPTIONS: Record<EditSectionId, string> = {
  personal: 'Update the applicant’s basic identity information.',
  contact: 'Update the applicant’s email and mobile numbers.',
  address: 'Update the present and permanent addresses.',
  education: 'Update schools attended and degrees earned.',
  skills: 'Update technical skills, trainings, and certifications.',
  work: 'Update previous roles and responsibilities.',
  preferences: 'Update desired roles, locations, and expected salary.',
  employment: 'Update the applicant’s employment status and expected salary.',
};

/** Which top-level payload keys are patched for each editable section. */
export const SECTION_KEYS: Record<EditSectionId, (keyof ApplicantPost)[]> = {
  personal: [
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
  ],
  contact: ['email_address', 'primary_mobile_number', 'secondary_mobile_number'],
  address: ['present_address', 'permanent_address'],
  education: ['educational_background'],
  skills: ['technical_skills', 'trainings'],
  work: ['work_experience'],
  preferences: [
    'employment_status',
    'preferred_occupation_industry',
    'preferred_work_location',
    'salary_expectation',
  ],
  employment: ['employment_status', 'salary_expectation'],
};

/** Extract only the edited section's keys, coercing `undefined` to `null` so
 *  cleared fields are explicitly reset on the backend. */
export const buildSectionPatch = (
  payload: ApplicantPost,
  section: EditSectionId,
): ApplicantPatch => {
  const patch: Record<string, unknown> = {};
  for (const key of SECTION_KEYS[section]) {
    const value = payload[key];
    patch[key] = value === undefined ? null : value;
  }
  return patch as ApplicantPatch;
};
