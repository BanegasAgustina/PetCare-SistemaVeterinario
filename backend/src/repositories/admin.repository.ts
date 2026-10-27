/** Consultas administrativas sobre tablas existentes. Nunca se devuelve password_hash. */
import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import { randomBytes } from 'node:crypto';
import { databasePool } from '../config/database';
import { withDatabaseLock } from '../database/lock';
import { readPermissions } from './authorization.repository';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { assertAdminPermission,assertDelegation,assertTarget,assertRoleAssignment,forbidden } from '../utils/admin-authorization';
import { objectBody,identifier,textField,permissionOverrides } from '../validators/veterinarian.validator';
import { readName,readPhone,normalizeEmail } from '../validators/auth.validator';
import * as clinicValidation from '../validators/clinic.validator';
import type { AuthUser,RoleCode } from '../types/auth';
import { isProfilePhotoKey,profilePhotoUrl } from '../services/pet-photo.service';
import { permissionDescription, permissionModuleName, permissionName, roleName } from '../utils/catalog-presentation';
import { roleCodeFromName } from '../utils/role-code';
import { deliverInvitation,renewUserInvitation,saveInvitation } from '../services/invitation.service';
import { hashPassword } from '../services/password.service';
import { assertAccountDeactivationAllowed,assertCustomRoleDeletable } from '../utils/admin-destructive-actions';

