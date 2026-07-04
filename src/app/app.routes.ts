import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { meGuard } from './core/guards/me.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'main',
    canActivate: [meGuard],
    loadChildren: () => import('./features/main/main.routes').then((m) => m.mainRoutes),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
