// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Extensión aditiva de pets para guardar el sexo sin alterar mascotas existentes. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

// Función migratePetSex: concentra la lógica dentro de este módulo.
export async function migratePetSex() {
  const connection=await databasePool.getConnection();
  try {
    await withDatabaseLock(connection,async()=>{
      const [tables]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pets'");
      if(!tables.length)throw new Error('No existe pets; aplicá primero el esquema base.');
      const [columns]=await connection.execute<RowDataPacket[]>("SELECT DATA_TYPE,COLUMN_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pets' AND COLUMN_NAME='sex'");
      if(columns.length){
        const column=columns[0];
        const stringTypes=['enum','char','varchar'];
        const longTextTypes=['tinytext','text','mediumtext','longtext'];
        if(longTextTypes.includes(String(column.DATA_TYPE))&&column.IS_NULLABLE==='YES'){
          console.info('pets.sex ya está preparada.');return;
        }
        if(longTextTypes.includes(String(column.DATA_TYPE))){
          await connection.execute('ALTER TABLE pets MODIFY COLUMN sex LONGTEXT NULL');
          console.info('pets.sex ahora admite NULL; se conservaron los valores existentes.');return;
        }
        if(!stringTypes.includes(String(column.DATA_TYPE)))throw new Error(`pets.sex tiene un tipo no textual (${String(column.COLUMN_TYPE)}, nullable=${String(column.IS_NULLABLE)}); no se modificó.`);
        if(column.DATA_TYPE==='varchar'&&Number(column.CHARACTER_MAXIMUM_LENGTH)>=32&&column.IS_NULLABLE==='YES'){
          console.info('pets.sex ya está preparada.');return;
        }
        // Convierte enums o campos cortos a texto suficiente para los códigos de la API;
        // MySQL conserva los valores actuales durante esta ampliación.
        const length=Math.max(32,Number(column.CHARACTER_MAXIMUM_LENGTH)||0);
        const target=length>4000?'LONGTEXT':`VARCHAR(${length})`;
        await connection.execute(`ALTER TABLE pets MODIFY COLUMN sex ${target} NULL`);
        console.info(`pets.sex ajustada a ${target} NULL; se conservaron los valores existentes.`);return;
      }
      await connection.execute('ALTER TABLE pets ADD COLUMN sex VARCHAR(32) NULL AFTER name');
      console.info('Migración aplicada: pets.sex. Las mascotas existentes conservan NULL hasta que se editen.');
    });
  } finally {connection.release();}
}

if(require.main===module)void migratePetSex().catch(error=>{
  console.error(error instanceof Error&&(error.message.startsWith('No existe')||error.message.includes('incompatible'))?error.message:'No se aplicó la migración de sexo de mascotas. Revisá conexión y permisos MySQL.');
  process.exitCode=1;
}).finally(()=>databasePool.end());
