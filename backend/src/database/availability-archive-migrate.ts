/** Agrega un indicador para retirar horarios desactivados de la lista sin borrar sus registros. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

export async function migrateAvailabilityArchive() {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      const [tables] = await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots'");
      if (!tables.length) throw new Error('No existe client_appointment_slots; aplicá primero el esquema base.');
      const [columns] = await connection.execute<(RowDataPacket & { DATA_TYPE: string; COLUMN_TYPE: string; IS_NULLABLE: string; COLUMN_DEFAULT: string | null })[]>("SELECT DATA_TYPE,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots' AND COLUMN_NAME='is_archived'");
      if (columns.length) {
        const column = columns[0];
        if (column.DATA_TYPE !== 'tinyint' || column.IS_NULLABLE !== 'NO' || Number(column.COLUMN_DEFAULT) !== 0) throw new Error('client_appointment_slots.is_archived existe con una definición incompatible.');
        console.info('client_appointment_slots.is_archived ya está preparado.');
        return;
      }
      await connection.execute('ALTER TABLE client_appointment_slots ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active');
      console.info('Migración aplicada: client_appointment_slots.is_archived. No se eliminaron turnos existentes.');
    });
  } finally {
    connection.release();
  }
}

if (require.main === module) void migrateAvailabilityArchive().catch(error => {
  console.error(error instanceof Error && (error.message.startsWith('No existe') || error.message.includes('incompatible')) ? error.message : 'No se preparó el archivo de horarios. Revisá conexión y permisos MySQL.');
  process.exitCode = 1;
}).finally(() => databasePool.end());
