/** Grants the existing patient update capability to the four staff roles authorized by the owner. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

const authorizedRoles = ['VETERINARIAN', 'GROOMER', 'ADMIN', 'SUPER_ADMIN'] as const;

async function main() {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      await connection.beginTransaction();
      try {
        const [basePermissions] = await connection.execute<RowDataPacket[]>(
          "SELECT module_code AS moduleCode FROM permissions WHERE code='pets.view_information' FOR UPDATE",
        );
        if (basePermissions.length !== 1) {
          throw new Error('No se encontró pets.view_information para ubicar pets.update en el catálogo; no se asignó ningún acceso.');
        }
        await connection.execute(
          "INSERT IGNORE INTO permissions(code,name,description,module_code,is_critical,opens_module) VALUES ('pets.update','Crear y actualizar pacientes','Crear pacientes, editar su información y cambiar su estado clínico',?,0,0)",
          [basePermissions[0].moduleCode],
        );
        const [permissions] = await connection.execute<(RowDataPacket & { id: string })[]>(
          "SELECT CAST(id AS CHAR) AS id FROM permissions WHERE code='pets.update' FOR UPDATE",
        );
        if (permissions.length !== 1) throw new Error('No se pudo registrar pets.update; no se asignó ningún acceso.');

        const [roles] = await connection.execute<(RowDataPacket & { id: string; code: string })[]>(
          'SELECT CAST(id AS CHAR) AS id,code FROM roles WHERE code IN (?,?,?,?) FOR UPDATE',
          [...authorizedRoles],
        );
        const foundRoles = new Set(roles.map(role => role.code));
        const missingRoles = authorizedRoles.filter(code => !foundRoles.has(code));
        if (missingRoles.length) {
          throw new Error(`No se asignó pets.update; faltan roles requeridos: ${missingRoles.join(', ')}.`);
        }

        let added = 0;
        for (const role of roles) {
          const [result] = await connection.execute(
            'INSERT IGNORE INTO role_permissions(role_id,permission_id) VALUES (?,?)',
            [role.id, permissions[0].id],
          );
          added += (result as { affectedRows?: number }).affectedRows ?? 0;
        }
        await connection.commit();
        console.info(`Permiso pets.update verificado para los cuatro roles autorizados; nuevas asignaciones: ${added}.`);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    });
  } finally {
    connection.release();
    await databasePool.end();
  }
}

void main().catch(error => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string' ? error.code : undefined;
  if (error instanceof Error && /^(No se encontró pets\.view_information|No se pudo registrar pets\.update|No se asignó pets\.update)/.test(error.message)) {
    console.error(error.message);
  } else if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    console.error(`No se pudo resolver DB_HOST por DNS (${code}). Revisá que backend/.env tenga el host vigente y que la red/VPN pueda resolverlo. La base no se modificó.`);
  } else if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    console.error(`No se pudo conectar a MySQL (${code}). Revisá DB_HOST, DB_PORT y las reglas de acceso de la base. La base no se modificó.`);
  } else if (code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL rechazó DB_USER/DB_PASSWORD. Revisá las credenciales configuradas; la base no se modificó.');
  } else {
    console.error(`No se actualizaron los permisos de pacientes${code ? ` (${code})` : ''}. Revisá el esquema y la conexión; la base no se modificó.`);
  }
  process.exitCode = 1;
});
