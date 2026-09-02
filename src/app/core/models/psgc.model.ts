/**
 * One PSGC (Philippine Standard Geographic Code) reference entry — a province,
 * city/municipality, or barangay. Loaded from the vendored JSON in
 * `assets/psgc/` (see that folder's README for shape and refresh steps).
 */
export interface PsgcItem {
  /** PSGC code for this entry (province / muncity / barangay code). */
  code: string;
  /** Canonical PSA name. This is what we store on the applicant address. */
  name: string;
  /** Code of the parent entry: region for a province, province for a city,
   *  city for a barangay. Used to filter children by their parent. */
  parentCode: string;
}
