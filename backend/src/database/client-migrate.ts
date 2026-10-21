/** Migración aditiva independiente: el checkout no contiene las migraciones originales aplicadas. */
import { readMigrationFiles, verifyMigrationHistory, type MigrationFile, type MigrationRecord } from './migration-files';
import { resolve } from 'node:path';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

// SQL 002 is absent from every reachable Git revision, but Layerbase records this
// exact checksum as applied and the audited schema contains client_pet_details.breed_name.
// Keep it only as a verification fingerprint; it has no statements and is never executed.
const archivedAppliedClientMigrations: MigrationFile[] = [{
  version: '002_pet_breed_name.sql',
  checksum: 'd2d34703a1a7b42d04709d3c25db62cb6f1ce7a30de8f93a42c727a4f7cd28a5',
  statements: [],
}];

// 007 contains only additive/idempotent DDL. MariaDB may leave its ledger row
// as `running` if a later CREATE TABLE fails after earlier DDL has committed.
// Allow that exact migration to resume after its SQL has been corrected.
const resumableMigration = '007_notification_push_schema.sql';

async function migrate() {
  const files = await readMigrationFiles(resolve(__dirname, '../../client-migrations'));
  const connection = await databasePool.getConnection();
  try {
    await withDatabaseLock(connection, async () => {
      await connection.execute(`CREATE TABLE IF NOT EXISTS client_schema_migrations (
        version VARCHAR(255) PRIMARY KEY, checksum CHAR(64) NOT NULL, state ENUM('running','applied') NOT NULL)`);
      const [records] = await connection.execute<MigrationRecord[]>('SELECT version,checksum,state FROM client_schema_migrations');
      for (const archived of archivedAppliedClientMigrations) {
        const record = records.find((item) => item.version === archived.version);
        if (!record || record.checksum !== archived.checksum || record.state !== 'applied') {
          throw new Error(`La migración histórica ${archived.version} no coincide con su huella aplicada auditada.`);
        }
      }
      const resumableRecord = records.find((record) => record.version === resumableMigration);
      const resumableFile = files.find((file) => file.version === resumableMigration);
      const historyForVerification = resumableRecord?.state === 'running'
        && resumableFile?.checksum === resumableRecord.checksum
        ? records.filter((record) => record !== resumableRecord)
        : records;
      verifyMigrationHistory([...files, ...archivedAppliedClientMigrations],historyForVerification);
      for (const file of files) {
        const existing = records.find(record => record.version === file.version);
        if (existing?.state === 'applied') continue;
        if (existing && (existing.version !== resumableMigration || existing.checksum !== file.checksum)) {
          throw new Error(`No se reanudará automáticamente la migración incompleta ${file.version}; revisá el esquema y el checksum.`);
        }
        if (!existing) {
          await connection.execute('INSERT INTO client_schema_migrations (version,checksum,state) VALUES (?,?,?)',[file.version,file.checksum,'running']);
        }
        for (const [index, statement] of file.statements.entries()) {
          try {
            await connection.execute(statement);
            // DDL implicitly commits in MariaDB. Commit explicitly between
            // dependent CREATE TABLE statements so the next FK sees its parent.
            await connection.commit();
          } catch (error) {
            console.error(`Falló ${file.version}, sentencia ${index + 1}/${file.statements.length}.`);
            throw error;
          }
        }
        await connection.execute("UPDATE client_schema_migrations SET state='applied' WHERE version=?",[file.version]);
        console.info(`Aplicada ${file.version}`);
      }
    });
  } finally { connection.release(); }
}
void migrate().catch(()=>{console.error('No se pudo aplicar la migración Cliente. Revisá conexión, esquema e historial antes de reintentar.');process.exitCode=1;}).finally(()=>databasePool.end());
