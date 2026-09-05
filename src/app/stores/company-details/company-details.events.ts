import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { CompanyGet } from '../../core/models/company.model';
import { CompanyApplicant } from '../../core/models/company-applicant.model';
import { JobGet } from '../../core/models/job.model';

export const companyDetailsEvents = eventGroup({
  source: 'Company Details',
  events: {
    loadCompanyDetails: type<{ id: string }>(),
    loadCompanyDetailsSuccess: type<CompanyGet>(),
    loadCompanyDetailsFailed: type<string>(),

    loadCompanyJobs: type<{ companyId: string }>(),
    loadCompanyJobsSuccess: type<JobGet[]>(),
    loadCompanyJobsFailed: type<string>(),

    deleteCompanyJob: type<{ id: string }>(),
    deleteCompanyJobSuccess: type<{ id: string }>(),
    deleteCompanyJobFailed: type<string>(),

    loadCompanyApplicants: type<{ companyId: string }>(),
    loadCompanyApplicantsSuccess: type<CompanyApplicant[]>(),
    loadCompanyApplicantsFailed: type<string>(),
  },
});
