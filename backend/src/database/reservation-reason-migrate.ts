// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Agrega el motivo opcional a cada cambio de estado de reserva existente. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

// Función migrateReservationReason: concentra la lógica dentro de este módulo.
export async function migrateReservationReason() {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      const [tables] = await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_order_status_history'");
      if (!tables.length) throw new Error('No existe el historial de reservas. Prepará primero la ampliación de reservas.');
      const [columns] = await connection.execute<(RowDataPacket & { DATA_TYPE: string; CHARACTER_MAXIMUM_LENGTH: number | null; IS_NULLABLE: string })[]>("SELECT DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_order_status_history' AND COLUMN_NAME='reason'");
      if (columns[0]) {
        if (columns[0].DATA_TYPE !== 'varchar' || Number(columns[0].CHARACTER_MAXIMUM_LENGTH) !== 500 || columns[0].IS_NULLABLE !== 'YES') throw new Error('El motivo de reserva existe con una definición incompatible.');
        console.info('El historial de reservas ya admite motivos.');
        return;
      }
      await connection.execute("ALTER TABLE client_order_status_history ADD COLUMN reason VARCHAR(500) NULL COMMENT 'Motivo informado para cancelar una reserva.'");
      console.info('Historial de reservas preparado para conservar los motivos.');
    });
  } finally { connection.release(); }
}

if (require.main === module) void migrateReservationReason().catch(error => {
  console.error(error instanceof Error && (error.message.includes('incompatible') || error.message.startsWith('No existe')) ? error.message : 'No se pudieron preparar los motivos de reserva. Revisá la conexión y los permisos de la base de datos.');
  process.exitCode = 1;
}).finally(() => databasePool.end());
