/** MySQL es la fuente de verdad; no se cachean permisos dentro del JWT. */
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { runDatabaseOperation } from '../utils/database-error';
import type { Permission, VetProfile } from '../types/authorization';
import { effectivePermission } from '../types/authorization';

export async function readPermissions(userId: string, connection?: PoolConnection): Promise<Permission[]> {
  return runDatabaseOperation(async () => {
    const [rows] = await (connection ?? databasePool).execute<RowDataPacket[]>(`SELECT p.code,p.name,p.description,p.module_code,p.is_critical,r.code AS role,
      rp.permission_id IS NOT NULL AS inherited,up.allowed AS override_value
      FROM users u JOIN roles r ON r.id=u.role_id CROSS JOIN permissions p
      LEFT JOIN role_permissions rp ON rp.role_id=u.role_id AND rp.permission_id=p.id
      LEFT JOIN user_permissions up ON up.user_id=u.id AND up.permission_id=p.id
      WHERE u.id=? ORDER BY p.module_code,p.id`, [userId]);
    return rows.map(row => {
      const inherited = Boolean(row.inherited);
      const override = row.override_value === null ? null : Boolean(row.override_value);
      return { code: row.code, name: row.name, description: row.description, module: row.module_code, inherited, override,
        // Invariante adicional: un permiso crítico nunca es efectivo fuera de SUPER_ADMIN,
        // incluso si una carga SQL errónea introdujo un override o un grant de rol.
        effective: (!row.is_critical || row.role==='SUPER_ADMIN') && effectivePermission(inherited, override) };
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
export async function authorizationData(userId: string) {
  const [permissions, veterinarian] = await Promise.all([readPermissions(userId),readVetProfile(userId)]);
  return { permissions: permissions.filter(p => p.effective).map(p => p.code), veterinarian };
}
