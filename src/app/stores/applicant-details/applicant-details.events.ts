import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { ApplicantGet } from '../../core/models/applicant.model';

export const applicantDetailsEvents = eventGroup({
  source: 'Applicant Details',
  events: {
    loadApplicantDetails: type<{ id: string }>(),
    loadApplicantDetailsSuccess: type<ApplicantGet>(),
    loadApplicantDetailsFailed: type<string>(),
  },
});
