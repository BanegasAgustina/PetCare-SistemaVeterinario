/** Pruebas unitarias aisladas del plan; no abren conexiones ni escriben en MySQL. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { env } from '../../src/config/env';
import { decideLedgerAction, planIndexReconciliation, reconcileClinic, type IndexSpec } from '../../src/database/clinic-reconcile';

const oldUnique: IndexSpec = { name: 'veterinarian_start', unique: true, columns: ['veterinarian_id', 'starts_at'] };
const support: IndexSpec = { name: 'veterinarian_history', unique: false, columns: ['veterinarian_id'] };

test('preflight requiere los datos duplicados en cero antes de planear DDL', () => {
  assert.deepEqual(planIndexReconciliation([oldUnique], true, 0), { addSupportIndex: true, dropHistoricalUnique: true });
});
test('detecta la definición exacta del índice histórico', () => {
  assert.equal(planIndexReconciliation([oldUnique], true, 0).dropHistoricalUnique, true);
});
test('conserva cualquier índice no único equivalente por prefijo', () => {
  const result = planIndexReconciliation([oldUnique, { name: 'ix_vet_start', unique: false, columns: ['veterinarian_id', 'starts_at'] }], true, 0);
  assert.deepEqual(result, { addSupportIndex: false, dropHistoricalUnique: true });
});
test('planea crear veterinarian_history cuando no hay soporte no único', () => {
  assert.equal(planIndexReconciliation([oldUnique], true, 0).addSupportIndex, true);
});
test('el plan elimina la unicidad antigua solo tras validar FK y datos', () => {
  assert.equal(planIndexReconciliation([oldUnique, support], true, 0).dropHistoricalUnique, true);
});
test('no elimina la unicidad cuando veterinarian_start tiene columnas inesperadas', () => {
  assert.throws(() => planIndexReconciliation([{ ...oldUnique, columns: ['starts_at', 'veterinarian_id'] }], true, 0), /definición distinta/);
});
test('no elimina la unicidad si el índice nombrado no es UNIQUE', () => {
  assert.throws(() => planIndexReconciliation([{ ...oldUnique, unique: false }], true, 0), /definición distinta/);
});
test('rechaza pares duplicados antes de tocar índices', () => {
  assert.throws(() => planIndexReconciliation([oldUnique], true, 1), /duplicados/);
});
test('rechaza la falta de FK veterinaria esperada', () => {
  assert.throws(() => planIndexReconciliation([oldUnique], false, 0), /Falta la FK/);
});
test('si no existe veterinarian_start, no planea eliminarlo', () => {
  assert.deepEqual(planIndexReconciliation([support], true, 0), { addSupportIndex: false, dropHistoricalUnique: false });
});
test('con un equivalente existente, la segunda planificación no agrega soporte', () => {
  const first = planIndexReconciliation([oldUnique], true, 0);
  assert.equal(first.addSupportIndex, true);
  const second = planIndexReconciliation([support], true, 0);
  assert.equal(second.addSupportIndex, false);
});
test('sin índice antiguo ni equivalente, solo propone agregar soporte', () => {
  assert.deepEqual(planIndexReconciliation([], true, 0), { addSupportIndex: true, dropHistoricalUnique: false });
});
test('el cálculo del plan no cambia los objetos de datos recibidos', () => {
  const indexes = [oldUnique, support];
  const snapshot = structuredClone(indexes);
  planIndexReconciliation(indexes, true, 0);
  assert.deepEqual(indexes, snapshot);
});
test('un ledger sin 002 inicia y no inventa un registro para 001', () => {
  assert.equal(decideLedgerAction(undefined, 'checksum-002', false), 'start');
});
test('un ledger running con checksum correcto se puede reanudar', () => {
  assert.equal(decideLedgerAction({ checksum: 'ok', state: 'running' }, 'ok', false), 'resume');
});
test('un ledger applied con checksum correcto termina sin cambios', () => {
  assert.equal(decideLedgerAction({ checksum: 'ok', state: 'applied' }, 'ok', false), 'skip');
});
test('un checksum distinto aborta', () => {
  assert.throws(() => decideLedgerAction({ checksum: 'viejo', state: 'running' }, 'nuevo', false), /checksum/);
});
test('un registro histórico 001 impide fingir una adopción', () => {
  assert.throws(() => decideLedgerAction(undefined, 'ok', true), /registro de 001/);
});
test('un estado de ledger desconocido aborta', () => {
  assert.throws(() => decideLedgerAction({ checksum: 'ok', state: 'failed' }, 'ok', false), /Estado de 002/);
});

/** Fake de metadata MySQL local: estas pruebas nunca abren una conexión real. */
class FakeConnection {
  indexes: Array<{ TABLE_NAME: string; INDEX_NAME: string; NON_UNIQUE: number; SEQ_IN_INDEX: number; COLUMN_NAME: string }>;
  ledgerExists = false;
  ledger: Array<{ version: string; checksum: string; state: string }> = [];
  businessRows = 7;
  duplicatePairs = 0;
  ddl: string[] = [];
  incompatible = false;

