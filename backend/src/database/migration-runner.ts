/** Aplica migraciones pendientes sin destruir datos ni simular rollback de DDL MySQL. */
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { runDatabaseOperation } from '../utils/database-error';
import { withDatabaseLock } from './lock';
import { readMigrationFiles, verifyMigrationHistory, type MigrationRecord } from './migration-files';

export async function runMigrations(directory?: string): Promise<number> {
  const files = await readMigrationFiles(directory);
  await checkDatabaseConnection();
  return runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {
      return await withDatabaseLock(connection, async () => {
        // Tabla técnica, independiente de las cinco entidades de negocio.
        await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
          checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
          state ENUM('running', 'applied') NOT NULL,
          applied_at TIMESTAMP(3) NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_ci`);
        const [records] = await connection.execute<MigrationRecord[]>('SELECT version, checksum, state FROM schema_migrations');
        verifyMigrationHistory(files, records);
        let appliedCount = 0;
        for (const file of files) {
          if (records.some((record) => record.version === file.version)) continue;
          // CREATE/ALTER causan commits implícitos. La marca running permite detectar
          // una interrupción parcial, en lugar de ocultarla con IF NOT EXISTS.
          await connection.execute('INSERT INTO schema_migrations (version, checksum, state) VALUES (?, ?, ?)', [file.version, file.checksum, 'running']);
          for (const statement of file.statements) await connection.execute(statement);
          await connection.execute('UPDATE schema_migrations SET state = ?, applied_at = CURRENT_TIMESTAMP(3) WHERE version = ?', ['applied', file.version]);
          appliedCount += 1;
        }
        return appliedCount;
      });
    } finally { connection.release(); }
  });
}
