import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSearchTerm } from '../src/utils/search-normalization';

test('normaliza búsquedas sin distinguir mayúsculas, minúsculas ni acentos', () => {
  assert.equal(normalizeSearchTerm('PÉLOTA Coquitos'), 'pelota coquitos');
  assert.equal(normalizeSearchTerm('Veterinária'), 'veterinaria');
});