export async function freshAdmin(c:PoolConnection,identity:AuthUser,...codes:string[]):Promise<AuthUser> {
  const [rows]=await c.execute<RowDataPacket[]>('SELECT u.id,r.code AS role,u.is_active,u.email_verified_at FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[identity.id]);
  if(!rows[0]?.is_active||!rows[0].email_verified_at)forbidden();
  const permissions=await readPermissions(identity.id,c);
  const actor={...identity,role:rows[0].role as RoleCode,permissions:permissions.filter(p=>p.effective).map(p=>p.code)};
  assertAdminPermission(actor,...codes);return actor;
}
async function freshPermissionActor(c:PoolConnection,identity:AuthUser,...codes:string[]):Promise<AuthUser> {
  const [rows]=await c.execute<RowDataPacket[]>('SELECT u.id,r.code AS role,u.is_active,u.email_verified_at FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[identity.id]);
  if(!rows[0]?.is_active||!rows[0].email_verified_at)forbidden();
  const permissions=await readPermissions(identity.id,c);
  const actor={...identity,role:String(rows[0].role),permissions:permissions.filter(p=>p.effective).map(p=>p.code)};
  for(const code of codes)if(!actor.permissions.includes(code))forbidden();
  return actor;
}
async function transaction<T>(operation:(c:PoolConnection)=>Promise<T>) {
  return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();
    try{return await withDatabaseLock(c,async()=>{await c.beginTransaction();try{const result=await operation(c);await c.commit();return result;}catch(error){await c.rollback();throw error;}});}finally{c.release();}
  });
}
const userColumns='u.id,u.first_name AS firstName,u.last_name AS lastName,u.email,u.phone,u.profile_photo_url AS profilePhotoUrl,u.role_id AS roleId,r.code AS role,r.name AS roleName,u.is_active AS isActive,u.email_verified_at IS NOT NULL AS emailVerified';
const mapUser=(row:RowDataPacket)=>({...row,id:String(row.id),roleId:String(row.roleId),roleName:roleName(row.role,row.roleName),isActive:Boolean(row.isActive),emailVerified:Boolean(row.emailVerified)});
export async function adminHome(actor:AuthUser) {
  // Este mapa describe rutas implementadas, no otorga permisos ni contiene datos de negocio.
  const paths:Record<string,string>={'pets.view_all':'/admin/patients','users.manage':'/admin/users','roles.manage':'/admin/roles','permissions.manage':'/admin/permissions','veterinarians.manage':'/admin/veterinarians','specialties.manage':'/admin/specialties','professionals.manage':'/admin/professionals','services.manage':'/admin/catalog/services','appointments.view_all':'/admin/agenda','products.create':'/admin/catalog/products','professional_types.manage':'/admin/specialties','products.update':'/admin/catalog/products','products.update_stock':'/admin/products','products.update_price':'/admin/products','categories.manage':'/admin/catalog/categories','promotions.manage':'/admin/catalog/promotions','store.settings.view':'/admin/store-settings','store.settings.manage':'/admin/store-settings','orders.view_all':'/admin/store-orders','store.banners.manage':'/admin/store-banners','settings.general.manage':'/admin/general-information'};
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT p.code,p.name,m.name AS moduleName FROM permissions p JOIN permission_modules m ON m.code=p.module_code ORDER BY m.sort_order,p.id');
  const seen=new Set<string>();const modules: {code:string;name:string;path:string}[]=[];
  for(const row of rows){const path=paths[row.code];if(path==='/admin/patients'&&!actor.permissions?.includes('pets.view_information'))continue;if(path&&actor.permissions?.includes(row.code)&&!seen.has(path)){seen.add(path);modules.push({code:row.code,name:permissionName(row.code,row.name),path});}}
  const result: { modules: typeof modules; storeStats?: { newOrders: number; preparingOrders: number; pendingDelivery: number; ordersInTransit: number; salesTodayCents: number; ordersToday: number; pendingPayments: number; outOfStockProducts: number; lowStockProducts:number; promotionsExpiring?:number; expiredBanners?:number; scheduledBanners?:number }; recentActivity?:{id:string;orderId:string;clientName:string;stateType:string;newStatus:string;occurredAt:string}[] } = {modules};
  if(actor.permissions?.includes('orders.view_all')) {
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT
      SUM(o.store_order_status='PLACED') AS newOrders,
      SUM(o.store_order_status='PROCESSING') AS preparingOrders,
      SUM(o.fulfillment_method='DELIVERY' AND o.store_order_status IN ('PLACED','CONFIRMED','PROCESSING','READY')) AS pendingDelivery,
      SUM(o.store_order_status='IN_TRANSIT') AS ordersInTransit,
      SUM(DATE(CONVERT_TZ(o.created_at,'+00:00','-03:00'))=?) AS ordersToday,
      COALESCE(SUM(CASE WHEN DATE(CONVERT_TZ(o.created_at,'+00:00','-03:00'))=? AND o.store_payment_status='PAID' AND o.store_order_status<>'CANCELLED' THEN o.total_cents ELSE 0 END),0) AS salesTodayCents,
      SUM(o.store_payment_status='PENDING') AS pendingPayments,
      (SELECT COUNT(*) FROM client_products p WHERE p.is_active=1 AND p.stock<=p.reserved_stock) AS outOfStockProducts,
      (SELECT COUNT(*) FROM client_products p WHERE p.is_active=1 AND p.stock>p.reserved_stock AND p.stock-p.reserved_stock<=p.stock_minimum) AS lowStockProducts
      FROM client_orders o WHERE o.is_store_order=1`,[today,today]);
    const row = rows[0] ?? {};
    result.storeStats = { newOrders:Number(row.newOrders??0),preparingOrders:Number(row.preparingOrders??0),pendingDelivery:Number(row.pendingDelivery??0),ordersInTransit:Number(row.ordersInTransit??0),salesTodayCents:Number(row.salesTodayCents??0),ordersToday:Number(row.ordersToday??0),pendingPayments:Number(row.pendingPayments??0),outOfStockProducts:Number(row.outOfStockProducts??0),lowStockProducts:Number(row.lowStockProducts??0) };
    const [activity]=await databasePool.execute<RowDataPacket[]>(`SELECT CAST(h.id AS CHAR) AS id,CAST(o.id AS CHAR) AS orderId,CONCAT(u.first_name,' ',u.last_name) AS clientName,h.state_type AS stateType,h.new_status AS newStatus,h.occurred_at AS occurredAt
      FROM client_order_status_history h JOIN client_orders o ON o.id=h.order_id JOIN users u ON u.id=o.owner_id
      WHERE o.is_store_order=1 ORDER BY h.occurred_at DESC,h.id DESC LIMIT 8`);
    result.recentActivity=activity.map(item=>({...item,id:String(item.id),orderId:String(item.orderId),clientName:String(item.clientName),stateType:String(item.stateType),newStatus:String(item.newStatus),occurredAt:String(item.occurredAt)}));
    if(actor.permissions?.includes('promotions.manage')) {
      const [promotions]=await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM client_promotions WHERE is_active=1 AND ends_at>UTC_TIMESTAMP() AND ends_at<=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY)`);
      result.storeStats.promotionsExpiring=Number(promotions[0]?.total??0);
    }
    if(actor.permissions?.includes('store.banners.manage')) {
      const [banners]=await databasePool.execute<RowDataPacket[]>(`SELECT SUM(is_active=1 AND ends_at IS NOT NULL AND ends_at<=UTC_TIMESTAMP()) AS expired,SUM(is_active=1 AND starts_at IS NOT NULL AND starts_at>UTC_TIMESTAMP()) AS scheduled FROM client_store_banners`);
      result.storeStats.expiredBanners=Number(banners[0]?.expired??0);result.storeStats.scheduledBanners=Number(banners[0]?.scheduled??0);
    }
  }
  return result;
}
export async function adminCatalog(actor:AuthUser) {
  const [roles]=await databasePool.execute<RowDataPacket[]>('SELECT r.id,r.code,r.name,(SELECT COUNT(*) FROM users u WHERE u.role_id=r.id) AS assignedUsers FROM roles r ORDER BY r.name');
  const [permissions]=await databasePool.execute<RowDataPacket[]>('SELECT p.id,p.code,p.name,p.description,p.module_code AS module,m.name AS moduleName,p.is_critical AS critical FROM permissions p JOIN permission_modules m ON m.code=p.module_code ORDER BY m.sort_order,p.id');
  const [grants]=await databasePool.execute<RowDataPacket[]>('SELECT rp.role_id AS roleId,p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id');
  return {roles:roles.map(r=>{const permissions=grants.filter(g=>String(g.roleId)===String(r.id)).map(g=>g.code as string);return {id:String(r.id),code:r.code,name:roleName(r.code,r.name),permissions,assignedUsers:Number(r.assignedUsers??0),
      canAssign:!['VETERINARIAN','SECRETARY'].includes(String(r.code))&&(r.code!=='SUPER_ADMIN'||actor.role==='SUPER_ADMIN')&&Boolean(actor.permissions?.includes('roles.manage'))&&permissions.every(code=>actor.permissions?.includes(code))};}),
    permissions:permissions.map(p=>({...p,id:String(p.id),name:permissionName(p.code,p.name),description:permissionDescription(p.code,p.description),moduleName:permissionModuleName(p.module,p.moduleName),critical:Boolean(p.critical),canDelegate:actor.permissions?.includes(p.code)??false}))};
}
export async function adminUsers(query:Record<string,unknown>) {
  const search=typeof query.search==='string'?query.search.trim():'';const pageText=query.page??'1';const status=query.status??'all';
  if(search.length>150||typeof pageText!=='string'||!/^[1-9]\d{0,5}$/.test(pageText)||!['all','active','inactive'].includes(String(status)))throw new AppError('VALIDATION_ERROR',400,'Revisá los filtros.');
  const page=Number(pageText);const filters:string[]=[];const params:(string|number)[]=[];
  if(search){filters.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');params.push(...Array<string>(3).fill(`%${search}%`));}
  if(status!=='all'){filters.push('u.is_active=?');params.push(status==='active'?1:0);}
  const from=`FROM users u JOIN roles r ON r.id=u.role_id ${filters.length?`WHERE ${filters.join(' AND ')}`:''}`;
  const [count]=await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total ${from}`,params);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${userColumns} ${from} ORDER BY u.last_name,u.first_name,u.id LIMIT 20 OFFSET ${(page-1)*20}`,params);
  return {items:await Promise.all(rows.map(async row=>({...mapUser(row),profilePhotoUrl:await profilePhotoUrl(row.profilePhotoUrl)}))),page,total:Number(count[0].total),hasMore:page*20<Number(count[0].total)};
}
export async function adminUser(id:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${userColumns},i.delivery AS invitationDelivery,i.expires_at AS invitationExpiresAt,i.consumed_at AS invitationConsumedAt
    FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN veterinarian_invitations i ON i.user_id=u.id WHERE u.id=?`,[id]);
  if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');
  const user=mapUser(rows[0]);
  const invitationStatus=rows[0].invitationConsumedAt?'accepted':rows[0].invitationExpiresAt&&new Date(rows[0].invitationExpiresAt).getTime()<=Date.now()?'expired':rows[0].invitationDelivery??null;
  return {...user,profilePhotoUrl:await profilePhotoUrl(rows[0].profilePhotoUrl),invitationStatus,invitationExpiresAt:rows[0].invitationExpiresAt??null,permissions:await readPermissions(id)};
}
export async function updateAdminUserPhoto(identity:AuthUser,id:string,key:string|null) {
  let previous:unknown=null;
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage');
    const [rows]=await c.execute<RowDataPacket[]>("SELECT u.profile_photo_url AS profilePhotoUrl,r.code AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE",[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');
    assertTarget(actor,{id,role:rows[0].role});
    if(!['VETERINARIAN','GROOMER','SECRETARY'].includes(String(rows[0].role)))throw new AppError('VALIDATION_ERROR',400,'La foto de perfil solo está habilitada para el personal de la clínica.');
    previous=rows[0].profilePhotoUrl;
    if(key!==null&&!isProfilePhotoKey(key))throw new AppError('VALIDATION_ERROR',400,'La referencia de la foto no es válida.');
    await c.execute('UPDATE users SET profile_photo_url=? WHERE id=?',[key,id]);
  });
  return {previous};
}
async function roleGrants(c:PoolConnection,id:string) {
  const [roles]=await c.execute<RowDataPacket[]>('SELECT id,code FROM roles WHERE id=?',[id]);if(!roles[0])throw new AppError('VALIDATION_ERROR',400,'El rol no existe.');
  const [permissions]=await c.execute<RowDataPacket[]>('SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=?',[id]);
  return {role:roles[0].code as string,permissions:permissions.map(p=>p.code as string)};
}
export async function createAdminUser(identity:AuthUser,value:unknown) {
  const body=objectBody(value,['firstName','lastName','email','phone','roleId']);
  const input={firstName:readName(body.firstName,'El nombre'),lastName:readName(body.lastName,'El apellido'),email:normalizeEmail(body.email),phone:readPhone(body.phone),roleId:identifier(body.roleId)};
  const unusablePasswordHash=await hashPassword(randomBytes(32).toString('hex'));
  const saved=await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage');const role=await roleGrants(c,input.roleId);
    assertRoleAssignment(actor,role.role,role.permissions);
    await c.execute('INSERT INTO users (role_id,email,password_hash,first_name,last_name,phone,is_active,must_change_password) VALUES (?,?,?,?,?,?,0,1)',[input.roleId,input.email,unusablePasswordHash,input.firstName,input.lastName,input.phone]);
    const [rows]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');const id=String(rows[0].id);
    const token=await saveInvitation(c,id);
    return {id,token,email:input.email};
  });
  const invitationDelivery=await deliverInvitation(saved.email,saved.token,'account');
  return {user:await adminUser(saved.id),invitationDelivery};
}
export async function resendAdminInvitation(identity:AuthUser,id:string) {
  return renewUserInvitation(id,async(c,target)=>{
    const actor=await freshAdmin(c,identity,target.role==='VETERINARIAN'?'veterinarians.manage':'users.manage');
    if(actor.role!=='SUPER_ADMIN')forbidden('Solo el Admin Principal puede reenviar invitaciones.');
    assertTarget(actor,target);
  });
}
export async function updateAdminUser(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['firstName','lastName','phone','roleId','isActive']);
  const firstName=readName(body.firstName,'El nombre');const lastName=readName(body.lastName,'El apellido');const phone=readPhone(body.phone);
  if(typeof body.isActive!=='boolean')throw new AppError('VALIDATION_ERROR',400,'Indicá el estado de la cuenta.');
  const requestedRole=body.roleId===undefined?undefined:identifier(body.roleId);
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'users.manage');
    const [rows]=await c.execute<RowDataPacket[]>('SELECT u.id,u.role_id AS roleId,u.is_active,u.email_verified_at,u.must_change_password,u.first_name AS firstName,u.last_name AS lastName,r.code AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE',[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Usuario no encontrado.');const target=rows[0];assertTarget(actor,{id,role:target.role});
    const roleChanged=requestedRole!==undefined&&requestedRole!==String(target.roleId);const statusChanged=Boolean(target.is_active)!==body.isActive;
    if(statusChanged&&body.isActive&&Number(target.must_change_password)===1&&!target.email_verified_at)throw new AppError('INVITATION_REQUIRED',409,'La cuenta debe activarse desde el enlace de invitación enviado al correo.');
    if(id===actor.id&&(roleChanged||statusChanged))forbidden('No podés cambiar tu propio rol ni desactivar tu propia cuenta.');
    if(roleChanged){if(target.role==='VETERINARIAN')throw new AppError('VET_PROFILE_REQUIRED',400,'No se cambia el rol de un usuario con perfil veterinario.');const role=await roleGrants(c,requestedRole!);assertRoleAssignment(actor,role.role,role.permissions);}
    if(statusChanged&&!body.isActive){const [others]=await c.execute<RowDataPacket[]>("SELECT COUNT(*) AS total FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='SUPER_ADMIN' AND u.is_active=1 AND u.email_verified_at IS NOT NULL AND u.id<>?",[id]);assertAccountDeactivationAllowed({actorId:actor.id,targetId:id,targetRole:String(target.role),activeVerifiedSuperAdmins:Number(others[0]?.total??0)+1});}
    await c.execute('UPDATE users SET first_name=?,last_name=?,phone=?,is_active=?,role_id=?,session_version=session_version+? WHERE id=?',[firstName,lastName,phone,body.isActive,requestedRole??target.roleId,roleChanged||statusChanged?1:0,id]);
    if(statusChanged)await c.execute('INSERT INTO admin_sensitive_action_audit (actor_user_id,action_code,entity_type,entity_id,entity_label,result_code) VALUES (?,?,?,?,?,?)',[actor.id,body.isActive?'USER_ACTIVATED':'USER_DEACTIVATED','USER',id,`${target.firstName} ${target.lastName}`.trim(),'SUCCESS']);
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
    if(role.role==='SECRETARY')throw new AppError('ROLE_RETIRED',400,'El rol Secretaría está retirado; conservá su configuración hasta revisar y migrar sus cuentas.');
    assertTarget(actor,{id,role:role.role});const changed=[...new Set([...role.permissions,...codes])].filter(code=>role.permissions.includes(code)!==codes.includes(code));assertDelegation(actor,changed);
    const [catalog]=await c.execute<RowDataPacket[]>('SELECT id,code,is_critical FROM permissions');
    for(const code of codes){const p=catalog.find(p=>p.code===code);if(!p)throw new AppError('INVALID_PERMISSION',400,'El permiso no existe.');if(p.is_critical&&!['ADMIN','SUPER_ADMIN'].includes(role.role))forbidden('Este rol no admite permisos administrativos.');}
    await c.execute('UPDATE roles SET name=? WHERE id=?',[name,id]);await c.execute('DELETE FROM role_permissions WHERE role_id=?',[id]);
    for(const code of codes)await c.execute('INSERT INTO role_permissions (role_id,permission_id) VALUES (?,?)',[id,catalog.find(p=>p.code===code)!.id]);
    const remaining=await readPermissions(actor.id,c);if(!remaining.some(p=>p.code==='roles.manage'&&p.effective)||!remaining.some(p=>p.code==='permissions.manage'&&p.effective))forbidden('El cambio quitaría tu acceso a la gestión de roles o permisos.');
  });return adminCatalog(identity);
}
export async function deleteCustomRole(identity:AuthUser,id:string) {
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'roles.manage','permissions.manage');
    const [rows]=await c.execute<RowDataPacket[]>('SELECT id,code,name FROM roles WHERE id=? FOR UPDATE',[id]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'Rol no encontrado.');
    const [assigned]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM users WHERE role_id=?',[id]);
    assertCustomRoleDeletable(String(rows[0].code),Number(assigned[0]?.total??0));
    await c.execute('DELETE FROM role_permissions WHERE role_id=?',[id]);
    await c.execute('DELETE FROM roles WHERE id=?',[id]);
    await c.execute('INSERT INTO admin_sensitive_action_audit (actor_user_id,action_code,entity_type,entity_id,entity_label,result_code) VALUES (?,?,?,?,?,?)',[actor.id,'ROLE_DELETED','ROLE',id,String(rows[0].name),'SUCCESS']);
  });
  return {deleted:true};
}
export async function createRole(identity:AuthUser,value:unknown) {
  const body=objectBody(value,['name','permissionCodes']);
  const name=textField(body.name,'El nombre del rol',60);
  if(!Array.isArray(body.permissionCodes)||body.permissionCodes.length>100||body.permissionCodes.some(p=>typeof p!=='string')||new Set(body.permissionCodes).size!==body.permissionCodes.length)throw new AppError('VALIDATION_ERROR',400,'Revisá los permisos del rol.');
  const codes=body.permissionCodes as string[];const code=roleCodeFromName(name);
  if(!/^[A-Z][A-Z0-9_]{0,31}$/.test(code)||['CLIENT','VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN'].includes(code))throw new AppError('VALIDATION_ERROR',400,'El nombre debe producir un código de rol nuevo y válido.');
  await transaction(async c=>{
    const actor=await freshAdmin(c,identity,'roles.manage','permissions.manage');
    if(actor.role!=='SUPER_ADMIN')forbidden('Solo el administrador principal puede crear roles personalizados.');
    assertDelegation(actor,codes);
    const [catalog]=await c.execute<RowDataPacket[]>('SELECT id,code,is_critical FROM permissions');
    for(const permissionCode of codes){
      const permission=catalog.find(item=>item.code===permissionCode);
      if(!permission)throw new AppError('INVALID_PERMISSION',400,'El permiso no existe.');
      if(permission.is_critical)forbidden('Un rol personalizado no puede recibir permisos críticos del administrador principal.');
    }
    const [existing]=await c.execute<RowDataPacket[]>('SELECT id FROM roles WHERE code=? OR name=? LIMIT 1 FOR UPDATE',[code,name]);
    if(existing.length)throw new AppError('ROLE_ALREADY_EXISTS',409,'Ya existe un rol con ese código o nombre.');
    await c.execute('INSERT INTO roles (code,name) VALUES (?,?)',[code,name]);
    const [created]=await c.execute<RowDataPacket[]>('SELECT id FROM roles WHERE code=?',[code]);
    for(const permissionCode of codes)await c.execute('INSERT INTO role_permissions(role_id,permission_id) SELECT ?,id FROM permissions WHERE code=?',[created[0].id,permissionCode]);
  });
  return adminCatalog(identity);
}
export async function adminProducts(query:Record<string,unknown>) {
  const search=typeof query.search==='string'?query.search.trim():'';const pageText=query.page??'1';
  const status=query.status??'all',stock=query.stock??'all',sort=query.sort??'name';
  if(search.length>150||typeof pageText!=='string'||!/^[1-9]\d{0,5}$/.test(pageText)||!['all','active','inactive'].includes(String(status))||!['all','available','out','low'].includes(String(stock))||!['name','price_low','price_high','stock_low','stock_high'].includes(String(sort)))throw new AppError('VALIDATION_ERROR',400,'Revisá los filtros.');
  const filters:string[]=[];const params:(string|number)[]=[];if(search){filters.push('p.name LIKE ?');params.push(`%${search}%`);}if(status!=='all'){filters.push('p.is_active=?');params.push(status==='active'?1:0);}if(stock==='available')filters.push('p.stock>p.reserved_stock');else if(stock==='out')filters.push('p.stock<=p.reserved_stock');else if(stock==='low')filters.push('p.stock>p.reserved_stock AND p.stock-p.reserved_stock<=p.stock_minimum');
  if(query.categoryId){filters.push('p.category_id=?');params.push(clinicValidation.id(query.categoryId));}
  const where=filters.length?`WHERE ${filters.join(' AND ')}`:'';const page=Number(pageText);
  const ordering:Record<string,string>={name:'p.name ASC,p.id',price_low:'p.price_cents ASC,p.name',price_high:'p.price_cents DESC,p.name',stock_low:'(p.stock-p.reserved_stock) ASC,p.name',stock_high:'(p.stock-p.reserved_stock) DESC,p.name'};
  const [count]=await databasePool.execute<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM client_products p ${where}`,params);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT p.id,p.name,p.description,p.image_url AS imageUrl,p.category_id AS categoryId,c.name AS category,p.price_cents AS priceCents,(p.stock-p.reserved_stock) AS stock,p.stock AS physicalStock,p.reserved_stock AS reservedStock,p.stock_minimum AS stockMinimum,p.is_active AS isActive FROM client_products p LEFT JOIN client_product_categories c ON c.id=p.category_id ${where} ORDER BY ${ordering[String(sort)]},p.id LIMIT 20 OFFSET ${(page-1)*20}`,params);
  return {items:rows.map(p=>({...p,id:String(p.id),isActive:Boolean(p.isActive)})),page,total:Number(count[0].total),hasMore:page*20<Number(count[0].total)};
}
export async function updateAdminProduct(identity:AuthUser,id:string,value:unknown) {
  const body=objectBody(value,['name','description','imageUrl','categoryId','isActive','priceCents','stock','stockMinimum','stockReason']);
  if(!Object.keys(body).some(key=>key!=='stockReason'))throw new AppError('VALIDATION_ERROR',400,'No hay cambios para guardar.');
  const assignments:string[]=[];const parameters:(string|number|boolean|null)[]=[];const required=new Set<string>();
  if(body.name!==undefined){assignments.push('name=?');parameters.push(textField(body.name,'El nombre',200));required.add('products.update');}
  if(body.description!==undefined){if(body.description!==null&&(typeof body.description!=='string'||body.description.length>10000))throw new AppError('VALIDATION_ERROR',400,'Revisá la descripción.');assignments.push('description=?');parameters.push(typeof body.description==='string'?body.description.trim()||null:null);required.add('products.update');}
  if(body.imageUrl!==undefined){assignments.push('image_url=?');parameters.push(clinicValidation.productImage(body.imageUrl));required.add('products.update');}
  const categoryId=body.categoryId===undefined?undefined:clinicValidation.optionalId(body.categoryId);
  if(body.categoryId!==undefined){assignments.push('category_id=?');parameters.push(categoryId??null);required.add('products.update');}
  if(body.isActive!==undefined){if(typeof body.isActive!=='boolean')throw new AppError('VALIDATION_ERROR',400,'Indicá el estado del producto.');assignments.push('is_active=?');parameters.push(body.isActive);required.add('products.update');}
  for(const field of ['priceCents','stock','stockMinimum'] as const)if(body[field]!==undefined){const number=body[field];if(typeof number!=='number'||!Number.isSafeInteger(number)||number<0||number>4294967295)throw new AppError('VALIDATION_ERROR',400,'Precio o stock inválido.');assignments.push(`${field==='priceCents'?'price_cents':field==='stock'?'stock':'stock_minimum'}=?`);parameters.push(number);required.add(field==='priceCents'?'products.update_price':'products.update_stock');}
  const stockReason=body.stockReason===undefined?null:textField(body.stockReason,'El motivo del ajuste',250);
  // La modificación heredada reutiliza los grants efectivos y obtiene el actor actualizado desde MySQL.
  return transaction(async c=>{const fresh=await freshPermissionActor(c,identity,...required);if(categoryId){const [categories]=await c.execute<RowDataPacket[]>('SELECT id FROM client_product_categories WHERE id=?',[categoryId]);if(!categories[0])throw new AppError('VALIDATION_ERROR',400,'La categoría seleccionada ya no existe.');}const [rows]=await c.execute<RowDataPacket[]>('SELECT id,stock,reserved_stock AS reservedStock,image_url AS imageUrl FROM client_products WHERE id=? FOR UPDATE',[id]);if(!rows[0])throw new AppError('NOT_FOUND',404,'Producto no encontrado.');if(body.stock!==undefined&&Number(body.stock)<Number(rows[0].reservedStock))throw new AppError('VALIDATION_ERROR',400,'El stock físico no puede ser menor al reservado.');const previousStock=Number(rows[0].stock),nextStock=body.stock===undefined?previousStock:Number(body.stock);if(nextStock!==previousStock&&!stockReason)throw new AppError('VALIDATION_ERROR',400,'Indicá el motivo del ajuste de stock.');
    // La actualización conserva el control de stock y registra el último editor en la misma operación.
    await c.execute(`UPDATE client_products SET ${assignments.join(',')},updated_by=? WHERE id=?`,[...parameters,fresh.id,id]);
    if(nextStock!==previousStock)await c.execute('INSERT INTO client_product_stock_movements(product_id,actor_user_id,quantity_before,quantity_after,quantity_delta,reason) VALUES (?,?,?,?,?,?)',[id,fresh.id,previousStock,nextStock,nextStock-previousStock,stockReason]);
    // El historial solo confirma el nombre de los campos enviados y se revierte si falla el guardado.
    await c.execute('INSERT INTO client_product_change_history(product_id,actor_user_id,action,changed_fields) VALUES (?,?,?,?)',[id,fresh.id,'UPDATED',JSON.stringify(Object.keys(body))]);
    // El servicio elimina la imagen previa únicamente después de que la transacción confirme el cambio.
    return {updated:true,previousImage:rows[0].imageUrl};});
}
export async function adminProductStockMovements(identity:AuthUser,id:string) {
 const rows=await transaction(async c=>{await freshPermissionActor(c,identity,'products.update_stock');const [product]=await c.execute<RowDataPacket[]>('SELECT id,name,stock,stock_minimum AS stockMinimum,reserved_stock AS reservedStock FROM client_products WHERE id=?',[id]);if(!product[0])throw new AppError('NOT_FOUND',404,'Producto no encontrado.');const [movements]=await c.execute<RowDataPacket[]>('SELECT m.id,m.quantity_before AS quantityBefore,m.quantity_after AS quantityAfter,m.quantity_delta AS quantityDelta,m.reason,m.created_at AS createdAt,CONCAT(u.first_name,\' \',u.last_name) AS actorName FROM client_product_stock_movements m JOIN users u ON u.id=m.actor_user_id WHERE m.product_id=? ORDER BY m.created_at DESC,m.id DESC LIMIT 100',[id]);return {product:{id:String(product[0].id),name:String(product[0].name),stock:Number(product[0].stock),stockMinimum:Number(product[0].stockMinimum),reservedStock:Number(product[0].reservedStock)},items:movements};});
 return rows;
}
export async function adminProductCategories(identity:AuthUser) {
  if(!['products.update','products.update_stock','products.update_price'].some(code=>identity.permissions?.includes(code)))forbidden();
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id,name FROM client_product_categories WHERE is_active=1 ORDER BY name');
  return {categories:rows.map(row=>({id:String(row.id),name:String(row.name)}))};
}
