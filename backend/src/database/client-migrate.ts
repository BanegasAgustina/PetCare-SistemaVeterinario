/** Migración aditiva independiente: el checkout no contiene las migraciones originales aplicadas. */
import { readMigrationFiles, verifyMigrationHistory, type MigrationRecord } from './migration-files';
import { resolve } from 'node:path';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

async function migrate() {
  const files = await readMigrationFiles(resolve(__dirname, '../../client-migrations'));
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      await connection.execute(`CREATE TABLE IF NOT EXISTS client_schema_migrations (
        version VARCHAR(255) PRIMARY KEY, checksum CHAR(64) NOT NULL, state ENUM('running','applied') NOT NULL)`);
      const [records] = await connection.execute<MigrationRecord[]>('SELECT version,checksum,state FROM client_schema_migrations');
      verifyMigrationHistory(files,records);
      for (const file of files) {
        if (records.some(record=>record.version===file.version)) continue;
        await connection.execute('INSERT INTO client_schema_migrations (version,checksum,state) VALUES (?,?,?)',[file.version,file.checksum,'running']);
        for (const statement of file.statements) await connection.execute(statement);
        await connection.execute("UPDATE client_schema_migrations SET state='applied' WHERE version=?",[file.version]);
        console.info(`Aplicada ${file.version}`);
      }
    });
  } finally { connection.release(); }
}
void migrate().catch(()=>{console.error('No se pudo aplicar la migración Cliente. Revisá conexión, esquema e historial antes de reintentar.');process.exitCode=1;}).finally(()=>databasePool.end());
