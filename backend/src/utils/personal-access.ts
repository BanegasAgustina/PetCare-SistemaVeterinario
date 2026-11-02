/**
 * ARCHIVO: personal-access.ts
 * UBICACIÓN: backend/src/utils/personal-access.ts
 * FUNCIÓN: Reglas de acceso personal por método y ruta HTTP.
 * RESPONSABILIDAD: Resolver permisos mínimos de una ruta y separar acceso de dueño del acceso profesional/admin.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/permission.middleware.ts
 * FUNCIONAMIENTO: Mapea combinaciones de método/ruta a permisos, evalúa rol/permiso y considera acceso al centro de notificaciones.
 * IMPORTANCIA: Lo consumen middlewares frontend/backend para restringir datos personales.
 */
/** Permisos dedicados a módulos personales; nunca se reutilizan grants laborales. */
/** Mapea método/ruta de cuenta personal a permisos requeridos o null si no es ruta propia. */
export function personalPermissionsForRoute(method:string,path:string):string[]|null {
  path=path.replace(/^\/api\/client(?=\/|$)/,'')||'/';
  const verb=method.toUpperCase();
  if(/^\/media\/pets\/\d+$/.test(path)&&verb==='GET')return ['personal.pets.view'];
  if(path==='/home'&&verb==='POST')return null;
  if(path==='/pets/catalog'&&verb==='POST')return ['personal.pets.view','personal.pets.manage'];
  // Solicitar un turno requiere seleccionar una mascota propia; este permiso
  // habilita solo la lista propia necesaria y no editar ni consultar su ficha.
  if(path==='/pets/query'&&verb==='POST')return ['personal.pets.view','personal.pets.manage','personal.appointments.create'];
  if(path==='/pets'&&verb==='POST')return ['personal.pets.manage'];
  if(/^\/pets\/\d+$/.test(path)&&verb==='POST')return ['personal.pets.view','personal.pets.manage'];
  if(/^\/pets\/\d+$/.test(path)&&verb==='PUT')return ['personal.pets.manage'];
  if(/^\/pets\/\d+\/(?:deactivate|reactivate)$/.test(path)&&verb==='PATCH')return ['personal.pets.manage'];
  if(/^\/clinical\/(?:medical-history|vaccines|prescriptions|recommendations)$/.test(path)&&verb==='POST')return ['personal.pets.view','personal.pets.manage'];
  if(['/appointments/catalog','/appointments/slots'].includes(path)&&verb==='POST')return ['personal.appointments.view','personal.appointments.create'];
  if(path==='/appointments/query'&&verb==='POST')return ['personal.appointments.view'];
  if(path==='/appointments'&&verb==='POST')return ['personal.appointments.create'];
  if(/^\/appointments\/\d+$/.test(path)&&verb==='POST')return ['personal.appointments.view'];
  if(['/store/categories','/store/fulfillment','/store/promotions','/store/banners','/store/products'].includes(path)&&verb==='POST')return ['personal.store.view','personal.store.purchase'];
  if(/^\/store\/products\/\d+$/.test(path)&&verb==='POST')return ['personal.store.view','personal.store.purchase'];
  if(path==='/store/delivery-quote'&&verb==='POST')return ['personal.store.purchase'];
  if(path==='/store/addresses/query'&&verb==='POST')return ['personal.store.purchase'];
  if(path==='/store/addresses'&&verb==='POST')return ['personal.store.purchase'];
  if(/^\/store\/addresses\/\d+$/.test(path)&&verb==='PATCH')return ['personal.store.purchase'];
  if(path==='/cart'&&verb==='POST')return ['personal.store.purchase'];
  if(/^\/cart\/\d+$/.test(path)&&verb==='PUT')return ['personal.store.purchase'];
  if(path==='/orders/query'&&verb==='POST')return ['personal.orders.view'];
  if(path==='/orders'&&verb==='POST')return ['personal.store.purchase'];
  if(path==='/orders/bank-transfer'&&verb==='POST')return ['personal.store.purchase'];
  if(/^\/orders\/\d+$/.test(path)&&verb==='POST')return ['personal.orders.view'];
  if(/^\/orders\/\d+\/payment-intents$/.test(path)&&verb==='POST')return ['personal.store.purchase'];
  if(/^\/payment-intents\/\d+\/proof$/.test(path)&&verb==='POST')return ['personal.store.purchase'];
  if(path==='/profile'&&verb==='PATCH')return ['personal.profile.manage'];
  if(path==='/profile/password'&&verb==='PUT')return ['personal.profile.manage'];
  return null;
}

/** Authenticated product roles may read only their own notification inbox. */
/** Clientes y roles de clínica pueden consultar la bandeja de su propia sesión. */
export function canAccessNotificationCenter(role:string):boolean {
  return ['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role);
}

/** Evalúa rol y permisos para decidir acceso a la ruta personal concreta. */
export function canAccessPersonalRoute(role:string,permissions:string[]|undefined,method:string,path:string):boolean {
  if(role==='CLIENT')return true;
  const normalized=path.replace(/^\/api\/client(?=\/|$)/,'')||'/';
  const verb=method.toUpperCase();
  const notifications=normalized==='/notifications'&&verb==='POST'||normalized==='/notifications/read-all'&&verb==='PATCH'||/^\/notifications\/[1-9]\d*\/read$/.test(normalized)&&verb==='PATCH'||/^\/notifications\/[1-9]\d*$/.test(normalized)&&verb==='DELETE';
  if(notifications)return canAccessNotificationCenter(role);
  const required=personalPermissionsForRoute(method,path);
  return Boolean(required?.some(code=>permissions?.includes(code)));
}
