/**
 * Migración aditiva para enlazar consultas con turnos y separar notas privadas.
 * No transforma ni borra registros clínicos existentes.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

type Column = { table: string; name: string; type: string; nullable: 'YES'|'NO'; length?:number; sql: string };
const columns: Column[] = [
  { table:'client_clinical_records',name: 'internal_notes', type: 'text', nullable: 'YES', sql: 'TEXT NULL' },
  { table:'client_clinical_records',name: 'appointment_id', type: 'bigint', nullable: 'YES', sql: 'BIGINT UNSIGNED NULL' },
  { table:'client_clinical_records',name: 'dose', type: 'varchar', nullable: 'YES', length:255,sql: 'VARCHAR(255) NULL' },
  { table:'client_clinical_records',name: 'frequency', type: 'varchar', nullable: 'YES', length:255,sql: 'VARCHAR(255) NULL' },
  { table:'client_clinical_records',name: 'duration', type: 'varchar', nullable: 'YES', length:255,sql: 'VARCHAR(255) NULL' },
  { table:'veterinarians',name:'professional_description',type:'varchar',nullable:'YES',length:2000,sql:'VARCHAR(2000) NULL' },
];

async function migrate(): Promise<void> {
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      const [tables] = await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('client_clinical_records','client_appointments','veterinarians')");
      if (tables.length !== 3) throw new Error('Se requieren client_clinical_records, client_appointments y veterinarians antes de aplicar esta migración.');
      for (const column of columns) {
        const [found] = await connection.execute<(RowDataPacket & { DATA_TYPE: string; IS_NULLABLE: string; COLUMN_TYPE: string; CHARACTER_MAXIMUM_LENGTH:number|null })[]>(
          'SELECT DATA_TYPE,IS_NULLABLE,COLUMN_TYPE,CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [column.table,column.name]);
        if (found[0]) {
          const appointmentTypeIsUnsigned=/^bigint(?:\(\d+\))? unsigned$/i.test(found[0].COLUMN_TYPE);
          if (found[0].DATA_TYPE !== column.type || found[0].IS_NULLABLE !== column.nullable || (column.name === 'appointment_id' && !appointmentTypeIsUnsigned) || (column.length!==undefined&&Number(found[0].CHARACTER_MAXIMUM_LENGTH)!==column.length)) {
            throw new Error(`${column.table}.${column.name} existe con una definición incompatible.`);
          }
        } else {
          await connection.execute(`ALTER TABLE ${column.table} ADD COLUMN ${column.name} ${column.sql}`);
        }
      }
      const [indexes] = await connection.execute<RowDataPacket[]>("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_clinical_records' AND INDEX_NAME='uq_clinical_appointment'");
      if (!indexes.length) await connection.execute('ALTER TABLE client_clinical_records ADD UNIQUE KEY uq_clinical_appointment (appointment_id)');
      const [foreignKeys] = await connection.execute<RowDataPacket[]>("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='client_clinical_records' AND COLUMN_NAME='appointment_id' AND REFERENCED_TABLE_NAME='client_appointments' AND REFERENCED_COLUMN_NAME='id'");
      if (!foreignKeys.length) await connection.execute('ALTER TABLE client_clinical_records ADD CONSTRAINT fk_clinical_appointment FOREIGN KEY (appointment_id) REFERENCES client_appointments(id) ON DELETE SET NULL ON UPDATE RESTRICT');
      console.info('Migración clínica veterinaria aplicada; los datos existentes se conservaron.');
    });
  } finally { connection.release(); }
}

if (require.main === module) void migrate().catch(error => {
  console.error(error instanceof Error && /incompatible|Se requieren/.test(error.message) ? error.message : 'No se pudo aplicar la migración clínica veterinaria. Revisá el esquema y la conexión antes de reintentar.');
  process.exitCode = 1;
}).finally(() => databasePool.end());
