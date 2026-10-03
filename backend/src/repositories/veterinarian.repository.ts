/** Gestión transaccional sin borrar profesionales. Identificadores BIGINT siempre como texto. */
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import type { VetInput } from '../validators/veterinarian.validator';
import { readPermissions, readVetProfile } from './authorization.repository';
import { invitationUrl, saveInvitation, deliverInvitation } from '../services/invitation.service';
import { freshAdmin } from './admin.repository';
import { assertAdminPermission,assertDelegation } from '../utils/admin-authorization';
import { withDatabaseLock } from '../database/lock';
import type { AuthUser } from '../types/auth';

async function transaction<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T> {
  return runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {return await withDatabaseLock(connection,async()=>{await connection.beginTransaction();try {const result=await operation(connection);await connection.commit();return result;}catch(error){await connection.rollback();throw error;}});} finally { connection.release(); }
  });
}
export async function vetCatalog() {
  return runDatabaseOperation(async () => {
    const [specialties] = await databasePool.execute<RowDataPacket[]>('SELECT id,name FROM specialties ORDER BY name');
    const [permissions] = await databasePool.execute<RowDataPacket[]>(`SELECT p.code,p.name,p.description,p.module_code AS module,m.name AS moduleName,
      p.is_critical AS critical,rp.permission_id IS NOT NULL AS inherited FROM permissions p
      JOIN permission_modules m ON m.code=p.module_code
      LEFT JOIN roles r ON r.code='VETERINARIAN' LEFT JOIN role_permissions rp ON rp.role_id=r.id AND rp.permission_id=p.id ORDER BY m.sort_order,p.id`);
    return { specialties: specialties.map(s=>({ id: String(s.id),name: s.name as string })),
      permissions: permissions.map(p=>({ code:p.code as string,name:p.name as string,description:p.description as string,
        module:p.module as string,moduleName:p.moduleName as string,critical:Boolean(p.critical),inherited:Boolean(p.inherited) })) };
  });
}
export async function vetDetail(id: string) {
  return runDatabaseOperation(async () => {
    const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT u.id AS user_id,u.first_name,u.last_name,u.email,u.phone,u.is_active,u.email_verified_at,
      i.consumed_at,i.delivery,i.expires_at>UTC_TIMESTAMP(3) AS invitation_valid
      FROM veterinarians v JOIN users u ON u.id=v.user_id JOIN roles r ON r.id=u.role_id
      LEFT JOIN veterinarian_invitations i ON i.user_id=u.id WHERE v.id=? AND r.code='VETERINARIAN'`,[id]);
    if (!rows[0]) throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
    const row = rows[0];
    const [profile,permissions] = await Promise.all([readVetProfile(String(row.user_id)),readPermissions(String(row.user_id))]);
    return { id, userId:String(row.user_id),firstName:row.first_name as string,lastName:row.last_name as string,
      email:row.email as string,phone:row.phone as string | null,isActive:Boolean(row.is_active),emailVerified:Boolean(row.email_verified_at),
      invitationStatus: row.consumed_at ? 'accepted' : row.invitation_valid ? row.delivery==='failed'?'failed':'pending' : 'expired',
      licenseNumber:profile?.licenseNumber ?? '',specialties:profile?.specialties ?? [],permissions };
  });
}
export async function vetList(query: Record<string, unknown>) {
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const status = query.status ?? 'all'; const order = query.order ?? 'asc';
  const pageText = query.page ?? '1';
  if (search.length > 150 || !['all','active','inactive'].includes(String(status)) || !['asc','desc'].includes(String(order)) ||
    typeof pageText !== 'string' || !/^[1-9]\d{0,5}$/.test(pageText) || (query.specialtyId !== undefined && (typeof query.specialtyId !== 'string' || !/^[1-9]\d{0,9}$/.test(query.specialtyId)))) {
    throw new AppError('VALIDATION_ERROR',400,'Revisá los filtros de búsqueda.');
  }
  const page = Number(pageText); const limit = 20;
  return runDatabaseOperation(async () => {
    const filters = ["r.code='VETERINARIAN'"]; const parameters: (string | number)[] = [];
    if (search) { filters.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR v.license_number LIKE ?)'); parameters.push(...Array<string>(4).fill(`%${search}%`)); }
    if (status !== 'all') { filters.push('u.is_active=?');parameters.push(status==='active'?1:0); }
    if (query.specialtyId) { filters.push('EXISTS (SELECT 1 FROM veterinarian_specialties vs WHERE vs.veterinarian_id=v.id AND vs.specialty_id=?)');parameters.push(query.specialtyId as string); }
    const from = `FROM veterinarians v JOIN users u ON u.id=v.user_id JOIN roles r ON r.id=u.role_id WHERE ${filters.join(' AND ')}`;
    const [count] = await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from}`,parameters);
    // ORDER viene de una lista blanca; límite/offset son enteros calculados, nunca texto del usuario.
    const direction = order === 'desc' ? 'DESC' : 'ASC';
    const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT v.id,u.first_name,u.last_name,u.email,u.is_active,v.license_number ${from}
      ORDER BY u.last_name ${direction},u.first_name ${direction},v.id ${direction} LIMIT ${limit} OFFSET ${(page-1)*limit}`,parameters);
    const ids = rows.map(row=>String(row.id));
    const [specialties] = ids.length ? await databasePool.execute<RowDataPacket[]>(`SELECT vs.veterinarian_id,s.id,s.name FROM veterinarian_specialties vs
      JOIN specialties s ON s.id=vs.specialty_id WHERE vs.veterinarian_id IN (${ids.map(()=>'?').join(',')}) ORDER BY s.name`,ids) : [[]];
    return { items: rows.map(row=>({ id:String(row.id),firstName:row.first_name as string,lastName:row.last_name as string,email:row.email as string,
      isActive:Boolean(row.is_active),licenseNumber:row.license_number as string,
      specialties:specialties.filter(s=>String(s.veterinarian_id)===String(row.id)).map(s=>({id:String(s.id),name:s.name as string})) })),
      page,pageSize:limit,total:Number(count[0].total),hasMore:page*limit<Number(count[0].total) };
  });
}
async function replaceOverrides(connection: PoolConnection,userId: string,overrides: VetInput['overrides'],actor:AuthUser) {
  const current=await readPermissions(userId,connection);
  const changed=current.filter(p=>p.override!==(overrides.find(o=>o.code===p.code)?.allowed??null)).map(p=>p.code);
  if(changed.length){assertAdminPermission(actor,'permissions.manage');assertDelegation(actor,changed);}
  // Validar incluso allowed=null: un código crítico no puede modificarse a través de este recurso.
  const [catalog] = await connection.execute<RowDataPacket[]>('SELECT id,code,is_critical FROM permissions');
  for (const item of overrides) {
    const permission = catalog.find(p=>p.code===item.code);
    if (!permission || permission.is_critical) throw new AppError('INVALID_PERMISSION',400,'No se pueden asignar permisos desconocidos o administrativos a veterinarios.');
  }
  await connection.execute('DELETE FROM user_permissions WHERE user_id=?',[userId]);
  for (const item of overrides) {
    if (item.allowed !== null) await connection.execute('INSERT INTO user_permissions (user_id,permission_id,allowed) VALUES (?,?,?)',[userId,catalog.find(p=>p.code===item.code)!.id,item.allowed]);
  }
}
async function replaceSpecialties(connection: PoolConnection,vetId: string,ids: string[]) {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT id FROM specialties WHERE id IN (${ids.map(()=>'?').join(',')})`,ids);
  if (rows.length !== ids.length) throw new AppError('VALIDATION_ERROR',400,'Una especialidad seleccionada ya no existe.');
  await connection.execute('DELETE FROM veterinarian_specialties WHERE veterinarian_id=?',[vetId]);
  for (const id of ids) await connection.execute('INSERT INTO veterinarian_specialties (veterinarian_id,specialty_id) VALUES (?,?)',[vetId,id]);
}
async function lockVet(connection: PoolConnection,id: string) {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT u.id,u.email,u.is_active FROM users u JOIN veterinarians v ON v.user_id=u.id
    JOIN roles r ON r.id=u.role_id WHERE v.id=? AND r.code='VETERINARIAN' FOR UPDATE`,[id]);
  if (!rows[0]) throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
  return rows[0];
}
export async function createVet(input: VetInput,identity:AuthUser) {
  invitationUrl();
  const hash = await bcrypt.hash(randomBytes(48).toString('base64'),env.bcryptSaltRounds);
  const result = await transaction(async connection => {
    const actor=await freshAdmin(connection,identity,'veterinarians.manage');
    const [roles] = await connection.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code='VETERINARIAN'");
    if (!roles[0]) throw new AppError('AUTH_UNAVAILABLE',503,'El rol veterinario no está configurado.');
    await connection.execute('INSERT INTO users (role_id,email,password_hash,first_name,last_name,phone,is_active) VALUES (?,?,?,?,?,?,?)',
      [roles[0].id,input.email,hash,input.firstName,input.lastName,input.phone,input.isActive]);
    const [users] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
    const userId = users[0].id as string;
    await connection.execute('INSERT INTO veterinarians (user_id,license_number) VALUES (?,?)',[userId,input.licenseNumber]);
    const [profiles] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
    const id = profiles[0].id as string;
    await replaceSpecialties(connection,id,input.specialtyIds); await replaceOverrides(connection,userId,input.overrides,actor);
    return { id,token:input.isActive ? await saveInvitation(connection,userId) : null };
  });
  return { veterinarian:await vetDetail(result.id),delivery:result.token ? await deliverInvitation(input.email,result.token) : 'pending' };
}
export async function updateVet(id: string,input: VetInput,identity:AuthUser) {
  const hash = await bcrypt.hash(randomBytes(48).toString('base64'),env.bcryptSaltRounds);
  await transaction(async connection => {
    const actor=await freshAdmin(connection,identity,'veterinarians.manage');
    const user = await lockVet(connection,id); const emailChanged = user.email !== input.email;
    await connection.execute(`UPDATE users SET first_name=?,last_name=?,email=?,phone=?,is_active=?,
      session_version=session_version+?,email_verified_at=IF(?,NULL,email_verified_at),password_hash=IF(?,?,password_hash) WHERE id=?`,
      [input.firstName,input.lastName,input.email,input.phone,input.isActive,emailChanged || Boolean(user.is_active)!==input.isActive ? 1:0,emailChanged,emailChanged,hash,user.id]);
    await connection.execute('UPDATE veterinarians SET license_number=? WHERE id=?',[input.licenseNumber,id]);
    await replaceSpecialties(connection,id,input.specialtyIds); await replaceOverrides(connection,String(user.id),input.overrides,actor);
    if (emailChanged || !input.isActive) {
      await connection.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[user.id]);
      await connection.execute('DELETE FROM email_verifications WHERE user_id=?',[user.id]);
    }
  });
  return vetDetail(id);
}
export async function updateVetPermissions(id: string,overrides: VetInput['overrides'],identity:AuthUser) {
  await transaction(async connection => {const actor=await freshAdmin(connection,identity,'veterinarians.manage','permissions.manage'); const user = await lockVet(connection,id);await replaceOverrides(connection,String(user.id),overrides,actor); });
  return vetDetail(id);
}
export async function updateVetStatus(id: string,isActive: boolean,identity:AuthUser) {
  await transaction(async connection => {
    await freshAdmin(connection,identity,'veterinarians.manage');
    const user = await lockVet(connection,id);
    await connection.execute('UPDATE users SET is_active=?,session_version=session_version+1 WHERE id=?',[isActive,user.id]);
    if (!isActive) {
      await connection.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[user.id]);
      await connection.execute('DELETE FROM email_verifications WHERE user_id=?',[user.id]);
    }
  });
  return vetDetail(id);
}
