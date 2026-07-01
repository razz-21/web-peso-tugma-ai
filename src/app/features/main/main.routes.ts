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
    ],
  },
];
