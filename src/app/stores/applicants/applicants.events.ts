import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { ApplicantGet, ApplicantList, ApplicantPost } from '../../core/models/applicant.model';
import { ApplicantsFilter } from './applicants.store';

export const applicantsEvents = eventGroup({
  source: 'Applicants',
  events: {
    loadApplicant: type<ApplicantsFilter>(),
    loadApplicantSuccess: type<ApplicantList>(),
    loadApplicantFailed: type<string>(),

    searchApplicant: type<string>(),
    searchApplicantSuccess: type<ApplicantList>(),
    searchApplicantFailed: type<string>(),

    createApplicant: type<ApplicantPost>(),
    createApplicantSuccess: type<ApplicantGet>(),
    createApplicantFailed: type<string>(),

    deleteApplicant: type<string>(),
    deleteApplicantSuccess: type<string>(),
    deleteApplicantFailed: type<string>(),
  },
});
