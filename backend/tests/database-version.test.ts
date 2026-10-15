import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertSupportedMysqlVersion } from '../src/services/database.service';

test('acepta las ramas verificadas de MySQL', () => {
  for (const version of ['8.0.16', '8.4.6-commercial', '9.0.1']) {
    assert.doesNotThrow(() => assertSupportedMysqlVersion(version));
  }
});

test('acepta MariaDB 11.8.x y no generaliza a otras ramas MariaDB', () => {
  for (const version of ['11.8.0-MariaDB', '11.8.9-MariaDB-ubu2404']) {
    assert.doesNotThrow(() => assertSupportedMysqlVersion(version));
  }
  for (const version of ['11.7.3-MariaDB', '10.11.8-MariaDB', '12.0.1-MariaDB']) {
    assert.throws(() => assertSupportedMysqlVersion(version), { code: 'DB_VERSION_UNSUPPORTED' });
  }
});

test('rechaza versiones MySQL anteriores al mínimo y motores no identificados', () => {
  for (const version of ['5.7.44', '8.0.15', 'PostgreSQL 16.2', '']) {
    assert.throws(() => assertSupportedMysqlVersion(version), { code: 'DB_VERSION_UNSUPPORTED' });
  }
});
