/** Read-only Layerbase inspection for the explicitly authorized cleanup review. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env, isVercelRuntime } from '../config/env';

type TableInfo = RowDataPacket & { TABLE_NAME: string; ENGINE: string | null };
type ColumnInfo = RowDataPacket & { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string };
type ForeignKeyInfo = RowDataPacket & {
  TABLE_NAME: string; COLUMN_NAME: string; REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string; CONSTRAINT_NAME: string; DELETE_RULE: string; UPDATE_RULE: string;
};

const relatedName = /(appointment|slot|reservation|veterinar|professional|service|specialt|block|clinical|consult|prescription|vaccin|patient)/i;

async function main(): Promise<void> {
  if (env.nodeEnvironment !== 'development' || isVercelRuntime || !/layerbase/i.test(env.database.host)) {
    throw new Error('Inspección detenida: esta herramienta requiere la configuración de desarrollo de Layerbase solicitada. No se abrió ninguna conexión.');
  }

  const connection = await databasePool.getConnection();
  let inReadOnlyTransaction = false;
  try {
    await connection.query('START TRANSACTION READ ONLY');
    inReadOnlyTransaction = true;
    const [identity] = await connection.execute<RowDataPacket[]>(
      'SELECT DATABASE() AS schemaName, @@port AS serverPort, @@GLOBAL.read_only AS serverReadOnly, @@SESSION.tx_read_only AS transactionReadOnly, @@version AS serverVersion',
    );
    if (String(identity[0]?.schemaName ?? '') !== env.database.database) {
      throw new Error('Inspección detenida: la base seleccionada no coincide con DB_NAME.');
    }

    const [tables] = await connection.execute<TableInfo[]>(
      "SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );
    const [columns] = await connection.execute<ColumnInfo[]>(
      'SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION',
    );
    const [foreignKeys] = await connection.execute<ForeignKeyInfo[]>(
      `SELECT k.TABLE_NAME,k.COLUMN_NAME,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,k.CONSTRAINT_NAME,r.DELETE_RULE,r.UPDATE_RULE
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.TABLE_NAME=k.TABLE_NAME AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME
       WHERE k.CONSTRAINT_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
       ORDER BY k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION`,
    );

    const columnsByTable = new Map<string, Set<string>>();
    for (const column of columns) {
      const set = columnsByTable.get(column.TABLE_NAME) ?? new Set<string>();
      set.add(column.COLUMN_NAME);
      columnsByTable.set(column.TABLE_NAME, set);
    }
    const targetTables = new Set(tables.map(table => table.TABLE_NAME).filter(name => relatedName.test(name)));
    const relevantForeignKeys = foreignKeys.filter(fk => targetTables.has(fk.TABLE_NAME) || targetTables.has(fk.REFERENCED_TABLE_NAME));
    const candidates = new Set(targetTables);
    for (const fk of relevantForeignKeys) {
      candidates.add(fk.TABLE_NAME);
      candidates.add(fk.REFERENCED_TABLE_NAME);
    }

    const counts: Array<{ table: string; rows: number }> = [];
    for (const table of [...candidates].sort()) {
      const quoted = `\`${table.replace(/`/g, '``')}\``;
      const [result] = await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS rowCount FROM ${quoted}`);
      counts.push({ table, rows: Number(result[0]?.rowCount ?? 0) });
    }

    const aggregates: Record<string, unknown> = {};
    const countByColumn = async (table: string, column: string, key: string) => {
      if (!columnsByTable.get(table)?.has(column)) return;
      const t = `\`${table}\``;
      const c = `\`${column}\``;
      const [result] = await connection.query<RowDataPacket[]>(`SELECT ${c} AS value,COUNT(*) AS rowCount FROM ${t} GROUP BY ${c} ORDER BY ${c}`);
      aggregates[key] = result.map(row => ({ value: row.value, rows: Number(row.rowCount) }));
    };
    await countByColumn('client_appointments', 'status', 'appointmentStatus');
    await countByColumn('client_services', 'is_active', 'serviceActive');
    await countByColumn('client_services', 'professional_type_id', 'serviceProfessionalType');
    await countByColumn('client_appointment_slots', 'is_active', 'slotActive');
    await countByColumn('professional_blocks', 'is_active', 'professionalBlockActive');
    await countByColumn('client_clinical_records', 'appointment_id', 'clinicalAppointmentReference');

    if (['id', 'name', 'is_active', 'professional_type_id', 'specialty_id'].every(column => columnsByTable.get('client_services')?.has(column))) {
      const [services] = await connection.execute<RowDataPacket[]>(
        `SELECT s.id,s.name,s.is_active AS isActive,pt.name AS professionalType,sp.name AS specialty
         FROM client_services s LEFT JOIN professional_types pt ON pt.id=s.professional_type_id
         LEFT JOIN specialties sp ON sp.id=s.specialty_id ORDER BY s.id`,
      );
      aggregates.services = services;
    }
    if (['service_id', 'professional_user_id', 'professional_type_id', 'is_active', 'starts_at', 'ends_at'].every(column => columnsByTable.get('client_appointment_slots')?.has(column))) {
      const [slots] = await connection.execute<RowDataPacket[]>(
        `SELECT s.service_id AS serviceId,sv.name AS service,pt.name AS professionalType,s.professional_user_id AS professionalUserId,
          COUNT(*) AS total,SUM(s.is_active=1) AS active,MIN(s.starts_at) AS firstStart,MAX(s.starts_at) AS lastStart
          ,SUM(s.veterinarian_id IS NOT NULL) AS veterinarianLinked
         FROM client_appointment_slots s LEFT JOIN client_services sv ON sv.id=s.service_id
         LEFT JOIN professional_types pt ON pt.id=s.professional_type_id
         GROUP BY s.service_id,sv.name,pt.name,s.professional_user_id ORDER BY s.service_id,s.professional_user_id`,
      );
      aggregates.slotsByServiceAndProfessional = slots.map(row => ({ ...row, total: Number(row.total), active: Number(row.active) }));
    }
    if (['user_id', 'service_id'].every(column => columnsByTable.get('professional_services')?.has(column))) {
      const [assignments] = await connection.execute<RowDataPacket[]>(
        `SELECT ps.service_id AS serviceId,sv.name AS service,ps.user_id AS professionalUserId,r.code AS accountRole,pt.name AS professionalType
         FROM professional_services ps JOIN client_services sv ON sv.id=ps.service_id
         JOIN users u ON u.id=ps.user_id JOIN roles r ON r.id=u.role_id
         LEFT JOIN professional_types pt ON pt.id=COALESCE(u.professional_type_id,r.professional_type_id)
         ORDER BY ps.service_id,ps.user_id`,
      );
      aggregates.serviceAssignments = assignments;
    }
    if (['users', 'roles'].every(table => tables.some(item => item.TABLE_NAME === table)) &&
      ['id', 'role_id', 'is_active'].every(column => columnsByTable.get('users')?.has(column))) {
      const [accounts] = await connection.execute<RowDataPacket[]>(
        `SELECT r.code AS role,u.is_active AS isActive,COUNT(*) AS accounts,
          SUM(v.id IS NOT NULL) AS veterinarianProfiles
         FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN veterinarians v ON v.user_id=u.id
         GROUP BY r.code,u.is_active ORDER BY r.code,u.is_active`,
      );
      aggregates.accountsByRoleAndStatus = accounts.map(row => ({ ...row, accounts: Number(row.accounts), veterinarianProfiles: Number(row.veterinarianProfiles) }));
    }

    const tableEngine = tables.filter(table => candidates.has(table.TABLE_NAME)).map(table => ({ table: table.TABLE_NAME, engine: table.ENGINE }));
    console.log(JSON.stringify({
      mode: 'READ ONLY; transaction will be rolled back',
      configuredEnvironment: env.nodeEnvironment,
      configuredHost: 'Layerbase (credential/hostname withheld)',
      configuredDatabase: env.database.database,
      databaseIdentity: {
        schema: String(identity[0].schemaName),
        serverPort: Number(identity[0].serverPort),
        serverReadOnly: Boolean(identity[0].serverReadOnly),
        transactionReadOnly: Boolean(identity[0].transactionReadOnly),
        serverVersion: String(identity[0].serverVersion),
      },
      relevantTablesAndEngines: tableEngine,
      rowCounts: counts,
      groupedCounts: aggregates,
      relatedTableColumns: columns.filter(column => targetTables.has(column.TABLE_NAME)),
      foreignKeys: relevantForeignKeys,
      note: 'Counts do not classify which rows are test data. No row was changed; review this inventory before authorizing any deletion.',
    }, null, 2));
  } finally {
    if (inReadOnlyTransaction) await connection.rollback();
    connection.release();
    await databasePool.end();
  }
}

void main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Inspección Layerbase fallida.');
  await databasePool.end().catch(() => undefined);
  process.exitCode = 1;
});
