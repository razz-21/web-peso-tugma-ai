import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PsgcItem } from '../models/psgc.model';
import { PsgcService } from './psgc.service';

const PROVINCES: PsgcItem[] = [
  { code: '001', name: 'Bataan', parentCode: '03' },
  { code: '002', name: 'Abra', parentCode: '14' },
];

// Two provinces both have a "San Isidro" city — barangay lookups must stay scoped.
const CITIES: PsgcItem[] = [
  { code: '00102', name: 'Balanga', parentCode: '001' },
  { code: '00101', name: 'San Isidro', parentCode: '001' },
  { code: '00201', name: 'San Isidro', parentCode: '002' },
];

const BARANGAYS: PsgcItem[] = [
  { code: '00101002', name: 'Poblacion', parentCode: '00101' },
  { code: '00101001', name: 'Aplaya', parentCode: '00101' },
  { code: '00201001', name: 'Wrong Province', parentCode: '00201' },
];

describe('PsgcService', () => {
  let service: PsgcService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PsgcService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PsgcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Lists are fetched sequentially (a child needs its parent's code first), so
   *  wait for pending microtasks to issue the request before flushing it. */
  async function flush(file: string, body: PsgcItem[]): Promise<void> {
    // Let any pending awaits resume and issue their request (harmless if already
    // pending — it just stays open until flushed below).
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    httpMock.expectOne(`assets/psgc/${file}`).flush(body);
  }

  it('returns provinces sorted alphabetically', async () => {
    const promise = service.provinces();
    await flush('provinces.json', PROVINCES);
    expect((await promise).map((p) => p.name)).toEqual(['Abra', 'Bataan']);
  });

  it('filters cities by province name and sorts them', async () => {
    const promise = service.citiesByProvince('Bataan');
    await flush('provinces.json', PROVINCES);
    await flush('cities.json', CITIES);
    expect((await promise).map((c) => c.name)).toEqual(['Balanga', 'San Isidro']);
  });

  it('returns [] for an unknown (legacy) province without fetching children', async () => {
    const promise = service.citiesByProvince('Nonexistent');
    await flush('provinces.json', PROVINCES);
    expect(await promise).toEqual([]);
  });

  it('scopes barangays to the city within the given province', async () => {
    const promise = service.barangaysByCity('Bataan', 'San Isidro');
    await flush('provinces.json', PROVINCES);
    await flush('cities.json', CITIES);
    await flush('barangays.json', BARANGAYS);
    // Only Bataan's San Isidro (00101) barangays, sorted; the identically-named
    // city in Abra (00201) must be excluded.
    expect((await promise).map((b) => b.name)).toEqual(['Aplaya', 'Poblacion']);
  });

  it('returns [] when the parent city or province is empty', async () => {
    // An empty province short-circuits before any request is made.
    expect(await service.citiesByProvince('')).toEqual([]);

    // An empty city still resolves the province (one fetch) but loads no barangays.
    const promise = service.barangaysByCity('Bataan', '');
    await flush('provinces.json', PROVINCES);
    expect(await promise).toEqual([]);
  });

  it('fetches each list only once and caches it', async () => {
    const first = service.provinces();
    await flush('provinces.json', PROVINCES);
    await first;
    await service.provinces();
    httpMock.verify(); // no second request expected
  });
});
