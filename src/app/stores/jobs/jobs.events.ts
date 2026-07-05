import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { JobGet, JobList, JobPatch, JobPost } from '../../core/models/job.model';
import { JobsFilter } from './jobs.store';

export const jobsEvents = eventGroup({
  source: 'Jobs',
  events: {
    loadJob: type<JobsFilter>(),
    loadJobSuccess: type<JobList>(),
    loadJobFailed: type<string>(),

    searchJob: type<string>(),
    searchJobSuccess: type<JobList>(),
    searchJobFailed: type<string>(),

    createJob: type<JobPost>(),
    createJobSuccess: type<JobGet>(),
    createJobFailed: type<string>(),

    updateJob: type<{ id: string; job: JobPatch }>(),
    updateJobSuccess: type<JobGet>(),
    updateJobFailed: type<string>(),

    deleteJob: type<string>(),
    deleteJobSuccess: type<string>(),
    deleteJobFailed: type<string>(),
  },
});
