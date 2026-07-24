import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { MeStore } from '../../stores/me/me.store';
import { APP_ROUTES } from '../constants/routes.constant';

/**
 * Resolves where a non-super-admin should land when they try to reach a
 * workspace they're not allowed to see: their own workspace details, or the
 * dashboard if they aren't assigned to one.
 */
const fallbackFor = (router: Router, workspaceId: string | undefined): UrlTree =>
  router.createUrlTree(workspaceId ? [APP_ROUTES.workspaces, workspaceId] : [APP_ROUTES.dashboard]);

/**
 * Guards the workspaces list. Only super admins browse every workspace; admins
 * and officers are scoped to their own workspace, so they're redirected
 * straight to its details page (they never see the list).
 */
export const workspaceListGuard: CanActivateFn = () => {
  const user = inject(MeStore).user();
  const router = inject(Router);

  if (user?.role === 'super_admin') {
    return true;
  }
  return fallbackFor(router, user?.workspace?.id);
};

/**
 * Guards a single workspace's details. Super admins may open any workspace;
 * admins and officers may open only the workspace they belong to — any other id
 * redirects them back to their own.
 */
export const workspaceDetailsGuard: CanActivateFn = (route) => {
  const user = inject(MeStore).user();
  const router = inject(Router);

  if (user?.role === 'super_admin') {
    return true;
  }

  const workspaceId = user?.workspace?.id;
  if (workspaceId && route.paramMap.get('id') === workspaceId) {
    return true;
  }
  return fallbackFor(router, workspaceId);
};
