/**
 * Production environment.
 *
 * Angular swaps this file for `environment.development.ts` during development
 * builds via the `fileReplacements` entry in `angular.json`. Import the API
 * configuration from here only — never reference the per-target files directly.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://service-peso-tugmai.razz-dev.com/api',
  apiTimeoutMs: 30000,
} as const;
