/**
 * Centralized application route paths.
 *
 * Use these constants instead of hardcoding URL strings in navigations, guards,
 * interceptors, and router links — a single source of truth keeps the app in
 * sync when a route changes (see the earlier `/auth/login` → `/login` drift).
 */
export const APP_ROUTES = {
  // Public (auth) area
  login: '/login',
  forgotPassword: '/forgot-password',
  register: '/register',

  // Authenticated (main) area
  main: '/main',
  dashboard: '/main/dashboard',
  companies: '/main/companies',
  applicants: '/main/applicants',
  jobListings: '/main/job-listings',
  userManagement: '/main/user-management',
  workspaces: '/main/workspaces',
  profile: '/main/profile',
} as const;

/** Route to a single user's detail page. */
export const userDetailsRoute = (id: string): string => `${APP_ROUTES.userManagement}/${id}`;

/** Route to a single company's detail page. */
export const companyDetailsRoute = (id: string): string => `${APP_ROUTES.companies}/${id}`;

/** Route to a single applicant's detail page. */
export const applicantDetailsRoute = (id: string): string => `${APP_ROUTES.applicants}/${id}`;

/** Route to a single job's detail page. */
export const jobDetailsRoute = (id: string): string => `${APP_ROUTES.jobListings}/${id}`;

/** Route to a single workspace's detail page. */
export const workspaceDetailsRoute = (id: string): string => `${APP_ROUTES.workspaces}/${id}`;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
