/** Una sola fuente de turnos, clínica, catálogo y reservas para todos los roles. */
import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import type { AuthUser } from '../types/auth';
import { readPermissions } from './authorization.repository';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { forbidden } from '../utils/admin-authorization';
import { assertTransition } from '../utils/clinic-rules';
import { petPhotoUrl } from '../services/pet-photo.service';
import { profilePhotoUrl } from '../services/pet-photo.service';
import * as v from '../validators/clinic.validator';
import { catalogName } from '../utils/catalog-presentation';
import { clientClinicalRecord } from '../utils/clinical-presentation';
export type Connection=Pick<PoolConnection,'execute'>;
export type SqlValue=string|number|boolean|null;
export type Data=Record<string,SqlValue>;
const utc=(value:unknown)=>value?String(value).replace(' ','T')+'Z':null;
export function map(row:RowDataPacket):Data {const result:Data={...row};for(const key of Object.keys(result)){if(key==='id'||key.endsWith('Id'))result[key]=result[key]===null?null:String(result[key]);if((key==='typeName'||key==='specialtyName')&&typeof result[key]==='string')result[key]=catalogName(result[key] as string);if(key==='specialties'&&typeof result[key]==='string')result[key]=(result[key] as string).split(' · ').map(catalogName).join(' · ');if(key.endsWith('At')||key==='validUntil')result[key]=utc(result[key]);}return result;}
export function permit(actor:AuthUser,...codes:string[]) {if(!codes.every(code=>actor.permissions?.includes(code)))forbidden();}
export async function transaction<T>(actor:AuthUser,operation:(c:PoolConnection,fresh:AuthUser)=>Promise<T>):Promise<T> {
 return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();try {await c.beginTransaction();
  const [users]=await c.execute<RowDataPacket[]>('SELECT u.is_active,u.email_verified_at,r.code AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[actor.id]);
  if(!users[0]?.is_active||!users[0].email_verified_at)forbidden();
  const fresh={...actor,role:users[0].role,permissions:(await readPermissions(actor.id,c)).filter(p=>p.effective).map(p=>p.code)};
  const result=await operation(c,fresh);await c.commit();return result;
 }catch(error){await c.rollback();throw error;}finally{c.release();}});
}
export async function rows(sql:string,args:unknown[]=[],c:Connection=databasePool):Promise<Data[]> {const [r]=await c.execute<RowDataPacket[]>(sql,args as SqlValue[]);return r.map(map);}
export async function one(sql:string,args:unknown[],c:Connection=databasePool) {const r=await rows(sql,args,c);if(!r[0])throw new AppError('NOT_FOUND',404,'Registro no encontrado.');return r[0];}
export async function notify(c:Connection,owner:unknown,title:string,content:string) {await c.execute('INSERT INTO client_notifications(owner_id,title,body) VALUES (?,?,?)',[String(owner),title,content] as SqlValue[]);}
export async function professionals(activeOnly=false) {const result=await rows(`SELECT u.id,CONCAT(u.first_name,' ',u.last_name) AS name,u.profile_photo_url AS profilePhotoUrl,u.created_at AS createdAt,u.is_active AS isActive,u.email_verified_at IS NOT NULL AS emailVerified,pt.id AS typeId,pt.name AS typeName,pt.is_clinical AS isClinical,v.id AS veterinarianId,(SELECT GROUP_CONCAT(sp.name ORDER BY sp.name SEPARATOR ' · ') FROM veterinarian_specialties vs JOIN specialties sp ON sp.id=vs.specialty_id WHERE vs.veterinarian_id=v.id AND sp.is_active=1) AS specialties FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) LEFT JOIN veterinarians v ON v.user_id=u.id ${activeOnly?'WHERE u.is_active=1 AND u.email_verified_at IS NOT NULL':''} ORDER BY u.created_at DESC,u.last_name,u.first_name`);return Promise.all(result.map(async person=>({...person,profilePhotoUrl:await profilePhotoUrl(person.profilePhotoUrl)})));}
export async function catalog(actor?:AuthUser) {
 const admin=actor&&['ADMIN','SUPER_ADMIN'].includes(actor.role);
 const presentNames=(items:Data[])=>items.map(item=>({...item,name:catalogName(String(item.name))}));
 return {types:presentNames(await rows('SELECT pt.id,pt.name,pt.role_id AS roleId,pt.is_clinical AS isClinical FROM professional_types pt ORDER BY pt.name')),
 services:await rows(`SELECT id,name,description,specialty_id AS specialtyId,professional_type_id AS typeId,duration_minutes AS durationMinutes,price_cents AS priceCents,requirements,is_active AS isActive FROM client_services ${admin?'':'WHERE is_active=1'} ORDER BY name`),
 specialties:presentNames(await rows(`SELECT id,name,is_active AS isActive FROM specialties ${admin?'':'WHERE is_active=1'} ORDER BY name`)),
 professionals:await professionals(!admin),assignments:await rows('SELECT user_id AS professionalId,service_id AS serviceId FROM professional_services'),
 categories:await rows(`SELECT id,name,is_active AS isActive FROM client_product_categories ${admin?'':'WHERE is_active=1'} ORDER BY name`),species:await rows('SELECT id,name FROM species ORDER BY name'),breeds:await rows('SELECT id,species_id AS speciesId,name FROM breeds ORDER BY name')};
}
const compatible=`JOIN users u ON u.id=s.professional_user_id JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) JOIN client_services sv ON sv.id=s.service_id
 JOIN professional_services ps ON ps.user_id=u.id AND ps.service_id=sv.id LEFT JOIN veterinarians vet ON vet.user_id=u.id
 WHERE u.is_active=1 AND u.email_verified_at IS NOT NULL AND s.is_active=1 AND sv.is_active=1 AND sv.professional_type_id=pt.id AND s.professional_type_id=pt.id
 AND (sv.specialty_id IS NULL OR EXISTS(SELECT 1 FROM veterinarian_specialties vs JOIN specialties sp ON sp.id=vs.specialty_id WHERE vs.veterinarian_id=vet.id AND vs.specialty_id=sv.specialty_id AND sp.is_active=1))
 AND NOT EXISTS(SELECT 1 FROM professional_blocks b WHERE b.user_id=u.id AND b.is_active=1 AND b.starts_at<s.ends_at AND b.ends_at>s.starts_at)`;
