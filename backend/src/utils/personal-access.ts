// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Permisos dedicados a módulos personales; nunca se reutilizan grants laborales. */
// Función personalPermissionsForRoute: concentra la lógica dentro de este módulo.
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

// Función canAccessPersonalRoute: comprueba una regla o condición dentro de este módulo.
export function canAccessPersonalRoute(role:string,permissions:string[]|undefined,method:string,path:string):boolean {
  if(role==='CLIENT')return true;
  const required=personalPermissionsForRoute(method,path);
  return Boolean(required?.some(code=>permissions?.includes(code)));
}
