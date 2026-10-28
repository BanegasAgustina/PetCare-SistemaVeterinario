// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Gestión transaccional sin borrar profesionales. Identificadores BIGINT siempre como texto. */
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import type { VetInput } from '../validators/veterinarian.validator';
import { readVetProfile } from './authorization.repository';
import { freshAdmin } from './admin.repository';
import { withDatabaseLock } from '../database/lock';
import { hashPassword } from '../services/password.service';
import { deliverInvitation,saveInvitation } from '../services/invitation.service';
import type { AuthUser } from '../types/auth';
import { isProfilePhotoKey,profilePhotoUrl } from '../services/pet-photo.service';
import { catalogName } from '../utils/catalog-presentation';

// Función transaction: concentra la lógica dentro de este módulo.
async function transaction<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T> {
  return runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {return await withDatabaseLock(connection,async()=>{await connection.beginTransaction();try {const result=await operation(connection);await connection.commit();return result;}catch(error){await connection.rollback();throw error;}});} finally { connection.release(); }
  });
}
// Función vetCatalog: concentra la lógica dentro de este módulo.
export async function vetCatalog() {
  return runDatabaseOperation(async () => {
    const [specialties] = await databasePool.execute<RowDataPacket[]>('SELECT id,name,is_active AS isActive FROM specialties WHERE is_active=1 ORDER BY name');
    return { specialties: specialties.map(s=>({ id: String(s.id),name: catalogName(s.name as string),isActive:true })) };
  });
}
// Función vetDetail: concentra la lógica dentro de este módulo.
export async function vetDetail(id: string) {
  return runDatabaseOperation(async () => {
    const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT u.id AS user_id,u.first_name,u.last_name,u.email,u.phone,u.profile_photo_url AS profilePhotoUrl,u.is_active,u.email_verified_at,
      i.consumed_at,i.delivery,i.expires_at>UTC_TIMESTAMP(3) AS invitation_valid
      FROM veterinarians v JOIN users u ON u.id=v.user_id JOIN roles r ON r.id=u.role_id
      LEFT JOIN veterinarian_invitations i ON i.user_id=u.id WHERE v.id=? AND r.code='VETERINARIAN'`,[id]);
    if (!rows[0]) throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
    const row = rows[0];
    const profile = await readVetProfile(String(row.user_id));
    return { id, userId:String(row.user_id),firstName:row.first_name as string,lastName:row.last_name as string,
      email:row.email as string,phone:row.phone as string | null,profilePhotoUrl:await profilePhotoUrl(row.profilePhotoUrl),isActive:Boolean(row.is_active),emailVerified:Boolean(row.email_verified_at),
      invitationStatus: row.consumed_at ? 'accepted' : row.invitation_valid ? row.delivery==='failed'?'failed':'pending' : 'expired',
      licenseNumber:profile?.licenseNumber ?? '',specialties:profile?.specialties ?? [] };
  });
}
// Función vetList: concentra la lógica dentro de este módulo.
export async function vetList(query: Record<string, unknown>) {
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const status = query.status ?? 'all'; const sort = query.sort ?? 'recent';
  const pageText = query.page ?? '1';
  if (search.length > 150 || !['all','active','inactive'].includes(String(status)) || !['recent','oldest','az','za'].includes(String(sort)) ||
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
    const direction = sort === 'za' || sort === 'oldest' ? 'DESC' : 'ASC';
    const ordering = sort === 'recent' || sort === 'oldest' ? `u.created_at ${direction},` : '';
    const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT v.id,u.first_name,u.last_name,u.email,u.profile_photo_url AS profilePhotoUrl,u.is_active,v.license_number ${from}
      ORDER BY ${ordering}u.last_name ${direction},u.first_name ${direction},v.id ${direction} LIMIT ${limit} OFFSET ${(page-1)*limit}`,parameters);
    const ids = rows.map(row=>String(row.id));
    const [specialties] = ids.length ? await databasePool.execute<RowDataPacket[]>(`SELECT vs.veterinarian_id,s.id,s.name FROM veterinarian_specialties vs
      JOIN specialties s ON s.id=vs.specialty_id WHERE vs.veterinarian_id IN (${ids.map(()=>'?').join(',')}) ORDER BY s.name`,ids) : [[]];
    return { items: await Promise.all(rows.map(async row=>({ id:String(row.id),firstName:row.first_name as string,lastName:row.last_name as string,email:row.email as string,
      profilePhotoUrl:await profilePhotoUrl(row.profilePhotoUrl),isActive:Boolean(row.is_active),licenseNumber:row.license_number as string,
      specialties:specialties.filter(s=>String(s.veterinarian_id)===String(row.id)).map(s=>({id:String(s.id),name:catalogName(s.name as string)})) }))),
      page,pageSize:limit,total:Number(count[0].total),hasMore:page*limit<Number(count[0].total) };
  });
}
// Función updateVetPhoto: actualiza o guarda información dentro de este módulo.
export async function updateVetPhoto(id:string,key:string|null,identity:AuthUser) {
  let previous:unknown=null;
  await transaction(async connection=>{
    await freshAdmin(connection,identity,'veterinarians.manage');
    const [rows]=await connection.execute<RowDataPacket[]>('SELECT u.id,u.profile_photo_url AS profilePhotoUrl FROM users u JOIN veterinarians v ON v.user_id=u.id WHERE v.id=? FOR UPDATE',[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
    if(key!==null&&!isProfilePhotoKey(key))throw new AppError('VALIDATION_ERROR',400,'La referencia de la foto no es válida.');
    previous=rows[0].profilePhotoUrl;
    await connection.execute('UPDATE users SET profile_photo_url=? WHERE id=?',[key,rows[0].id]);
  });
  return {previous:previous as string|null};
}
/** El veterinario solo puede editar la foto de la cuenta ligada a su propio JWT. */
// Función updateOwnVetPhoto: actualiza o guarda información dentro de este módulo.
export async function updateOwnVetPhoto(userId:string,key:string|null) {
  let previous:string|null=null;
  await transaction(async connection=>{
    const [rows]=await connection.execute<RowDataPacket[]>("SELECT u.profile_photo_url AS previous,r.code AS role FROM users u JOIN roles r ON r.id=u.role_id JOIN veterinarians v ON v.user_id=u.id WHERE u.id=? FOR UPDATE",[userId]);
    if(!rows[0]||rows[0].role!=='VETERINARIAN')throw new AppError('FORBIDDEN',403,'Solo el veterinario puede actualizar su foto de perfil.');
    previous=rows[0].previous as string|null;
    await connection.execute('UPDATE users SET profile_photo_url=? WHERE id=?',[key,userId]);
  });
  return {previous};
}
// Función replaceSpecialties: concentra la lógica dentro de este módulo.
async function replaceSpecialties(connection: PoolConnection,vetId: string,ids: string[]) {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT id FROM specialties WHERE is_active=1 AND id IN (${ids.map(()=>'?').join(',')})`,ids);
  if (rows.length !== ids.length) throw new AppError('VALIDATION_ERROR',400,'Una especialidad seleccionada ya no existe.');
  // Una baja lógica conserva la relación histórica; solo reemplazamos asignaciones activas.
  await connection.execute('DELETE vs FROM veterinarian_specialties vs JOIN specialties s ON s.id=vs.specialty_id WHERE vs.veterinarian_id=? AND s.is_active=1',[vetId]);
  for (const id of ids) await connection.execute('INSERT INTO veterinarian_specialties (veterinarian_id,specialty_id) VALUES (?,?)',[vetId,id]);
}
// Función lockVet: concentra la lógica dentro de este módulo.
async function lockVet(connection: PoolConnection,id: string) {
  const [rows] = await connection.execute<RowDataPacket[]>(`SELECT u.id,u.email,u.is_active,u.email_verified_at,u.must_change_password FROM users u JOIN veterinarians v ON v.user_id=u.id
    JOIN roles r ON r.id=u.role_id WHERE v.id=? AND r.code='VETERINARIAN' FOR UPDATE`,[id]);
  if (!rows[0]) throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
  return rows[0];
}
// Función createVet: crea un registro o inicia una operación dentro de este módulo.
export async function createVet(input: VetInput,identity:AuthUser) {
  const unusablePasswordHash = await hashPassword(randomBytes(32).toString('hex'));
  const result = await transaction(async connection => {
    await freshAdmin(connection,identity,'veterinarians.manage');
    const [roles] = await connection.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code='VETERINARIAN'");
    if (!roles[0]) throw new AppError('AUTH_UNAVAILABLE',503,'El rol veterinario no está configurado.');
    await connection.execute('INSERT INTO users (role_id,email,password_hash,first_name,last_name,phone,is_active,must_change_password) VALUES (?,?,?,?,?,?,0,1)',
      [roles[0].id,input.email,unusablePasswordHash,input.firstName,input.lastName,input.phone]);
    const [users] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
    const userId = users[0].id as string;
    await connection.execute('INSERT INTO veterinarians (user_id,license_number) VALUES (?,?)',[userId,input.licenseNumber]);
    const [profiles] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
    const id = profiles[0].id as string;
    await replaceSpecialties(connection,id,input.specialtyIds);
    const invitationToken=await saveInvitation(connection,userId);
    return { id,userId,invitationToken,email:input.email };
  });
  const invitationDelivery=await deliverInvitation(result.email,result.invitationToken,'veterinarian');
  return { veterinarian:await vetDetail(result.id),invitationDelivery };
}
// Función updateVet: actualiza o guarda información dentro de este módulo.
export async function updateVet(id: string,input: VetInput,identity:AuthUser) {
  await transaction(async connection => {
    const actor=await freshAdmin(connection,identity,'veterinarians.manage');
    const user = await lockVet(connection,id); const emailChanged = user.email !== input.email;
    if(!user.is_active&&input.isActive&&Number(user.must_change_password)===1&&!user.email_verified_at)throw new AppError('INVITATION_REQUIRED',409,'El veterinario debe activar su cuenta desde el enlace enviado por correo.');
    if(Boolean(user.is_active)!==input.isActive&&actor.role!=='SUPER_ADMIN')throw new AppError('FORBIDDEN',403,'Solo el administrador principal puede activar o desactivar veterinarios.');
    if(String(user.id)===actor.id&&!input.isActive)throw new AppError('FORBIDDEN',403,'No podés desactivar tu propia cuenta.');
    await connection.execute(`UPDATE users SET first_name=?,last_name=?,email=?,phone=?,is_active=?,
      session_version=session_version+?,email_verified_at=IF(?,NULL,email_verified_at) WHERE id=?`,
      [input.firstName,input.lastName,input.email,input.phone,input.isActive,emailChanged || Boolean(user.is_active)!==input.isActive ? 1:0,emailChanged,user.id]);
    await connection.execute('UPDATE veterinarians SET license_number=? WHERE id=?',[input.licenseNumber,id]);
    await replaceSpecialties(connection,id,input.specialtyIds);
    if (emailChanged || !input.isActive) {
      await connection.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[user.id]);
      await connection.execute('DELETE FROM email_verifications WHERE user_id=?',[user.id]);
    }
  });
  return vetDetail(id);
}
// Función updateVetStatus: actualiza o guarda información dentro de este módulo.
export async function updateVetStatus(id: string,isActive: boolean,identity:AuthUser) {
  await transaction(async connection => {
    const actor=await freshAdmin(connection,identity,'veterinarians.manage');
    const user = await lockVet(connection,id);
    if(actor.role!=='SUPER_ADMIN')throw new AppError('FORBIDDEN',403,'Solo el administrador principal puede activar o desactivar veterinarios.');
    if(!user.is_active&&isActive&&Number(user.must_change_password)===1&&!user.email_verified_at)throw new AppError('INVITATION_REQUIRED',409,'El veterinario debe activar su cuenta desde el enlace enviado por correo.');
    if(String(user.id)===actor.id&&!isActive)throw new AppError('FORBIDDEN',403,'No podés desactivar tu propia cuenta.');
    await connection.execute('UPDATE users SET is_active=?,session_version=session_version+1 WHERE id=?',[isActive,user.id]);
    if (!isActive) {
      await connection.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[user.id]);
      await connection.execute('DELETE FROM email_verifications WHERE user_id=?',[user.id]);
    }
  });
  return vetDetail(id);
}
