import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../../src/config/database';
import { effectiveRolePermission } from '../../src/types/authorization';

test('live role grants authorize global patient view for ADMIN and SUPER_ADMIN', async () => {
  const connection = await databasePool.getConnection();
  try {
    await connection.query('SET TRANSACTION READ ONLY');
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>(`SELECT r.code AS roleCode,p.is_critical AS isCritical,
      rp.permission_id IS NOT NULL AS inherited
      FROM roles r JOIN permissions p ON p.code='pets.view_all'
      LEFT JOIN role_permissions rp ON rp.role_id=r.id AND rp.permission_id=p.id
      WHERE r.code IN ('ADMIN','SUPER_ADMIN')`);
    const grants = new Map(rows.map(row => [String(row.roleCode), {
      critical: Number(row.isCritical) === 1,
      inherited: Number(row.inherited) === 1,
    }]));

    for (const role of ['ADMIN', 'SUPER_ADMIN']) {
      const grant = grants.get(role);
      assert.ok(grant, `${role} exists and the pets.view_all permission is registered`);
      assert.equal(grant.inherited, true, `${role} currently has the role grant enabled`);
      assert.equal(effectiveRolePermission(role, grant.critical, grant.inherited, null), true);
    }
  } finally {
    await connection.rollback();
    connection.release();
    await databasePool.end();
  }
});
