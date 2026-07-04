import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import {
  CompanyGet,
  CompanyList,
  CompanyPatch,
  CompanyPost,
} from '../../core/models/company.model';
import { CompaniesFilter } from './companies.store';

export const companiesEvents = eventGroup({
  source: 'Companies',
  events: {
    loadCompany: type<CompaniesFilter>(),
    loadCompanySuccess: type<CompanyList>(),
    loadCompanyFailed: type<string>(),

    searchCompany: type<string>(),
    searchCompanySuccess: type<CompanyList>(),
    searchCompanyFailed: type<string>(),

    createCompany: type<CompanyPost>(),
    createCompanySuccess: type<CompanyGet>(),
    createCompanyFailed: type<string>(),

    updateCompany: type<{ id: string; company: CompanyPatch }>(),
    updateCompanySuccess: type<CompanyGet>(),
    updateCompanyFailed: type<string>(),

    deleteCompany: type<string>(),
    deleteCompanySuccess: type<string>(),
    deleteCompanyFailed: type<string>(),
  },
});
