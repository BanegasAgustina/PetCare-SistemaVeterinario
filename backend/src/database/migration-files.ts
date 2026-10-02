/** Lee SQL versionado y verifica integridad; no acepta archivos arbitrarios ni DELIMITER. */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseError } from '../utils/database-error';

export const migrationsDirectory = resolve(__dirname, '../../migrations');
export type MigrationFile = { version: string; checksum: string; statements: string[] };
export type MigrationRecord = RowDataPacket & { version: string; checksum: string; state: 'running' | 'applied' };

export async function readMigrationFiles(directory = migrationsDirectory): Promise<MigrationFile[]> {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  const versionNumbers = new Set<string>();
  if (names.length === 0) throw new DatabaseError('MIGRATIONS_MISSING', 500, 'No se encontraron migraciones SQL.');
  const files: MigrationFile[] = [];
  for (const name of names) {
    const match = /^(\d{3,})_[a-z0-9_]+\.sql$/.exec(name);
    if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) < 1 || versionNumbers.has(String(Number(match[1])))) {
      throw new DatabaseError('MIGRATION_INVALID', 500, 'Las migraciones deben tener versiones numéricas únicas y nombres válidos.');
    }
    versionNumbers.add(String(Number(match[1])));
    const sql = await readFile(resolve(directory, name), 'utf8');
    if (/^\s*DELIMITER\b/im.test(sql)) throw new DatabaseError('MIGRATION_INVALID', 500, 'No se admite DELIMITER en las migraciones.');
    // El marcador es un comentario SQL válido: cada bloque se ejecuta por separado.
    // No se divide por punto y coma, que podría aparecer dentro de un texto literal.
    const statements = sql.split(/^\s*-- petcare:statement\s*$/m).map((statement) => statement.trim()).filter(Boolean);
    files.push({ version: name, checksum: createHash('sha256').update(sql).digest('hex'), statements });
  }
  return files.sort((first, second) => Number(first.version.split('_')[0]) - Number(second.version.split('_')[0]));
}

/** Una migración aplicada es inmutable; la falta de un archivo también se considera deriva. */
export function verifyMigrationHistory(files: MigrationFile[], records: MigrationRecord[]): void {
  for (const record of records) {
    const file = files.find((candidate) => candidate.version === record.version);
    if (!file || file.checksum !== record.checksum) {
      throw new DatabaseError('MIGRATION_CHANGED', 500, 'El historial de migraciones cambió. Restaurá los archivos aplicados y creá una nueva versión.');
    }
    if (record.state !== 'applied') {
      throw new DatabaseError('MIGRATION_INCOMPLETE', 500, 'Existe una migración incompleta. Revisá el esquema antes de continuar; no se reintentará automáticamente.');
    }
  }
  const latestAppliedVersion = Math.max(0, ...records.map((record) => Number(record.version.split('_')[0])));
  if (files.some((file) => Number(file.version.split('_')[0]) < latestAppliedVersion && !records.some((record) => record.version === file.version))) {
    throw new DatabaseError('MIGRATION_OUT_OF_ORDER', 500, 'Una migración nueva tiene una versión anterior al historial aplicado. Creá una versión posterior.');
  }
}
