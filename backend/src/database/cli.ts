/**
 * ARCHIVO: cli.ts
 * UBICACIÓN: backend/src/database/cli.ts
 * FUNCIÓN: Interfaz de línea de comandos para tareas administrativas de base de datos.
 * RESPONSABILIDAD: Interpreta la acción solicitada, ejecuta el flujo autorizado y presenta errores sin filtrar secretos.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Scripts npm → cli.ts → database.service, migration-runner y seed-runner.
 * IMPORTANCIA: Hace explícita la operación que modifica el esquema o datos.
 */
/** Comandos explícitos de preparación: el inicio HTTP no aplica cambios al esquema. */
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { normalizeDatabaseError } from '../utils/database-error';
import { createDatabase } from './create-database';
import { runMigrations } from './migration-runner';
import { runSeeds } from './seed-runner';

/** Interpreta el subcomando de operación y ejecuta la tarea de base de datos solicitada. */
async function main(): Promise<void> {
  try {
    switch (process.argv[2]) {
      case 'create': await createDatabase(); console.info('Base preparada. No se eliminaron datos existentes.'); break;
      case 'check': await checkDatabaseConnection(); console.info('Conexión con motor de base de datos compatible disponible.'); break;
      case 'migrate': console.info(`Migraciones aplicadas: ${await runMigrations()}.`); break;
      case 'seed': await runSeeds(); console.info('Catálogos mínimos preparados.'); break;
      default: console.error('Comando inválido. Usá db:create, db:check, db:migrate o db:seed.'); process.exitCode = 1;
    }
  } catch (error) {
    const safeError = normalizeDatabaseError(error);
    console.error(`${safeError.code}: ${safeError.message} Revisá backend/README.md y la configuración local.`);
    process.exitCode = 1;
  } finally { await databasePool.end(); }
}
void main();
