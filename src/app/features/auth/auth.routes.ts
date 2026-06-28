import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('../login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('../forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
    ],
  },
];
