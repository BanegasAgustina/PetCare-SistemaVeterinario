/** Comandos explícitos de preparación: el inicio HTTP no aplica cambios al esquema. */
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { normalizeDatabaseError } from '../utils/database-error';
import { createDatabase } from './create-database';
import { runMigrations } from './migration-runner';
import { runSeeds } from './seed-runner';

async function main(): Promise<void> {
  try {
    switch (process.argv[2]) {
      case 'create': await createDatabase(); console.info('Base preparada. No se eliminaron datos existentes.'); break;
      case 'check': await checkDatabaseConnection(); console.info('Conexión MySQL 8 disponible.'); break;
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
