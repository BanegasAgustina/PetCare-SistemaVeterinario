/** Screen catalog: routes stay in the app; effective permission codes come from the API. */
export const personalCapabilityModules = [
  { code: 'personal.pets.view', name: 'Mis mascotas', path: '/client/pets', permissions: ['personal.pets.view','personal.pets.manage'] },
  { code: 'personal.appointments.view', name: 'Mis turnos', path: '/client/appointments', permissions: ['personal.appointments.view','personal.appointments.create'] },
  { code: 'personal.store.view', name: 'Tienda', path: '/client/store', permissions: ['personal.store.view','personal.store.purchase'] },
  { code: 'personal.orders.view', name: 'Mis pedidos', path: '/client/orders', permissions: ['personal.orders.view'] },
  { code: 'personal.profile.manage', name: 'Mi perfil personal', path: '/client/profile', permissions: ['personal.profile.manage'] },
] as const;

/** Permission-to-screen mapping only; this does not grant permissions or classify roles. */
export const administrativeCapabilityModules = [
  { code: 'pets.view_all', name: 'Pacientes', path: '/admin/patients', permissions: ['pets.view_all','pets.view_information','pets.view_assigned'] },
  { code: 'appointments.view_all', name: 'Turnos', path: '/admin/agenda', permissions: ['appointments.view_all','appointments.view_own','appointments.manage'] },
  { code: 'schedule.manage', name: 'Horarios', path: '/admin/availability', permissions: ['schedule.manage'] },
  { code: 'users.view_basic', name: 'Clientes', path: '/admin/clients', permissions: ['users.view_basic'] },
  { code: 'professionals.manage', name: 'Profesionales', path: '/admin/professionals', permissions: ['professionals.manage'] },
  { code: 'veterinarians.manage', name: 'Veterinarios', path: '/admin/veterinarians', permissions: ['veterinarians.manage'] },
  { code: 'services.manage', name: 'Servicios', path: '/admin/catalog/services', permissions: ['services.manage'] },
  { code: 'products.view', name: 'Productos', path: '/admin/products', permissions: ['products.view','products.update','products.update_stock','products.update_price'] },
  { code: 'categories.manage', name: 'Categorías', path: '/admin/catalog/categories', permissions: ['categories.manage'] },
  { code: 'promotions.manage', name: 'Promociones', path: '/admin/catalog/promotions', permissions: ['promotions.manage'] },
  { code: 'store.settings.view', name: 'Envíos y entregas', path: '/admin/store-settings', permissions: ['store.settings.view','store.settings.manage'] },
  { code: 'orders.view_all', name: 'Pedidos', path: '/admin/store-orders', permissions: ['orders.view_all','orders.manage'] },
  { code: 'store.banners.manage', name: 'Banners y slider', path: '/admin/store-banners', permissions: ['store.banners.manage'] },
  { code: 'roles.manage', name: 'Roles', path: '/admin/roles', permissions: ['roles.manage'] },
  { code: 'permissions.manage', name: 'Permisos', path: '/admin/permissions', permissions: ['permissions.manage'] },
  { code: 'users.manage', name: 'Usuarios', path: '/admin/users', permissions: ['users.manage'] },
  { code: 'specialties.manage', name: 'Especialidades', path: '/admin/specialties', permissions: ['specialties.manage','professional_types.manage'] },
  { code: 'settings.general.manage', name: 'Información de PetCare', path: '/admin/general-information', permissions: ['settings.general.manage'] },
] as const;

export const capabilityModules = [...personalCapabilityModules,...administrativeCapabilityModules];

export function hasCapabilityModule(permissions: string[] | undefined) {
  return administrativeCapabilityModules.some(module => module.permissions.some(code => permissions?.includes(code)));
}
/** Permission set that warrants the administration shell; own-work tools stay in the professional shell. */
export function hasAdministrativeShellCapability(permissions:string[]|undefined) {
  const professionalOnly=new Set(['appointments.view_own','appointments.update_own','pets.view_information','pets.view_assigned','products.view']);
  return administrativeCapabilityModules.some(module=>module.permissions.some(code=>!professionalOnly.has(code)&&permissions?.includes(code)));
}
export function hasPersonalCapabilityModule(permissions: string[] | undefined) {
  return personalCapabilityModules.some(module => module.permissions.some(code => permissions?.includes(code)));
}
function capabilityPath(code:string,path:string,permissions:string[]|undefined):string {
  return code==='personal.appointments.view'&&permissions?.includes('personal.appointments.create')&&!permissions.includes('personal.appointments.view')?'/client/appointments/request':path;
}
export function personalModulesForCapabilities(permissions: string[] | undefined) {
  return personalCapabilityModules.filter(module => module.permissions.some(code => permissions?.includes(code))).map(({code,name,path})=>({code,name,path:capabilityPath(code,path,permissions)}));
}
export function modulesForCapabilities(permissions: string[] | undefined) {
  const byPath=new Map<string,{code:string;name:string;path:string}>();
  for(const module of capabilityModules){const path=capabilityPath(module.code,module.path,permissions);if(module.permissions.some(code=>permissions?.includes(code))&&!byPath.has(path))byPath.set(path,{code:module.code,name:module.name,path});}
  return [...byPath.values()];
}
