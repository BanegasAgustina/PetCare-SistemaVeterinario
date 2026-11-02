/**
 * ARCHIVO: database.ts
 * UBICACIÓN: backend/src/config/database.ts
 * FUNCIÓN: Define opciones y pool compartido para conexiones MySQL del backend.
 * RESPONSABILIDAD: Mantener conexiones UTF-8/UTC acotadas, con IDs grandes representados como strings.
 * CONEXIONES: Importa: backend/src/config/env.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts y 49 más
 * FUNCIONAMIENTO: Toma env.database, crea databaseOptions y un pool con límites, y fija UTC en cada nueva conexión.
 * IMPORTANCIA: Reutilizan este pool las consultas de negocio y el conjunto de scripts de migración.
 */

/** Pool MySQL compartido: las futuras consultas usarán execute(sql, parámetros). */
import mysql, { type ConnectionOptions } from 'mysql2/promise';
import { env } from './env';

// Crear el pool no abre conexiones: health puede funcionar sin una base instalada.
/** Opciones compartidas por el pool y la creación inicial de la base. */
/** Opciones seguras compartidas con el pool y herramientas de creación/migración. */
export const databaseOptions: ConnectionOptions = {
  ...env.database,
  connectTimeout: env.databaseConnectTimeout,
  multipleStatements: false,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  // BIGINT puede exceder Number.MAX_SAFE_INTEGER; los IDs se leen como strings.
  supportBigNumbers: true,
  bigNumberStrings: true,
};

/** Pool reutilizable; crear el pool es diferido y no abre conexiones por sí solo. */
export const databasePool = mysql.createPool({
  ...databaseOptions,
  waitForConnections: true,
  connectionLimit: env.databaseConnectionLimit,
  queueLimit: env.databaseQueueLimit,
});

// UTC mantiene alineados TIMESTAMP, UTC_TIMESTAMP y los vencimientos persistidos por la aplicación.
databasePool.on('connection', connection => {
  const promiseConnection = (connection as unknown as {
    promise(): { query(sql: string): Promise<unknown> };
  }).promise();
  void promiseConnection.query("SET time_zone = '+00:00'").catch(() => {
    console.error('No se pudo fijar UTC en una conexión MySQL.');connection.destroy();
  });
});
