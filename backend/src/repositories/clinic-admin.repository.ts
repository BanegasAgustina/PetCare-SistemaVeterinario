// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Configuración administrable: todos los catálogos y asignaciones viven en MySQL. */
import type { AuthUser } from '../types/auth';
import * as db from './clinic.repository';
import * as v from '../validators/clinic.validator';
import { assertCapabilityPermission,forbidden } from '../utils/admin-authorization';
import { catalogName } from '../utils/catalog-presentation';
import { availabilityReactivationError } from '../utils/availability-lifecycle';
// Dato entities: conserva un valor calculado o de configuración usado por este módulo.
const entities={services:{table:'client_services',permission:'services.manage',fields:{name:'name',imageUrl:'image_url',description:'description',specialtyId:'specialty_id',typeId:'professional_type_id',durationMinutes:'duration_minutes',priceCents:'price_cents',requirements:'requirements',isActive:'is_active'}},categories:{table:'client_product_categories',permission:'categories.manage',fields:{name:'name',isActive:'is_active'}},products:{table:'client_products',permission:'products.update',fields:{name:'name',description:'description',categoryId:'category_id',imageUrl:'image_url',priceCents:'price_cents',stock:'stock',isActive:'is_active',isFeatured:'is_featured',requiresPrescription:'requires_prescription',speciesId:'species_id',productType:'product_type'}},promotions:{table:'client_promotions',permission:'promotions.manage',fields:{name:'name',productId:'product_id',priceCents:'price_cents',startsAt:'starts_at',endsAt:'ends_at',isActive:'is_active',bannerImageUrl:'banner_image_url',bannerSubtitle:'banner_subtitle',bannerCtaText:'banner_cta_text'}},types:{table:'professional_types',permission:'professional_types.manage',fields:{name:'name',roleId:'role_id',isClinical:'is_clinical'}},specialties:{table:'specialties',permission:'specialties.manage',fields:{name:'name',isActive:'is_active'}}} as const;
// Función enumField: concentra la lógica dentro de este módulo.
function enumField<T extends string>(value:unknown,allowed:readonly T[]):T {if(typeof value!=='string'||!allowed.includes(value as T))v.invalid('El tipo de producto no es válido.');return value as T;}
// Tipo Entity: define la forma o las opciones válidas de los datos usados por este módulo.
export type Entity=keyof typeof entities;
// Función entity: concentra la lógica dentro de este módulo.
export function entity(name:string):Entity {if(!Object.hasOwn(entities,name))v.invalid();return name as Entity;}
// La lista administrativa muestra disponibilidad y autoría sin exponer datos sensibles.
// Función list: obtiene o consulta información dentro de este módulo.
export async function list(actor:AuthUser,name:Entity,query:Record<string,unknown>={}) {const config=entities[name];assertCapabilityPermission(actor,config.permission);const fields=Object.entries(config.fields).map(([alias,column])=>`${column} AS ${alias}`).join(',');const search=v.text(query.search,100,true)??'';const status=query.status??'all';if(!['all','active','inactive'].includes(String(status)))v.invalid('El filtro de estado no es válido.');const filters=['name LIKE ?'];const params:unknown[]=[`%${search}%`];if(name!=='types'&&status!=='all'){filters.push('is_active=?');params.push(status==='active'?1:0);}const result=await db.rows(`SELECT id,${fields} ${name==='products'?',reserved_stock AS reservedStock,created_by AS createdBy,updated_by AS updatedBy':''} FROM ${config.table} WHERE ${filters.join(' AND ')} ORDER BY name LIMIT 101 OFFSET ${(v.queryPage(query)-1)*100}`,params);return ['types','specialties'].includes(name)?result.map(item=>({...item,name:catalogName(String(item.name))})):result;}
// Función save: actualiza o guarda información dentro de este módulo.
export async function save(actor:AuthUser,name:Entity,id:string|undefined,value:unknown) {const config=entities[name];const fields:Record<string,string>=config.fields;const body=v.body(value,Object.keys(fields));const names=Object.keys(body);if(!names.length)v.invalid();if(!id&&!body.name)v.invalid('Ingresá un nombre.');
 // Cada dato de producto se valida en el backend antes de iniciar la escritura.
 const converted:db.Data={};for(const key of names){const value=body[key];converted[key]=key==='name'?v.text(value,name==='products'?200:name==='services'&&key==='name'?20:100):key==='imageUrl'?(name==='services'?v.serviceImage(value):v.productImage(value)):key==='bannerImageUrl'?v.productImage(value):key==='bannerCtaText'?v.text(value,40,true)??'Ver producto':key==='bannerSubtitle'?v.text(value,250,true):key==='productType'?enumField(value,['MEDICINE','ACCESSORY']):key.endsWith('Id')?v.optionalId(value):key.startsWith('is')||key==='requiresPrescription'?v.bool(value):key.endsWith('At')?v.instant(value):['stock','priceCents','durationMinutes'].includes(key)?(key==='priceCents'&&value===null?null:v.integer(value,key==='durationMinutes'?5:0,key==='durationMinutes'?480:100000000)):v.text(value,10000,true);}
 return db.transaction(actor,async(c,fresh)=>{assertCapabilityPermission(fresh,config.permission);let previousImage:unknown=null;let auditedProductId=id;let savedId=id;if(id&&name!=='products'&&name!=='services')await db.one(`SELECT id FROM ${config.table} WHERE id=? FOR UPDATE`,[id],c);if(name==='products'){if(!id)assertCapabilityPermission(fresh,'products.create','products.update_price','products.update_stock');if(body.priceCents!==undefined)assertCapabilityPermission(fresh,'products.update_price');if(body.stock!==undefined)assertCapabilityPermission(fresh,'products.update_stock');if(!id&&(body.priceCents===undefined||body.stock===undefined||body.productType===undefined))v.invalid('Indicá tipo, precio y stock.');
  // La fila bloqueada aporta los valores actuales para validar cambios parciales sin confiar en campos omitidos.
  const current=id?await db.one('SELECT reserved_stock AS reservedStock,image_url AS imageUrl,product_type AS productType,requires_prescription AS requiresPrescription FROM client_products WHERE id=? FOR UPDATE',[id],c):null;
  const finalType=String(body.productType??current?.productType??'MEDICINE');
  // Los accesorios no representan medicamentos y no deben asociarse a requisitos de receta.
  if(finalType==='ACCESSORY'&&Boolean(body.requiresPrescription??current?.requiresPrescription))v.invalid('Un accesorio no puede requerir receta veterinaria.');
  // La limpieza de imagen previa solo ocurre después del commit y conserva la referencia vigente ante errores.
  if(current){previousImage=current.imageUrl;if(body.stock!==undefined&&Number(body.stock)<Number(current.reservedStock))v.invalid('El stock físico no puede ser menor al reservado.');}}
  let currentService:db.Data|null=null;if(id){const current=await db.one(`SELECT id${name==='services'?' ,image_url AS imageUrl,specialty_id AS specialtyId':''} FROM ${config.table} WHERE id=? FOR UPDATE`,[id],c);if(name==='services'){previousImage=current.imageUrl;currentService=current;}}
  if(name==='services'){if(body.name!==undefined&&/\d/u.test(String(body.name)))v.invalid('El nombre del servicio no puede incluir números.');if((!id||body.typeId!==undefined)&&!converted.typeId)v.invalid('Seleccioná el tipo profesional.');if(converted.typeId){const type=await db.one('SELECT id,is_clinical AS isClinical FROM professional_types WHERE id=?',[converted.typeId],c);if(!type.isClinical&&converted.specialtyId)v.invalid('Un servicio no clínico no requiere especialidad veterinaria.');}const specialtyId=body.specialtyId!==undefined?converted.specialtyId:currentService?.specialtyId;if(converted.specialtyId)await db.one('SELECT id FROM specialties WHERE id=? AND is_active=1',[converted.specialtyId],c);if(body.isActive===true&&specialtyId)await db.one('SELECT id FROM specialties WHERE id=? AND is_active=1',[specialtyId],c);}
  if(name==='types'){if(!id){const role=await db.one('SELECT code FROM roles WHERE id=?',[converted.roleId],c);if(!['VETERINARIAN','GROOMER'].includes(String(role.code)))v.invalid('Este rol no es profesional.');if(Boolean(converted.isClinical)!==(role.code==='VETERINARIAN'))v.invalid('El acceso clínico corresponde exclusivamente al rol veterinario.');}else if(body.roleId!==undefined||body.isClinical!==undefined)v.invalid('No se cambia el rol ni acceso clínico de un tipo utilizado.');}
  if(name==='promotions'&&converted.startsAt&&converted.endsAt&&String(converted.endsAt)<=String(converted.startsAt))v.invalid('La promoción debe terminar después de comenzar.');
  // La autoría de edición se toma de la sesión verificada y nunca del cuerpo enviado por el cliente.
  if(id&&name==='products')await c.execute(`UPDATE ${config.table} SET ${names.map(key=>`${fields[key]}=?`).join(',')},updated_by=? WHERE id=?`,[...names.map(key=>converted[key]),fresh.id,id]);
  // Las entidades administrativas distintas de productos conservan su escritura dinámica existente.
  else if(id)await c.execute(`UPDATE ${config.table} SET ${names.map(key=>`${fields[key]}=?`).join(',')} WHERE id=?`,[...names.map(key=>converted[key]),id]);
  // La creación de producto registra quién lo agregó además de los campos que autorizó el formulario.
  else if(name==='products'){await c.execute(`INSERT INTO ${config.table}(${names.map(key=>fields[key]).join(',')},created_by,updated_by) VALUES (${[...names.map(()=>'?'),'?','?'].join(',')})`,[...names.map(key=>converted[key]),fresh.id,fresh.id]);auditedProductId=String((await db.one('SELECT LAST_INSERT_ID() AS id',[],c)).id);}
  // Las entidades distintas de productos mantienen su inserción preexistente.
  else {await c.execute(`INSERT INTO ${config.table}(${names.map(key=>fields[key]).join(',')}) VALUES (${names.map(()=>'?').join(',')})`,names.map(key=>converted[key]));savedId=String((await db.one('SELECT LAST_INSERT_ID() AS id',[],c)).id);}
  // El evento de auditoría comparte la transacción y se confirma o revierte junto con el producto.
  if(name==='products'){savedId=auditedProductId;await c.execute('INSERT INTO client_product_change_history(product_id,actor_user_id,action,changed_fields) VALUES (?,?,?,?)',[String(auditedProductId),fresh.id,id?'UPDATED':'CREATED',JSON.stringify(names)]);}
  // Se devuelve la imagen anterior para que el servicio la retire únicamente tras confirmar la escritura.
  return {saved:true,id:savedId,...(['products','services'].includes(name)?{previousImage}: {})};
 });
}
// Función deleteService: elimina, revoca o cancela una operación dentro de este módulo.
export async function deleteService(actor:AuthUser,id:string) {
 return db.transaction(actor,async(c,fresh)=>{
  assertCapabilityPermission(fresh,'services.manage');
  const service=await db.one('SELECT id,image_url AS imageUrl FROM client_services WHERE id=? FOR UPDATE',[id],c);
  const slots=await db.rows('SELECT id FROM client_appointment_slots WHERE service_id=? FOR UPDATE',[id],c);
  if(slots.length){
   const appointments=await db.rows('SELECT a.id FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id WHERE s.service_id=? LIMIT 1 FOR UPDATE',[id],c);
   if(appointments.length){
    await c.execute('UPDATE client_services SET is_active=0 WHERE id=?',[id]);
    await c.execute('DELETE FROM professional_services WHERE service_id=?',[id]);
    await c.execute('UPDATE client_appointment_slots s SET is_active=0 WHERE s.service_id=? AND NOT EXISTS (SELECT 1 FROM client_appointments a WHERE a.slot_id=s.id)',[id]);
    return {deleted:false,archived:true,imageUrl:service.imageUrl};
   }
  }
  await c.execute('DELETE FROM professional_services WHERE service_id=?',[service.id]);
  await c.execute('DELETE FROM client_appointment_slots WHERE service_id=?',[service.id]);
  await c.execute('DELETE FROM client_services WHERE id=?',[service.id]);
  return {deleted:true,archived:false,imageUrl:service.imageUrl};
 });
}
// Función assignServices: concentra la lógica dentro de este módulo.
export async function assignServices(actor:AuthUser,id:string,value:unknown) {const body=v.body(value,['serviceIds']);if(!Array.isArray(body.serviceIds)||body.serviceIds.length>100)v.invalid();const ids=[...new Set(body.serviceIds.map(v.id))];return db.transaction(actor,async(c,fresh)=>{assertCapabilityPermission(fresh,'professionals.manage');const p=await db.one('SELECT u.id,pt.id AS typeId,vt.id AS veterinarianId FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) LEFT JOIN veterinarians vt ON vt.user_id=u.id WHERE u.id=? FOR UPDATE',[id],c);
 for(const serviceId of ids){const s=await db.one('SELECT professional_type_id AS typeId,specialty_id AS specialtyId FROM client_services WHERE id=?',[serviceId],c);if(s.typeId!==p.typeId)v.invalid('El servicio no corresponde al tipo profesional.');if(s.specialtyId)await db.one('SELECT specialty_id AS id FROM veterinarian_specialties WHERE veterinarian_id=? AND specialty_id=?',[p.veterinarianId,s.specialtyId],c);}
 await c.execute('DELETE FROM professional_services WHERE user_id=?',[id]);for(const serviceId of ids)await c.execute('INSERT INTO professional_services(user_id,service_id) VALUES (?,?)',[id,serviceId]);return {saved:true};});}