  constructor(withEquivalent = false) {
    this.indexes = [
      ...(!withEquivalent ? [{ TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'veterinarian_start', NON_UNIQUE: 0, SEQ_IN_INDEX: 1, COLUMN_NAME: 'veterinarian_id' }, { TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'veterinarian_start', NON_UNIQUE: 0, SEQ_IN_INDEX: 2, COLUMN_NAME: 'starts_at' }] : [{ TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'ix_vet_history', NON_UNIQUE: 1, SEQ_IN_INDEX: 1, COLUMN_NAME: 'veterinarian_id' }]),
      { TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'uq_professional_active_start', NON_UNIQUE: 0, SEQ_IN_INDEX: 1, COLUMN_NAME: 'professional_user_id' },
      { TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'uq_professional_active_start', NON_UNIQUE: 0, SEQ_IN_INDEX: 2, COLUMN_NAME: 'active_start' },
      { TABLE_NAME: 'client_appointments', INDEX_NAME: 'uq_client_occupied_slot', NON_UNIQUE: 0, SEQ_IN_INDEX: 1, COLUMN_NAME: 'occupied_slot_id' },
      { TABLE_NAME: 'client_appointments', INDEX_NAME: 'idx_client_slot_history', NON_UNIQUE: 1, SEQ_IN_INDEX: 1, COLUMN_NAME: 'slot_id' },
    ];
  }

  async execute(sql: string, params: unknown[] = []): Promise<[RowDataPacket[], unknown]> {
    const statement = sql.toLowerCase();
    let result: Record<string, unknown>[] = [];
    if (statement.includes('get_lock')) result = [{ acquired: 1 }];
    else if (statement.includes('release_lock')) result = [{ released: 1 }];
    else if (statement.includes('select database()')) result = [{ db: env.database.database }];
    else if (statement.includes('information_schema.tables') && statement.includes('table_name in')) result = ['client_appointment_slots', 'veterinarians', 'client_appointments'].map((TABLE_NAME) => ({ TABLE_NAME }));
    else if (statement.includes('information_schema.tables') && statement.includes('clinic_schema_migrations')) result = this.ledgerExists ? [{ TABLE_NAME: 'clinic_schema_migrations' }] : [];
    else if (statement.includes('information_schema.columns')) result = [
      { TABLE_NAME: 'client_appointment_slots', COLUMN_NAME: 'veterinarian_id', COLUMN_TYPE: this.incompatible ? 'varchar(20)' : 'bigint unsigned', IS_NULLABLE: 'YES', EXTRA: '' },
      { TABLE_NAME: 'client_appointment_slots', COLUMN_NAME: 'id', COLUMN_TYPE: 'bigint unsigned', IS_NULLABLE: 'NO', EXTRA: 'auto_increment' },
      { TABLE_NAME: 'client_appointment_slots', COLUMN_NAME: 'professional_user_id', COLUMN_TYPE: 'bigint unsigned', IS_NULLABLE: 'YES', EXTRA: '' },
      { TABLE_NAME: 'client_appointment_slots', COLUMN_NAME: 'starts_at', COLUMN_TYPE: 'datetime', IS_NULLABLE: 'NO', EXTRA: '' },
      { TABLE_NAME: 'client_appointment_slots', COLUMN_NAME: 'active_start', COLUMN_TYPE: 'datetime', IS_NULLABLE: 'YES', EXTRA: 'STORED GENERATED' },
      { TABLE_NAME: 'client_appointments', COLUMN_NAME: 'slot_id', COLUMN_TYPE: 'bigint unsigned', IS_NULLABLE: 'NO', EXTRA: '' },
      { TABLE_NAME: 'client_appointments', COLUMN_NAME: 'occupied_slot_id', COLUMN_TYPE: 'bigint unsigned', IS_NULLABLE: 'YES', EXTRA: 'STORED GENERATED' },
      { TABLE_NAME: 'veterinarians', COLUMN_NAME: 'id', COLUMN_TYPE: 'bigint unsigned', IS_NULLABLE: 'NO', EXTRA: 'auto_increment' },
    ];
    else if (statement.includes('information_schema.key_column_usage') && statement.includes("table_name='client_appointments'")) result = [{ COLUMN_NAME: 'slot_id', REFERENCED_TABLE_NAME: 'client_appointment_slots', REFERENCED_COLUMN_NAME: 'id' }];
    else if (statement.includes('information_schema.key_column_usage') && statement.includes("column_name='starts_at'")) result = [];
    else if (statement.includes('information_schema.key_column_usage')) result = [{ COLUMN_NAME: 'veterinarian_id', REFERENCED_TABLE_NAME: 'veterinarians', REFERENCED_COLUMN_NAME: 'id' }];
    else if (statement.includes('information_schema.statistics') && statement.includes('count(*)')) result = [{ found: this.indexes.some((index) => index.TABLE_NAME === 'client_appointment_slots' && index.NON_UNIQUE === 1 && index.SEQ_IN_INDEX === 1 && index.COLUMN_NAME === 'veterinarian_id') ? 1 : 0 }];
    else if (statement.includes('information_schema.statistics')) result = this.indexes;
    else if (statement.includes('select (select count(*)')) result = [{ row_count: this.businessRows, duplicate_pairs: this.duplicatePairs }];
    else if (statement.includes('select version,checksum,state')) result = this.ledger.filter((entry) => params.includes(entry.version));
    else if (statement.includes('insert into clinic_schema_migrations')) {
      this.ledger.push({ version: String(params[0]), checksum: String(params[1]), state: 'running' });
    } else if (statement.includes("set state='applied'")) {
      const entry = this.ledger.find((item) => item.version === params[0]);
      if (entry) entry.state = 'applied';
    }
    return [result as RowDataPacket[], []];
  }

