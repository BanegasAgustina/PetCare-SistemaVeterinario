import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDatabaseError } from '../src/utils/database-error';

test('database connection failures produce a safe 503 classification', () => {
  const error = normalizeDatabaseError({ code: 'ECONNREFUSED', message: 'private connection detail' });

  assert.equal(error.status, 503);
  assert.equal(error.code, 'DB_UNAVAILABLE');
  assert.equal(error.message, 'La base de datos no está disponible. Intentá nuevamente.');
});

test('missing database columns produce a safe schema 500 classification', () => {
  const logged: string[] = [];
  const originalError = console.error;
  console.error = (...values: unknown[]) => logged.push(values.join(' '));

  try {
    const error = normalizeDatabaseError({
      code: 'ER_BAD_FIELD_ERROR',
      sqlMessage: "Unknown column 'p.photo_url' in 'field list'; sensitive SQL detail",
    });

    assert.equal(error.status, 500);
    assert.equal(error.code, 'SCHEMA_UPDATE_REQUIRED');
    assert.equal(logged.length, 1);
    assert.match(logged[0], /p\.photo_url/);
    assert.doesNotMatch(logged[0], /sensitive SQL detail/);
  } finally {
    console.error = originalError;
  }
});

test('unclassified database errors remain a safe 500 classification', () => {
  const error = normalizeDatabaseError({ code: 'ER_PARSE_ERROR', sqlMessage: 'private SQL detail' });

  assert.equal(error.status, 500);
  assert.equal(error.code, 'DB_ERROR');
  assert.doesNotMatch(error.message, /private SQL detail/);
});
