/**
 * Exporta metadatos del esquema y ledgers de migración sin leer datos de negocio
 * ni ejecutar DDL. Reutiliza la conexión validada por el backend.
 * Uso: npm run db:audit:readonly -- --out layerbase-sql-audit.json
 */
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import ts from 'typescript';
import { databasePool } from '../config/database';

type MetadataRow = RowDataPacket & Record<string, unknown>;
type AuditError = { stage: string; query: string; code: string; message: string; unknownColumn?: string };

const safeHistoryColumns = [
  'version', 'migration_name', 'name', 'checksum', 'state', 'status',
  'applied_at', 'started_at', 'completed_at', 'batch', 'completed_steps',
];
const ignoredTableWords = new Set(['if', 'not', 'exists', 'select', 'only', 'lateral']);

function quoteIdentifier(value: string): string {
  return `\`${value.replaceAll('`', '``')}\``;
}

function extractTableReferences(source: string): string[] {
  const refs = new Set<string>();
  // Heuristic inventory only: runtime SQL assembled from variables/fragments can
  // require manual review. It extracts table identifiers, never SQL values.
  const pattern = /\b(?:FROM|JOIN|INTO|UPDATE|REFERENCES)\s+[`"']?([a-zA-Z_][\w$]*(?:\.[a-zA-Z_][\w$]*)?)/gi;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].replaceAll('`', '').replaceAll('"', '').replaceAll("'", '');
    if (!ignoredTableWords.has(name.toLowerCase())) refs.add(name);
  }
  return [...refs].sort((a, b) => a.localeCompare(b));
}

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listTypeScriptFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(fullPath);
  }
  return files;
}

