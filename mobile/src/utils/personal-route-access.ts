// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Guardia de presentación para rutas del espacio personal; backend vuelve a validar cada operación. */
// Función personalPermissionsForPathname: concentra la lógica dentro de este módulo.
export function personalPermissionsForPathname(pathname:string):string[]|null {
  const path=pathname.replace(/\/+$/,'')||'/';
  if(path==='/client/pets'||path.startsWith('/client/pets/'))return ['personal.pets.view','personal.pets.manage'];
  if(path==='/client/medical-history'||path==='/client/vaccines'||path==='/client/prescriptions'||path==='/client/recommendations')return ['personal.pets.view'];
  if(path==='/client/appointments/request')return ['personal.appointments.create'];
  if(path==='/client/appointments'||path.startsWith('/client/appointments/'))return ['personal.appointments.view'];
  if(path==='/client/store'||path.startsWith('/client/store/'))return ['personal.store.view','personal.store.purchase'];
  if(path==='/client/orders'||path.startsWith('/client/orders/'))return ['personal.orders.view'];
  if(path.startsWith('/client/payment-intents/'))return ['personal.store.purchase'];
  if(path==='/client/profile'||path.startsWith('/client/profile/'))return ['personal.profile.manage'];
  return null;
}

/** Inbox access is available to authenticated product roles; the server still scopes every row to the session user. */
export function canAccessNotificationCenter(role:string):boolean {
  return ['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role);
}

// Función canEnterPersonalPath: comprueba una regla o condición dentro de este módulo.
export function canEnterPersonalPath(role:string,permissions:string[]|undefined,pathname:string):boolean {
  if(role==='CLIENT')return true;
  if(pathname.replace(/\/+$/,'')==='/client/notifications')return canAccessNotificationCenter(role);
  const required=personalPermissionsForPathname(pathname);
  return Boolean(required?.some(code=>permissions?.includes(code)));
}
