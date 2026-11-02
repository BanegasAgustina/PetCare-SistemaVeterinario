/**
 * ARCHIVO: personal-route-access.ts
 * UBICACIÓN: mobile/src/utils/personal-route-access.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de personal-route-access.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/_layout.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx, mobile/src/utils/role-home.ts
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Guardia de presentación para rutas del espacio personal; backend vuelve a validar cada operación. */
/** Mapea ruta personal a grants requeridos; devuelve null si no pertenece a este espacio. */
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

/** Permite inbox a los cinco roles de producto; el servidor aún filtra filas por usuario autenticado. */
export function canAccessNotificationCenter(role:string):boolean {
  return ['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role);
}

/** CLIENT entra en sus rutas; otros roles necesitan grant mapeado o acceso al centro de notificaciones. */
export function canEnterPersonalPath(role:string,permissions:string[]|undefined,pathname:string):boolean {
  if(role==='CLIENT')return true;
  if(pathname.replace(/\/+$/,'')==='/client/notifications')return canAccessNotificationCenter(role);
  const required=personalPermissionsForPathname(pathname);
  return Boolean(required?.some(code=>permissions?.includes(code)));
}