  async query(sql: string): Promise<[RowDataPacket[], unknown]> {
    const statement = sql.toLowerCase();
    this.ddl.push(sql);
    if (statement.startsWith('create table')) this.ledgerExists = true;
    if (statement.includes('add index veterinarian_history')) this.indexes.push({ TABLE_NAME: 'client_appointment_slots', INDEX_NAME: 'veterinarian_history', NON_UNIQUE: 1, SEQ_IN_INDEX: 1, COLUMN_NAME: 'veterinarian_id' });
    if (statement.includes('drop index veterinarian_start')) this.indexes = this.indexes.filter((index) => index.INDEX_NAME !== 'veterinarian_start');
    return [[], []];
  }

  asPoolConnection(): PoolConnection { return this as unknown as PoolConnection; }
}

test('runner aislado crea índice de soporte antes de retirar la unicidad histórica', async () => {
  const fake = new FakeConnection();
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  assert.ok(fake.ddl.findIndex((sql) => sql.includes('ADD INDEX veterinarian_history')) < fake.ddl.findIndex((sql) => sql.includes('DROP INDEX veterinarian_start')));
});
test('runner aislado conserva un índice no único equivalente ya existente', async () => {
  const fake = new FakeConnection(true);
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  assert.equal(fake.ddl.some((sql) => sql.includes('ADD INDEX veterinarian_history')), false);
});
test('runner crea el historial y registra únicamente 002', async () => {
  const fake = new FakeConnection(true);
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  assert.equal(fake.ledgerExists, true);
  assert.deepEqual(fake.ledger.map((entry) => [entry.version, entry.state]), [['002_adopt_existing_clinic_schema.sql', 'applied']]);
});
test('ejecutar dos veces es idempotente y la segunda pasada no emite DDL', async () => {
  const fake = new FakeConnection(true);
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  const before = [...fake.ddl];
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  assert.deepEqual(fake.ddl, before);
});
test('runner aborta por checksum incorrecto sin añadir DDL', async () => {
  const fake = new FakeConnection(true);
  fake.ledgerExists = true;
  fake.ledger.push({ version: '002_adopt_existing_clinic_schema.sql', checksum: 'incorrecto', state: 'running' });
  await assert.rejects(reconcileClinic(fake.asPoolConnection(), 'test migration bytes'), /checksum/);
  assert.deepEqual(fake.ddl, []);
});
test('runner aborta ante estructura incompatible sin crear ledger ni tocar filas funcionales', async () => {
  const fake = new FakeConnection();
  fake.incompatible = true;
  await assert.rejects(reconcileClinic(fake.asPoolConnection(), 'test migration bytes'), /Definición inesperada/);
  assert.equal(fake.ledgerExists, false);
  assert.equal(fake.businessRows, 7);
  assert.deepEqual(fake.ddl, []);
});
test('la reconciliación aislada no altera la cantidad de filas de negocio', async () => {
  const fake = new FakeConnection();
  const before = fake.businessRows;
  await reconcileClinic(fake.asPoolConnection(), 'test migration bytes');
  assert.equal(fake.businessRows, before);
});