// Función availability: concentra la lógica dentro de este módulo.
export async function availability(actor:AuthUser,query:Record<string,unknown>) {assertCapabilityPermission(actor,'schedule.manage');const id=v.id(query.professionalId);return {slots:await db.rows('SELECT id,service_id AS serviceId,starts_at AS startsAt,ends_at AS endsAt,is_active AS isActive FROM client_appointment_slots WHERE professional_user_id=? AND is_archived=0 ORDER BY starts_at DESC LIMIT 300',[id]),blocks:await db.rows('SELECT id,starts_at AS startsAt,ends_at AS endsAt,reason,is_active AS isActive FROM professional_blocks WHERE user_id=? ORDER BY starts_at DESC LIMIT 100',[id])};}
// Función archiveAvailability: concentra la lógica dentro de este módulo.
export async function archiveAvailability(actor:AuthUser,kind:string,id:string) {
 if(kind!=='slot')v.invalid('Solo se pueden quitar de la lista los horarios desactivados.');
 return db.transaction(actor,async(c,fresh)=>{
  assertCapabilityPermission(fresh,'schedule.manage');
  const row=await db.one('SELECT is_active AS isActive,is_archived AS isArchived FROM client_appointment_slots WHERE id=? FOR UPDATE',[id],c);
  if(Boolean(row.isActive))v.invalid('Desactivá el horario antes de quitarlo de la lista.');
  if(Boolean(row.isArchived))return {archived:true};
  await c.execute('UPDATE client_appointment_slots SET is_archived=1 WHERE id=?',[id]);
  return {archived:true};
 });
}
// Función saveAvailability: actualiza o guarda información dentro de este módulo.
export async function saveAvailability(actor:AuthUser,value:unknown) {const body=v.body(value,['professionalId','serviceId','startsAt','endsAt','block','reason']);const professionalId=v.id(body.professionalId),starts=v.instant(body.startsAt),ends=v.instant(body.endsAt);if(ends<=starts||starts<new Date().toISOString().slice(0,19).replace('T',' '))v.invalid('Revisá el intervalo futuro de atención.');const block=body.block===true;
 return db.transaction(actor,async(c,fresh)=>{assertCapabilityPermission(fresh,'schedule.manage');const professionals=await db.rows('SELECT u.id,pt.id AS typeId FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) WHERE u.id=? AND u.is_active=1 FOR UPDATE',[professionalId],c);if(!professionals.length)v.invalid('El profesional ya no está activo o no tiene un tipo profesional válido. Actualizá la lista e intentá nuevamente.');const professional=professionals[0];
  const overlaps=await db.rows(`SELECT s.id FROM client_appointment_slots s WHERE s.professional_user_id=? AND s.is_active=1 AND s.starts_at<? AND s.ends_at>? ${block?"AND EXISTS(SELECT 1 FROM client_appointments a WHERE a.slot_id=s.id AND a.status<>'CANCELLED')":''}`,[professionalId,ends,starts],c);if(overlaps.length)v.invalid('El intervalo se superpone con un horario o turno existente.');
  if(block){await c.execute('INSERT INTO professional_blocks(user_id,starts_at,ends_at,reason) VALUES (?,?,?,?)',[professionalId,starts,ends,v.text(body.reason,200)!]);return {saved:true};}
  const serviceId=v.id(body.serviceId);const services=await db.rows('SELECT s.professional_type_id AS typeId,s.duration_minutes AS durationMinutes,s.specialty_id AS specialtyId FROM client_services s JOIN professional_services ps ON ps.service_id=s.id WHERE s.id=? AND ps.user_id=? AND s.is_active=1',[serviceId,professionalId],c);if(!services.length)v.invalid('El profesional ya no tiene asignado este servicio. Revisá la asignación y volvé a intentar.');const service=services[0];if(service.typeId!==professional.typeId)v.invalid('El servicio no corresponde al profesional.');
  if(service.specialtyId){const specialties=await db.rows('SELECT vs.specialty_id AS id FROM veterinarian_specialties vs JOIN veterinarians vt ON vt.id=vs.veterinarian_id JOIN specialties sp ON sp.id=vs.specialty_id WHERE vt.user_id=? AND vs.specialty_id=? AND sp.is_active=1',[professionalId,service.specialtyId],c);if(!specialties.length)v.invalid('El profesional no tiene activa la especialidad requerida por este servicio. Revisá la ficha profesional antes de publicar.');}
  const blocks=await db.rows('SELECT id FROM professional_blocks WHERE user_id=? AND is_active=1 AND starts_at<? AND ends_at>?',[professionalId,ends,starts],c);if(blocks.length)v.invalid('El profesional tiene un bloqueo en ese intervalo.');
  const duration=Number(service.durationMinutes)*60000;const startMs=Date.parse(starts.replace(' ','T')+'Z'),endMs=Date.parse(ends.replace(' ','T')+'Z');if((endMs-startMs)%duration!==0||(endMs-startMs)/duration>100)v.invalid('El bloque debe contener hasta 100 turnos completos de la duración del servicio.');
  for(let time=startMs;time+duration<=endMs;time+=duration){// Función format: agrupa una operación que este módulo puede ejecutar o reutilizar.
const format=(ms:number)=>new Date(ms).toISOString().slice(0,19).replace('T',' ');await c.execute('INSERT INTO client_appointment_slots(service_id,professional_user_id,professional_type_id,veterinarian_id,starts_at,ends_at) VALUES (?,?,?,(SELECT id FROM veterinarians WHERE user_id=?),?,?)',[serviceId,professionalId,service.typeId,professionalId,format(time),format(time+duration)]);}return {saved:true};
 });}
