/**
 * ARCHIVO: appointment-details-migrate.ts
 * UBICACIÓN: backend/src/database/appointment-details-migrate.ts
 * FUNCIÓN: Migra columnas de detalle y observaciones de los turnos clínicos.
 * RESPONSABILIDAD: Detecta columnas pendientes y aplica cambios SQL necesarios para guardar datos ampliados de turnos.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: backend/src/database/clinic-schema-migrate.ts
 * FUNCIONAMIENTO: Se invoca desde el runner de migraciones y usa databasePool/error handling de la capa de datos.
 * IMPORTANCIA: Alinea el esquema existente con los campos que consumen los turnos clínicos.
 */
/** Agrega motivo de cancelación y observaciones sin cambiar turnos existentes. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

/** Comprueba columnas de detalles clínicos y agrega las que falten sin sobrescribir el contenido existente. */
export async function migrateAppointmentDetails() {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      const [tables] = await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointments'");
      if (!tables.length) throw new Error('No existe el esquema de turnos. Prepará la clínica antes de aplicar esta mejora.');
      const columns = [
        { name: 'cancellation_reason', dataType: 'varchar', length: 500, sql: 'VARCHAR(500) NULL' },
        { name: 'observations', dataType: 'text', length: null, sql: 'TEXT NULL' },
      ];
      for (const expected of columns) {
        const [rows] = await connection.execute<(RowDataPacket & { DATA_TYPE: string; CHARACTER_MAXIMUM_LENGTH: number | null; IS_NULLABLE: string })[]>("SELECT DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointments' AND COLUMN_NAME=?", [expected.name]);
        if (rows[0]) {
          if (rows[0].DATA_TYPE !== expected.dataType || rows[0].IS_NULLABLE !== 'YES' || (expected.length !== null && Number(rows[0].CHARACTER_MAXIMUM_LENGTH) !== expected.length)) throw new Error(`client_appointments.${expected.name} existe con una definición incompatible.`);
          continue;
        }
        await connection.execute(`ALTER TABLE client_appointments ADD COLUMN ${expected.name} ${expected.sql}`);
      }
      console.info('Turnos preparados para guardar observaciones y motivos de cancelación.');
    });
  } finally { connection.release(); }
}

if (require.main === module) void migrateAppointmentDetails().catch(error => {
  console.error(error instanceof Error && error.message.includes('incompatible') || error instanceof Error && error.message.startsWith('No existe') ? error.message : 'No se pudieron preparar los detalles de turnos. Revisá la conexión y los permisos de la base de datos.');
  process.exitCode = 1;
}).finally(() => databasePool.end());
