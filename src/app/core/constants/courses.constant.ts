/**
 * Course / program options for the applicant educational-background dropdown.
 *
 * Feeds the `course_program` field (see `EducationalBackground` in
 * `core/models/applicant.model.ts`). Grouped by discipline so the select can
 * render `<optgroup>`s. Values are stored verbatim as the `course_program`
 * string, so keep labels stable to avoid drifting historical records.
 */
export interface CourseProgramGroup {
  /** Discipline heading, e.g. shown as an optgroup label. */
  category: string;
  /** Course/program names under this discipline. */
  courses: readonly string[];
}

export const COURSE_PROGRAM_GROUPS: readonly CourseProgramGroup[] = [
  {
    category: 'Information Technology & Computing',
    courses: [
      'Bachelor of Science in Information Technology',
      'Bachelor of Science in Computer Science',
      'Bachelor of Science in Information Systems',
      'Bachelor of Science in Computer Engineering',
      'Bachelor of Science in Entertainment and Multimedia Computing',
      'Associate in Computer Technology',
    ],
  },
  {
    category: 'Engineering',
    courses: [
      'Bachelor of Science in Civil Engineering',
      'Bachelor of Science in Mechanical Engineering',
      'Bachelor of Science in Electrical Engineering',
      'Bachelor of Science in Electronics Engineering',
      'Bachelor of Science in Industrial Engineering',
      'Bachelor of Science in Chemical Engineering',
      'Bachelor of Science in Geodetic Engineering',
    ],
  },
  {
    category: 'Business & Accountancy',
    courses: [
      'Bachelor of Science in Accountancy',
      'Bachelor of Science in Management Accounting',
      'Bachelor of Science in Business Administration',
      'Bachelor of Science in Office Administration',
      'Bachelor of Science in Entrepreneurship',
      'Bachelor of Science in Real Estate Management',
      'Bachelor of Science in Customs Administration',
    ],
  },
  {
    category: 'Health Sciences',
    courses: [
      'Bachelor of Science in Nursing',
      'Bachelor of Science in Pharmacy',
      'Bachelor of Science in Medical Technology',
      'Bachelor of Science in Physical Therapy',
      'Bachelor of Science in Midwifery',
      'Bachelor of Science in Radiologic Technology',
      'Bachelor of Science in Nutrition and Dietetics',
    ],
  },
  {
    category: 'Education',
    courses: [
      'Bachelor of Elementary Education',
      'Bachelor of Secondary Education',
      'Bachelor of Early Childhood Education',
      'Bachelor of Physical Education',
      'Bachelor of Technical-Vocational Teacher Education',
    ],
  },
  {
    category: 'Arts, Sciences & Communication',
    courses: [
      'Bachelor of Arts in Communication',
      'Bachelor of Arts in Political Science',
      'Bachelor of Arts in Psychology',
      'Bachelor of Science in Psychology',
      'Bachelor of Arts in English Language',
      'Bachelor of Science in Biology',
      'Bachelor of Science in Mathematics',
    ],
  },
  {
    category: 'Hospitality & Tourism',
    courses: [
      'Bachelor of Science in Hospitality Management',
      'Bachelor of Science in Tourism Management',
      'Bachelor of Science in Hotel and Restaurant Management',
    ],
  },
  {
    category: 'Criminal Justice & Public Safety',
    courses: [
      'Bachelor of Science in Criminology',
      'Bachelor of Science in Public Administration',
    ],
  },
  {
    category: 'Agriculture & Fisheries',
    courses: [
      'Bachelor of Science in Agriculture',
      'Bachelor of Science in Fisheries',
      'Bachelor of Science in Forestry',
      'Bachelor of Science in Agribusiness',
    ],
  },
  {
    category: 'Maritime',
    courses: [
      'Bachelor of Science in Marine Transportation',
      'Bachelor of Science in Marine Engineering',
    ],
  },
  {
    category: "Master's Degree",
    courses: [
      'Master of Business Administration',
      'Master of Public Administration',
      'Master of Arts in Education',
      'Master of Science in Information Technology',
      'Master of Science in Computer Science',
      'Master of Science in Civil Engineering',
      'Master of Science in Nursing',
      'Master of Arts in Psychology',
      'Master of Science in Environmental Science',
      'Master of Laws',
    ],
  },
  {
    category: 'Doctorate Degree',
    courses: [
      'Doctor of Philosophy in Education',
      'Doctor of Philosophy in Management',
      'Doctor of Philosophy in Information Technology',
      'Doctor of Philosophy in Psychology',
      'Doctor of Education',
      'Doctor of Public Administration',
      'Doctor of Medicine',
      'Doctor of Dental Medicine',
      'Doctor of Veterinary Medicine',
      'Juris Doctor',
    ],
  },
  {
    category: 'Technical-Vocational (TESDA)',
    courses: [
      'Shielded Metal Arc Welding (SMAW) NC II',
      'Automotive Servicing NC II',
      'Electrical Installation and Maintenance NC II',
      'Computer Systems Servicing NC II',
      'Bread and Pastry Production NC II',
      'Cookery NC II',
      'Housekeeping NC II',
      'Dressmaking / Tailoring NC II',
      'Driving NC II',
      'Caregiving NC II',
    ],
  },
] as const;

/** Flat list of every course/program label (ungrouped dropdown or filtering). */
export const COURSE_PROGRAMS: readonly string[] = COURSE_PROGRAM_GROUPS.flatMap(
  (group) => group.courses,
);
