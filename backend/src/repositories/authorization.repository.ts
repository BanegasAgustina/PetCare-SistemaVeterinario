/** MySQL es la fuente de verdad; no se cachean permisos dentro del JWT. */
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { runDatabaseOperation } from '../utils/database-error';
import type { Permission, VetProfile } from '../types/authorization';
import { effectiveRolePermission } from '../types/authorization';

export async function readPermissions(userId: string, connection?: PoolConnection): Promise<Permission[]> {
  return runDatabaseOperation(async () => {
    const [rows] = await (connection ?? databasePool).execute<RowDataPacket[]>(`SELECT p.code,p.name,p.description,p.module_code,p.is_critical,r.code AS role,
      rp.permission_id IS NOT NULL AS inherited,up.allowed AS override_value
      FROM users u JOIN roles r ON r.id=u.role_id CROSS JOIN permissions p
      LEFT JOIN role_permissions rp ON rp.role_id=u.role_id AND rp.permission_id=p.id
      LEFT JOIN user_permissions up ON up.user_id=u.id AND up.permission_id=p.id
      WHERE u.id=? ORDER BY p.module_code,p.id`, [userId]);
    return rows.map(row => {
      const inherited = Number(row.inherited)===1;
      const override = row.override_value === null ? null : Number(row.override_value)===1;
      return { code: row.code, name: row.name, description: row.description, module: row.module_code, inherited, override,
        // CLIENT/VETERINARIAN no reciben permisos administrativos por overrides maliciosos.
        // ADMIN y SUPER_ADMIN necesitan grants reales; el rol jamás concede por sí solo.
        effective: effectiveRolePermission(row.role,Number(row.is_critical)===1,inherited,override) };
    });
  });
}
export async function readVetProfile(userId: string): Promise<VetProfile | null> {
  return runDatabaseOperation(async () => {
    const [profiles] = await databasePool.execute<RowDataPacket[]>('SELECT id,license_number FROM veterinarians WHERE user_id=?',[userId]);
    if (!profiles[0]) return null;
    const [specialties] = await databasePool.execute<RowDataPacket[]>(`SELECT s.id,s.name FROM specialties s
      JOIN veterinarian_specialties vs ON vs.specialty_id=s.id WHERE vs.veterinarian_id=? ORDER BY s.name`,[profiles[0].id]);
    return { id: String(profiles[0].id), licenseNumber: profiles[0].license_number,
      specialties: specialties.map(s => ({ id: String(s.id), name: s.name })) };
  });
}
export async function authorizationData(userId: string,role?:string) {
  const [permissions, veterinarian] = await Promise.all([readPermissions(userId),readVetProfile(userId)]);
  let professional:null|{typeId:string;name:string;isClinical:boolean;serviceIds:string[]}=null;
  if(role==='VETERINARIAN'||role==='GROOMER') {
    const [types]=await databasePool.execute<RowDataPacket[]>('SELECT pt.id,pt.name,pt.is_clinical FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) WHERE u.id=?',[userId]);
    if(types[0]){const [services]=await databasePool.execute<RowDataPacket[]>('SELECT service_id FROM professional_services WHERE user_id=?',[userId]);professional={typeId:String(types[0].id),name:types[0].name,isClinical:Boolean(types[0].is_clinical),serviceIds:services.map(s=>String(s.service_id))};}
  }
  return { permissions: permissions.filter(p => p.effective).map(p => p.code), veterinarian,professional };
}
