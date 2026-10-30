import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { readCatalog } from '../src/database/seed-runner';

test('versioned reference catalog contains all reserved database roles and species codes', async () => {
  const source = JSON.parse(await readFile(resolve(__dirname, '../seeds/001_reference_catalogs.json'), 'utf8')) as Record<string, unknown>;
  const roles = readCatalog(source.roles);
  const species = readCatalog(source.species);

  assert.deepEqual(roles.map(role => role.code), ['CLIENT', 'VETERINARIAN', 'GROOMER', 'ADMIN', 'SUPER_ADMIN', 'SECRETARY']);
  assert.deepEqual(species.map(item => item.code), ['DOG', 'CAT']);
});
