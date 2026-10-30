/**
 * Permisos de presentación para las rutas administrativas. La API vuelve a
 * comprobar cada operación; esta tabla mantiene iguales los accesos visibles
 * y la protección de navegación.
 */
export type PermissionCheck = (code: string) => boolean;

const anyPermissionRoutes: { matches: (path: string) => boolean; permissions: string[] }[] = [
  { matches: path => path === '/admin/store-settings', permissions: ['store.settings.view', 'store.settings.manage'] },
  { matches: path => path === '/admin/specialties' || path === '/admin/veterinarians/specialties', permissions: ['specialties.manage', 'professional_types.manage'] },
  { matches: path => path === '/admin/products', permissions: ['products.update', 'products.update_stock', 'products.update_price'] },
  { matches: path => path === '/admin/catalog/services', permissions: ['services.manage'] },
  { matches: path => path === '/admin/catalog/categories', permissions: ['categories.manage'] },
  { matches: path => path === '/admin/catalog/promotions', permissions: ['promotions.manage'] },
  { matches: path => path === '/admin/catalog/products', permissions: ['products.update'] },
];

const singlePermissionRoutes: { matches: (path: string) => boolean; permission: string }[] = [
  { matches: path => /^\/admin\/(?:agenda|appointment)$/.test(path), permission: 'appointments.view_all' },
  { matches: path => path === '/admin/availability', permission: 'schedule.manage' },
  { matches: path => path === '/admin/store-orders', permission: 'orders.view_all' },
  { matches: path => path === '/admin/store-banners', permission: 'store.banners.manage' },
  { matches: path => /^\/admin\/professionals(?:\/|$)/.test(path), permission: 'professionals.manage' },
  { matches: path => /^\/admin\/veterinarians(?:\/|$)/.test(path), permission: 'veterinarians.manage' },
  { matches: path => /^\/admin\/users(?:\/|$)/.test(path), permission: 'users.manage' },
  { matches: path => /^\/admin\/(?:clients|client)$/.test(path), permission: 'users.view_basic' },
  { matches: path => path === '/admin/roles', permission: 'roles.manage' },
  { matches: path => path === '/admin/permissions', permission: 'permissions.manage' },
  { matches: path => path === '/admin/general-information', permission: 'settings.general.manage' },
];

/** Allows a route only when its configured effective permission is present. */
export function canAccessAdminPath(pathname: string, hasPermission: PermissionCheck): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (['/admin', '/admin/clinic', '/admin/store', '/admin/administration'].includes(path)) return true;

  // This screen is specifically the global patient list; use the effective
  // all-patients grant configured on the user's role.
  if (/^\/admin\/(?:patients|patient)$/.test(path)) {
    return hasPermission('pets.view_all');
  }

  const anyRoute = anyPermissionRoutes.find(route => route.matches(path));
  if (anyRoute) return anyRoute.permissions.some(permission => hasPermission(permission));

  const singleRoute = singlePermissionRoutes.find(route => route.matches(path));
  if (singleRoute) return hasPermission(singleRoute.permission);

  // Unrecognized admin routes stay closed until their access rule is defined.
  return false;
}
