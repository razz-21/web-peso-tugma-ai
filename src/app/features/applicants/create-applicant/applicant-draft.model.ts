import { ApplicantPost, Sex } from '../../../core/models/applicant.model';

export type DraftAddress = {
  province: string;
  municipality_city: string;
  baranggay: string;
  house_no_street: string;
};

export type DraftOccupationIndustry = { occupation: string; industry: string };

export type DraftEligibility = { title: string; license_number: string; expiry_date: Date | null };

export type DraftWorkExperience = {
  company: string;
  address: string;
  position: string;
  start_date: Date | null;
  end_date: Date | null;
  status_of_appointment: string;
};

export type DraftTraining = {
  training_title: string;
  duration_start: Date | null;
  duration_end: Date | null;
  institution: string;
  certificate_received: string;
  completed: boolean;
};

export type DraftEducation = {
  current_in_school: boolean;
  highest_education_level: string;
  year_graduated: string;
  last_attended: string;
  school_university: string;
  course_program: string;
};

/** The full applicant wizard draft — one flat shape backing the signal form. */
export type ApplicantDraft = {
  firstname: string;
  lastname: string;
  middlename: string;
  suffix: string;
  date_of_birth: Date | null;
  sex: Sex | '';
  citizenship: string;
  height_in_cm: number | null;
  weight_in_kg: number | null;
  present_address: DraftAddress;
  permanent_address: DraftAddress;
  primary_mobile_number: string;
  secondary_mobile_number: string;
  email_address: string;
  employment_status: string;
  preferred_occupation_industry: DraftOccupationIndustry[];
  preferred_work_location: string[];
  salary_expectation: string;
  educational_background: DraftEducation;
  eligibility: DraftEligibility[];
  work_experience: DraftWorkExperience[];
  technical_skills: string[];
  trainings: DraftTraining[];
};

export const EMPTY_ADDRESS: DraftAddress = {
  province: '',
  municipality_city: '',
  baranggay: '',
  house_no_street: '',
};

export const EMPTY_OCCUPATION_INDUSTRY: DraftOccupationIndustry = { occupation: '', industry: '' };

export const EMPTY_ELIGIBILITY: DraftEligibility = {
  title: '',
  license_number: '',
  expiry_date: null,
};

export const EMPTY_WORK_EXPERIENCE: DraftWorkExperience = {
  company: '',
  address: '',
  position: '',
  start_date: null,
  end_date: null,
  status_of_appointment: '',
};

export const EMPTY_TRAINING: DraftTraining = {
  training_title: '',
  duration_start: null,
  duration_end: null,
  institution: '',
  certificate_received: '',
  completed: false,
};

export const INITIAL_DRAFT: ApplicantDraft = {
  firstname: '',
  lastname: '',
  middlename: '',
  suffix: '',
  date_of_birth: null,
  sex: '',
  citizenship: '',
  height_in_cm: null,
  weight_in_kg: null,
  present_address: { ...EMPTY_ADDRESS },
  permanent_address: { ...EMPTY_ADDRESS },
  primary_mobile_number: '',
  secondary_mobile_number: '',
  email_address: '',
  employment_status: '',
  preferred_occupation_industry: [],
  preferred_work_location: [],
  salary_expectation: '',
  educational_background: {
    current_in_school: false,
    highest_education_level: '',
    year_graduated: '',
    last_attended: '',
    school_university: '',
    course_program: '',
  },
  eligibility: [],
  work_experience: [],
  technical_skills: [],
  trainings: [],
};

/** Trim a string, returning undefined when empty so optional fields are omitted. */
const clean = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/** Format a datepicker value as a local `yyyy-MM-dd` string, or undefined when unset. */
export const toDateString = (value: Date | null): string | undefined => {
  if (!value || Number.isNaN(value.getTime())) {
    return undefined;
  }
  const year = value.getFullYear().toString().padStart(4, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const day = value.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const hasAddress = (address: DraftAddress): boolean =>
  Boolean(
    clean(address.province) ||
    clean(address.municipality_city) ||
    clean(address.baranggay) ||
    clean(address.house_no_street),
  );

const toAddress = (address: DraftAddress) => ({
  id: crypto.randomUUID(),
  province: clean(address.province),
  municipality_city: clean(address.municipality_city),
  baranggay: clean(address.baranggay),
  house_no_street: clean(address.house_no_street),
});

/** Maps the wizard draft into the POST /applicants payload, dropping empties. */
export const draftToPayload = (draft: ApplicantDraft, sameAsPresent: boolean): ApplicantPost => {
  const permanent = sameAsPresent ? draft.present_address : draft.permanent_address;

  return {
    firstname: draft.firstname.trim(),
    lastname: draft.lastname.trim(),
    middlename: clean(draft.middlename),
    suffix: clean(draft.suffix),
    date_of_birth: toDateString(draft.date_of_birth),
    sex: draft.sex === '' ? undefined : draft.sex,
    citizenship: clean(draft.citizenship),
    height_in_cm: draft.height_in_cm ?? undefined,
    weight_in_kg: draft.weight_in_kg ?? undefined,
    present_address: toAddress(draft.present_address),
    permanent_address: sameAsPresent || hasAddress(permanent) ? toAddress(permanent) : undefined,
    primary_mobile_number: clean(draft.primary_mobile_number),
    secondary_mobile_number: clean(draft.secondary_mobile_number),
    email_address: clean(draft.email_address),
    employment_status: clean(draft.employment_status),
    preferred_occupation_industry: draft.preferred_occupation_industry
      .filter((item) => clean(item.occupation) || clean(item.industry))
      .map((item) => ({
        id: crypto.randomUUID(),
        occupation: clean(item.occupation),
        industry: clean(item.industry),
      })),
    preferred_work_location: draft.preferred_work_location
      .map((location) => location.trim())
      .filter((location) => location.length > 0),
    salary_expectation: clean(draft.salary_expectation),
    educational_background: {
      current_in_school: draft.educational_background.current_in_school,
      highest_education_level: clean(draft.educational_background.highest_education_level),
      year_graduated: clean(draft.educational_background.year_graduated),
      last_attended: clean(draft.educational_background.last_attended),
      school_university: clean(draft.educational_background.school_university),
      course_program: clean(draft.educational_background.course_program),
    },
    eligibility: draft.eligibility
      .filter((item) => clean(item.title) || clean(item.license_number) || item.expiry_date)
      .map((item) => ({
        id: crypto.randomUUID(),
        title: clean(item.title),
        license_number: clean(item.license_number),
        expiry_date: toDateString(item.expiry_date),
      })),
    work_experience: draft.work_experience
      .filter((item) => clean(item.company) || clean(item.position))
      .map((item) => ({
        id: crypto.randomUUID(),
        company: clean(item.company),
        address: clean(item.address),
        position: clean(item.position),
        start_date: toDateString(item.start_date),
        end_date: toDateString(item.end_date),
        status_of_appointment: clean(item.status_of_appointment),
      })),
    technical_skills: draft.technical_skills
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0),
    trainings: draft.trainings
      .filter((item) => clean(item.training_title) || clean(item.institution))
      .map((item) => ({
        id: crypto.randomUUID(),
        training_title: clean(item.training_title),
        duration_start: toDateString(item.duration_start),
        duration_end: toDateString(item.duration_end),
        institution: clean(item.institution),
        certificate_received: clean(item.certificate_received),
        completed: item.completed,
      })),
  };
};
