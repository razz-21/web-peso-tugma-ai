/**
 * Development environment.
 *
 * Used for `ng serve` and development builds. Point `apiBaseUrl` at your local
 * backend (or a remote dev API) here.
 */
export const environment = {
  production: false,
  /** Base URL of the backend API for local development. */
  apiBaseUrl: 'http://localhost:8000/api',
  /** Default request timeout in milliseconds. */
  apiTimeoutMs: 30000,
} as const;