function extractSqlLikeStrings(filePath: string): string[] {
  const content = ts.sys.readFile(filePath);
  if (content === undefined) return [];
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const strings: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      strings.push(node.text);
    } else if (ts.isTemplateExpression(node)) {
      strings.push(node.head.text);
      for (const span of node.templateSpans) strings.push(span.literal.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return strings;
}

async function codeTableInventory(): Promise<{ filesScanned: number; byFile: Record<string, string[]>; allTables: string[] }> {
  const sourceRoot = path.resolve(__dirname, '..');
  const files = await listTypeScriptFiles(sourceRoot);
  const byFile: Record<string, string[]> = {};
  const all = new Set<string>();
  for (const file of files) {
    const names = new Set(extractSqlLikeStrings(file).flatMap(extractTableReferences));
    if (!names.size) continue;
    const relative = path.relative(process.cwd(), file).split(path.sep).join('/');
    byFile[relative] = [...names].sort((a, b) => a.localeCompare(b));
    names.forEach((name) => all.add(name));
  }
  return { filesScanned: files.length, byFile, allTables: [...all].sort((a, b) => a.localeCompare(b)) };
}

function describeError(stage: string, query: string, error: unknown): AuditError {
  const dbError = error as NodeJS.ErrnoException & { sqlMessage?: string };
  const message = dbError.sqlMessage ?? dbError.message ?? String(error);
  const column = message.match(/unknown column\s+['"`]([^'"`]+)['"`]/i)?.[1];
  return {
    stage,
    query,
    code: dbError.code ?? 'AUDIT_ERROR',
    message,
    ...(column ? { unknownColumn: column } : {}),
  };
}

async function audit(): Promise<Record<string, unknown>> {
  const errors: AuditError[] = [];
  const warnings: string[] = [];
  const sections: Record<string, { status: 'ok' | 'error' | 'skipped'; rowCount?: number; reason?: string }> = {};
  const result: Record<string, unknown> = {
    auditType: 'read-only schema metadata; no business rows queried',
    generatedAt: new Date().toISOString(),
    auditComplete: false,
    connection: { status: 'error' },
    tables: [], columns: [], constraints: [], checkConstraints: [], indexes: [], migrationHistory: [],
    sections,
    errors,
    warnings,
  };
  let connection;
  try {
    connection = await databasePool.getConnection();
  } catch (error) {
    errors.push(describeError('connection', 'databasePool.getConnection()', error));
    sections.connection = { status: 'error' };
    result.missingRequiredSections = ['connection', 'tables', 'columns', 'constraints', 'checkConstraints', 'indexes', 'migrationHistory'];
    return result;
  }

  try {
    const identitySql = 'SELECT DATABASE() AS databaseName, VERSION() AS serverVersion';
    let schemaName = '';
    try {
      const [identityRows] = await connection.query<MetadataRow[]>(identitySql);
      const identity = identityRows[0] ?? {};
      schemaName = String(identity.databaseName ?? '');
      if (!schemaName) throw new Error('La conexión no seleccionó una base de datos.');
      result.connection = { status: 'ok', databaseName: identity.databaseName, serverVersion: identity.serverVersion };
      sections.connection = { status: 'ok', rowCount: 1 };
    } catch (error) {
      errors.push(describeError('connection identity', identitySql, error));
      sections.connection = { status: 'error' };
      result.missingRequiredSections = ['connection', 'tables', 'columns', 'constraints', 'checkConstraints', 'indexes', 'migrationHistory'];
      return result;
    }

    const runMetadata = async (stage: string, query: string): Promise<MetadataRow[] | undefined> => {
      try {
        const [rows] = await connection!.execute<MetadataRow[]>(query, [schemaName]);
        sections[stage] = { status: 'ok', rowCount: rows.length };
        return rows;
      } catch (error) {
        errors.push(describeError(stage, query, error));
        sections[stage] = { status: 'error' };
        return undefined;
      }
    };

    const tableSql = `SELECT TABLE_NAME AS tableName, TABLE_TYPE AS tableType, ENGINE AS engine, TABLE_COLLATION AS tableCollation
      FROM information_schema.TABLES WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME`;
    const columnSql = `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, ORDINAL_POSITION AS ordinalPosition,
      COLUMN_TYPE AS columnType, DATA_TYPE AS dataType, IS_NULLABLE AS isNullable,
      COLUMN_DEFAULT AS columnDefault, EXTRA AS extra, GENERATION_EXPRESSION AS generationExpression,
      CHARACTER_SET_NAME AS characterSetName, COLLATION_NAME AS collationName
      FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, ORDINAL_POSITION`;
    const constraintSql = `SELECT tc.TABLE_NAME AS tableName, tc.CONSTRAINT_NAME AS constraintName,
      tc.CONSTRAINT_TYPE AS constraintType, kcu.COLUMN_NAME AS columnName,
      kcu.ORDINAL_POSITION AS ordinalPosition, kcu.REFERENCED_TABLE_NAME AS referencedTableName,
      kcu.REFERENCED_COLUMN_NAME AS referencedColumnName, rc.UPDATE_RULE AS updateRule,
      rc.DELETE_RULE AS deleteRule
      FROM information_schema.TABLE_CONSTRAINTS tc
      LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
        ON kcu.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND kcu.TABLE_NAME=tc.TABLE_NAME
       AND kcu.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
      LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON rc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND rc.TABLE_NAME=tc.TABLE_NAME
       AND rc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_SCHEMA=? ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION`;
    const checkSql = `SELECT tc.TABLE_NAME AS tableName, tc.CONSTRAINT_NAME AS constraintName,
      cc.CHECK_CLAUSE AS checkClause
      FROM information_schema.TABLE_CONSTRAINTS tc
      JOIN information_schema.CHECK_CONSTRAINTS cc
        ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.TABLE_NAME=tc.TABLE_NAME
       AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_SCHEMA=? AND tc.CONSTRAINT_TYPE='CHECK'
      ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME`;
    // MariaDB 11.x STATISTICS has COLUMN_NAME but does not expose MySQL's
    // STATISTICS.EXPRESSION field. Functional indexes are reported via their
    // generated/indexed column metadata, so this query stays MariaDB-compatible.
    const indexSql = `SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique,
      SEQ_IN_INDEX AS sequenceInIndex, COLUMN_NAME AS columnName, COLLATION AS collation,
      SUB_PART AS subPart, INDEX_TYPE AS indexType, NULLABLE AS nullable
      FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`;

    const [tableRows, columnRows, constraintRows, checkRows, indexRows] = await Promise.all([
      runMetadata('tables', tableSql),
      runMetadata('columns', columnSql),
      runMetadata('constraints', constraintSql),
      runMetadata('checkConstraints', checkSql),
      runMetadata('indexes', indexSql),
    ]);
    if (tableRows) result.tables = tableRows;
    if (columnRows) result.columns = columnRows;
    if (constraintRows) result.constraints = constraintRows;
    if (checkRows) result.checkConstraints = checkRows;
    if (indexRows) result.indexes = indexRows;

    if (tableRows && columnRows) {
      const migrationTables = tableRows.map((row) => String(row.tableName)).filter((name) => /migration|schema_history|schema_version/i.test(name));
      const history: Array<Record<string, unknown>> = [];
      const failedHistoryTables: string[] = [];
      const columnsByTable = new Map<string, string[]>();
      for (const row of columnRows) {
        const table = String(row.tableName);
        const list = columnsByTable.get(table) ?? [];
        list.push(String(row.columnName));
        columnsByTable.set(table, list);
      }
      for (const tableName of migrationTables) {
        const knownColumns = (columnsByTable.get(tableName) ?? []).filter((column) => safeHistoryColumns.includes(column.toLowerCase()));
        const hasVersionKey = knownColumns.some((column) => ['version', 'migration_name', 'name'].includes(column.toLowerCase()));
        if (!hasVersionKey) {
          warnings.push(`${tableName}: tabla candidata sin columna reconocida de versión/nombre; no se consultaron filas.`);
          failedHistoryTables.push(tableName);
          continue;
        }
        const select = knownColumns.map(quoteIdentifier).join(', ');
        const historySql = `SELECT ${select} FROM ${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)} LIMIT 500`;
        try {
          const [rows] = await connection.query<MetadataRow[]>(historySql);
          history.push({ tableName, columns: knownColumns, rows });
        } catch (error) {
          errors.push(describeError(`migrationHistory:${tableName}`, historySql, error));
          failedHistoryTables.push(tableName);
        }
      }
      result.migrationHistory = history;
      if (migrationTables.length === 0) {
        sections.migrationHistory = { status: 'error', reason: 'No se descubrió una tabla candidata al historial; no se da por verificada esta sección.' };
        warnings.push('No se descubrió una tabla candidata de historial de migraciones. La sección requiere revisión manual.');
      } else {
        sections.migrationHistory = { status: failedHistoryTables.length ? 'error' : 'ok', rowCount: history.length };
      }
    } else {
      sections.migrationHistory = { status: 'skipped', reason: 'Requiere tablas y columnas inspeccionadas correctamente.' };
    }

    try {
      const codeInventory = await codeTableInventory();
      result.backendSqlReferenceInventory = {
        method: 'TypeScript string/template literal heuristic; dynamic SQL and non-literal fragments need manual review',
        filesScanned: codeInventory.filesScanned,
        allTables: codeInventory.allTables,
        byFile: codeInventory.byFile,
        possibleMissingTables: tableRows
          ? codeInventory.allTables.filter((name) => !new Set(tableRows.map((row) => String(row.tableName).toLowerCase()))
            .has(name.split('.').at(-1)!.replaceAll('`', '').toLowerCase()))
          : null,
      };
      sections.backendSqlReferenceInventory = { status: 'ok', rowCount: codeInventory.filesScanned };
    } catch (error) {
      errors.push(describeError('backendSqlReferenceInventory', 'TypeScript source scan (no database query)', error));
      sections.backendSqlReferenceInventory = { status: 'error' };
    }

    const requiredSections = ['connection', 'tables', 'columns', 'constraints', 'checkConstraints', 'indexes', 'migrationHistory'];
    const missingSections = requiredSections.filter((stage) => sections[stage]?.status !== 'ok');
    result.auditComplete = missingSections.length === 0;
    result.missingRequiredSections = missingSections;
  } finally {
    connection.release();
  }
  return result;
}

