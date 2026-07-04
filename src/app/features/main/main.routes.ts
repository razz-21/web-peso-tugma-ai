import { Routes } from '@angular/router';
import { MainComponent } from './main.component';

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
        path: 'user-management',
        loadComponent: () => import('../users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'user-management/:id',
        loadComponent: () =>
          import('../user-details/user-details.component').then((m) => m.UserDetailsComponent),
      },
      {
        path: 'workspaces',
        loadComponent: () =>
          import('../workspaces/workspaces.component').then((m) => m.WorkspacesComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
];
