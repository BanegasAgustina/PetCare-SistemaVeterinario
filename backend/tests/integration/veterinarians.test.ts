/** HTTP + MySQL real en base _test: invitación, transacciones, permisos y preservación histórica. */
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {test} from 'node:test';
import bcrypt from 'bcrypt';
import type {RowDataPacket} from 'mysql2/promise';
import type {Request,Response} from 'express';
import {app} from '../../src/app';
import {env} from '../../src/config/env';
import {databasePool} from '../../src/config/database';
import {createDatabase} from '../../src/database/create-database';
import {runMigrations} from '../../src/database/migration-runner';
import {runSeeds} from '../../src/database/seed-runner';
import {createAccessToken} from '../../src/services/token.service';
import {requirePatientScope} from '../../src/middlewares/permission.middleware';
import {startTestSmtp} from '../helpers/smtp';

test('gestión veterinaria y autorización con MySQL 8',async suite=>{
  assert.equal(env.nodeEnvironment,'test');assert.ok(env.database.database.endsWith('_test'));
  assert.ok(['127.0.0.1','localhost','::1'].includes(env.database.host));
  process.env.JWT_ACCESS_SECRET=randomBytes(48).toString('hex');process.env.EMAIL_CODE_SECRET=randomBytes(48).toString('hex');
  const smtp=await startTestSmtp();
  Object.assign(process.env,{SMTP_HOST:'127.0.0.1',SMTP_PORT:String(smtp.port),SMTP_SECURE:'false',SMTP_REQUIRE_TLS:'false',SMTP_USER:'',SMTP_PASSWORD:'',MAIL_FROM:'petcare@example.com',VETERINARIAN_INVITATION_URL:'http://localhost:8081/activate-vet'});
  const userIds:string[]=[];const vetIds:string[]=[];let petId='';let server:ReturnType<typeof app.listen>|undefined;
  const email=`vet-${randomUUID()}@example.com`;const password='Segura!123';let id='';let userId='';let token='';let invite='';
  try {
    await createDatabase();await runMigrations();await runSeeds();
    const hash=await bcrypt.hash(password,10);
    async function fixture(role:string) {
      const connection=await databasePool.getConnection();
      try {
        await connection.execute(`INSERT INTO users (role_id,email,password_hash,first_name,last_name,email_verified_at)
          SELECT id,?,?,'Prueba','Temporal',UTC_TIMESTAMP(3) FROM roles WHERE code=?`,[`${role.toLowerCase()}-${randomUUID()}@example.com`,hash,role]);
        const [rows]=await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');userIds.push(rows[0].id as string);
        return {id:rows[0].id as string,token:createAccessToken(rows[0].id as string).accessToken};
      } finally {connection.release();}
    }
    const admin=await fixture('SUPER_ADMIN');const client=await fixture('CLIENT');const ordinaryAdmin=await fixture('ADMIN');
    server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');
    const base=`http://127.0.0.1:${address.port}/api`;
    async function call(path:string,method='GET',body?:unknown,bearer=admin.token) {
      const response=await fetch(`${base}${path}`,{method,headers:{'Content-Type':'application/json',...(bearer?{Authorization:`Bearer ${bearer}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
      const result=await response.json();assert.ok(!JSON.stringify(result).includes('password_hash'));assert.ok(!JSON.stringify(result).includes(password));
      return {status:response.status,body:result};
    }
    const catalog=await call('/admin/veterinarians/catalog');assert.equal(catalog.status,200);
    const specialtyId=catalog.body.data.specialties[0].id as string;
    const input={firstName:'Ana',lastName:'Prueba',email,phone:'+541112345678',licenseNumber:`MP-${randomUUID()}`,isActive:true,specialtyIds:[specialtyId],overrides:[]};
    await suite.test('clientes y ADMIN no pueden gestionar ni obtener el catálogo crítico',async()=>{
      for(const account of [client,ordinaryAdmin]) assert.equal((await call('/admin/veterinarians','POST',input,account.token)).status,403);
      assert.equal((await call('/admin/veterinarians/catalog','GET',undefined,client.token)).status,403);
    });
    await suite.test('rol forzado, perfil y especialidades reales; no filtra token ni hash',async()=>{
      assert.equal((await call('/admin/veterinarians','POST',{...input,role:'SUPER_ADMIN'})).status,400);
      const created=await call('/admin/veterinarians','POST',input);assert.equal(created.status,201);assert.equal(created.body.data.delivery,'sent');
      const vet=created.body.data.veterinarian;id=vet.id;userId=vet.userId;vetIds.push(id);userIds.push(userId);
      assert.equal(vet.specialties[0].id,specialtyId);assert.equal(vet.emailVerified,false);
      invite=smtp.messages.find(message=>message.to===email)?.invitationToken??'';assert.equal(invite.length,64);
      assert.ok(!JSON.stringify(created.body).includes(invite));
      const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT r.code,i.token_hash,u.password_hash FROM users u JOIN roles r ON r.id=u.role_id
        JOIN veterinarian_invitations i ON i.user_id=u.id WHERE u.id=?`,[userId]);
      assert.equal(rows[0].code,'VETERINARIAN');assert.notEqual(rows[0].token_hash,invite);assert.equal(await bcrypt.compare(password,rows[0].password_hash),false);
    });
    await suite.test('invitar tiene cooldown, expiración y consumo concurrente de un solo uso',async()=>{
      assert.equal((await call(`/admin/veterinarians/${id}/invitation`,'POST')).status,429);
      await databasePool.execute('UPDATE veterinarian_invitations SET expires_at=TIMESTAMPADD(SECOND,-1,UTC_TIMESTAMP(3)) WHERE user_id=?',[userId]);
      assert.equal((await call('/auth/veterinarian-invitations/accept','POST',{token:invite,password},'')).status,400);
      await databasePool.execute('UPDATE veterinarian_invitations SET expires_at=TIMESTAMPADD(HOUR,1,UTC_TIMESTAMP(3)) WHERE user_id=?',[userId]);
      const results=await Promise.all([call('/auth/veterinarian-invitations/accept','POST',{token:invite,password},''),call('/auth/veterinarian-invitations/accept','POST',{token:invite,password},'')]);
      assert.deepEqual(results.map(result=>result.status).sort(),[200,400]);
      const login=await call('/auth/login','POST',{email,password},'');assert.equal(login.status,200);token=login.body.data.accessToken;
      assert.equal(login.body.data.user.role,'VETERINARIAN');assert.ok(login.body.data.user.permissions.includes('pets.view_assigned'));
    });
    await suite.test('permisos denegados/grant aparecen en /me y módulos con el mismo JWT',async()=>{
      const permissions=catalog.body.data.permissions.filter((p:{module:string})=>p.module==='vaccines'||p.module==='prescriptions').map((p:{code:string})=>({code:p.code,allowed:false}));
      permissions.push({code:'appointments.view_all',allowed:true});
      assert.equal((await call(`/admin/veterinarians/${id}/permissions`,'PUT',{overrides:permissions})).status,200);
      const me=await call('/auth/me','GET',undefined,token);assert.equal(me.status,200);assert.ok(!me.body.data.user.permissions.includes('vaccines.view'));assert.ok(me.body.data.user.permissions.includes('appointments.view_all'));
      const home=await call('/vet/home','GET',undefined,token);assert.equal(home.status,200);assert.ok(!home.body.data.modules.some((m:{code:string})=>m.code==='vaccines'));
      assert.equal((await call('/vet/modules/vaccines','GET',undefined,token)).status,403);
      assert.equal((await call('/vet/modules/appointments','GET',undefined,token)).status,200);
      assert.equal((await call('/vet/modules/administration','GET',undefined,token)).status,403);
      assert.equal((await call(`/admin/veterinarians/${id}/permissions`,'PUT',{overrides:[]},token)).status,403);
      assert.equal((await call(`/admin/veterinarians/${id}/permissions`,'PUT',{overrides:[{code:'permissions.manage',allowed:true}]})).status,400);
      assert.equal((await call(`/admin/veterinarians/${id}/permissions`,'PUT',{overrides:[{code:'unknown.permission',allowed:true}]})).status,400);
      // Defensa ante una carga SQL equivocada fuera de la API: el permiso crítico tampoco es efectivo.
      await databasePool.execute("INSERT INTO user_permissions (user_id,permission_id,allowed) SELECT ?,id,1 FROM permissions WHERE code='permissions.manage'",[userId]);
      assert.ok(!(await call('/auth/me','GET',undefined,token)).body.data.user.permissions.includes('permissions.manage'));
      // Ausencia de override restaura herencia.
      assert.equal((await call(`/admin/veterinarians/${id}/permissions`,'PUT',{overrides:[]})).status,200);
      assert.equal((await call('/vet/modules/vaccines','GET',undefined,token)).status,200);
    });
    await suite.test('listado filtra MySQL, edición valida especialidades y hace rollback completo',async()=>{
      const list=await call(`/admin/veterinarians?search=${encodeURIComponent(input.licenseNumber)}&status=active&specialtyId=${specialtyId}&order=desc&page=1`);
      assert.equal(list.body.data.items[0].id,id);assert.equal(list.body.data.pageSize,20);
      const invalid=await call(`/admin/veterinarians/${id}`,'PUT',{...input,firstName:'Cambio',specialtyIds:['4294967295']});assert.equal(invalid.status,400);
      const detail=await call(`/admin/veterinarians/${id}`);assert.equal(detail.body.data.firstName,'Ana');
      assert.equal((await call(`/admin/veterinarians/${id}`,'PUT',{...input,phone:'+541198765432'})).status,200);
      const duplicate=await call('/admin/veterinarians','POST',input);assert.equal(duplicate.status,409);
    });
    await suite.test('scope del paciente asignado se verifica con la identidad del JWT',async()=>{
      const connection=await databasePool.getConnection();
      try {
        await connection.execute("INSERT INTO pets (owner_id,name,species_id) SELECT ?,'Paciente temporal',id FROM species WHERE code='DOG'",[client.id]);
        const [rows]=await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');petId=rows[0].id as string;
      } finally {connection.release();}
      async function scope(permissions:string[]) {
        return new Promise<unknown>((resolve,reject)=>{try {const result=requirePatientScope()({params:{petId}} as unknown as Request,{locals:{authenticatedUser:{id:userId,role:'VETERINARIAN',permissions}}} as unknown as Response,error=>resolve(error));if(result instanceof Promise)void result.catch(reject);}catch(error){reject(error);}});
      }
      assert.equal((await scope(['pets.view_assigned']) as {status:number}).status,403);
      await databasePool.execute('INSERT INTO veterinarian_patients (veterinarian_id,pet_id) VALUES (?,?)',[id,petId]);
      assert.equal(await scope(['pets.view_assigned']),undefined);assert.equal((await scope([]) as {status:number}).status,403);
      assert.equal(await scope(['pets.view_all']),undefined);
    });
    await suite.test('desactivación bloquea login/JWT y preserva perfil/asignaciones',async()=>{
      assert.equal((await call(`/admin/veterinarians/${id}/status`,'PATCH',{isActive:false})).status,200);
      assert.equal((await call('/auth/me','GET',undefined,token)).status,401);assert.equal((await call('/auth/login','POST',{email,password},'')).status,401);
      assert.equal((await call(`/admin/veterinarians/${id}/invitation`,'POST')).status,409);
      const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT * FROM veterinarian_patients WHERE veterinarian_id=?',[id]);assert.equal(rows.length,1);
      assert.equal((await call(`/admin/veterinarians/${id}`)).status,200);
      assert.equal((await call(`/admin/veterinarians/${id}/status`,'PATCH',{isActive:true})).status,200);
      assert.equal((await call('/auth/me','GET',undefined,token)).status,401);
      const login=await call('/auth/login','POST',{email,password},'');assert.equal(login.status,200);token=login.body.data.accessToken;
    });
    await suite.test('restablecimiento rota invitación y revoca sesiones al consumirla; SMTP fallido no borra cuenta',async()=>{
      const sent=await call(`/admin/veterinarians/${id}/invitation`,'POST');assert.equal(sent.body.data.delivery,'sent');
      const reset=smtp.messages.filter(message=>message.to===email).at(-1)?.invitationToken;assert.ok(reset);assert.notEqual(reset,invite);
      assert.equal((await call('/auth/veterinarian-invitations/accept','POST',{token:invite,password},'')).status,400);
      assert.equal((await call('/auth/veterinarian-invitations/accept','POST',{token:reset,password:'Nueva!456'},'')).status,200);
      assert.equal((await call('/auth/me','GET',undefined,token)).status,401);
      await databasePool.execute('UPDATE veterinarian_invitations SET sent_at=TIMESTAMPADD(MINUTE,-2,UTC_TIMESTAMP(3)) WHERE user_id=?',[userId]);
      smtp.failNext();const failed=await call(`/admin/veterinarians/${id}/invitation`,'POST');assert.equal(failed.status,200);assert.equal(failed.body.data.delivery,'failed');assert.equal((await call(`/admin/veterinarians/${id}`)).status,200);
    });
    await suite.test('cambiar email exige nueva verificación y bloquea contraseña/JWT anteriores',async()=>{
      const login=await call('/auth/login','POST',{email,password:'Nueva!456'},'');assert.equal(login.status,200);
      const changedEmail=`changed-${randomUUID()}@example.com`;
      const updated=await call(`/admin/veterinarians/${id}`,'PUT',{...input,email:changedEmail});assert.equal(updated.status,200);assert.equal(updated.body.data.emailVerified,false);
      assert.equal((await call('/auth/me','GET',undefined,login.body.data.accessToken)).status,401);
      assert.equal((await call('/auth/login','POST',{email:changedEmail,password:'Nueva!456'},'')).status,401);
      const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT user_id FROM veterinarian_invitations WHERE user_id=?',[userId]);assert.equal(rows.length,0);
      assert.equal((await call(`/admin/veterinarians/${id}/invitation`,'POST')).body.data.delivery,'sent');
    });
  } finally {
    if(server)await new Promise<void>((resolve,reject)=>server!.close(error=>error?reject(error):resolve()));
    // Limpieza exclusivamente de fixtures creados por esta suite en _test; producción no ofrece DELETE.
    for(const vetId of vetIds){await databasePool.execute('DELETE FROM veterinarian_patients WHERE veterinarian_id=?',[vetId]);await databasePool.execute('DELETE FROM veterinarian_specialties WHERE veterinarian_id=?',[vetId]);await databasePool.execute('DELETE FROM veterinarians WHERE id=?',[vetId]);}
    if(petId)await databasePool.execute('DELETE FROM pets WHERE id=?',[petId]);
    for(const fixtureId of userIds){await databasePool.execute('DELETE FROM user_permissions WHERE user_id=?',[fixtureId]);await databasePool.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[fixtureId]);await databasePool.execute('DELETE FROM users WHERE id=?',[fixtureId]);}
    await smtp.close();await databasePool.end();
  }
});