export async function slots(service:string,professional?:string,c:Connection=databasePool) {
 return rows(`SELECT s.id,s.service_id AS serviceId,s.professional_user_id AS professionalId,s.starts_at AS startsAt,s.ends_at AS endsAt,CONCAT(u.first_name,' ',u.last_name) AS veterinarian,s.professional_user_id AS veterinarianId FROM client_appointment_slots s ${compatible} AND s.service_id=? AND s.starts_at>UTC_TIMESTAMP()
 AND NOT EXISTS(SELECT 1 FROM client_appointments a JOIN client_appointment_slots occupied ON occupied.id=a.slot_id WHERE occupied.professional_user_id=u.id AND a.status<>'CANCELLED' AND occupied.starts_at<s.ends_at AND occupied.ends_at>s.starts_at) ${professional?'AND u.id=?':''} ORDER BY s.starts_at LIMIT 200`,professional?[service,professional]:[service],c);
}
/** Serializa por profesional y relee disponibilidad para impedir turnos solapados en solicitudes concurrentes. */
export async function requestAppointment(owner:string,petId:string,slotId:string) {
 const actor={id:owner} as AuthUser;
 return transaction(actor,async(c,fresh)=>{if(fresh.role!=='CLIENT')forbidden();
  await one('SELECT id FROM pets WHERE id=? AND owner_id=? AND is_active=1 FOR UPDATE',[petId,owner],c);
  const slot=await one('SELECT professional_user_id AS professionalId,service_id AS serviceId FROM client_appointment_slots WHERE id=?',[slotId],c);
  // Bloquear al profesional serializa reservas y cambios de disponibilidad de sus slots.
  await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[slot.professionalId]);
  const available=await slots(String(slot.serviceId),String(slot.professionalId),c);if(!available.some(s=>s.id===slotId))throw new AppError('SLOT_UNAVAILABLE',409,'El horario ya no está disponible.');
  await c.execute('INSERT INTO client_appointments(owner_id,pet_id,slot_id) VALUES (?,?,?)',[owner,petId,slotId]);
  await c.execute('INSERT IGNORE INTO veterinarian_patients(veterinarian_id,pet_id) SELECT id,? FROM veterinarians WHERE user_id=?',[petId,slot.professionalId]);
  return {requested:true};
 });
}
const appointmentSelect=`SELECT a.id,a.owner_id AS ownerId,a.pet_id AS petId,a.slot_id AS slotId,a.status,a.observations,a.cancellation_reason AS cancellationReason,p.name AS petName,p.photo_url AS petPhotoUrl,CONCAT(owner.first_name,' ',owner.last_name) AS ownerName,owner.phone AS ownerPhone,sv.name AS service,sv.id AS serviceId,pt.id AS typeId,pt.name AS typeName,s.professional_user_id AS professionalId,CONCAT(u.first_name,' ',u.last_name) AS veterinarian,s.starts_at AS startsAt,s.ends_at AS endsAt,(s.starts_at>UTC_TIMESTAMP() AND a.status NOT IN ('CANCELLED','COMPLETED')) AS isUpcoming FROM client_appointments a JOIN pets p ON p.id=a.pet_id JOIN client_appointment_slots s ON s.id=a.slot_id JOIN client_services sv ON sv.id=s.service_id JOIN users u ON u.id=s.professional_user_id JOIN professional_types pt ON pt.id=s.professional_type_id JOIN users owner ON owner.id=a.owner_id`;
export async function appointments(actor:AuthUser,query:Record<string,unknown>={}) {
 const params:unknown[]=[];const clauses:string[]=[];
 if(actor.role==='CLIENT'){clauses.push('a.owner_id=?');params.push(actor.id);}else if(!actor.permissions?.includes('appointments.view_all')){permit(actor,'appointments.view_own');clauses.push('s.professional_user_id=?');params.push(actor.id);}
 for(const [key,column] of Object.entries({id:'a.id',professionalId:'s.professional_user_id',serviceId:'sv.id',typeId:'pt.id',status:'a.status'})){if(query[key]){clauses.push(`${column}=?`);params.push(key==='status'?v.text(query[key],20):v.id(query[key]));}}
 if(query.search){const search=v.text(query.search,100)!;const searchOwner=actor.role==='VETERINARIAN'&&actor.permissions?.includes('users.view_basic');clauses.push(`(p.name LIKE ? OR sv.name LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?${searchOwner?' OR owner.first_name LIKE ? OR owner.last_name LIKE ?':''})`);params.push(...Array(searchOwner?6:4).fill(`%${search}%`));}
 if(query.date){const date=v.text(query.date,10)!;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))v.invalid();clauses.push("DATE(CONVERT_TZ(s.starts_at,'+00:00','-03:00'))=?");params.push(date);}
 for(const [key,operator] of [['fromDate','>=' ],['toDate','<=']] as const)if(query[key]){const date=v.text(query[key],10)!;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))v.invalid();clauses.push(`DATE(CONVERT_TZ(s.starts_at,'+00:00','-03:00'))${operator}?`);params.push(date);}
 const result=await rows(`${appointmentSelect} ${clauses.length?'WHERE '+clauses.join(' AND '):''} ORDER BY s.starts_at ${actor.role==='VETERINARIAN'?'ASC':'DESC'} LIMIT 201 OFFSET ${(v.queryPage(query)-1)*200}`,params);
 return await Promise.all(result.map(async appointment=>{
  const presented:Data={...appointment,petPhotoUrl:await petPhotoUrl(String(appointment.ownerId),appointment.petPhotoUrl)};
  // Las notas internas del turno nunca forman parte de la API consumida por CLIENT.
  if(actor.role==='CLIENT'){delete presented.observations;delete presented.ownerName;delete presented.ownerPhone;}
  if(actor.role==='VETERINARIAN')delete presented.observations;
  if(actor.role==='VETERINARIAN'&&!actor.permissions?.includes('users.view_basic')){delete presented.ownerName;delete presented.ownerPhone;}
  return presented;
 })) as Data[];
}
export async function changeAppointment(actor:AuthUser,id:string,value:unknown) {
 const body=v.body(value,['status','slotId','observations','cancellationReason']);return transaction(actor,async(c,fresh)=>{
  const a=await one(`${appointmentSelect} WHERE a.id=? FOR UPDATE`,[id],c);
  const manage=fresh.permissions?.includes('appointments.manage');
  if(!manage){permit(fresh,'appointments.update_own');if(a.professionalId!==fresh.id)forbidden();}
  if(fresh.role==='VETERINARIAN'&&body.observations!==undefined)forbidden();
  if(['COMPLETED','CANCELLED'].includes(String(a.status))&&(body.status!==undefined||body.slotId!==undefined))throw new AppError('INVALID_TRANSITION',409,'El turno se encuentra cerrado.');
  let slotId=String(a.slotId);let status=String(a.status);
  if(body.slotId!==undefined){if(!manage)forbidden();slotId=v.id(body.slotId);if(slotId!==a.slotId){const next=await one('SELECT service_id AS serviceId,professional_user_id AS professionalId FROM client_appointment_slots WHERE id=?',[slotId],c);if(next.serviceId!==a.serviceId)v.invalid('El nuevo horario debe corresponder al mismo servicio.');
   await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[next.professionalId]);const available=await slots(String(next.serviceId),String(next.professionalId),c);if(!available.some(s=>s.id===slotId))throw new AppError('SLOT_UNAVAILABLE',409,'El horario ya no está disponible.');
   await c.execute('INSERT IGNORE INTO veterinarian_patients(veterinarian_id,pet_id) SELECT id,? FROM veterinarians WHERE user_id=?',[a.petId,next.professionalId]);
  }}
  if(body.status!==undefined){status=v.text(body.status,20)!;if(!manage&&!['IN_PROGRESS','COMPLETED','CANCELLED'].includes(status))forbidden();assertTransition(String(a.status),status,'appointment');}
  const observations=body.observations===undefined?undefined:v.text(body.observations,5000,true);
  const cancellationReason=body.cancellationReason===undefined?undefined:v.text(body.cancellationReason,500,true);
  if(body.status==='CANCELLED'&&(!cancellationReason||cancellationReason.length<3))v.invalid('Ingresá el motivo de cancelación.');
  if(body.status!=='CANCELLED'&&cancellationReason!==undefined)v.invalid();
  if(slotId===a.slotId&&status===a.status&&observations===undefined)v.invalid('No hay cambios.');
  const assignments=['status=?','slot_id=?'];const values:unknown[]=[status,slotId];
  if(observations!==undefined){assignments.push('observations=?');values.push(observations);}
  if(cancellationReason!==undefined){assignments.push('cancellation_reason=?');values.push(cancellationReason);}
  await c.execute(`UPDATE client_appointments SET ${assignments.join(',')} WHERE id=?`,[...values,id] as SqlValue[]);
await notify(c,a.ownerId,body.status==='CANCELLED'?'Tu turno fue cancelado':'Tu turno fue actualizado',body.status==='CANCELLED'?`La clínica canceló el turno ${id}. Motivo: ${cancellationReason}`:`La clínica actualizó el turno ${id}. Consultá Turnos para ver el estado y horario.`);
  return {updated:true};
 });
}
export async function patientScope(actor:AuthUser,petId:string,c:Connection=databasePool) {
 if(actor.role!=='VETERINARIAN'&&!['ADMIN','SUPER_ADMIN'].includes(actor.role))forbidden();
 if(actor.permissions?.includes('pets.view_all'))return one('SELECT id,owner_id AS ownerId FROM pets WHERE id=?',[petId],c);
 permit(actor,'pets.view_assigned');return one('SELECT p.id,p.owner_id AS ownerId FROM pets p JOIN veterinarian_patients vp ON vp.pet_id=p.id JOIN veterinarians vt ON vt.id=vp.veterinarian_id WHERE p.id=? AND vt.user_id=?',[petId,actor.id],c);
}
export async function patients(actor:AuthUser,search='',sort='recent',speciesId?:string) {
 permit(actor,'pets.view_information');const all=actor.permissions?.includes('pets.view_all');if(!all)permit(actor,'pets.view_assigned');if(actor.role!=='VETERINARIAN'&&!['ADMIN','SUPER_ADMIN'].includes(actor.role))forbidden();
 if(!['recent','oldest','az','za','weight_high','weight_low','birth_recent','birth_oldest'].includes(sort))v.invalid('Criterio de orden no válido.');
 const owner=actor.permissions?.includes('users.view_basic');const params:unknown[]=[`%${search}%`];if(owner)params.push(`%${search}%`);if(speciesId)params.push(v.id(speciesId));if(!all)params.push(actor.id);
 const ordering:Record<string,string>={recent:'p.created_at DESC',oldest:'p.created_at ASC',az:'p.name ASC',za:'p.name DESC',weight_high:'d.weight_kg DESC,p.name ASC',weight_low:'d.weight_kg ASC,p.name ASC',birth_recent:'p.birth_date DESC,p.name ASC',birth_oldest:'p.birth_date ASC,p.name ASC'};
 const result=await rows(`SELECT p.id,p.owner_id AS ownerId,p.photo_url AS photoUrl,p.name,p.sex,p.created_at AS createdAt,p.birth_date AS birthDate,p.species_id AS speciesId,p.breed_id AS breedId,COALESCE(d.breed_name,b.name) AS breed,s.name AS species,d.weight_kg AS weightKg,
 (SELECT MAX(r.occurred_at) FROM client_clinical_records r WHERE r.pet_id=p.id AND r.kind='medical-history') AS lastConsultationAt,
 (SELECT MIN(appt.starts_at) FROM client_appointments appt JOIN client_appointment_slots slot ON slot.id=appt.slot_id WHERE appt.pet_id=p.id AND appt.status IN ('REQUESTED','CONFIRMED','IN_PROGRESS') AND slot.starts_at>=UTC_TIMESTAMP()) AS nextAppointmentAt ${owner?",CONCAT(u.first_name,' ',u.last_name) AS ownerName":''} FROM pets p JOIN users u ON u.id=p.owner_id JOIN species s ON s.id=p.species_id LEFT JOIN breeds b ON b.id=p.breed_id LEFT JOIN client_pet_details d ON d.pet_id=p.id WHERE p.is_active=1 AND (p.name LIKE ? ${owner?"OR CONCAT(u.first_name,' ',u.last_name) LIKE ?":''}) ${speciesId?'AND p.species_id=?':''} ${all?'':'AND EXISTS(SELECT 1 FROM veterinarian_patients vp JOIN veterinarians vt ON vt.id=vp.veterinarian_id WHERE vp.pet_id=p.id AND vt.user_id=?)'} ORDER BY ${ordering[sort]},p.id LIMIT 200`,params);
 return Promise.all(result.map(async pet=>{const ownerId=String(pet.ownerId);const visible={...pet};delete visible.ownerId;return {...visible,photoUrl:await petPhotoUrl(ownerId,pet.photoUrl)};}));
}
export async function clinical(actor:AuthUser,petId:string,kind:string) {
 const permissions:Record<string,string>={'medical-history':'medical_records.view',vaccines:'vaccines.view',prescriptions:'prescriptions.view',recommendations:'medical_records.view'};
 if(!permissions[kind])v.invalid();permit(actor,permissions[kind]);await patientScope(actor,petId);
 const result=await rows('SELECT r.id,r.pet_id AS petId,r.kind,r.title,r.content,r.occurred_at AS occurredAt,r.next_due_at AS nextDueAt,r.product_id AS productId,r.consultation_id AS consultationId,r.valid_until AS validUntil,r.reason,r.diagnosis,r.treatment,r.weight_kg AS weightKg,r.internal_notes AS internalNotes,r.appointment_id AS appointmentId,r.dose,r.frequency,r.duration,CONCAT(u.first_name,\' \',u.last_name) AS veterinarian FROM client_clinical_records r JOIN veterinarians vt ON vt.id=r.veterinarian_id JOIN users u ON u.id=vt.user_id WHERE r.pet_id=? AND r.kind=? ORDER BY r.occurred_at DESC',[petId,kind]);
 // Los informes del veterinario conservan el detalle profesional. El propietario recibe solo el contenido destinado a él.
 return ['VETERINARIAN','ADMIN','SUPER_ADMIN'].includes(actor.role)?result:result.map(clientClinicalRecord);
}
export async function saveClinical(actor:AuthUser,petId:string,kind:string,value:unknown) {
 const codes:Record<string,string>={'medical-history':'medical_records.create',vaccines:'vaccines.create',prescriptions:'prescriptions.create',recommendations:'recommendations.create'};if(!codes[kind])v.invalid();
 const body=v.body(value,['title','content','occurredAt','nextDueAt','productId','consultationId','validUntil','weightKg','reason','diagnosis','treatment','internalNotes','appointmentId','dose','frequency','duration']);
 const title=v.text(body.title,200)!,content=v.text(body.content,20000,true)??'',occurred=v.instant(body.occurredAt),next=body.nextDueAt?v.instant(body.nextDueAt):null;
 if(!content.trim()&&!String(body.internalNotes??'').trim()&&!String(body.reason??'').trim()&&!String(body.diagnosis??'').trim()&&!String(body.treatment??'').trim())v.invalid('Ingresá indicaciones o una observación clínica.');
 return transaction(actor,async(c,fresh)=>{if(fresh.role!=='VETERINARIAN')forbidden();permit(fresh,codes[kind]);await patientScope(fresh,petId,c);
  if(body.diagnosis)permit(fresh,'medical_records.diagnose');if(body.treatment)permit(fresh,'medical_records.treat');
  const productId=v.optionalId(body.productId),consultationId=v.optionalId(body.consultationId),validUntil=body.validUntil?v.instant(body.validUntil):null;
  if(kind!=='prescriptions'&&(productId||validUntil))v.invalid();if(validUntil&&validUntil<=occurred)v.invalid('El vencimiento debe ser posterior a la emisión.');
  if(productId)await one('SELECT id FROM client_products WHERE id=? AND is_active=1',[productId],c);
  if(consultationId)await one("SELECT id FROM client_clinical_records WHERE id=? AND pet_id=? AND kind='medical-history'",[consultationId,petId],c);
  const appointmentId=v.optionalId(body.appointmentId);
  if(appointmentId&&kind!=='medical-history')v.invalid('Solo una consulta puede vincularse directamente con un turno.');
  if(appointmentId){
   const linked=await one("SELECT a.id FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id WHERE a.id=? AND a.pet_id=? AND s.professional_user_id=? AND a.status<>'CANCELLED'",[appointmentId,petId,fresh.id],c);
   void linked;
   const [existing]=await c.execute<RowDataPacket[]>('SELECT id FROM client_clinical_records WHERE appointment_id=?',[appointmentId]);
   if(existing[0])return {created:false,recordId:String(existing[0].id)};
  }
  const vet=await one('SELECT id FROM veterinarians WHERE user_id=?',[fresh.id],c);
  const weight=body.weightKg===undefined||body.weightKg===null?null:Number(body.weightKg);if(weight!==null&&(!Number.isFinite(weight)||weight<=0||weight>9999.99))v.invalid();
  const internalNotes=v.text(body.internalNotes,20000,true);
  const dose=v.text(body.dose,255,true),frequency=v.text(body.frequency,255,true),duration=v.text(body.duration,255,true);
  if(kind!=='prescriptions'&&(dose||frequency||duration))v.invalid('Los datos de dosis solo corresponden a una receta.');
  await c.execute('INSERT INTO client_clinical_records(pet_id,veterinarian_id,kind,title,content,occurred_at,next_due_at,product_id,consultation_id,valid_until,weight_kg,reason,diagnosis,treatment,internal_notes,appointment_id,dose,frequency,duration) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[petId,vet.id,kind,title,content,occurred,next,productId,consultationId,validUntil,weight,v.text(body.reason,5000,true),v.text(body.diagnosis,5000,true),v.text(body.treatment,5000,true),internalNotes,appointmentId,dose,frequency,duration]);
  if(weight!==null)await c.execute('INSERT INTO client_pet_details(pet_id,weight_kg) VALUES (?,?) ON DUPLICATE KEY UPDATE weight_kg=?',[petId,weight,weight]);
  const [savedId]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
  await notify(c,(await patientScope(fresh,petId,c)).ownerId,'Nueva información de tu mascota','La clínica agregó un registro. Consultá la ficha de tu mascota.');return {created:true,recordId:String(savedId[0].id)};
 });
}
export async function clients(actor:AuthUser,search='') {
 const vet=actor.role==='VETERINARIAN';if(vet){permit(actor,'pets.view_information');if(!actor.permissions?.includes('pets.view_all'))permit(actor,'pets.view_assigned');}else permit(actor,'users.view_basic');
 const contact=!vet||actor.permissions?.includes('users.view_basic');
 return rows(`SELECT DISTINCT u.id,u.first_name AS firstName,u.last_name AS lastName${contact?',u.phone,u.email':''} FROM users u JOIN roles r ON r.id=u.role_id JOIN pets p ON p.owner_id=u.id AND p.is_active=1 ${vet?"LEFT JOIN veterinarian_patients vp ON vp.pet_id=p.id LEFT JOIN veterinarians vt ON vt.id=vp.veterinarian_id":""} WHERE r.code='CLIENT' AND (u.first_name LIKE ? OR u.last_name LIKE ?${contact?' OR u.email LIKE ':''}) ${vet&& !actor.permissions?.includes('pets.view_all')?'AND vt.user_id=?':''} ORDER BY u.last_name,u.first_name LIMIT 100`,contact?[`%${search}%`,`%${search}%`,`%${search}%`,...(vet&&!actor.permissions?.includes('pets.view_all')?[actor.id]:[])]:[`%${search}%`,`%${search}%`,...(vet&&!actor.permissions?.includes('pets.view_all')?[actor.id]:[])]);
}
export async function clientDetails(actor:AuthUser,id:string) {
 const vet=actor.role==='VETERINARIAN';if(vet){permit(actor,'pets.view_information');if(!actor.permissions?.includes('pets.view_all'))permit(actor,'pets.view_assigned');}else{permit(actor,'users.view_basic');permit(actor,'appointments.view_all');permit(actor,'reservations.view_all');}
 const contact=!vet||actor.permissions?.includes('users.view_basic');
 const client=await one(`SELECT u.id,u.first_name AS firstName,u.last_name AS lastName${contact?',u.phone,u.email':''} FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND r.code='CLIENT'`,[id]);
 const petRows=await rows(`SELECT p.id,p.name,p.photo_url AS photoUrl,p.owner_id AS ownerId FROM pets p WHERE p.owner_id=? AND p.is_active=1 ${vet&& !actor.permissions?.includes('pets.view_all')?'AND EXISTS(SELECT 1 FROM veterinarian_patients vp JOIN veterinarians vt ON vt.id=vp.veterinarian_id WHERE vp.pet_id=p.id AND vt.user_id=?)':''}`,[id,...(vet&&!actor.permissions?.includes('pets.view_all')?[actor.id]:[])]);
 if(vet&&!petRows.length)forbidden();
 const pets=await Promise.all(petRows.map(async pet=>({...pet,id:String(pet.id),photoUrl:await petPhotoUrl(id,pet.photoUrl)})));
 const appointmentRows=vet&&petRows.length?await rows(`${appointmentSelect} WHERE a.owner_id=? AND a.pet_id IN (${petRows.map(()=>'?').join(',')}) ORDER BY s.starts_at DESC LIMIT 100`,[id,...petRows.map(p=>p.id)]):vet?[]:await rows(`${appointmentSelect} WHERE a.owner_id=? ORDER BY s.starts_at DESC LIMIT 100`,[id]);
 return {client,pets,appointments:!contact&&vet?appointmentRows.map(item=>{const visible={...item};delete visible.ownerName;delete visible.ownerPhone;return visible;}):appointmentRows,reservations:vet?[]:await rows('SELECT id,status,created_at AS createdAt FROM client_orders WHERE owner_id=? ORDER BY id DESC LIMIT 100',[id])};
}
export async function home(actor:AuthUser) {
 const all=actor.permissions?.includes('appointments.view_all'),own=actor.permissions?.includes('appointments.view_own');
 let stats:Data|null=null,next:Data|null=null;
 if(all||own){const scope=all?'':' AND s.professional_user_id=?';const params=all?[]:[actor.id];
  stats=await one(`SELECT SUM(DATE(CONVERT_TZ(s.starts_at,'+00:00','-03:00'))=DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','-03:00'))) AS todayCount,SUM(a.status='REQUESTED') AS pendingCount FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id WHERE a.status<>'CANCELLED'${scope}`,params);
  // El resumen no depende de las columnas opcionales que usa el detalle (observations y cancellation_reason).
  const r=await rows(`SELECT p.name AS petName,sv.name AS service,s.starts_at AS startsAt FROM client_appointments a JOIN pets p ON p.id=a.pet_id JOIN client_appointment_slots s ON s.id=a.slot_id JOIN client_services sv ON sv.id=s.service_id WHERE a.status IN ('REQUESTED','CONFIRMED','IN_PROGRESS') AND s.ends_at>UTC_TIMESTAMP()${scope} ORDER BY s.starts_at LIMIT 1`,params);next=r[0]??null;
 }
 const clinicToday=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
 const todayAppointments=actor.role==='VETERINARIAN'&&(all||own)?await appointments(actor,{date:`${clinicToday.year}-${clinicToday.month}-${clinicToday.day}`}):undefined;
 return {nextAppointment:next,todayCount:stats?Number(stats.todayCount??0):null,pendingCount:stats?Number(stats.pendingCount??0):null,pendingReservations:actor.permissions?.includes('reservations.view_all')?Number((await one("SELECT COUNT(*) AS total FROM client_orders WHERE status='PLACED'",[])).total):null,...(todayAppointments?{todayAppointments}: {})};
}

export async function patient(actor:AuthUser,id:string) {permit(actor,'pets.view_information');const scope=await patientScope(actor,id);
 const owner=actor.permissions?.includes('users.view_basic');const result=await one(`SELECT p.id,p.name,p.sex,p.species_id AS speciesId,p.breed_id AS breedId,p.birth_date AS birthDate,p.microchip_number AS microchipNumber,p.photo_url AS photoUrl,s.name AS species,COALESCE(d.breed_name,b.name) AS breed,d.weight_kg AS weightKg,
 (SELECT MAX(r.occurred_at) FROM client_clinical_records r WHERE r.pet_id=p.id AND r.kind='medical-history') AS lastConsultationAt,
 (SELECT MIN(appt.starts_at) FROM client_appointments appt JOIN client_appointment_slots slot ON slot.id=appt.slot_id WHERE appt.pet_id=p.id AND appt.status IN ('REQUESTED','CONFIRMED','IN_PROGRESS') AND slot.starts_at>=UTC_TIMESTAMP()) AS nextAppointmentAt ${owner?",CONCAT(u.first_name,' ',u.last_name) AS ownerName,u.email AS ownerEmail,u.phone AS ownerPhone":''} FROM pets p JOIN species s ON s.id=p.species_id JOIN users u ON u.id=p.owner_id LEFT JOIN breeds b ON b.id=p.breed_id LEFT JOIN client_pet_details d ON d.pet_id=p.id WHERE p.id=?`,[id]);
 result.photoUrl=await petPhotoUrl(String(scope.ownerId),result.photoUrl);return result;
}
export async function updatePatient(actor:AuthUser,id:string,value:unknown) {
 const body=v.body(value,['name','sex','speciesId','breedId','birthDate','microchipNumber','weightKg']);
 const name=v.text(body.name,100)!,sex=v.text(body.sex,10)!;
 if(!['FEMALE','MALE','UNKNOWN'].includes(sex))v.invalid('Seleccioná el sexo de la mascota.');
 const speciesId=v.id(body.speciesId),breedId=v.optionalId(body.breedId),birthDate=v.text(body.birthDate,10,true),microchip=v.text(body.microchipNumber,32,true);
 if(birthDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)||!Number.isFinite(Date.parse(birthDate))||new Date(birthDate).toISOString().slice(0,10)!==birthDate||birthDate>new Date().toISOString().slice(0,10)))v.invalid('Revisá la fecha de nacimiento.');
 const weight=body.weightKg===null||body.weightKg===undefined||body.weightKg===''?null:Number(body.weightKg);
 if(weight!==null&&(!Number.isFinite(weight)||weight<=0||weight>9999.99||Math.abs(weight*100-Math.round(weight*100))>0.000001))v.invalid('Revisá el peso.');
 return transaction(actor,async(c,fresh)=>{
  permit(fresh,'pets.update');const scope=await patientScope(fresh,id,c);
  await c.execute('SELECT id FROM pets WHERE id=? AND is_active=1 FOR UPDATE',[id]);
  await one('SELECT id FROM species WHERE id=?',[speciesId],c);
  if(breedId)await one('SELECT id FROM breeds WHERE id=? AND species_id=?',[breedId,speciesId],c);
  await c.execute('UPDATE pets SET name=?,sex=?,species_id=?,breed_id=?,birth_date=?,microchip_number=? WHERE id=? AND owner_id=? AND is_active=1',[name,sex,speciesId,breedId,birthDate,microchip,id,scope.ownerId]);
  await c.execute('INSERT INTO client_pet_details(pet_id,weight_kg) VALUES (?,?) ON DUPLICATE KEY UPDATE weight_kg=?',[id,weight,weight]);
  return {updated:true};
 });
}
