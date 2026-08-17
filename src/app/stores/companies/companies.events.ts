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

    // Avatar upload reuses updateCompanySuccess to apply the returned company,
    // so every view bound to it (list + details) refreshes with the new image.
    uploadCompanyAvatar: type<{ id: string; file: File }>(),
    uploadCompanyAvatarFailed: type<string>(),

    // Avatar removal likewise reuses updateCompanySuccess to apply the returned
    // company (now without an avatar) across every view bound to it.
    removeCompanyAvatar: type<{ id: string }>(),
    removeCompanyAvatarFailed: type<string>(),

    deleteCompany: type<string>(),
    deleteCompanySuccess: type<string>(),
    deleteCompanyFailed: type<string>(),
  },
});
