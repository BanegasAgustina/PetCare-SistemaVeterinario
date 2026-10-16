import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { catalogName, permissionDescription, permissionModuleName, permissionName, roleName } from '../src/utils/catalog-presentation';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(?:ts|tsx|js|jsx|json|html|css)$/i.test(entry.name) ? [path] : [];
  });
}

test('permission catalog labels are presented in correct Spanish without changing stored data', () => {
  assert.equal(permissionName('medical_records.diagnose', 'Registrar diagn\u00c3\u0192\u00c2\u00b3stico'), 'Registrar diagnóstico');
  assert.equal(permissionName('pets.view_information', 'Ver informaci\u00c3\u0192\u00c2\u00b3n de mascotas'), 'Ver información de mascotas');
  assert.equal(permissionName('other.permission', 'Etiqueta válida'), 'Etiqueta válida');
  assert.equal(permissionDescription('products.view', 'Cat\u00c3\u0192\u00c2\u00a1logo de productos'), 'Catálogo de productos');
  assert.equal(permissionDescription('products.update_stock', 'Edici\u00c3\u0192\u00c2\u00adn de stock'), 'Edición de stock');
  assert.equal(permissionModuleName('medical_records', 'Historial cl\u00c3\u0192\u00c2\u00adnico'), 'Historial clínico');
  assert.equal(roleName('GROOMER', 'Peluquer\u00c3\u0192\u00c2\u00ada'), 'Peluquería');
  assert.equal(roleName('SECRETARY', 'Secretar\u00c3\u0192\u00c2\u00ada'), 'Secretaría');
  assert.equal(catalogName('Dermatolog\u00c3\u0192\u00c2\u00ada'), 'Dermatología');
  assert.equal(catalogName('Cardiolog\u00c3\u0192\u00c2\u00ada'), 'Cardiología');
  assert.equal(catalogName('Nutrici\u00c3\u0192\u00c2\u00b3n'), 'Nutrición');
  assert.equal(catalogName('Cirug\u00c3\u0192\u00c2\u00ada'), 'Cirugía');
  assert.equal(catalogName('Una etiqueta válida'), 'Una etiqueta válida');
});

test('backend and mobile source contain no common encoding corruption or replacement characters', () => {
  const roots = [resolve(process.cwd(), 'src'), resolve(process.cwd(), 'tests'), resolve(process.cwd(), '../mobile/src')];
  const suspiciousEncoding = /\u00c3|\u00c2|\ufffd/u;
  const matches = roots.flatMap(root => sourceFiles(root)).flatMap(path => {
    const content = readFileSync(path, 'utf8');
    return suspiciousEncoding.test(content) ? [path] : [];
  });
  assert.deepEqual(matches, [], `Revisá caracteres sospechosos en: ${matches.join(', ')}`);
});

test('mobile labels do not reintroduce common English interface copy', () => {
  const files = [...sourceFiles(resolve(process.cwd(), '../mobile/src')), ...sourceFiles(resolve(process.cwd(), 'src'))];
  const legacyCopy = /(?:label|title|placeholder)\s*=\s*{?['"](?:Email|Password|Login|Loading\.\.\.|Medical history|Pet information|Diagnosis|Something went wrong)['"]|['"](?:Email o contraseña incorrectos\.|Email:|Ir a Login|Login habitual)['"]/i;
  const matches = files.flatMap(path => legacyCopy.test(readFileSync(path, 'utf8')) ? [path] : []);
  assert.deepEqual(matches, [], `Traducí las etiquetas visibles en: ${matches.join(', ')}`);
});
