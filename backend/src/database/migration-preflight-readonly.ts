/**
 * Read-only preflight for client migrations 013–016.
 * Usage from backend/: npx tsx src/database/migration-preflight-readonly.ts
 * This script issues SELECT statements only and never prints connection secrets.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readMigrationFiles } from './migration-files';
import { env } from '../config/env';

type DbRow = RowDataPacket & Record<string, unknown>;

const targetTables = [
  'client_schema_migrations',
  'client_notifications',
  'client_appointments',
  'client_notification_preferences',
  'client_store_payment_intents',
  'client_general_information',
  'client_orders',
  'client_order_status_history',
  'client_appointment_slots',
  'client_services',
  'pets',
  'species',
  'breeds',
  'client_pet_details',
  'client_products',
  'client_product_categories',
  'users',
  'permissions',
  'roles',
  'role_permissions',
];

function safeErrorCode(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'UNKNOWN';
  return /^[A-Z0-9_]+$/.test(code) ? code : 'UNKNOWN';
}

async function main(): Promise<void> {
  const connection = await mysql.createConnection({
    ...env.database,
    connectTimeout: env.databaseConnectTimeout,
    multipleStatements: false,
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
  });

  try {
    const [identityRows] = await connection.execute<DbRow[]>(
      'SELECT DATABASE() AS databaseName, VERSION() AS serverVersion, @@port AS serverPort',
    );
    const identity = identityRows[0] ?? {};

    const [tableRows] = await connection.execute<DbRow[]>(
      `SELECT TABLE_NAME AS tableName
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${targetTables.map(() => '?').join(',')})
       ORDER BY TABLE_NAME`,
      targetTables,
    );
    const existingTables = new Set(tableRows.map(row => String(row.tableName)));
    const availableTargets = targetTables.filter(table => existingTables.has(table));

    const columns = availableTargets.length
      ? (await connection.execute<DbRow[]>(
          `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
                  IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault
           FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${availableTargets.map(() => '?').join(',')})
           ORDER BY TABLE_NAME, ORDINAL_POSITION`,
          availableTargets,
        ))[0]
      : [];

    const indexes = availableTargets.length
      ? (await connection.execute<DbRow[]>(
          `SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique,
                  SEQ_IN_INDEX AS sequenceInIndex, COLUMN_NAME AS columnName
           FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${availableTargets.map(() => '?').join(',')})
           ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
          availableTargets,
        ))[0]
      : [];

    const constraints = availableTargets.length
      ? (await connection.execute<DbRow[]>(
          `SELECT tc.TABLE_NAME AS tableName, tc.CONSTRAINT_NAME AS constraintName,
                  tc.CONSTRAINT_TYPE AS constraintType, kcu.COLUMN_NAME AS columnName,
                  kcu.REFERENCED_TABLE_NAME AS referencedTableName,
                  kcu.REFERENCED_COLUMN_NAME AS referencedColumnName,
                  rc.DELETE_RULE AS deleteRule, rc.UPDATE_RULE AS updateRule
           FROM information_schema.TABLE_CONSTRAINTS tc
           LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
             ON kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND kcu.TABLE_NAME = tc.TABLE_NAME
            AND kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
           LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
             ON rc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND rc.TABLE_NAME = tc.TABLE_NAME
            AND rc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
           WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.TABLE_NAME IN (${availableTargets.map(() => '?').join(',')})
           ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION`,
          availableTargets,
        ))[0]
      : [];

    const migrationFiles = await readMigrationFiles(resolve(__dirname, '../../client-migrations'));
    const migratorSource = await readFile(resolve(__dirname, 'client-migrate.ts'), 'utf8');
    const archivedFingerprints = [...migratorSource.matchAll(
      /version:\s*'([^']+\.sql)'[\s\S]*?checksum:\s*'([a-f0-9]{64})'/g,
    )].map(match => ({ version: match[1], checksum: match[2] }));
    const clientLedgerExists = existingTables.has('client_schema_migrations');
    let history: DbRow[] = [];
    if (clientLedgerExists) {
      [history] = await connection.execute<DbRow[]>(
        'SELECT version, checksum, state FROM client_schema_migrations ORDER BY version',
      );
    }
    const filesByVersion = new Map(migrationFiles.map(file => [file.version, file]));
    const migrationIntegrity = history.map(record => {
      const file = filesByVersion.get(String(record.version));
      const archived = archivedFingerprints.find(item => item.version === record.version);
      const expectedChecksum = file?.checksum ?? archived?.checksum;
      return {
        version: record.version,
        state: record.state,
        recordedChecksum: record.checksum,
        localFilePresent: Boolean(file),
        checksumSource: file ? 'local_file' : archived ? 'archived_migrator_fingerprint' : 'missing',
        checksumMatchesLocalSource: expectedChecksum ? expectedChecksum === record.checksum : null,
      };
    });
    const migrationCandidates = migrationFiles
      .filter(file => Number(file.version.slice(0, 3)) >= 13)
      .map(file => ({
        version: file.version,
        localChecksum: file.checksum,
        recordedState: history.find(record => record.version === file.version)?.state ?? 'not_recorded',
      }));

    const appointmentColumn = (columns as DbRow[]).find(row =>
      row.tableName === 'client_appointments' && row.columnName === 'status');
    let appointmentStatusCounts: DbRow[] = [];
    if (appointmentColumn) {
      [appointmentStatusCounts] = await connection.execute<DbRow[]>(
        'SELECT status, COUNT(*) AS total FROM client_appointments GROUP BY status ORDER BY status',
      );
    }

    const permissions = existingTables.has('permissions')
      ? (await connection.execute<DbRow[]>(
          `SELECT id, code, name, description, module_code AS moduleCode, is_critical AS isCritical,
                  opens_module AS opensModule
           FROM permissions WHERE code IN ('users.manage', 'settings.general.manage') ORDER BY code`,
        ))[0]
      : [];
    const roleAssignments = existingTables.has('roles') && existingTables.has('permissions') && existingTables.has('role_permissions')
      ? (await connection.execute<DbRow[]>(
          `SELECT r.id AS roleId, r.code AS roleCode, p.id AS permissionId, p.code AS permissionCode,
                  rp.role_id IS NOT NULL AS alreadyAssigned
           FROM roles r CROSS JOIN permissions p
           LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
           WHERE r.code = 'SUPER_ADMIN' AND p.code IN ('users.manage', 'settings.general.manage')
           ORDER BY p.code`,
        ))[0]
      : [];
    const targetRoles = existingTables.has('roles')
      ? (await connection.execute<DbRow[]>(
          "SELECT id, code FROM roles WHERE code = 'SUPER_ADMIN' ORDER BY id",
        ))[0]
      : [];

    const permissionUniqueKeys = (indexes as DbRow[]).filter(row =>
      (row.tableName === 'permissions' && Number(row.nonUnique) === 0) ||
      (row.tableName === 'role_permissions' && Number(row.nonUnique) === 0));

    const expectedHost = process.env.PETCARE_EXPECTED_DB_HOST?.trim();
    const expectedDatabase = process.env.PETCARE_EXPECTED_DB_NAME?.trim();
    const currentHost = env.database.host.trim().toLowerCase().replace(/\.$/, '');
    const expectedHostNormalized = expectedHost?.toLowerCase().replace(/\.$/, '');

    console.log(JSON.stringify({
      auditType: 'read-only migration preflight; no DDL or DML issued',
      connection: {
        status: 'ok',
        databaseName: identity.databaseName,
        serverVersion: identity.serverVersion,
        serverPort: identity.serverPort,
        expectedHostComparison: expectedHostNormalized ? currentHost === expectedHostNormalized : 'not_configured',
        expectedDatabaseComparison: expectedDatabase ? identity.databaseName === expectedDatabase : 'not_configured',
      },
      migrationLedger: {
        tablePresent: clientLedgerExists,
        records: history,
        localChecksumComparison: migrationIntegrity,
        candidates013Onward: migrationCandidates,
      },
      schema: {
        tables: [...existingTables].sort(),
        columns,
        indexes,
        constraints,
      },
      appointmentStatusCounts,
      migration014ReadOnlyImpactReview: {
        existingPermissionRows: permissions,
        targetRoles,
        superAdminAssignments: roleAssignments,
        uniqueIndexes: permissionUniqueKeys,
        behavior: '014 uses INSERT IGNORE for the new permission and SUPER_ADMIN assignment; existing matching rows are not updated. Review unique indexes and these rows before any migration run.',
      },
      backup: 'Not verifiable from SQL metadata; confirm provider snapshot and test restore separately.',
    }, null, 2));
  } finally {
    await connection.end();
  }
}

void main().catch(error => {
  console.error(JSON.stringify({
    auditType: 'read-only migration preflight',
    connection: 'error',
    code: safeErrorCode(error),
    detail: 'Connection or SELECT failed. No database writes were issued.',
  }, null, 2));
  process.exitCode = 1;
});
