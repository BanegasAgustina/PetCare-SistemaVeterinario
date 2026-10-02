/** QA de integración sin INSERT/UPDATE/DELETE: utiliza exclusivamente identidades existentes. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { RowDataPacket } from 'mysql2/promise';
import { app } from '../src/app';
import { databasePool } from '../src/config/database';
import { createAccessToken } from '../src/services/token.service';

async function verify(){
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}/api`;
  try {
    const [users]=await databasePool.execute<RowDataPacket[]>(`SELECT u.id,u.session_version FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='CLIENT' AND u.is_active=1 AND u.email_verified_at IS NOT NULL LIMIT 1`);
    assert.ok(users.length,'Se necesita un CLIENT real verificado para comprobar integración.');
    const owner=String(users[0].id);const token=createAccessToken(owner,Number(users[0].session_version)).accessToken;
    const get=async(path:string,authenticated=true)=>{const response=await fetch(base+path,{headers:authenticated?{Authorization:`Bearer ${token}`}:{}});const body=await response.json();return {status:response.status,body};};
    assert.equal((await get('/client/pets',false)).status,401);
    assert.equal((await get('/health/database',false)).status,200);
    const paths=['home','pets','pets/catalog','appointments','appointments/catalog','clinical/medical-history','clinical/vaccines','clinical/prescriptions','clinical/recommendations','store/categories','store/products','cart','orders','notifications'];
    for(const path of paths){const response=await get('/client/'+path);assert.equal(response.status,200,path);assert.equal(response.body.success,true);console.info(`GET /client/${path}: OK`);}
    for(const path of ['/pets/18446744073709551615','/orders/18446744073709551615','/clinical/vaccines?petId=18446744073709551615'])assert.equal((await get('/client'+path)).status,404);
    const [others]=await databasePool.execute<RowDataPacket[]>('SELECT id FROM pets WHERE owner_id<>? AND is_active=1 LIMIT 1',[owner]);
    if(others.length){assert.equal((await get('/client/pets/'+String(others[0].id))).status,404);assert.equal((await get('/client/clinical/medical-history?petId='+String(others[0].id))).status,404);console.info('Ownership cruzado: OK');}
    const [roles]=await databasePool.execute<RowDataPacket[]>(`SELECT u.id,u.session_version FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code<>'CLIENT' AND u.is_active=1 AND u.email_verified_at IS NOT NULL LIMIT 1`);
    if(roles.length){const other=createAccessToken(String(roles[0].id),Number(roles[0].session_version)).accessToken;assert.equal((await fetch(base+'/client/pets',{headers:{Authorization:`Bearer ${other}`}})).status,403);console.info('Barrera de rol: OK');}
    console.info('Integración Cliente de solo lectura: OK');
  } finally {await new Promise<void>(resolve=>server.close(()=>resolve()));await databasePool.end();}
}
void verify().catch(()=>{console.error('QA de integración Cliente falló; revisá esquema y usuario verificado.');process.exitCode=1;});
