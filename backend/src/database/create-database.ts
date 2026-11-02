/**
 * ARCHIVO: create-database.ts
 * UBICACIÓN: backend/src/database/create-database.ts
 * FUNCIÓN: Crea la base configurada si aún no existe.
 * RESPONSABILIDAD: Obtiene conexión administrativa y ejecuta CREATE DATABASE con identificador validado.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/config/env.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/cli.ts
 * FUNCIONAMIENTO: CLI/operación explícita → createDatabase → config/database.
 * IMPORTANCIA: Prepara el contenedor lógico sobre el que luego corren migraciones.
 */
/** Crea solo la base configurada, sin eliminar ni alterar una base existente. */
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { databaseOptions } from '../config/database';
import { env } from '../config/env';
import { assertMysql8Version } from '../services/database.service';
import { runDatabaseOperation } from '../utils/database-error';

/** Abre conexión administrativa y crea la base configurada solo si el nombre validado aún no existe. */
export async function createDatabase(): Promise<void> {
  await runDatabaseOperation(async () => {
    // La conexión inicial no selecciona una base que quizás todavía no existe.
    const connection = await mysql.createConnection({ ...databaseOptions, database: undefined });
    try {
      const [rows] = await connection.execute<(RowDataPacket & { version: string })[]>('SELECT VERSION() AS version');
      assertMysql8Version(rows[0].version);
      // Excepción controlada: un identificador SQL no puede usar ?. DB_NAME ya fue
      // validado estrictamente en env.ts; se encierra entre backticks adicionalmente.
      // utf8mb4_0900_as_ci solo existe en MySQL 8; unicode_ci es compatible con MariaDB 11.8.
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${env.database.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } finally { await connection.end(); }
  });
}
