import { Routes } from '@angular/router';
import { MainComponent } from './main.component';
import {
  workspaceDetailsGuard,
  workspaceListGuard,
} from '../../core/guards/workspace-access.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const mainRoutes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('../companies/companies.component').then((m) => m.CompaniesComponent),
      },
      {
        path: 'companies/:id',
        loadComponent: () =>
          import('../company-details/company-details.component').then(
            (m) => m.CompanyDetailsComponent,
          ),
      },
      {
        path: 'applicants',
        loadComponent: () =>
          import('../applicants/applicants.component').then((m) => m.ApplicantsComponent),
      },
      {
        path: 'applicants/:id',
        loadComponent: () =>
          import('../applicant-details/applicant-details.component').then(
            (m) => m.ApplicantDetailsComponent,
          ),
      },
      {
        path: 'job-listings',
        loadComponent: () =>
          import('../job-listings/job-listings.component').then((m) => m.JobListingsComponent),
      },
      {
        path: 'job-listings/:id',
        loadComponent: () =>
          import('../job-details/job-details.component').then((m) => m.JobDetailsComponent),
      },
      {
        path: 'user-management',
        canActivate: [roleGuard('super_admin', 'admin')],
        loadComponent: () => import('../users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'user-management/:id',
        canActivate: [roleGuard('super_admin', 'admin')],
        loadComponent: () =>
          import('../user-details/user-details.component').then((m) => m.UserDetailsComponent),
      },
      {
        path: 'workspaces',
        canActivate: [workspaceListGuard],
        loadComponent: () =>
          import('../workspaces/workspaces.component').then((m) => m.WorkspacesComponent),
      },
      {
        path: 'workspaces/:id',
        canActivate: [workspaceDetailsGuard],
        loadComponent: () =>
          import('../workspace-details/workspace-details.component').then(
            (m) => m.WorkspaceDetailsComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () => import('../reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'reports/job-solicited',
        loadComponent: () =>
          import('../reports/job-solicited/job-solicited.component').then(
            (m) => m.JobSolicitedComponent,
          ),
      },
      {
        path: 'reports/applicant-referred',
        loadComponent: () =>
          import('../reports/applicant-referred/applicant-referred.component').then(
            (m) => m.ApplicantReferredComponent,
          ),
      },
      {
        path: 'reports/applicant-placed',
        loadComponent: () =>
          import('../reports/applicant-placed/applicant-placed.component').then(
            (m) => m.ApplicantPlacedComponent,
          ),
      },
      {
        path: 'reports/applicant-registered',
        loadComponent: () =>
          import('../reports/applicant-registered/applicant-registered.component').then(
            (m) => m.ApplicantRegisteredComponent,
          ),
      },
      {
        path: 'reports/establishments-registered',
        loadComponent: () =>
          import('../reports/establishments-registered/establishments-registered.component').then(
            (m) => m.EstablishmentsRegisteredComponent,
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('../audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
];
