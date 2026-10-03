/** Consultas administrativas sobre tablas existentes. Nunca se devuelve password_hash. */
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env } from '../config/env';
import { withDatabaseLock } from '../database/lock';
import { readPermissions } from './authorization.repository';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { assertAdminPermission,assertDelegation,assertTarget,assertRoleAssignment,forbidden } from '../utils/admin-authorization';
import { objectBody,identifier,textField,permissionOverrides } from '../validators/veterinarian.validator';
import { readName,readPhone,normalizeEmail } from '../validators/auth.validator';
import { invitationUrl,saveInvitation,deliverInvitation,renewUserInvitation } from '../services/invitation.service';
import type { AuthUser,RoleCode } from '../types/auth';

export async function freshAdmin(c:PoolConnection,identity:AuthUser,...codes:string[]):Promise<AuthUser> {
  const [rows]=await c.execute<RowDataPacket[]>('SELECT u.id,r.code AS role,u.is_active,u.email_verified_at FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[identity.id]);
  if(!rows[0]?.is_active||!rows[0].email_verified_at)forbidden();
  const permissions=await readPermissions(identity.id,c);
  const actor={...identity,role:rows[0].role as RoleCode,permissions:permissions.filter(p=>p.effective).map(p=>p.code)};
  assertAdminPermission(actor,...codes);return actor;
}
async function transaction<T>(operation:(c:PoolConnection)=>Promise<T>) {
  return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();
    try{return await withDatabaseLock(c,async()=>{await c.beginTransaction();try{const result=await operation(c);await c.commit();return result;}catch(error){await c.rollback();throw error;}});}finally{c.release();}
  });
}
const userColumns='u.id,u.first_name AS firstName,u.last_name AS lastName,u.email,u.phone,u.role_id AS roleId,r.code AS role,r.name AS roleName,u.is_active AS isActive,u.email_verified_at IS NOT NULL AS emailVerified';
const mapUser=(row:RowDataPacket)=>({...row,id:String(row.id),roleId:String(row.roleId),isActive:Boolean(row.isActive),emailVerified:Boolean(row.emailVerified)});
export async function adminHome(actor:AuthUser) {
  // Este mapa describe rutas implementadas, no otorga permisos ni contiene datos de negocio.
  const paths:Record<string,string>={'pets.view_all':'/admin/patients','users.manage':'/admin/users','roles.manage':'/admin/roles','permissions.manage':'/admin/permissions','veterinarians.manage':'/admin/veterinarians','specialties.manage':'/admin/catalog/specialties','professionals.manage':'/admin/professionals','services.manage':'/admin/catalog/services','schedule.manage':'/admin/availability','appointments.view_all':'/admin/agenda','reservations.view_all':'/admin/reservations','categories.manage':'/admin/catalog/categories','products.create':'/admin/catalog/products','promotions.manage':'/admin/catalog/promotions','professional_types.manage':'/admin/catalog/types','products.update':'/admin/catalog/products','products.update_stock':'/admin/products','products.update_price':'/admin/products'};
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT p.code,p.name,m.name AS moduleName FROM permissions p JOIN permission_modules m ON m.code=p.module_code ORDER BY m.sort_order,p.id');
  const seen=new Set<string>();const modules: {code:string;name:string;path:string}[]=[];
  for(const row of rows){const path=paths[row.code];if(path==='/admin/patients'&&!actor.permissions?.includes('pets.view_information'))continue;if(path&&actor.permissions?.includes(row.code)&&!seen.has(path)){seen.add(path);modules.push({code:row.code,name:row.name,path});}}
  return {modules};
}
export async function adminCatalog(actor:AuthUser) {
  const [roles]=await databasePool.execute<RowDataPacket[]>('SELECT id,code,name FROM roles ORDER BY name');
  const [permissions]=await databasePool.execute<RowDataPacket[]>('SELECT p.id,p.code,p.name,p.description,p.module_code AS module,m.name AS moduleName,p.is_critical AS critical FROM permissions p JOIN permission_modules m ON m.code=p.module_code ORDER BY m.sort_order,p.id');
  const [grants]=await databasePool.execute<RowDataPacket[]>('SELECT rp.role_id AS roleId,p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id');
  return {roles:roles.map(r=>{const permissions=grants.filter(g=>String(g.roleId)===String(r.id)).map(g=>g.code as string);return {id:String(r.id),code:r.code,name:r.name,permissions,
      canAssign:r.code!=='VETERINARIAN'&&(r.code!=='SUPER_ADMIN'||actor.role==='SUPER_ADMIN')&&Boolean(actor.permissions?.includes('roles.manage'))&&permissions.every(code=>actor.permissions?.includes(code))};}),
    permissions:permissions.map(p=>({...p,id:String(p.id),critical:Boolean(p.critical),canDelegate:actor.permissions?.includes(p.code)??false}))};
}
export async function adminUsers(query:Record<string,unknown>) {
  const search=typeof query.search==='string'?query.search.trim():'';const pageText=query.page??'1';
  if(search.length>150||typeof pageText!=='string'||!/^[1-9]\d{0,5}$/.test(pageText))throw new AppError('VALIDATION_ERROR',400,'Revisá los filtros.');
  const page=Number(pageText);const params=search?[`%${search}%`,`%${search}%`,`%${search}%`]:[];
  const from=`FROM users u JOIN roles r ON r.id=u.role_id ${search?'WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?':''}`;
  const [count]=await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from}`,params);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${userColumns} ${from} ORDER BY u.last_name,u.first_name,u.id LIMIT 20 OFFSET ${(page-1)*20}`,params);
  return {items:rows.map(mapUser),page,total:Number(count[0].total),hasMore:page*20<Number(count[0].total)};
}
export async function adminUser(id:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${userColumns} FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?`,[id]);
  if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');
  return {...mapUser(rows[0]),permissions:await readPermissions(id)};
}
async function roleGrants(c:PoolConnection,id:string) {
  const [roles]=await c.execute<RowDataPacket[]>('SELECT id,code FROM roles WHERE id=?',[id]);if(!roles[0])throw new AppError('VALIDATION_ERROR',400,'El rol no existe.');
  const [permissions]=await c.execute<RowDataPacket[]>('SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=?',[id]);
  return {role:roles[0].code as string,permissions:permissions.map(p=>p.code as string)};
}
export async function createAdminUser(identity:AuthUser,value:unknown) {
  const body=objectBody(value,['firstName','lastName','email','phone','roleId']);
  const input={firstName:readName(body.firstName,'El nombre'),lastName:readName(body.lastName,'El apellido'),email:normalizeEmail(body.email),phone:readPhone(body.phone),roleId:identifier(body.roleId)};
  invitationUrl('account');const hash=await bcrypt.hash(randomBytes(48).toString('base64'),env.bcryptSaltRounds);
  const saved=await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage');const role=await roleGrants(c,input.roleId);
    assertRoleAssignment(actor,role.role,role.permissions);
    await c.execute('INSERT INTO users (role_id,email,password_hash,first_name,last_name,phone,is_active) VALUES (?,?,?,?,?,?,1)',[input.roleId,input.email,hash,input.firstName,input.lastName,input.phone]);
    const [rows]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');const id=String(rows[0].id);
    return {id,token:await saveInvitation(c,id)};
  });
  return {user:await adminUser(saved.id),delivery:await deliverInvitation(input.email,saved.token,'account')};
}
export async function updateAdminUser(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['firstName','lastName','phone','roleId','isActive']);
  const firstName=readName(body.firstName,'El nombre');const lastName=readName(body.lastName,'El apellido');const phone=readPhone(body.phone);
  if(typeof body.isActive!=='boolean')throw new AppError('VALIDATION_ERROR',400,'Indicá el estado de la cuenta.');
  const requestedRole=body.roleId===undefined?undefined:identifier(body.roleId);
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage');
    const [rows]=await c.execute<RowDataPacket[]>('SELECT u.id,u.role_id AS roleId,u.is_active,r.code AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');const target=rows[0];assertTarget(actor,{id,role:target.role});
    const roleChanged=requestedRole!==undefined&&requestedRole!==String(target.roleId);const statusChanged=Boolean(target.is_active)!==body.isActive;
    if(id===actor.id&&(roleChanged||statusChanged))forbidden('No podés cambiar tu propio rol ni desactivar tu propia cuenta.');
    if(roleChanged){if(target.role==='VETERINARIAN')throw new AppError('VET_PROFILE_REQUIRED',400,'No se cambia el rol de un usuario con perfil veterinario.');const role=await roleGrants(c,requestedRole!);assertRoleAssignment(actor,role.role,role.permissions);}
    if(target.role==='SUPER_ADMIN'&&statusChanged&&!body.isActive){const [others]=await c.execute<RowDataPacket[]>("SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='SUPER_ADMIN' AND u.is_active=1 AND u.email_verified_at IS NOT NULL AND u.id<>? LIMIT 1",[id]);if(!others.length)forbidden('No se puede desactivar al último SUPER_ADMIN activo y verificado.');}
    await c.execute('UPDATE users SET first_name=?,last_name=?,phone=?,is_active=?,role_id=?,session_version=session_version+? WHERE id=?',[firstName,lastName,phone,body.isActive,requestedRole??target.roleId,roleChanged||statusChanged?1:0,id]);
    if(roleChanged)await c.execute('DELETE FROM user_permissions WHERE user_id=?',[id]);
    if(roleChanged||!body.isActive){await c.execute('DELETE FROM veterinarian_invitations WHERE user_id=?',[id]);await c.execute('DELETE FROM email_verifications WHERE user_id=?',[id]);}
  });return adminUser(id);
}
export async function updateUserPermissions(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['overrides']);const overrides=permissionOverrides(body.overrides);
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage','permissions.manage');const [rows]=await c.execute<RowDataPacket[]>('SELECT r.code AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');assertTarget(actor,{id,role:rows[0].role});if(id===actor.id)forbidden('No podés modificar tus propios overrides administrativos.');
    const current=await readPermissions(id,c);const changed=current.filter(p=>p.override!==(overrides.find(o=>o.code===p.code)?.allowed??null));assertDelegation(actor,changed.map(p=>p.code));
    const [catalog]=await c.execute<RowDataPacket[]>('SELECT id,code,is_critical FROM permissions');
    for(const override of overrides){const p=catalog.find(p=>p.code===override.code);if(!p)throw new AppError('INVALID_PERMISSION',400,'El permiso no existe.');if(p.is_critical&&!['ADMIN','SUPER_ADMIN'].includes(rows[0].role))forbidden('No se asignan permisos administrativos a clientes o veterinarios.');}
    await c.execute('DELETE FROM user_permissions WHERE user_id=?',[id]);
    for(const override of overrides)if(override.allowed!==null)await c.execute('INSERT INTO user_permissions (user_id,permission_id,allowed) VALUES (?,?,?)',[id,catalog.find(p=>p.code===override.code)!.id,override.allowed]);
  });return adminUser(id);
}
export async function updateRole(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['name','permissionCodes']);const name=textField(body.name,'El nombre del rol',60);
  if(!Array.isArray(body.permissionCodes)||body.permissionCodes.length>100||body.permissionCodes.some(p=>typeof p!=='string')||new Set(body.permissionCodes).size!==body.permissionCodes.length)throw new AppError('VALIDATION_ERROR',400,'Revisá los permisos del rol.');
  const codes=body.permissionCodes as string[];
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'roles.manage','permissions.manage');const role=await roleGrants(c,id);
    assertTarget(actor,{id,role:role.role});const changed=[...new Set([...role.permissions,...codes])].filter(code=>role.permissions.includes(code)!==codes.includes(code));assertDelegation(actor,changed);
    const [catalog]=await c.execute<RowDataPacket[]>('SELECT id,code,is_critical FROM permissions');
    for(const code of codes){const p=catalog.find(p=>p.code===code);if(!p)throw new AppError('INVALID_PERMISSION',400,'El permiso no existe.');if(p.is_critical&&!['ADMIN','SUPER_ADMIN'].includes(role.role))forbidden('Este rol no admite permisos administrativos.');}
    await c.execute('UPDATE roles SET name=? WHERE id=?',[name,id]);await c.execute('DELETE FROM role_permissions WHERE role_id=?',[id]);
    for(const code of codes)await c.execute('INSERT INTO role_permissions (role_id,permission_id) VALUES (?,?)',[id,catalog.find(p=>p.code===code)!.id]);
    const remaining=await readPermissions(actor.id,c);if(!remaining.some(p=>p.code==='roles.manage'&&p.effective)||!remaining.some(p=>p.code==='permissions.manage'&&p.effective))forbidden('El cambio quitaría tu acceso a la gestión de roles o permisos.');
  });return adminCatalog(identity);
}
export async function inviteAdminUser(identity:AuthUser,id:string) {
  return renewUserInvitation(id,async(c,target)=>{const actor=await freshAdmin(c,identity,'users.manage');assertTarget(actor,target);});
}
export async function adminProducts(query:Record<string,unknown>) {
  const search=typeof query.search==='string'?query.search.trim():'';const pageText=query.page??'1';
  if(search.length>150||typeof pageText!=='string'||!/^[1-9]\d{0,5}$/.test(pageText))throw new AppError('VALIDATION_ERROR',400,'Revisá los filtros.');
  const page=Number(pageText);const where=search?'WHERE name LIKE ?':'';const params=search?[`%${search}%`]:[];
  const [count]=await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM client_products ${where}`,params);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT id,name,description,price_cents AS priceCents,stock,is_active AS isActive FROM client_products ${where} ORDER BY name,id LIMIT 20 OFFSET ${(page-1)*20}`,params);
  return {items:rows.map(p=>({...p,id:String(p.id),isActive:Boolean(p.isActive)})),page,total:Number(count[0].total),hasMore:page*20<Number(count[0].total)};
}
export async function updateAdminProduct(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['name','description','isActive','priceCents','stock']);
  if(!Object.keys(body).length)throw new AppError('VALIDATION_ERROR',400,'No hay cambios para guardar.');
  const assignments:string[]=[];const parameters:(string|number|boolean|null)[]=[];const required=new Set<string>();
  if(body.name!==undefined){assignments.push('name=?');parameters.push(textField(body.name,'El nombre',200));required.add('products.update');}
  if(body.description!==undefined){if(body.description!==null&&(typeof body.description!=='string'||body.description.length>10000))throw new AppError('VALIDATION_ERROR',400,'Revisá la descripción.');assignments.push('description=?');parameters.push(typeof body.description==='string'?body.description.trim()||null:null);required.add('products.update');}
  if(body.isActive!==undefined){if(typeof body.isActive!=='boolean')throw new AppError('VALIDATION_ERROR',400,'Indicá el estado del producto.');assignments.push('is_active=?');parameters.push(body.isActive);required.add('products.update');}
  for(const field of ['priceCents','stock'] as const)if(body[field]!==undefined){const number=body[field];if(typeof number!=='number'||!Number.isSafeInteger(number)||number<0||number>(field==='priceCents'?100000000:4294967295))throw new AppError('VALIDATION_ERROR',400,'Precio o stock inválido.');assignments.push(`${field==='priceCents'?'price_cents':'stock'}=?`);parameters.push(number);required.add(field==='priceCents'?'products.update_price':'products.update_stock');}
  return transaction(async c=>{await freshAdmin(c,identity,...required);const [rows]=await c.execute<RowDataPacket[]>('SELECT id,reserved_stock AS reservedStock FROM client_products WHERE id=? FOR UPDATE',[id]);if(!rows[0])throw new AppError('NOT_FOUND',404,'Producto no encontrado.');if(body.stock!==undefined&&Number(body.stock)<Number(rows[0].reservedStock))throw new AppError('VALIDATION_ERROR',400,'El stock físico no puede ser menor al reservado.');await c.execute(`UPDATE client_products SET ${assignments.join(',')} WHERE id=?`,[...parameters,id]);return {updated:true};});
}
