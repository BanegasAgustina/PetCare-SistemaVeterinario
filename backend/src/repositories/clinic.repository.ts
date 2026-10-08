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
import * as v from '../validators/clinic.validator';
export type Connection=Pick<PoolConnection,'execute'>;
export type SqlValue=string|number|boolean|null;
export type Data=Record<string,SqlValue>;
const utc=(value:unknown)=>value?String(value).replace(' ','T')+'Z':null;
export function map(row:RowDataPacket):Data {const result:Data={...row};for(const key of Object.keys(result)){if(key==='id'||key.endsWith('Id'))result[key]=result[key]===null?null:String(result[key]);if(key.endsWith('At')||key==='validUntil')result[key]=utc(result[key]);}return result;}
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
export async function notify(c:Connection,owner:unknown,title:string,content:string) {await c.execute('INSERT INTO client_notifications(owner_id,title,body) VALUES (?,?,?)',[String(owner),title,content]);}
export async function professionals(activeOnly=false) {return rows(`SELECT u.id,CONCAT(u.first_name,' ',u.last_name) AS name,u.is_active AS isActive,u.email_verified_at IS NOT NULL AS emailVerified,pt.id AS typeId,pt.name AS typeName,pt.is_clinical AS isClinical,v.id AS veterinarianId FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) LEFT JOIN veterinarians v ON v.user_id=u.id ${activeOnly?'WHERE u.is_active=1 AND u.email_verified_at IS NOT NULL':''} ORDER BY u.last_name,u.first_name`);}
export async function catalog(actor?:AuthUser) {
 const admin=actor&&['ADMIN','SUPER_ADMIN'].includes(actor.role);
 return {types:await rows('SELECT pt.id,pt.name,pt.role_id AS roleId,pt.is_clinical AS isClinical FROM professional_types pt ORDER BY pt.name'),
 services:await rows(`SELECT id,name,description,specialty_id AS specialtyId,professional_type_id AS typeId,duration_minutes AS durationMinutes,price_cents AS priceCents,requirements,is_active AS isActive FROM client_services ${admin?'':'WHERE is_active=1'} ORDER BY name`),
 specialties:await rows(`SELECT id,name,is_active AS isActive FROM specialties ${admin?'':'WHERE is_active=1'} ORDER BY name`),
 professionals:await professionals(!admin),assignments:await rows('SELECT user_id AS professionalId,service_id AS serviceId FROM professional_services'),
 categories:await rows(`SELECT id,name,is_active AS isActive FROM client_product_categories ${admin?'':'WHERE is_active=1'} ORDER BY name`),species:await rows('SELECT id,name FROM species ORDER BY name')};
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
const appointmentSelect=`SELECT a.id,a.owner_id AS ownerId,a.pet_id AS petId,a.slot_id AS slotId,a.status,p.name AS petName,sv.name AS service,sv.id AS serviceId,pt.id AS typeId,pt.name AS typeName,s.professional_user_id AS professionalId,CONCAT(u.first_name,' ',u.last_name) AS veterinarian,s.starts_at AS startsAt,s.ends_at AS endsAt,(s.starts_at>UTC_TIMESTAMP() AND a.status NOT IN ('CANCELLED','COMPLETED')) AS isUpcoming FROM client_appointments a JOIN pets p ON p.id=a.pet_id JOIN client_appointment_slots s ON s.id=a.slot_id JOIN client_services sv ON sv.id=s.service_id JOIN users u ON u.id=s.professional_user_id JOIN professional_types pt ON pt.id=s.professional_type_id`;
export async function appointments(actor:AuthUser,query:Record<string,unknown>={}) {
 const params:unknown[]=[];const clauses:string[]=[];
 if(actor.role==='CLIENT'){clauses.push('a.owner_id=?');params.push(actor.id);}else if(!actor.permissions?.includes('appointments.view_all')){permit(actor,'appointments.view_own');clauses.push('s.professional_user_id=?');params.push(actor.id);}
 for(const [key,column] of Object.entries({id:'a.id',professionalId:'s.professional_user_id',serviceId:'sv.id',typeId:'pt.id',status:'a.status'})){if(query[key]){clauses.push(`${column}=?`);params.push(key==='status'?v.text(query[key],20):v.id(query[key]));}}
 if(query.date){const date=v.text(query.date,10)!;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))v.invalid();clauses.push("DATE(CONVERT_TZ(s.starts_at,'+00:00','-03:00'))=?");params.push(date);}
 return rows(`${appointmentSelect} ${clauses.length?'WHERE '+clauses.join(' AND '):''} ORDER BY s.starts_at DESC LIMIT 200 OFFSET ${(v.queryPage(query)-1)*200}`,params);
}
export async function changeAppointment(actor:AuthUser,id:string,value:unknown) {
 const body=v.body(value,['status','slotId']);return transaction(actor,async(c,fresh)=>{
  const a=await one(`${appointmentSelect} WHERE a.id=? FOR UPDATE`,[id],c);
  const manage=fresh.permissions?.includes('appointments.manage');
  if(!manage){permit(fresh,'appointments.update_own');if(a.professionalId!==fresh.id)forbidden();}
  if(['COMPLETED','CANCELLED'].includes(String(a.status)))throw new AppError('INVALID_TRANSITION',409,'El turno está cerrado.');
  let slotId=String(a.slotId);let status=String(a.status);
  if(body.slotId!==undefined){if(!manage)forbidden();slotId=v.id(body.slotId);if(slotId!==a.slotId){const next=await one('SELECT service_id AS serviceId,professional_user_id AS professionalId FROM client_appointment_slots WHERE id=?',[slotId],c);if(next.serviceId!==a.serviceId)v.invalid('El nuevo horario debe corresponder al mismo servicio.');
   await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[next.professionalId]);const available=await slots(String(next.serviceId),String(next.professionalId),c);if(!available.some(s=>s.id===slotId))throw new AppError('SLOT_UNAVAILABLE',409,'El horario ya no está disponible.');
   await c.execute('INSERT IGNORE INTO veterinarian_patients(veterinarian_id,pet_id) SELECT id,? FROM veterinarians WHERE user_id=?',[a.petId,next.professionalId]);
  }}
  if(body.status!==undefined){status=v.text(body.status,20)!;if(!manage&&!['IN_PROGRESS','COMPLETED','CANCELLED'].includes(status))forbidden();assertTransition(String(a.status),status,'appointment');}
  if(slotId===a.slotId&&status===a.status)v.invalid('No hay cambios.');
  await c.execute('UPDATE client_appointments SET status=?,slot_id=? WHERE id=?',[status,slotId,id]);
  await notify(c,a.ownerId,'Tu turno fue actualizado',`La clínica actualizó el turno ${id}. Consultá Turnos para ver el estado y horario.`);
  return {updated:true};
 });
}
export async function patientScope(actor:AuthUser,petId:string,c:Connection=databasePool) {
 if(actor.role!=='VETERINARIAN'&&!['ADMIN','SUPER_ADMIN'].includes(actor.role))forbidden();
 if(actor.permissions?.includes('pets.view_all'))return one('SELECT id,owner_id AS ownerId FROM pets WHERE id=?',[petId],c);
 permit(actor,'pets.view_assigned');return one('SELECT p.id,p.owner_id AS ownerId FROM pets p JOIN veterinarian_patients vp ON vp.pet_id=p.id JOIN veterinarians vt ON vt.id=vp.veterinarian_id WHERE p.id=? AND vt.user_id=?',[petId,actor.id],c);
}
export async function patients(actor:AuthUser,search='') {
 permit(actor,'pets.view_information');const all=actor.permissions?.includes('pets.view_all');if(!all)permit(actor,'pets.view_assigned');if(actor.role!=='VETERINARIAN'&&!['ADMIN','SUPER_ADMIN'].includes(actor.role))forbidden();
 const owner=actor.permissions?.includes('users.view_basic');const params:unknown[]=[`%${search}%`];if(owner)params.push(`%${search}%`);if(!all)params.push(actor.id);
 return rows(`SELECT p.id,p.name,p.birth_date AS birthDate,s.name AS species,d.weight_kg AS weightKg ${owner?",CONCAT(u.first_name,' ',u.last_name) AS ownerName":''} FROM pets p JOIN users u ON u.id=p.owner_id JOIN species s ON s.id=p.species_id LEFT JOIN client_pet_details d ON d.pet_id=p.id WHERE p.is_active=1 AND (p.name LIKE ? ${owner?"OR CONCAT(u.first_name,' ',u.last_name) LIKE ?":''}) ${all?'':'AND EXISTS(SELECT 1 FROM veterinarian_patients vp JOIN veterinarians vt ON vt.id=vp.veterinarian_id WHERE vp.pet_id=p.id AND vt.user_id=?)'} ORDER BY p.name LIMIT 200`,params);
}
export async function clinical(actor:AuthUser,petId:string,kind:string) {
 const permissions:Record<string,string>={'medical-history':'medical_records.view',vaccines:'vaccines.view',prescriptions:'prescriptions.view',recommendations:'medical_records.view'};
 if(!permissions[kind])v.invalid();permit(actor,permissions[kind]);await patientScope(actor,petId);
 return rows('SELECT r.id,r.pet_id AS petId,r.kind,r.title,r.content,r.occurred_at AS occurredAt,r.next_due_at AS nextDueAt,r.product_id AS productId,r.consultation_id AS consultationId,r.valid_until AS validUntil,r.reason,r.diagnosis,r.treatment,r.weight_kg AS weightKg,CONCAT(u.first_name,\' \',u.last_name) AS veterinarian FROM client_clinical_records r JOIN veterinarians vt ON vt.id=r.veterinarian_id JOIN users u ON u.id=vt.user_id WHERE r.pet_id=? AND r.kind=? ORDER BY r.occurred_at DESC',[petId,kind]);
}
export async function saveClinical(actor:AuthUser,petId:string,kind:string,value:unknown) {
 const codes:Record<string,string>={'medical-history':'medical_records.create',vaccines:'vaccines.create',prescriptions:'prescriptions.create',recommendations:'recommendations.create'};if(!codes[kind])v.invalid();
 const body=v.body(value,['title','content','occurredAt','nextDueAt','productId','consultationId','validUntil','weightKg','reason','diagnosis','treatment']);
 const title=v.text(body.title,200)!,content=v.text(body.content,20000)!,occurred=v.instant(body.occurredAt),next=body.nextDueAt?v.instant(body.nextDueAt):null;
 return transaction(actor,async(c,fresh)=>{if(fresh.role!=='VETERINARIAN')forbidden();permit(fresh,codes[kind]);await patientScope(fresh,petId,c);
  if(body.diagnosis)permit(fresh,'medical_records.diagnose');if(body.treatment)permit(fresh,'medical_records.treat');
  const productId=v.optionalId(body.productId),consultationId=v.optionalId(body.consultationId),validUntil=body.validUntil?v.instant(body.validUntil):null;
  if(kind!=='prescriptions'&&(productId||validUntil))v.invalid();if(validUntil&&validUntil<=occurred)v.invalid('El vencimiento debe ser posterior a la emisión.');
  if(productId)await one('SELECT id FROM client_products WHERE id=? AND is_active=1',[productId],c);
  if(consultationId)await one("SELECT id FROM client_clinical_records WHERE id=? AND pet_id=? AND kind='medical-history'",[consultationId,petId],c);
  const vet=await one('SELECT id FROM veterinarians WHERE user_id=?',[fresh.id],c);
  const weight=body.weightKg===undefined||body.weightKg===null?null:Number(body.weightKg);if(weight!==null&&(!Number.isFinite(weight)||weight<=0||weight>9999.99))v.invalid();
  await c.execute('INSERT INTO client_clinical_records(pet_id,veterinarian_id,kind,title,content,occurred_at,next_due_at,product_id,consultation_id,valid_until,weight_kg,reason,diagnosis,treatment) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[petId,vet.id,kind,title,content,occurred,next,productId,consultationId,validUntil,weight,v.text(body.reason,5000,true),v.text(body.diagnosis,5000,true),v.text(body.treatment,5000,true)]);
  if(weight!==null)await c.execute('INSERT INTO client_pet_details(pet_id,weight_kg) VALUES (?,?) ON DUPLICATE KEY UPDATE weight_kg=?',[petId,weight,weight]);
  await notify(c,(await patientScope(fresh,petId,c)).ownerId,'Nueva información de tu mascota','La clínica agregó un registro. Consultá la ficha de tu mascota.');return {created:true};
 });
}
export async function clients(actor:AuthUser,search='') {permit(actor,'users.view_basic');return rows("SELECT u.id,u.first_name AS firstName,u.last_name AS lastName,u.phone,u.email FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='CLIENT' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?) ORDER BY u.last_name LIMIT 100",[`%${search}%`,`%${search}%`,`%${search}%`]);}
export async function clientDetails(actor:AuthUser,id:string) {permit(actor,'users.view_basic');const client=await one("SELECT u.id,u.first_name AS firstName,u.last_name AS lastName,u.phone,u.email FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND r.code='CLIENT'",[id]);return {client,pets:await rows('SELECT id,name FROM pets WHERE owner_id=?',[id]),appointments:await rows(`${appointmentSelect} WHERE a.owner_id=? ORDER BY s.starts_at DESC LIMIT 100`,[id]),reservations:await rows('SELECT id,status,created_at AS createdAt FROM client_orders WHERE owner_id=? ORDER BY id DESC LIMIT 100',[id])};}
export async function home(actor:AuthUser) {
 const all=actor.permissions?.includes('appointments.view_all'),own=actor.permissions?.includes('appointments.view_own');
 let stats:Data|null=null,next:Data|null=null;
 if(all||own){const scope=all?'':' AND s.professional_user_id=?';const params=all?[]:[actor.id];
  stats=await one(`SELECT SUM(DATE(CONVERT_TZ(s.starts_at,'+00:00','-03:00'))=DATE(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','-03:00'))) AS todayCount,SUM(a.status='REQUESTED') AS pendingCount FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id WHERE a.status<>'CANCELLED'${scope}`,params);
  const r=await rows(`${appointmentSelect} WHERE a.status IN ('REQUESTED','CONFIRMED','IN_PROGRESS') AND s.ends_at>UTC_TIMESTAMP()${scope} ORDER BY s.starts_at LIMIT 1`,params);next=r[0]??null;
 }
 return {nextAppointment:next,todayCount:stats?Number(stats.todayCount??0):null,pendingCount:stats?Number(stats.pendingCount??0):null,pendingReservations:actor.permissions?.includes('reservations.view_all')?Number((await one("SELECT COUNT(*) AS total FROM client_orders WHERE status='PLACED'",[])).total):null};
}

export async function patient(actor:AuthUser,id:string) {permit(actor,'pets.view_information');const scope=await patientScope(actor,id);
 const owner=actor.permissions?.includes('users.view_basic');const result=await one(`SELECT p.id,p.name,p.birth_date AS birthDate,p.microchip_number AS microchipNumber,s.name AS species,COALESCE(d.breed_name,b.name) AS breed,d.weight_kg AS weightKg,d.photo_url AS photoUrl ${owner?",CONCAT(u.first_name,' ',u.last_name) AS ownerName":''} FROM pets p JOIN species s ON s.id=p.species_id JOIN users u ON u.id=p.owner_id LEFT JOIN breeds b ON b.id=p.breed_id LEFT JOIN client_pet_details d ON d.pet_id=p.id WHERE p.id=?`,[id]);
 result.photoUrl=await petPhotoUrl(String(scope.ownerId),result.photoUrl);return result;
}
