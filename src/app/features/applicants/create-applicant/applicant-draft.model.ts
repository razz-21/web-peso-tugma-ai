import { Address, ApplicantGet, ApplicantPost, Sex } from '../../../core/models/applicant.model';

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
  civil_status: string;
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
  civil_status: '',
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
    civil_status: clean(draft.civil_status),
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

/** Parse a `yyyy-MM-dd` (or ISO) string into a local Date, or null when unset. */
const parseDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day);
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const toDraftAddress = (address: Address | null | undefined): DraftAddress => ({
  province: address?.province ?? '',
  municipality_city: address?.municipality_city ?? '',
  baranggay: address?.baranggay ?? '',
  house_no_street: address?.house_no_street ?? '',
});

/** Whether the permanent address matches the present address (or is absent). */
export const isPermanentSameAsPresent = (applicant: ApplicantGet): boolean => {
  if (applicant.permanent_address === null) {
    return true;
  }
  const present = toDraftAddress(applicant.present_address);
  const permanent = toDraftAddress(applicant.permanent_address);
  return (
    present.province === permanent.province &&
    present.municipality_city === permanent.municipality_city &&
    present.baranggay === permanent.baranggay &&
    present.house_no_street === permanent.house_no_street
  );
};

/** Seed an editable draft from an existing applicant (inverse of draftToPayload). */
export const applicantToDraft = (applicant: ApplicantGet): ApplicantDraft => ({
  firstname: applicant.firstname,
  lastname: applicant.lastname,
  middlename: applicant.middlename ?? '',
  suffix: applicant.suffix ?? '',
  date_of_birth: parseDate(applicant.date_of_birth),
  sex: applicant.sex ?? '',
  civil_status: applicant.civil_status ?? '',
  citizenship: applicant.citizenship ?? '',
  height_in_cm: applicant.height_in_cm,
  weight_in_kg: applicant.weight_in_kg,
  present_address: toDraftAddress(applicant.present_address),
  permanent_address: toDraftAddress(applicant.permanent_address),
  primary_mobile_number: applicant.primary_mobile_number ?? '',
  secondary_mobile_number: applicant.secondary_mobile_number ?? '',
  email_address: applicant.email_address ?? '',
  employment_status: applicant.employment_status ?? '',
  preferred_occupation_industry: applicant.preferred_occupation_industry.map((item) => ({
    occupation: item.occupation ?? '',
    industry: item.industry ?? '',
  })),
  preferred_work_location: [...applicant.preferred_work_location],
  salary_expectation: applicant.salary_expectation ?? '',
  educational_background: {
    current_in_school: applicant.educational_background?.current_in_school ?? false,
    highest_education_level: applicant.educational_background?.highest_education_level ?? '',
    year_graduated: applicant.educational_background?.year_graduated ?? '',
    last_attended: applicant.educational_background?.last_attended ?? '',
    school_university: applicant.educational_background?.school_university ?? '',
    course_program: applicant.educational_background?.course_program ?? '',
  },
  eligibility: applicant.eligibility.map((item) => ({
    title: item.title ?? '',
    license_number: item.license_number ?? '',
    expiry_date: parseDate(item.expiry_date),
  })),
  work_experience: applicant.work_experience.map((item) => ({
    company: item.company ?? '',
    address: item.address ?? '',
    position: item.position ?? '',
    start_date: parseDate(item.start_date),
    end_date: parseDate(item.end_date),
    status_of_appointment: item.status_of_appointment ?? '',
  })),
  technical_skills: [...applicant.technical_skills],
  trainings: applicant.trainings.map((item) => ({
    training_title: item.training_title ?? '',
    duration_start: parseDate(item.duration_start),
    duration_end: parseDate(item.duration_end),
    institution: item.institution ?? '',
    certificate_received: item.certificate_received ?? '',
    completed: item.completed,
  })),
});
