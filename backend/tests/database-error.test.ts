import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDatabaseError } from '../src/utils/database-error';

test('schema errors expose a retryable message and log only the missing identifier', () => {
  const originalError = console.error;
  const diagnostic: unknown[][] = [];
  console.error = (...values: unknown[]) => diagnostic.push(values);

  try {
    const error = normalizeDatabaseError({
      code: 'ER_BAD_FIELD_ERROR',
      sqlMessage: "Unknown column 'client_appointments.cancellation_reason' in 'field list'; SELECT secret FROM users",
      sql: 'SELECT secret FROM users',
    });

    assert.equal(error.code, 'SCHEMA_UPDATE_REQUIRED');
    assert.equal(error.message, 'No pudimos recuperar los datos de la clínica. Intentá nuevamente.');
    assert.equal(diagnostic.length, 1);
    assert.deepEqual(JSON.parse(String(diagnostic[0][1])), {
      code: 'ER_BAD_FIELD_ERROR',
      object: 'client_appointments.cancellation_reason',
    });
    assert.doesNotMatch(String(diagnostic[0][1]), /SELECT|secret|sqlMessage/i);
  } finally {
    console.error = originalError;
  }
});
