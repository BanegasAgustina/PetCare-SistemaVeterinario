/** Carga únicamente catálogos reales, de forma transaccional e idempotente. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';
import { withDatabaseLock } from './lock';
import { readMigrationFiles, verifyMigrationHistory, type MigrationRecord } from './migration-files';

type CatalogEntry = { code: string; name: string };

/** Aunque el JSON sea versionado, validarlo evita cargar un catálogo mal editado. */
export function readCatalog(value: unknown): CatalogEntry[] {
  if (!Array.isArray(value) || value.length === 0) throw new DatabaseError('SEED_INVALID', 500, 'El catálogo de seed es inválido.');
  const codes = new Set<string>();
  return value.map((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null || !('code' in entry) || !('name' in entry) ||
      typeof entry.code !== 'string' || !/^[A-Z][A-Z0-9_]{0,31}$/.test(entry.code) ||
      typeof entry.name !== 'string' || entry.name.trim().length === 0 || entry.name !== entry.name.trim() || entry.name.length > 60 || codes.has(entry.code)) {
      throw new DatabaseError('SEED_INVALID', 500, 'El catálogo de seed contiene datos inválidos o códigos repetidos.');
    }
    codes.add(entry.code);
    return { code: entry.code, name: entry.name };
  });
}

export async function runSeeds(): Promise<void> {
  const source: unknown = JSON.parse(await readFile(resolve(__dirname, '../../seeds/001_reference_catalogs.json'), 'utf8'));
  if (typeof source !== 'object' || source === null || !('roles' in source) || !('species' in source)) {
    throw new DatabaseError('SEED_INVALID', 500, 'No se encontraron los catálogos de seed.');
  }
  const roles = readCatalog(source.roles);
  const species = readCatalog(source.species);
  const files = await readMigrationFiles();
  await checkDatabaseConnection();
  await runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {
      await withDatabaseLock(connection, async () => {
        const [records] = await connection.execute<MigrationRecord[]>('SELECT version, checksum, state FROM schema_migrations');
        verifyMigrationHistory(files, records);
        if (files.some((file) => !records.some((record) => record.version === file.version))) {
          throw new DatabaseError('MIGRATIONS_PENDING', 500, 'Ejecutá las migraciones pendientes antes de los seeds.');
        }
        await connection.beginTransaction();
        try {
          // Los valores van en placeholders. Repetir el seed no duplica ni cambia
          // etiquetas que hayan sido editadas deliberadamente en la base.
          for (const role of roles) {
            await connection.execute('INSERT INTO roles (code, name) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = ?)', [role.code, role.name, role.code]);
          }
          for (const item of species) {
            await connection.execute('INSERT INTO species (code, name) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM species WHERE code = ?)', [item.code, item.name, item.code]);
          }
          await connection.commit();
        } catch (error) { await connection.rollback(); throw error; }
      });
    } finally { connection.release(); }
  });
}
