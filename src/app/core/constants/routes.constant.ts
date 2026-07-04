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

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
