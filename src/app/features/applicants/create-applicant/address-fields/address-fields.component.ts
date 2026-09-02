import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { PsgcItem } from '../../../../core/models/psgc.model';
import { PsgcService } from '../../../../core/services/psgc.service';
import { CreateApplicantDraftStore } from '../create-applicant-draft.store';

/** The Signal Forms subtree for one address group (present or permanent). Derived
 *  from the store so it stays in sync without depending on non-exported types. */
type AddressGroup = CreateApplicantDraftStore['form']['present_address'];

type FieldState = {
  touched: () => boolean;
  valid: () => boolean;
  errors: () => ReadonlyArray<{ message?: string }>;
};

/**
 * Renders the four address fields (Province / City / Barangay dropdowns + free-text
 * House no. / Street) for a single address group and owns the cascade: choosing a
 * parent filters and clears its children. Stored values that aren't in the PSGC
 * lists (legacy hand-typed data) are kept selectable so editing never drops them.
 */
@Component({
  selector: 'app-address-fields',
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, FormField],
  templateUrl: './address-fields.component.html',
  styleUrl: './address-fields.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFieldsComponent {
  private readonly psgc = inject(PsgcService);

  /** The address subtree to bind, e.g. `store.form.present_address`. */
  readonly group = input.required<AddressGroup>();

  protected readonly provinceOptions = signal<PsgcItem[]>([]);
  protected readonly cityOptions = signal<PsgcItem[]>([]);
  protected readonly barangayOptions = signal<PsgcItem[]>([]);

  private readonly provinceValue = computed(() => this.group().province().value());
  private readonly cityValue = computed(() => this.group().municipality_city().value());
  private readonly barangayValue = computed(() => this.group().baranggay().value());

  /** A stored value that isn't in the loaded options — surfaced as an extra
   *  "(existing)" option so legacy / non-canonical data stays selected. */
  protected readonly legacyProvince = computed(() =>
    this.legacyValue(this.provinceValue(), this.provinceOptions()),
  );
  protected readonly legacyCity = computed(() =>
    this.legacyValue(this.cityValue(), this.cityOptions()),
  );
  protected readonly legacyBarangay = computed(() =>
    this.legacyValue(this.barangayValue(), this.barangayOptions()),
  );

  constructor() {
    this.psgc.provinces().then((list) => this.provinceOptions.set(list));

    // Reload city options whenever the province changes (including on hydration).
    effect(() => {
      const province = this.provinceValue();
      this.psgc.citiesByProvince(province).then((list) => this.cityOptions.set(list));
    });

    // Reload barangay options whenever the province or city changes.
    effect(() => {
      const province = this.provinceValue();
      const city = this.cityValue();
      this.psgc.barangaysByCity(province, city).then((list) => this.barangayOptions.set(list));
    });
  }

  /** User picked a province → clear the now-stale city and barangay selections. */
  protected onProvinceChange(): void {
    this.group().municipality_city().value.set('');
    this.group().baranggay().value.set('');
  }

  /** User picked a city → clear the now-stale barangay selection. */
  protected onCityChange(): void {
    this.group().baranggay().value.set('');
  }

  protected error(field: FieldState): string | null {
    if (!field.touched() || field.valid()) {
      return null;
    }
    return field.errors()[0]?.message ?? 'Invalid value';
  }

  private legacyValue(value: string, options: PsgcItem[]): string | null {
    if (!value) {
      return null;
    }
    return options.some((option) => option.name === value) ? null : value;
  }
}
