# Vendored PSGC data

Philippine Standard Geographic Code reference lists backing the cascading
address dropdowns (Province → City / Municipality → Barangay).

- **Source:** [`@jobuntux/psgc`](https://www.npmjs.com/package/@jobuntux/psgc)
- **PSA release:** `2025-2Q` (package v0.2.1, published Aug 2025)

Each file is a flat `PsgcItem[]` (`{ code, name, parentCode }`, see
`core/models/psgc.model.ts`), sorted A→Z by name:

| File             | `code`        | `parentCode`  |
| ---------------- | ------------- | ------------- |
| `provinces.json` | province code | region code   |
| `cities.json`    | muncity code  | province code |
| `barangays.json` | barangay code | muncity code  |

`barangays.json` is ~2.4 MB (~42k rows). It lives in `assets/` and is fetched
lazily at runtime — it is **not** part of the JS bundle.

### NCR & special areas

NCR has no provinces; its cities (e.g. "City of Manila") sit in the province
slot and their districts (e.g. "Binondo") in the city slot. A few province-less
cities in the raw dataset (Pateros, City of Isabela, and the BARMM Special
Geographic Area municipalities) get a **synthesized** province entry during
generation so every city stays reachable from the Province dropdown.

## Refreshing

PSA updates the PSGC periodically. To refresh:

```bash
npm pack @jobuntux/psgc@latest          # download the newest release
tar -xzf jobuntux-psgc-*.tgz            # extract package/data/<release>/
```

Then re-run the generator (see `ADDRESS_DROPDOWN_IMPLEMENTATION.md`, §10): map
`provinces/muncities/barangays.json` into the `{ code, name, parentCode }`
shape, synthesize provinces for any province-less city, sort by name, and write
the three files here. Spot-check a few provinces, then note the new PSA release
date above. No code change is needed as long as the JSON shape is stable.
