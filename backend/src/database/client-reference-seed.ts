/**
 * ARCHIVO: client-reference-seed.ts
 * UBICACIÓN: backend/src/database/client-reference-seed.ts
 * FUNCIÓN: Carga datos de referencia de cliente a partir de un origen estructurado.
 * RESPONSABILIDAD: Lee catálogos de especies/razas y los inserta o reconcilia usando conexión SQL.
 * CONEXIONES: Importa: backend/src/database/seed-runner.ts, backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Seed runner → carga de referencias de cliente → archivos semilla y databasePool.
 * IMPORTANCIA: Provee opciones maestras que necesita el formulario de mascotas.
 */
/** Carga solo las especies estructurales ya versionadas, necesarias para la FK pets.species_id.
 * No agrega un seed nuevo ni datos de negocio. El runner original requiere SQL ausente del checkout.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readCatalog } from './seed-runner';
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { withDatabaseLock } from './lock';
/** Carga o reconcilia especies y referencias iniciales desde el catálogo fuente. */
async function seed(){
  const source:unknown=JSON.parse(await readFile(resolve(__dirname,'../../seeds/001_reference_catalogs.json'),'utf8'));
  if(!source||typeof source!=='object'||!('species' in source))throw new Error('Catálogo estructural ausente.');
  const species=readCatalog(source.species);await checkDatabaseConnection();const c=await databasePool.getConnection();
  try{await withDatabaseLock(c,async()=>{await c.beginTransaction();try{
    for(const item of species)await c.execute('INSERT INTO species (code,name) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM species WHERE code=?)',[item.code,item.name,item.code]);
    await c.commit();console.info('Catálogo estructural de especies existente preparado.');
  }catch(error){await c.rollback();throw error;}});}finally{c.release();}
}
void seed().catch(()=>{console.error('No se pudo preparar el catálogo estructural de especies.');process.exitCode=1;}).finally(()=>databasePool.end());
