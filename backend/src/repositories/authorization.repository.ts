/**
 * ARCHIVO: authorization.repository.ts
 * UBICACIÓN: backend/src/repositories/authorization.repository.ts
 * FUNCIÓN: Lectura de permisos efectivos y perfil profesional asociados a una identidad.
 * RESPONSABILIDAD: Consulta rol, permisos heredados/overrides y perfil de veterinario; convierte los resultados en contratos de autorización del backend.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/types/authorization.ts, backend/src/types/authorization.ts, backend/src/utils/catalog-presentation.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/session.service.ts
 * FUNCIONAMIENTO: auth.middleware y session.service → authorizationData/readPermissions; repositories de clínica/admin reutilizan la misma fuente.
 * IMPORTANCIA: Permite verificar autorización con datos actuales de MySQL, no con valores obsoletos del cliente.
 */
/** MySQL es la fuente de verdad; no se cachean permisos dentro del JWT. */
import type { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { runDatabaseOperation } from '../utils/database-error';
import type { Permission, VetProfile } from '../types/authorization';
import { effectiveRolePermission } from '../types/authorization';
import { catalogName, permissionDescription, permissionName } from '../utils/catalog-presentation';

/** Lee permisos del usuario, combinando permisos del rol y overrides persistidos. */
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
      return { code: row.code, name: permissionName(row.code, row.name), description: permissionDescription(row.code, row.description), module: row.module_code, inherited, override,
        // CLIENT/VETERINARIAN no reciben permisos administrativos por overrides maliciosos.
        // ADMIN y SUPER_ADMIN necesitan grants reales; el rol jamás concede por sí solo.
        effective: effectiveRolePermission(row.role,Number(row.is_critical)===1,inherited,override) };
    });
  });
}
/** Obtiene el perfil profesional ligado al usuario o devuelve null si no existe. */
export async function readVetProfile(userId: string): Promise<VetProfile | null> {
  return runDatabaseOperation(async () => {
    const [profiles] = await databasePool.execute<RowDataPacket[]>('SELECT id,license_number,professional_description AS professionalDescription FROM veterinarians WHERE user_id=?',[userId]);
    if (!profiles[0]) return null;
    const [specialties] = await databasePool.execute<RowDataPacket[]>(`SELECT s.id,s.name FROM specialties s
      JOIN veterinarian_specialties vs ON vs.specialty_id=s.id WHERE vs.veterinarian_id=? ORDER BY s.name`,[profiles[0].id]);
    return { id: String(profiles[0].id), licenseNumber: profiles[0].license_number,professionalDescription:profiles[0].professionalDescription as string|null,
      specialties: specialties.map(s => ({ id: String(s.id), name: catalogName(s.name) })) };
  });
}
/** Construye los datos actuales de autorización, rol y perfil que requiere middleware/sesión. */
export async function authorizationData(userId: string) {
  const [permissions, veterinarian] = await Promise.all([readPermissions(userId),readVetProfile(userId)]);
  let professional:null|{typeId:string;name:string;isClinical:boolean;serviceIds:string[]}=null;
  const [types]=await databasePool.execute<RowDataPacket[]>('SELECT pt.id,pt.name,pt.is_clinical FROM users u JOIN professional_types pt ON pt.id=COALESCE((SELECT chosen.id FROM professional_types chosen WHERE chosen.id=u.professional_type_id AND chosen.role_id=u.role_id),(SELECT default_role.professional_type_id FROM roles default_role WHERE default_role.id=u.role_id)) WHERE u.id=?',[userId]);
  if(types[0]){const [services]=await databasePool.execute<RowDataPacket[]>('SELECT service_id FROM professional_services WHERE user_id=?',[userId]);professional={typeId:String(types[0].id),name:catalogName(types[0].name),isClinical:Boolean(types[0].is_clinical),serviceIds:services.map(s=>String(s.service_id))};}
  return { permissions: permissions.filter(p => p.effective).map(p => p.code), veterinarian,professional };
}
