import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { JobGet, JobStatus } from '../../core/models/job.model';

export const jobDetailsEvents = eventGroup({
  source: 'Job Details',
  events: {
    loadJobDetails: type<{ id: string }>(),
    loadJobDetailsSuccess: type<JobGet>(),
    loadJobDetailsFailed: type<string>(),

    updateStatus: type<{ id: string; status: JobStatus }>(),
    updateStatusSuccess: type<JobGet>(),
    updateStatusFailed: type<string>(),
  },
});