async function main(): Promise<void> {
  const outIndex = process.argv.indexOf('--out');
  const requestedOutput = outIndex >= 0 ? process.argv[outIndex + 1] : undefined;
  if (outIndex >= 0 && (!requestedOutput || requestedOutput.startsWith('--'))) {
    console.error('Falta la ruta luego de --out.');
    process.exitCode = 1;
    await databasePool.end();
    return;
  }
  const outputPath = requestedOutput ? path.resolve(process.cwd(), requestedOutput) : undefined;
  try {
    const result = await audit();
    const serialized = `${JSON.stringify(result, null, 2)}\n`;
    const auditErrors = result.errors as AuditError[];
    for (const diagnostic of auditErrors) {
      console.error(`[${diagnostic.stage}] ${diagnostic.code}: ${diagnostic.message}`);
      if (diagnostic.unknownColumn) console.error(`Columna desconocida: ${diagnostic.unknownColumn}`);
      console.error(`Consulta responsable:\n${diagnostic.query}`);
    }
    if (outputPath) {
      // --out is a repeatable audit snapshot path; replace the previous export.
      await writeFile(outputPath, serialized, { encoding: 'utf8', flag: 'w' });
      console.info(`${result.auditComplete ? 'Auditoría de metadatos completa' : 'Auditoría parcial'}; archivo JSON generado: ${outputPath}`);
      console.info('El archivo no contiene filas de negocio ni credenciales.');
    } else {
      console.log(serialized);
    }
    if (!result.auditComplete) process.exitCode = 2;
  } catch (error) {
    const diagnostic = describeError('write output or audit setup', 'No database mutation statement is used by this script.', error);
    console.error(`No se pudo generar el resultado JSON: ${diagnostic.code}: ${diagnostic.message}`);
    process.exitCode = 1;
  } finally {
    await databasePool.end();
  }
}

void main();
