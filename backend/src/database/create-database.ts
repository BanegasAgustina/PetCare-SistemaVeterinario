/** Crea solo la base configurada, sin eliminar ni alterar una base existente. */
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { databaseOptions } from '../config/database';
import { env } from '../config/env';
import { assertMysql8Version } from '../services/database.service';
import { runDatabaseOperation } from '../utils/database-error';

export async function createDatabase(): Promise<void> {
  await runDatabaseOperation(async () => {
    // La conexión inicial no selecciona una base que quizás todavía no existe.
    const connection = await mysql.createConnection({ ...databaseOptions, database: undefined });
    try {
      const [rows] = await connection.execute<(RowDataPacket & { version: string })[]>('SELECT VERSION() AS version');
      assertMysql8Version(rows[0].version);
      // Excepción controlada: un identificador SQL no puede usar ?. DB_NAME ya fue
      // validado estrictamente en env.ts; se encierra entre backticks adicionalmente.
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${env.database.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci`);
    } finally { await connection.end(); }
  });
}
