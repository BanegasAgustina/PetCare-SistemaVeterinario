/** Adopta el esquema clínico existente con validación y DDL mínimo reanudable. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env } from '../config/env';
import { withDatabaseLock } from './lock';

export const RECONCILIATION_VERSION = '002_adopt_existing_clinic_schema.sql';
export const HISTORICAL_VERSION = '001_connected_clinic.sql';
const MIGRATION_PATH = resolve(process.cwd(), 'clinic-migrations', RECONCILIATION_VERSION);

type IndexRow = RowDataPacket & { TABLE_NAME: string; INDEX_NAME: string; NON_UNIQUE: number | string; SEQ_IN_INDEX: number | string; COLUMN_NAME: string };
type ForeignKeyRow = RowDataPacket & { COLUMN_NAME: string; REFERENCED_TABLE_NAME: string; REFERENCED_COLUMN_NAME: string };
type Queryable = Pick<PoolConnection, 'execute' | 'query'>;
export type IndexSpec = { name: string; unique: boolean; columns: string[] };
export type ReconcilePlan = { addSupportIndex: boolean; dropHistoricalUnique: boolean };

export function decideLedgerAction(entry: { checksum: string; state: string } | undefined, checksum: string, historicalRecorded: boolean): 'start' | 'resume' | 'skip' {
  if (entry && entry.checksum !== checksum) throw new Error('El checksum de 002 no coincide con el historial; se aborta.');
  if (historicalRecorded) throw new Error('Existe un registro de 001; revisar manualmente la historia antes de adoptar 002.');
  if (!entry) return 'start';
  if (entry.state === 'applied') return 'skip';
  if (entry.state === 'running') return 'resume';
  throw new Error(`Estado de 002 no reconocido: ${entry.state}.`);
}

export function planIndexReconciliation(indexes: IndexSpec[], foreignKeyExists: boolean, duplicatePairs: number): ReconcilePlan {
  if (duplicatePairs !== 0) throw new Error('Hay pares veterinarian_id + starts_at duplicados; se aborta sin cambios.');
  const exactOld = indexes.find((index) => index.name === 'veterinarian_start');
  if (exactOld && (!exactOld.unique || exactOld.columns.join(',') !== 'veterinarian_id,starts_at')) {
    throw new Error('veterinarian_start existe con definición distinta de UNIQUE(veterinarian_id, starts_at).');
  }
  if (exactOld && !foreignKeyExists) throw new Error('Falta la FK veterinaria esperada; no se altera veterinarian_start.');
  const hasSupport = indexes.some((index) => !index.unique && index.columns[0] === 'veterinarian_id');
  const hasNamedHistory = indexes.some((index) => index.name === 'veterinarian_history' && !index.unique && index.columns.join(',') === 'veterinarian_id');
  return { addSupportIndex: !hasSupport && !hasNamedHistory, dropHistoricalUnique: Boolean(exactOld) };
}

async function rows<T extends RowDataPacket>(connection: Queryable, sql: string, values: unknown[] = []): Promise<T[]> {
  const [result] = await connection.execute<T[]>(sql, values as (string | number | boolean | null)[]);
  return result;
}

async function assertPreflight(connection: Queryable, expectedDatabase: string): Promise<{ plan: ReconcilePlan; rowCount: number; duplicatePairs: number }> {
  const [database] = await rows<RowDataPacket & { db: string }>(connection, 'SELECT DATABASE() AS db');
  if (!database?.db || database.db !== expectedDatabase || database.db !== env.database.database) {
    throw new Error(`Base conectada inesperada (${database?.db ?? 'ninguna'}); configuración: ${env.database.database}.`);
  }
  const tableNames = ['client_appointment_slots', 'veterinarians', 'client_appointments'];
  const existingTables = await rows<RowDataPacket & { TABLE_NAME: string }>(connection,
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${tableNames.map(() => '?').join(',')})`, tableNames);
  if (new Set(existingTables.map((row) => row.TABLE_NAME)).size !== tableNames.length) throw new Error('Falta una tabla clínica requerida; no se modifica el esquema.');

  const columns = await rows<RowDataPacket & { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string; EXTRA: string }>(connection,
    "SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND ((TABLE_NAME='client_appointment_slots' AND COLUMN_NAME IN ('id','veterinarian_id','professional_user_id','starts_at','active_start')) OR (TABLE_NAME='client_appointments' AND COLUMN_NAME IN ('slot_id','occupied_slot_id')) OR (TABLE_NAME='veterinarians' AND COLUMN_NAME='id'))");
  const column = (table: string, name: string) => columns.find((item) => item.TABLE_NAME === table && item.COLUMN_NAME === name);
  const checks: Array<[string, string, (item: typeof columns[number]) => boolean]> = [
    ['client_appointment_slots', 'veterinarian_id', (item) => item.COLUMN_TYPE === 'bigint unsigned'],
    ['client_appointment_slots', 'id', (item) => item.COLUMN_TYPE === 'bigint unsigned'],
    ['client_appointment_slots', 'professional_user_id', (item) => item.COLUMN_TYPE === 'bigint unsigned'],
    ['client_appointment_slots', 'starts_at', (item) => item.COLUMN_TYPE === 'datetime'],
    ['client_appointment_slots', 'active_start', (item) => item.EXTRA.toLowerCase().includes('generated')],
    ['client_appointments', 'slot_id', (item) => item.COLUMN_TYPE === 'bigint unsigned'],
    ['client_appointments', 'occupied_slot_id', (item) => item.EXTRA.toLowerCase().includes('generated')],
    ['veterinarians', 'id', (item) => item.COLUMN_TYPE === 'bigint unsigned'],
  ];
  for (const [table, name, valid] of checks) {
    const found = column(table, name);
    if (!found || !valid(found)) throw new Error(`Definición inesperada de ${table}.${name}; se aborta sin cambios.`);
  }
  const veterinarianIdColumn = column('client_appointment_slots', 'veterinarian_id');
  if (veterinarianIdColumn?.IS_NULLABLE !== 'YES') throw new Error('client_appointment_slots.veterinarian_id debe aceptar NULL según el esquema clínico actual.');

  const foreignKeys = await rows<ForeignKeyRow>(connection,
    "SELECT COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots' AND COLUMN_NAME='veterinarian_id' AND REFERENCED_TABLE_NAME='veterinarians' AND REFERENCED_COLUMN_NAME='id'");
  const fkExists = foreignKeys.length > 0;
  if (!fkExists) throw new Error('No existe la FK client_appointment_slots.veterinarian_id → veterinarians.id.');
  const startsAtForeignKeys = await rows<ForeignKeyRow>(connection,
    "SELECT COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots' AND COLUMN_NAME='starts_at' AND REFERENCED_TABLE_NAME IS NOT NULL");
  if (startsAtForeignKeys.length) throw new Error('Una FK utiliza starts_at; no es seguro eliminar veterinarian_start.');

  const indexRows = await rows<IndexRow>(connection,
    "SELECT TABLE_NAME,INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('client_appointment_slots','client_appointments') ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX");
  const grouped = new Map<string, IndexSpec>();
  for (const row of indexRows.filter((item) => item.TABLE_NAME === 'client_appointment_slots')) {
    const found = grouped.get(row.INDEX_NAME) ?? { name: row.INDEX_NAME, unique: Number(row.NON_UNIQUE) === 0, columns: [] };
    if (found.unique !== (Number(row.NON_UNIQUE) === 0)) throw new Error(`Metadatos inconsistentes para índice ${row.INDEX_NAME}.`);
    found.columns[Number(row.SEQ_IN_INDEX) - 1] = row.COLUMN_NAME;
    grouped.set(row.INDEX_NAME, found);
  }
  const counts = await rows<RowDataPacket & { row_count: number | string; duplicate_pairs: number | string }>(connection,
    'SELECT (SELECT COUNT(*) FROM client_appointment_slots) AS row_count, (SELECT COUNT(*) FROM (SELECT veterinarian_id, starts_at FROM client_appointment_slots GROUP BY veterinarian_id, starts_at HAVING COUNT(*) > 1) d) AS duplicate_pairs');
  const rowCount = Number(counts[0]?.row_count ?? 0);
  const duplicatePairs = Number(counts[0]?.duplicate_pairs ?? 0);
  const plan = planIndexReconciliation([...grouped.values()], fkExists, duplicatePairs);
  const appointmentIndexes = new Map<string, IndexSpec>();
  for (const row of indexRows.filter((item) => item.TABLE_NAME === 'client_appointments')) {
    const found = appointmentIndexes.get(row.INDEX_NAME) ?? { name: row.INDEX_NAME, unique: Number(row.NON_UNIQUE) === 0, columns: [] };
    found.columns[Number(row.SEQ_IN_INDEX) - 1] = row.COLUMN_NAME;
    appointmentIndexes.set(row.INDEX_NAME, found);
  }
  const hasEquivalent = (unique: boolean, columnName: string) => [...appointmentIndexes.values()].some((index) => index.unique === unique && index.columns.join(',') === columnName);
  if (!hasEquivalent(true, 'occupied_slot_id') || !hasEquivalent(false, 'slot_id')) {
    throw new Error('client_appointments no conserva los índices funcionales esperados (occupied_slot_id y slot_id).');
  }
  const appointmentFk = await rows<ForeignKeyRow>(connection,
    "SELECT COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointments' AND COLUMN_NAME='slot_id' AND REFERENCED_TABLE_NAME='client_appointment_slots' AND REFERENCED_COLUMN_NAME='id'");
  if (!appointmentFk.length) throw new Error('Falta la FK client_appointments.slot_id → client_appointment_slots.id.');
  const slotIndexes = [...grouped.values()];
  const hasUniqueProfessionalStart = slotIndexes.some((index) => index.unique && index.columns.join(',') === 'professional_user_id,active_start');
  if (!hasUniqueProfessionalStart) throw new Error('No existe índice único equivalente para professional_user_id + active_start.');
  console.log(`Preflight de solo lectura: ${rowCount} slots; ${duplicatePairs} pares duplicados; ` +
    `${grouped.has('veterinarian_start') ? 'veterinarian_start presente' : 'veterinarian_start ausente'}.`);
  return { plan, rowCount, duplicatePairs };
}

async function readLedger(connection: Queryable, checksum: string) {
  const ledger = await rows<RowDataPacket & { version: string; checksum: string; state: string }>(connection,
    'SELECT version,checksum,state FROM clinic_schema_migrations WHERE version IN (?,?)', [RECONCILIATION_VERSION, HISTORICAL_VERSION]);
  const adopted = ledger.find((entry) => entry.version === RECONCILIATION_VERSION);
  if (adopted && adopted.checksum !== checksum) throw new Error('El checksum de 002 no coincide con el historial; se aborta.');
  return { adopted, historical: ledger.some((entry) => entry.version === HISTORICAL_VERSION) };
}

async function reconcileIndexes(connection: PoolConnection): Promise<void> {
  // Se vuelve a leer el estado antes de cada DDL para permitir reanudación tras DDL no transaccional.
  const current = await assertPreflight(connection, env.database.database);
  const [equivalent] = await rows<RowDataPacket & { found: number }>(connection,
    "SELECT COUNT(*) AS found FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots' AND NON_UNIQUE=1 AND SEQ_IN_INDEX=1 AND COLUMN_NAME='veterinarian_id'");
  if (Number(equivalent?.found ?? 0) === 0) {
    if (!current.plan.addSupportIndex) throw new Error('No se pudo confirmar un índice no único de soporte.');
    await connection.query('ALTER TABLE client_appointment_slots ADD INDEX veterinarian_history (veterinarian_id)');
  }
  const refreshed = await assertPreflight(connection, env.database.database);
  if (refreshed.plan.dropHistoricalUnique) {
    const [support] = await rows<RowDataPacket & { found: number }>(connection,
      "SELECT COUNT(*) AS found FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_appointment_slots' AND NON_UNIQUE=1 AND SEQ_IN_INDEX=1 AND COLUMN_NAME='veterinarian_id'");
    if (Number(support?.found ?? 0) === 0) throw new Error('No hay índice no único de soporte; no se elimina la unicidad histórica.');
    await connection.query('ALTER TABLE client_appointment_slots DROP INDEX veterinarian_start');
  }
}

export async function reconcileClinic(connection: PoolConnection, sql: string): Promise<void> {
  const checksum = createHash('sha256').update(sql).digest('hex');
  await withDatabaseLock(connection, async () => {
    // Este preflight antecede incluso a la creación del ledger.
    const preflight = await assertPreflight(connection, env.database.database);
    const ledgerExists = await rows<RowDataPacket & { TABLE_NAME: string }>(connection,
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='clinic_schema_migrations'");
    if (ledgerExists.length) {
      const ledger = await readLedger(connection, checksum);
      const action = decideLedgerAction(ledger.adopted, checksum, ledger.historical);
      if (action === 'skip') {
        console.log('002 ya está aplicada con el mismo checksum; no se requieren cambios.');
        return;
      }
    }
    // Solo después de validar estructura, FK, índices y datos se crea/usa el historial.
    await connection.query("CREATE TABLE IF NOT EXISTS clinic_schema_migrations(version VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL,completed_steps INT UNSIGNED NOT NULL DEFAULT 0,state ENUM('running','applied') NOT NULL)");
    const ledger = await readLedger(connection, checksum);
    const action = decideLedgerAction(ledger.adopted, checksum, ledger.historical);
    if (action === 'start') await connection.execute("INSERT INTO clinic_schema_migrations(version,checksum,completed_steps,state) VALUES (?, ?, 0, 'running')", [RECONCILIATION_VERSION, checksum]);

    // Registrar evidencia de estado, no ejecutar backfills ni tocar datos de negocio.
    if (preflight.plan.addSupportIndex || preflight.plan.dropHistoricalUnique) await reconcileIndexes(connection);
    await connection.execute("UPDATE clinic_schema_migrations SET state='applied' WHERE version=?", [RECONCILIATION_VERSION]);
    console.log('002 adoptada; 001 permanece sin ejecutar y sin registrar.');
  });
}

async function main(): Promise<void> {
  const sql = await readFile(MIGRATION_PATH, 'utf8');
  const connection = await databasePool.getConnection();
  try { await reconcileClinic(connection, sql); }
  finally { connection.release(); await databasePool.end(); }
}

if (process.argv[1] && /clinic-reconcile\.(?:ts|js)$/.test(process.argv[1])) {
  void main().catch((error: unknown) => {
    console.error(`No se completó la reconciliación clínica: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
