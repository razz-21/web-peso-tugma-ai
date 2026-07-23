import { ApplicantGet } from '../../../core/models/applicant.model';

export type EditSectionId =
  | 'personal'
  | 'contact'
  | 'address'
  | 'education'
  | 'skills'
  | 'work'
  | 'preferences'
  | 'employment';

export interface ApplicantEditDialogData {
  readonly section: EditSectionId;
  readonly sectionLabel: string;
  readonly applicant: ApplicantGet;
}

export type FieldState = {
  touched: () => boolean;
  valid: () => boolean;
  errors: () => ReadonlyArray<{ message?: string }>;
};
