/**
 * ARCHIVO: user-deletion-migrate.ts
 * UBICACIÓN: backend/src/database/user-deletion-migrate.ts
 * FUNCIÓN: Añade campos y restricciones para baja lógica de usuarios.
 * RESPONSABILIDAD: Comprueba esquema y aplica columnas necesarias para conservar estado de baja/control temporal.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Migration runner → MySQL y user.repository/auth middleware.
 * IMPORTANCIA: Permite desactivar/eliminar acceso sin perder relaciones históricas.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

/** Comprueba y aplica los campos de baja lógica de cuenta si el esquema aún no los tiene. */
export async function migrateUserDeletion() {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      const [tables] = await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'");
      if (!tables.length) throw new Error('No existe users; aplicá primero el esquema base.');
      const [columns] = await connection.execute<(RowDataPacket & { DATA_TYPE: string; DATETIME_PRECISION: number | null; IS_NULLABLE: string })[]>("SELECT DATA_TYPE,DATETIME_PRECISION,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='deleted_at'");
      if (columns.length) {
        const column = columns[0];
        if (column.DATA_TYPE !== 'datetime' || Number(column.DATETIME_PRECISION) !== 3 || column.IS_NULLABLE !== 'YES') throw new Error('users.deleted_at existe con una definición incompatible.');
        console.info('users.deleted_at ya está preparado.');
        return;
      }
      await connection.execute('ALTER TABLE users ADD COLUMN deleted_at DATETIME(3) NULL DEFAULT NULL AFTER is_active');
      console.info('Migración aplicada: users.deleted_at. No se borraron ni modificaron usuarios existentes.');
    });
  } finally {
    connection.release();
  }
}

if (require.main === module) void migrateUserDeletion().catch(error => {
  console.error(error instanceof Error && (error.message.startsWith('No existe users') || error.message.includes('incompatible')) ? error.message : 'No se preparó el retiro lógico de usuarios. Revisá conexión y permisos ALTER.');
  process.exitCode = 1;
}).finally(() => databasePool.end());