// Función setAvailabilityActive: actualiza o guarda información dentro de este módulo.
export async function setAvailabilityActive(actor:AuthUser,kind:string,id:string,isActive:boolean) {
 if(!['slot','block'].includes(kind)||typeof isActive!=='boolean')v.invalid();
 return db.transaction(actor,async(c,fresh)=>{
  assertCapabilityPermission(fresh,'schedule.manage');
  const slot=kind==='slot';const table=slot?'client_appointment_slots':'professional_blocks';
  const row=await db.one(`SELECT ${slot?'professional_user_id':'user_id'} AS professionalId,starts_at AS startsAt,ends_at AS endsAt${slot?',service_id AS serviceId,professional_type_id AS professionalTypeId,is_archived AS isArchived':''},is_active AS isActive FROM ${table} WHERE id=? FOR UPDATE`,[id],c);
  if(slot&&Boolean(row.isArchived)&&isActive)v.invalid('El horario ya fue quitado de la lista y no se puede reactivar.');
  if(Boolean(row.isActive)===isActive)return {saved:true,isActive};
  await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[row.professionalId]);
  if(!isActive){
   if(slot&&(await db.rows("SELECT id FROM client_appointments WHERE slot_id=? AND status<>'CANCELLED'",[id],c)).length)v.invalid('Reprogramá o cancelá el turno antes de desactivar el horario.');
   await c.execute(`UPDATE ${table} SET is_active=0 WHERE id=?`,[id]);return {saved:true,isActive:false};
  }
  const [professionals]=await c.execute<import('mysql2/promise').RowDataPacket[]>('SELECT id FROM users WHERE id=? AND is_active=1 AND email_verified_at IS NOT NULL',[row.professionalId]);
  const professionalActive=professionals.length>0;
  let serviceActive=false;
  if(slot){
   const [services]=await c.execute<import('mysql2/promise').RowDataPacket[]>(`SELECT s.id FROM client_services s JOIN professional_services ps ON ps.service_id=s.id AND ps.user_id=?
    WHERE s.id=? AND s.is_active=1 AND s.professional_type_id=? AND (s.specialty_id IS NULL OR EXISTS (
     SELECT 1 FROM veterinarian_specialties vs JOIN veterinarians vet ON vet.id=vs.veterinarian_id JOIN specialties sp ON sp.id=vs.specialty_id
     WHERE vet.user_id=? AND vs.specialty_id=s.specialty_id AND sp.is_active=1))`,[row.professionalId,row.serviceId,row.professionalTypeId,row.professionalId]);
   serviceActive=services.length>0;
  }
  const overlaps=slot
   ?await db.rows(`SELECT id FROM client_appointment_slots WHERE professional_user_id=? AND id<>? AND is_active=1 AND starts_at<? AND ends_at>? LIMIT 1`,[row.professionalId,id,row.endsAt,row.startsAt],c)
   :await db.rows(`SELECT id FROM professional_blocks WHERE user_id=? AND id<>? AND is_active=1 AND starts_at<? AND ends_at>? LIMIT 1`,[row.professionalId,id,row.endsAt,row.startsAt],c);
  const conflictingBlocks=slot?await db.rows('SELECT id FROM professional_blocks WHERE user_id=? AND is_active=1 AND starts_at<? AND ends_at>? LIMIT 1',[row.professionalId,row.endsAt,row.startsAt],c):[];
  const appointmentRows=slot
   ?await db.rows("SELECT id FROM client_appointments WHERE slot_id=? AND status<>'CANCELLED' LIMIT 1",[id],c)
   :await db.rows(`SELECT a.id FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id
      WHERE s.professional_user_id=? AND a.status<>'CANCELLED' AND s.starts_at<? AND s.ends_at>? LIMIT 1`,[row.professionalId,row.endsAt,row.startsAt],c);
  const conflict=availabilityReactivationError({kind:slot?'slot':'block',startsAt:String(row.startsAt),professionalActive,serviceActive,
   hasOverlappingActiveSlot:slot&&overlaps.length>0,hasOverlappingActiveBlock:slot?conflictingBlocks.length>0:overlaps.length>0,
   hasNonCancelledAppointment:appointmentRows.length>0});
  if(conflict)v.invalid(conflict);
  await c.execute(`UPDATE ${table} SET is_active=1 WHERE id=?`,[id]);return {saved:true,isActive:true};
 });
}
// Función administrative: concentra la lógica dentro de este módulo.
export function administrative(actor:AuthUser){if(!['ADMIN','SUPER_ADMIN'].includes(actor.role))forbidden();}

