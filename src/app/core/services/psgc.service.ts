import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PsgcItem } from '../models/psgc.model';

/**
 * Serves the vendored PSGC reference lists (see `assets/psgc/README.md`) as
 * cascading, alphabetically-sorted options for the address dropdowns.
 *
 * Each JSON file is fetched at most once and cached; `barangays.json` (~2.4 MB)
 * is only fetched the first time a barangay list is requested. Because the
 * applicant address stores canonical **names** (not codes), children are looked
 * up by resolving the parent name to its code first.
 */
@Injectable({ providedIn: 'root' })
export class PsgcService {
  private readonly http = inject(HttpClient);

  private provincesCache?: Promise<PsgcItem[]>;
  private citiesCache?: Promise<PsgcItem[]>;
  private barangaysCache?: Promise<PsgcItem[]>;

  /** All provinces (plus NCR cities / synthesized entries), sorted A→Z. */
  async provinces(): Promise<PsgcItem[]> {
    return this.sortByName(await this.loadProvinces());
  }

  /** Cities/municipalities under the named province, sorted A→Z. `[]` when the
   *  province is empty or not found (e.g. a legacy, non-canonical value). */
  async citiesByProvince(provinceName: string): Promise<PsgcItem[]> {
    const provinceCode = await this.resolveProvinceCode(provinceName);
    if (!provinceCode) {
      return [];
    }
    const cities = await this.loadCities();
    return this.sortByName(cities.filter((city) => city.parentCode === provinceCode));
  }

  /** Barangays under the named city within the named province, sorted A→Z.
   *  The province scopes the lookup because city names are not unique
   *  nationwide. `[]` when either parent is empty or not found. */
  async barangaysByCity(provinceName: string, cityName: string): Promise<PsgcItem[]> {
    const cityCodes = await this.resolveCityCodes(provinceName, cityName);
    if (cityCodes.size === 0) {
      return [];
    }
    const barangays = await this.loadBarangays();
    return this.sortByName(barangays.filter((brgy) => cityCodes.has(brgy.parentCode)));
  }

  private async resolveProvinceCode(provinceName: string): Promise<string | null> {
    const name = provinceName.trim();
    if (!name) {
      return null;
    }
    const provinces = await this.loadProvinces();
    return provinces.find((province) => province.name === name)?.code ?? null;
  }

  private async resolveCityCodes(provinceName: string, cityName: string): Promise<Set<string>> {
    const name = cityName.trim();
    const provinceCode = await this.resolveProvinceCode(provinceName);
    if (!name || !provinceCode) {
      return new Set();
    }
    const cities = await this.loadCities();
    return new Set(
      cities
        .filter((city) => city.parentCode === provinceCode && city.name === name)
        .map((city) => city.code),
    );
  }

  private loadProvinces(): Promise<PsgcItem[]> {
    return (this.provincesCache ??= this.fetch('provinces.json'));
  }

  private loadCities(): Promise<PsgcItem[]> {
    return (this.citiesCache ??= this.fetch('cities.json'));
  }

  private loadBarangays(): Promise<PsgcItem[]> {
    return (this.barangaysCache ??= this.fetch('barangays.json'));
  }

  private fetch(file: string): Promise<PsgcItem[]> {
    return firstValueFrom(this.http.get<PsgcItem[]>(`assets/psgc/${file}`));
  }

  private sortByName(items: PsgcItem[]): PsgcItem[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }
}
