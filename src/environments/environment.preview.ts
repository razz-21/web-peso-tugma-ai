/**
 * Preview / staging environment.
 *
 * Used for Vercel Preview deployments (and any non-production Vercel build).
 * Angular swaps `environment.ts` for this file via the `fileReplacements`
 * entry of the `preview` configuration in `angular.json`, which is selected by
 * the `vercel-build` script when `VERCEL_ENV` is not `production`.
 */
export const environment = {
  production: false,
  /** Base URL of the separate API used for preview/staging deployments. */
  apiBaseUrl: 'https://dev.service-peso-tugma-ai.com/api',
  apiTimeoutMs: 30000,
} as const;
