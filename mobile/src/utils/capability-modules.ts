/**
 * ARCHIVO: capability-modules.ts
 * UBICACIÓN: mobile/src/utils/capability-modules.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de capability-modules.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/workspace.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/utils/role-home.ts
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Rutas disponibles para roles personalizados. Las rutas vienen de esta lista local cerrada. */
// Dato personalCapabilityModules: conserva un valor calculado o de configuración usado por este módulo.
export const personalCapabilityModules = [
  { code: 'personal.pets.view', name: 'Mis mascotas', path: '/client/pets', permissions: ['personal.pets.view','personal.pets.manage'] },
  { code: 'personal.appointments.view', name: 'Mis turnos', path: '/client/appointments', permissions: ['personal.appointments.view','personal.appointments.create'] },
  { code: 'personal.store.view', name: 'Tienda', path: '/client/store', permissions: ['personal.store.view','personal.store.purchase'] },
  { code: 'personal.orders.view', name: 'Mis pedidos', path: '/client/orders', permissions: ['personal.orders.view'] },
  { code: 'personal.profile.manage', name: 'Mi perfil personal', path: '/client/profile', permissions: ['personal.profile.manage'] },
] as const;
// Dato administrativeCapabilityModules: conserva un valor calculado o de configuración usado por este módulo.
export const administrativeCapabilityModules = [
  { code: 'products.update_stock', name: 'Inventario y stock', path: '/admin/products', permissions: ['products.update_stock','products.update','products.update_price'] },
  { code: 'categories.manage', name: 'Categorías', path: '/admin/catalog/categories', permissions: ['categories.manage'] },
  { code: 'promotions.manage', name: 'Promociones y descuentos', path: '/admin/catalog/promotions', permissions: ['promotions.manage'] },
  { code: 'services.manage', name: 'Servicios', path: '/admin/catalog/services', permissions: ['services.manage'] },
  { code: 'products.update', name: 'Inventario y productos', path: '/admin/products', permissions: ['products.update'] },
] as const;
// Configuración capabilityModules: reúne valores o reglas que consume el resto del módulo.
export const capabilityModules = [...personalCapabilityModules,...administrativeCapabilityModules];
/** Indica si algún permiso administrativo reconocido habilita el espacio de capacidades de administración. */
export function hasCapabilityModule(permissions: string[] | undefined) {
  return administrativeCapabilityModules.some(module => module.permissions.some(code => permissions?.includes(code)));
}
/** Indica si algún permiso personal reconocido habilita módulos personales para un rol personalizado. */
export function hasPersonalCapabilityModule(permissions: string[] | undefined) {
  return personalCapabilityModules.some(module => module.permissions.some(code => permissions?.includes(code)));
}
/** Envía a formulario de solicitud a quien puede crear turnos personales, pero no tiene permiso de lectura. */
function capabilityPath(code:string,path:string,permissions:string[]|undefined):string {
  return code==='personal.appointments.view'&&permissions?.includes('personal.appointments.create')&&!permissions.includes('personal.appointments.view')?'/client/appointments/request':path;
}
/** Filtra los módulos personales habilitados y ajusta la ruta de creación de turnos según sus grants. */
export function personalModulesForCapabilities(permissions: string[] | undefined) {
  return personalCapabilityModules.filter(module => module.permissions.some(code => permissions?.includes(code))).map(({code,name,path})=>({code,name,path:capabilityPath(code,path,permissions)}));
}
/** Reúne módulos personales y administrativos permitidos y quita rutas repetidas para el menú. */
export function modulesForCapabilities(permissions: string[] | undefined) {
  const byPath=new Map<string,{code:string;name:string;path:string}>();
  for(const module of capabilityModules){const path=capabilityPath(module.code,module.path,permissions);if(module.permissions.some(code=>permissions?.includes(code))&&!byPath.has(path))byPath.set(path,{code:module.code,name:module.name,path});}
  return [...byPath.values()];
}
