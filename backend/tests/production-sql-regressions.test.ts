import test from 'node:test';
import assert from 'node:assert/strict';
import { databasePool } from '../src/config/database';
import { clinicOperation } from '../src/services/clinic.service';
import { clientOperation } from '../src/services/client.service';
import { clients } from '../src/repositories/clinic.repository';
import type { AuthUser } from '../src/types/auth';

type Execute = typeof databasePool.execute;
type ExecuteResult = (sql: string, values: unknown[]) => Promise<unknown>;

function mockExecute(run: ExecuteResult): () => void {
  const original = databasePool.execute;
  databasePool.execute = (async (sql: unknown, values?: unknown[]) => run(String(sql), values ?? [])) as Execute;
  return () => { databasePool.execute = original; };
}

function actor(role: AuthUser['role'], permissions: string[]): AuthUser {
  return { id: '42', firstName: 'Test', lastName: 'User', email: 'test@example.invalid', phone: null, role, permissions };
}

test('admin service listing exposes the image_url schema dependency and normalizes a missing column', async () => {
  let query = '';
  const restore = mockExecute(async sql => {
    query = sql;
    throw Object.assign(new Error('database error'), {
      code: 'ER_BAD_FIELD_ERROR',
      sqlMessage: "Unknown column 'image_url' in 'field list'",
    });
  });
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...values: unknown[]) => logged.push(values.join(' '));
  try {
    await assert.rejects(
      clinicOperation(actor('ADMIN', ['services.manage']), 'admin-list', undefined, undefined, {}, 'services'),
      error => (error as { code?: string; status?: number }).code === 'SCHEMA_UPDATE_REQUIRED'
        && (error as { status?: number }).status === 500,
    );
    assert.match(query, /client_services/);
    assert.match(query, /image_url AS imageUrl/);
    assert.match(logged.join(' '), /image_url/);
    assert.doesNotMatch(logged.join(' '), /SELECT|field list/);
  } finally {
    console.error = originalError;
    restore();
  }
});

test('client notifications listing selects event metadata and normalizes a missing column', async () => {
  let query = '';
  const restore = mockExecute(async sql => {
    query = sql;
    throw Object.assign(new Error('database error'), {
      code: 'ER_BAD_FIELD_ERROR',
      sqlMessage: "Unknown column 'event_type' in 'field list'",
    });
  });
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...values: unknown[]) => logged.push(values.join(' '));
  try {
    await assert.rejects(
      clientOperation('42', 'notifications', undefined, undefined, {}),
      error => (error as { code?: string; status?: number }).code === 'SCHEMA_UPDATE_REQUIRED'
        && (error as { status?: number }).status === 500,
    );
    assert.match(query, /event_type AS eventType/);
    assert.match(query, /reference_type AS referenceType/);
    assert.match(query, /CAST\(reference_id AS CHAR\) AS referenceId/);
    assert.match(logged.join(' '), /event_type/);
    assert.doesNotMatch(logged.join(' '), /SELECT|field list/);
  } finally {
    console.error = originalError;
    restore();
  }
});

test('clinic clients query variants keep role and permission predicates parameterized', async () => {
  const queries: Array<{ sql: string; values: unknown[] }> = [];
  const restore = mockExecute(async (sql, values) => {
    queries.push({ sql, values });
    return [[], []];
  });
  try {
    const cases: Array<{ user: AuthUser; joinsVet: boolean; assignedOnly: boolean; contacts: boolean }> = [
      { user: actor('ADMIN', ['users.view_basic']), joinsVet: false, assignedOnly: false, contacts: true },
      { user: actor('SECRETARY', ['users.view_basic']), joinsVet: false, assignedOnly: false, contacts: true },
      { user: actor('VETERINARIAN', ['pets.view_information', 'pets.view_assigned']), joinsVet: true, assignedOnly: true, contacts: false },
      { user: actor('VETERINARIAN', ['pets.view_information', 'pets.view_assigned', 'users.view_basic']), joinsVet: true, assignedOnly: true, contacts: true },
      { user: actor('VETERINARIAN', ['pets.view_information', 'pets.view_all']), joinsVet: true, assignedOnly: false, contacts: false },
      { user: actor('VETERINARIAN', ['pets.view_information', 'pets.view_all', 'users.view_basic']), joinsVet: true, assignedOnly: false, contacts: true },
    ];
    for (const item of cases) await clients(item.user, 'needle');

    assert.equal(queries.length, cases.length);
    for (const [index, item] of cases.entries()) {
      const { sql, values } = queries[index];
      assert.equal((sql.match(/\?/g) ?? []).length, values.length, `query variant ${index}: ${sql}`);
      assert.doesNotMatch(sql, /needle|%needle%|42/);
      assert.match(sql, /SELECT DISTINCT u\.id/);
      assert.match(sql, /ORDER BY u\.last_name,u\.first_name LIMIT 100/);
      assert.equal(sql.includes('LEFT JOIN veterinarian_patients'), item.joinsVet);
      assert.equal(sql.includes('AND vt.user_id=?'), item.assignedOnly);
      assert.equal(sql.includes('u.email LIKE ?'), item.contacts);
      assert.equal(values.length, 2 + Number(item.contacts) + Number(item.assignedOnly));
    }
  } finally {
    restore();
  }
});
