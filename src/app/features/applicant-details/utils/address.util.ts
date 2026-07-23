import { Address } from '../../../core/models/applicant.model';

/** Non-empty address parts, top to bottom, for stacked display. */
export const addressLines = (address: Address | null): string[] => {
  if (!address) {
    return [];
  }
  return [address.house_no_street, address.baranggay, address.municipality_city, address.province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
};

/** Whether two addresses have identical street/barangay/city/province. */
export const sameAddress = (a: Address, b: Address): boolean =>
  (a.house_no_street ?? '') === (b.house_no_street ?? '') &&
  (a.baranggay ?? '') === (b.baranggay ?? '') &&
  (a.municipality_city ?? '') === (b.municipality_city ?? '') &&
  (a.province ?? '') === (b.province ?? '');
