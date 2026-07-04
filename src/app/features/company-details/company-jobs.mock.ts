/**
 * Mock job-listing data for the company-details page.
 *
 * The jobs feature has no backend yet, so the right-hand "Job list" table is
 * populated from this static list. Swap this out for a real jobs service/store
 * once the endpoint exists.
 */

export type JobStatus = 'open' | 'screening' | 'closed';

export interface CompanyJob {
  id: string;
  title: string;
  description: string;
  location: string;
  vacancies: number;
  /** Total applicants — feeds the "Applied" stat, not shown as a column. */
  applicants: number;
  status: JobStatus;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open',
  screening: 'Screening',
  closed: 'Closed',
};

export const MOCK_COMPANY_JOBS: readonly CompanyJob[] = [
  {
    id: 'job-1',
    title: 'Robotics Engineer',
    description: 'Design and build robotic hardware systems.',
    location: 'SF / Hybrid',
    vacancies: 2,
    applicants: 24,
    status: 'open',
  },
  {
    id: 'job-2',
    title: 'Firmware Developer',
    description: 'Develop embedded firmware for motion controllers.',
    location: 'Remote',
    vacancies: 1,
    applicants: 18,
    status: 'open',
  },
  {
    id: 'job-3',
    title: 'QA Technician',
    description: 'Run quality assurance on production units.',
    location: 'Austin, TX',
    vacancies: 3,
    applicants: 9,
    status: 'screening',
  },
  {
    id: 'job-4',
    title: 'Supply Chain Analyst',
    description: 'Optimize sourcing and inventory operations.',
    location: 'SF',
    vacancies: 1,
    applicants: 31,
    status: 'open',
  },
  {
    id: 'job-5',
    title: 'Controls Software Engineer',
    description: 'Build control software for automation lines.',
    location: 'Remote',
    vacancies: 2,
    applicants: 27,
    status: 'open',
  },
  {
    id: 'job-6',
    title: 'Field Service Technician',
    description: 'Install and service equipment on customer sites.',
    location: 'Chicago, IL',
    vacancies: 1,
    applicants: 12,
    status: 'screening',
  },
];