// Función assignType: concentra la lógica dentro de este módulo.
export async function assignType(actor:AuthUser,id:string,value:unknown) {const body=v.body(value,['typeId']);const typeId=v.id(body.typeId);return db.transaction(actor,async(c,fresh)=>{assertCapabilityPermission(fresh,'professionals.manage');const user=await db.one('SELECT id,role_id AS roleId FROM users WHERE id=? FOR UPDATE',[id],c);const type=await db.one('SELECT id,role_id AS roleId FROM professional_types WHERE id=?',[typeId],c);if(user.roleId!==type.roleId)v.invalid('El tipo debe corresponder al rol profesional de la cuenta.');
 const occupied=await db.rows("SELECT a.id FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id WHERE s.professional_user_id=? AND a.status NOT IN ('CANCELLED','COMPLETED') AND s.ends_at>UTC_TIMESTAMP()",[id],c);if(occupied.length)v.invalid('Reprogramá los turnos vigentes antes de cambiar el tipo profesional.');
 await c.execute('UPDATE users SET professional_type_id=? WHERE id=?',[typeId,id]);await c.execute('DELETE ps FROM professional_services ps JOIN client_services s ON s.id=ps.service_id WHERE ps.user_id=? AND s.professional_type_id<>?',[id,typeId]);return {saved:true};});}
