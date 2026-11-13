/**
 * ARCHIVO: admin-route-access.ts
 * UBICACIÓN: mobile/src/utils/admin-route-access.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de admin-route-access.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/components/admin/AdminSectionHub.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Permisos de presentación para las rutas administrativas. La API vuelve a
 * comprobar cada operación; esta tabla mantiene iguales los accesos visibles
 * y la protección de navegación.
 */
export type PermissionCheck = (code: string) => boolean;

const anyPermissionRoutes: { matches: (path: string) => boolean; permissions: string[] }[] = [
  { matches: path => /^\/admin\/(?:agenda|appointment)$/.test(path), permissions: ['appointments.view_all','appointments.view_own','appointments.manage'] },
  { matches: path => path === '/admin/store-settings', permissions: ['store.settings.view', 'store.settings.manage'] },
  { matches: path => path === '/admin/specialties' || path === '/admin/veterinarians/specialties', permissions: ['specialties.manage', 'professional_types.manage'] },
  { matches: path => path === '/admin/products', permissions: ['products.update', 'products.update_stock', 'products.update_price'] },
  { matches: path => path === '/admin/catalog/services', permissions: ['services.manage'] },
  { matches: path => path === '/admin/catalog/categories', permissions: ['categories.manage'] },
  { matches: path => path === '/admin/catalog/promotions', permissions: ['promotions.manage'] },
  { matches: path => path === '/admin/catalog/products', permissions: ['products.update'] },
];

const singlePermissionRoutes: { matches: (path: string) => boolean; permission: string }[] = [
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

/** Normaliza la ruta y aplica la regla de permisos visibles; rutas administrativas desconocidas quedan denegadas. La API verifica lo mismo al ejecutar la operación. */
export function canAccessAdminPath(pathname: string, hasPermission: PermissionCheck): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (['/admin', '/admin/clinic', '/admin/store', '/admin/administration'].includes(path)) return true;

  // This screen is specifically the global patient list; use the effective
  // all-patients grant configured on the user's role.
  if (/^\/admin\/(?:patients|patient)$/.test(path)) {
    return ['pets.view_all','pets.view_information','pets.view_assigned','medical_records.view','medical_records.create','vaccines.view','vaccines.create','prescriptions.view','prescriptions.create','recommendations.create']
      .some(permission=>hasPermission(permission));
  }

  const anyRoute = anyPermissionRoutes.find(route => route.matches(path));
  if (anyRoute) return anyRoute.permissions.some(permission => hasPermission(permission));

  const singleRoute = singlePermissionRoutes.find(route => route.matches(path));
  if (singleRoute) return hasPermission(singleRoute.permission);

  // Unrecognized admin routes stay closed until their access rule is defined.
  return false;
}
