/**
 * ARCHIVO: client-migrate.ts
 * UBICACIÓN: backend/src/database/client-migrate.ts
 * FUNCIÓN: Ejecuta migraciones versionadas del esquema del dominio cliente.
 * RESPONSABILIDAD: Compara archivos SQL con historial y checksums, detecta recuperaciones o archivos archivados y ejecuta solo cambios pendientes.
 * CONEXIONES: Importa: backend/src/database/migration-files.ts, backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Bootstrap/CLI → migración cliente → migration-files y MySQL.
 * IMPORTANCIA: Controla evolución incremental de mascotas, turnos, tienda y notificaciones del cliente.
 */
/** Este ejecutor mantiene las migraciones del área de clientes separadas del esquema general. */
import { readMigrationFiles, verifyMigrationHistory, type MigrationFile, type MigrationRecord } from './migration-files';
import { resolve } from 'node:path';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

// Esta migración histórica ya no está en el repositorio, pero la base auditada la registra como aplicada.
// Se conserva su checksum como huella para verificar el historial; al no tener sentencias, nunca se ejecuta.
const archivedAppliedClientMigrations: MigrationFile[] = [{
  version: '002_pet_breed_name.sql',
  checksum: 'd2d34703a1a7b42d04709d3c25db62cb6f1ce7a30de8f93a42c727a4f7cd28a5',
  statements: [],
}];

/** Única migración que puede continuar si una ejecución anterior quedó a medias. */
const resumableMigration = '007_notification_push_schema.sql';

/** Lee, valida y aplica las migraciones pendientes del área de clientes. */
async function migrate() {
  // Carga los archivos SQL desde la carpeta client-migrations del backend.
  const files = await readMigrationFiles(resolve(__dirname, '../../client-migrations'));
  // Conserva una conexión durante todo el proceso para que el bloqueo y las consultas usen la misma sesión.
  const connection = await databasePool.getConnection();
  try {
    // Impide que otra instancia ejecute migraciones al mismo tiempo sobre esta base.
    await withDatabaseLock(connection, async () => {
      // Crea el registro de migraciones si aún no existe; el estado permite detectar ejecuciones incompletas.
      await connection.execute(`CREATE TABLE IF NOT EXISTS client_schema_migrations (
        version VARCHAR(255) PRIMARY KEY, checksum CHAR(64) NOT NULL, state ENUM('running','applied') NOT NULL)`);
      // Lee qué versiones ya se registraron y en qué estado quedaron.
      const [records] = await connection.execute<MigrationRecord[]>('SELECT version,checksum,state FROM client_schema_migrations');
      for (const archived of archivedAppliedClientMigrations) {
        const record = records.find((item) => item.version === archived.version);
        // Falla si la migración histórica archivada no coincide exactamente con el registro auditado.
        if (!record || record.checksum !== archived.checksum || record.state !== 'applied') {
          throw new Error(`La migración histórica ${archived.version} no coincide con su huella aplicada auditada.`);
        }
      }
      // Busca si la migración reanudable existe en el historial y entre los archivos disponibles.
      const resumableRecord = records.find((record) => record.version === resumableMigration);
      const resumableFile = files.find((file) => file.version === resumableMigration);
      // Si quedó en ejecución y el archivo no cambió, se excluye temporalmente del historial para poder retomarla.
      const historyForVerification = resumableRecord?.state === 'running'
        && resumableFile?.checksum === resumableRecord.checksum
        ? records.filter((record) => record !== resumableRecord)
        : records;
      // Verifica que los archivos y el historial coincidan, incluyendo la huella histórica archivada.
      verifyMigrationHistory([...files, ...archivedAppliedClientMigrations],historyForVerification);
      for (const file of files) {
        const existing = records.find(record => record.version === file.version);
        // Las migraciones completadas no vuelven a ejecutarse.
        if (existing?.state === 'applied') continue;
        // No reanuda automáticamente otras migraciones incompletas ni una versión cuyo SQL haya cambiado.
        if (existing && (existing.version !== resumableMigration || existing.checksum !== file.checksum)) {
          throw new Error(`No se reanudará automáticamente la migración incompleta ${file.version}; revisá el esquema y el checksum.`);
        }
        // Registra la migración antes de ejecutar SQL para poder reconocer una interrupción posterior.
        if (!existing) {
          await connection.execute('INSERT INTO client_schema_migrations (version,checksum,state) VALUES (?,?,?)',[file.version,file.checksum,'running']);
        }
        // Ejecuta cada sentencia en orden y confirma los cambios de DDL que MariaDB puede guardar por separado.
        for (const [index, statement] of file.statements.entries()) {
          try {
            await connection.execute(statement);
            // Confirma cada paso para que las sentencias siguientes puedan usar las tablas recién creadas.
            await connection.commit();
          } catch (error) {
            console.error(`Falló ${file.version}, sentencia ${index + 1}/${file.statements.length}.`);
            throw error;
          }
        }
        // Marca la versión como aplicada solo después de completar todas sus sentencias.
        await connection.execute("UPDATE client_schema_migrations SET state='applied' WHERE version=?",[file.version]);
        console.info(`Aplicada ${file.version}`);
      }
    });
  } finally { connection.release(); }
}
// Inicia el proceso; si falla, informa un mensaje general y establece un código de salida de error.
void migrate().catch(()=>{console.error('No se pudo aplicar la migración Cliente. Revisá conexión, esquema e historial antes de reintentar.');process.exitCode=1;}).finally(()=>databasePool.end());
