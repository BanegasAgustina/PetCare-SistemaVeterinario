/** Integración MySQL real exclusivamente en una base *_test, siempre con rollback. */
import { test } from 'node:test';import assert from 'node:assert/strict';import { randomUUID,randomBytes } from 'node:crypto';import bcrypt from 'bcrypt';
import type { PoolConnection,RowDataPacket } from 'mysql2/promise';import { databasePool } from '../../src/config/database';import { env } from '../../src/config/env';import type { AuthUser,RoleCode } from '../../src/types/auth';
import * as clinic from '../../src/repositories/clinic.repository';import * as admin from '../../src/repositories/clinic-admin.repository';import * as reservations from '../../src/repositories/reservation.repository';import * as client from '../../src/repositories/client.repository';import { readPermissions } from '../../src/repositories/authorization.repository';
const enabled=process.env.CLINIC_DB_TESTS==='true'&&env.database.database.endsWith('_test');
test('Flujos A–F: cliente, secretaría, profesional, clínica, catálogo y reservas comparten MySQL',{skip:!enabled},async t=>{
 const c=await databasePool.getConnection();await c.beginTransaction();let savepoint=0;
 // Redirige las conexiones a una transacción real aislada. Commit de cada operación
 // libera su savepoint; el rollback exterior elimina todos los fixtures del test.
 const wrapped={execute:c.execute.bind(c),beginTransaction:async()=>{await c.query(`SAVEPOINT operation_${++savepoint}`);},commit:async()=>{await c.query(`RELEASE SAVEPOINT operation_${savepoint}`);},rollback:async()=>{await c.query(`ROLLBACK TO SAVEPOINT operation_${savepoint}`);},release:()=>undefined} as unknown as PoolConnection;
 const get=t.mock.method(databasePool,'getConnection',async()=>wrapped);const exec=t.mock.method(databasePool,'execute',c.execute.bind(c));
 const run=async(sql:string,args:unknown[]=[])=>c.execute<RowDataPacket[]>(sql,args as (string|number|boolean|null)[]);
 const insertId=async()=>String((await run('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id'))[0][0].id);
 const account=async(role:RoleCode)=>{const roles=(await run('SELECT id FROM roles WHERE code=?',[role]))[0];assert.ok(roles[0]);const email=`${randomUUID()}@example.invalid`;const hash=await bcrypt.hash(randomBytes(24).toString('hex'),4);await run('INSERT INTO users(role_id,email,password_hash,first_name,last_name,email_verified_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP())',[roles[0].id,email,hash,'Fixture','Integración']);const id=await insertId();return {id,role,email,firstName:'Fixture',lastName:'Integración',phone:null,permissions:(await readPermissions(id,wrapped)).filter(p=>p.effective).map(p=>p.code)} as AuthUser;};
 try{
  const superAdmin=await account('SUPER_ADMIN'),owner=await account('CLIENT'),secretary=await account('SECRETARY'),groomer=await account('GROOMER'),vet=await account('VETERINARIAN');
  await run('INSERT INTO veterinarians(user_id,license_number) VALUES (?,?)',[vet.id,randomUUID()]);
  // Grants de fixture solo dentro de la transacción del test.
  await run("INSERT INTO user_permissions(user_id,permission_id,allowed) SELECT ?,id,1 FROM permissions WHERE code IN ('pets.view_assigned','pets.view_information','medical_records.create','medical_records.view','medical_records.diagnose','medical_records.treat','prescriptions.create') ON DUPLICATE KEY UPDATE allowed=1",[vet.id]);vet.permissions=(await readPermissions(vet.id,wrapped)).filter(p=>p.effective).map(p=>p.code);
  await run('INSERT INTO species(code,name) VALUES (?,?)',[randomUUID().replaceAll('-','').toUpperCase(),'Especie fixture '+randomUUID()]);const speciesId=await insertId();
  await run('INSERT INTO pets(owner_id,name,species_id) VALUES (?,?,?)',[owner.id,'Mascota fixture',speciesId]);const petId=await insertId();
  const types=await clinic.rows('SELECT pt.id,r.code FROM professional_types pt JOIN roles r ON r.id=pt.role_id',[],wrapped);
  const future=new Date(Date.now()+86400000*10);future.setUTCMinutes(0,0,0);const start=future.toISOString(),end=new Date(future.getTime()+1800000).toISOString();
  const serviceIds:string[]=[];
  for(const professional of [groomer,vet]){
   const typeId=String(types.find(type=>type.code===professional.role)!.id);await admin.save(superAdmin,'services',undefined,{name:'Servicio fixture '+randomUUID(),typeId,durationMinutes:30,isActive:true});const serviceId=await insertId();serviceIds.push(serviceId);
   await admin.assignServices(superAdmin,professional.id,{serviceIds:[serviceId]});await admin.saveAvailability(superAdmin,{professionalId:professional.id,serviceId,startsAt:start,endsAt:end});
   const slots=await clinic.slots(serviceId,professional.id);assert.equal(slots.length,1);await clinic.requestAppointment(owner.id,petId,String(slots[0].id));const appointments=await clinic.appointments(secretary,{serviceId});assert.equal(appointments.length,1);const appointmentId=String(appointments[0].id);
   assert.equal((await clinic.appointments(professional)).some(a=>a.id===appointmentId),true);
   await assert.rejects(clinic.requestAppointment(owner.id,petId,String(slots[0].id)),{code:'SLOT_UNAVAILABLE'});
   await clinic.changeAppointment(secretary,appointmentId,{status:'CONFIRMED'});assert.equal((await client.appointments(owner.id)).find(a=>a.id===appointmentId)?.status,'CONFIRMED');
   await clinic.changeAppointment(professional,appointmentId,{status:'IN_PROGRESS'});await clinic.changeAppointment(professional,appointmentId,{status:'COMPLETED'});assert.equal((await clinic.appointments(secretary,{id:appointmentId}))[0].status,'COMPLETED');
  }
  await clinic.saveClinical(vet,petId,'medical-history',{title:'Consulta fixture',content:'Información exclusiva de test',reason:'Motivo fixture',diagnosis:'Diagnóstico fixture',treatment:'Tratamiento fixture',occurredAt:new Date().toISOString()});assert.equal((await client.clinical(owner.id,'medical-history',petId)).length,1);await assert.rejects(clinic.saveClinical(groomer,petId,'prescriptions',{title:'Fixture',content:'Fixture',occurredAt:start}),{status:403});
  await admin.save(superAdmin,'services',serviceIds[0],{isActive:false});assert.equal((await client.appointmentCatalog()).services.some(s=>s.id===serviceIds[0]),false);
  await admin.save(superAdmin,'categories',undefined,{name:'Categoría fixture '+randomUUID(),isActive:true});const categoryId=await insertId();await admin.save(superAdmin,'products',undefined,{name:'Producto fixture '+randomUUID(),priceCents:100,stock:3,categoryId,isActive:true});const productId=await insertId();assert.equal((await client.products()).some(p=>p.id===productId),true);
  const reservation=await reservations.create(owner,{productId,quantity:2,requestKey:randomUUID()});assert.equal(Number((await client.product(productId)).stock),1);assert.equal((await reservations.list(secretary)).some(r=>r.id===reservation.id),true);await assert.rejects(reservations.create(owner,{productId,quantity:2,requestKey:randomUUID()}),{code:'STOCK_UNAVAILABLE'});
  await assert.rejects(admin.save(superAdmin,'products',productId,{stock:1}),{code:'VALIDATION_ERROR'});
  for(const status of ['CONFIRMED','PROCESSING','READY'])await reservations.change(secretary,String(reservation.id),{status});assert.equal((await reservations.detail(owner,String(reservation.id))).status,'READY');await reservations.change(secretary,String(reservation.id),{status:'COMPLETED'});assert.equal(Number((await client.product(productId)).stock),1);
  const cancelled=await reservations.create(owner,{productId,quantity:1,requestKey:randomUUID()});await reservations.change(secretary,String(cancelled.id),{status:'CANCELLED'});assert.equal(Number((await client.product(productId)).stock),1);await assert.rejects(reservations.change(secretary,String(cancelled.id),{status:'CANCELLED'}),{code:'INVALID_TRANSITION'});
  await admin.save(superAdmin,'products',productId,{requiresPrescription:true});await assert.rejects(reservations.create(owner,{productId,quantity:1,petId,requestKey:randomUUID()}),{code:'PRESCRIPTION_REQUIRED'});
  await clinic.saveClinical(vet,petId,'prescriptions',{title:'Receta fixture',content:'Indicación exclusiva de test',productId,occurredAt:new Date().toISOString(),validUntil:end});const prescriptions=await client.clinical(owner.id,'prescriptions',petId);assert.equal(prescriptions[0].productId,productId);const rx=await reservations.create(owner,{productId,quantity:1,petId,prescriptionId:prescriptions[0].id,requestKey:randomUUID()});assert.ok(rx.id);
  assert.ok((await client.notifications(owner.id)).length>0);
 }finally{get.mock.restore();exec.mock.restore();await c.rollback();c.release();await databasePool.end();}
});
