import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { CompanyGet } from '../../core/models/company.model';

export const companyDetailsEvents = eventGroup({
  source: 'Company Details',
  events: {
    loadCompanyDetails: type<{ id: string }>(),
    loadCompanyDetailsSuccess: type<CompanyGet>(),
    loadCompanyDetailsFailed: type<string>(),
  },
});
