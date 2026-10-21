/**
 * Read-only preflight for a future cleanup of test appointment/catalog data.
 * Refuses remote, Layerbase, and production environments before opening a DB connection.
 * It reports schema relationships and counts only; it never deletes or updates rows.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env, isVercelRuntime } from '../config/env';

type TableRow = RowDataPacket & { TABLE_NAME: string };
type ForeignKeyRow = RowDataPacket & {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
  CONSTRAINT_NAME: string;
  DELETE_RULE: string;
  UPDATE_RULE: string;
};

const localHost = /^(localhost|127(?:\.\d{1,3}){0,3}|::1|\[::1\])$/i;
const operationalTable = /(appointment|slot|reservation|veterinar|professional|service|specialt|block|clinical|consult|prescription|vaccin|patient)/i;

async function main(): Promise<void> {
  // This check must stay before getConnection(): a local NODE_ENV alone does not
  // make a remote database safe, and the current project .env points remotely.
  if (env.nodeEnvironment !== 'development' || isVercelRuntime || !localHost.test(env.database.host) || env.database.ssl) {
    throw new Error('Preflight detenido: requiere NODE_ENV=development, sin runtime serverless, MySQL loopback y TLS remoto desactivado. No se abrió ninguna conexión.');
  }

  const connection = await databasePool.getConnection();
  try {
    const [identity] = await connection.execute<RowDataPacket[]>(
      'SELECT DATABASE() AS schemaName, @@port AS serverPort, @@global.read_only AS readOnly, VERSION() AS serverVersion',
    );
    if (String(identity[0]?.schemaName ?? '') !== env.database.database || Number(identity[0]?.readOnly) !== 0) {
      throw new Error('Preflight detenido: identidad de esquema o modo de escritura no coincide con el entorno local esperado.');
    }

    const [tables] = await connection.execute<TableRow[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );
    const [foreignKeys] = await connection.execute<ForeignKeyRow[]>(
      `SELECT k.TABLE_NAME,k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,k.CONSTRAINT_NAME,r.DELETE_RULE,r.UPDATE_RULE
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
       WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION`,
    );

    const relevant = new Set(tables.map(table => table.TABLE_NAME).filter(name => operationalTable.test(name)));
    for (const fk of foreignKeys) {
      if (relevant.has(fk.TABLE_NAME) || relevant.has(fk.REFERENCED_TABLE_NAME)) {
        relevant.add(fk.TABLE_NAME);
        relevant.add(fk.REFERENCED_TABLE_NAME);
      }
    }

    const counts: Array<{ table: string; rows: number }> = [];
    for (const table of [...relevant].sort()) {
      // Identifiers come only from information_schema and are still escaped.
      const quoted = `\`${table.replace(/`/g, '``')}\``;
      const [result] = await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS rowCount FROM ${quoted}`);
      counts.push({ table, rows: Number(result[0]?.rowCount ?? 0) });
    }

    const edges = foreignKeys.filter(fk => relevant.has(fk.TABLE_NAME) || relevant.has(fk.REFERENCED_TABLE_NAME));
    console.log(JSON.stringify({
      mode: 'read-only preflight; no rows changed',
      database: String(identity[0].schemaName),
      serverPort: Number(identity[0].serverPort),
      serverVersion: String(identity[0].serverVersion),
      tableCounts: counts,
      foreignKeys: edges,
      note: 'Los conteos no identifican por sí solos cuáles filas son datos de prueba. No se borra ni desactiva ninguna fila.',
    }, null, 2));
  } finally {
    connection.release();
    await databasePool.end();
  }
}

void main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Preflight fallido.');
  await databasePool.end().catch(() => undefined);
  process.exitCode = 1;
});
