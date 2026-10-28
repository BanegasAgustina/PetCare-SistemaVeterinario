// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Ejecuta de forma reanudable la ampliación aditiva de metadatos de productos y su auditoría. */
import type { RowDataPacket } from 'mysql2/promise'; // El tipo modela filas devueltas por las consultas de metadatos.
import { databasePool } from '../config/database'; // El pool conserva la conexión MySQL ya configurada por PetCare.
import { withDatabaseLock } from './lock'; // El lock evita que dos migradores trabajen simultáneamente.
import { planProductOriginMigration, type ProductOriginSchema, type SchemaColumn, type SchemaForeignKey, type SchemaIndex } from './product-origin-schema'; // El planificador valida el esquema sin ejecutar DDL.

/** Lee el esquema actual necesario para decidir una sola operación compatible. */
// Función readProductOriginSchema: obtiene o consulta información dentro de este módulo.
async function readProductOriginSchema(connection: Awaited<ReturnType<typeof databasePool.getConnection>>): Promise<ProductOriginSchema> { // La conexión recibida pertenece al pool y se reutiliza durante la ejecución.
  /** La consulta obtiene tablas padre e historiales sin leer ni modificar filas de negocio. */
  const [tableRows] = await connection.execute<(RowDataPacket & { TABLE_NAME: string; ENGINE: string | null; TABLE_COLLATION: string | null; CHARACTER_SET_NAME: string | null })[]>("SELECT t.TABLE_NAME, t.ENGINE, t.TABLE_COLLATION, c.CHARACTER_SET_NAME FROM information_schema.TABLES AS t LEFT JOIN information_schema.COLLATION_CHARACTER_SET_APPLICABILITY AS c ON c.COLLATION_NAME = t.TABLE_COLLATION WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME IN ('client_products', 'client_orders', 'users', 'client_product_change_history', 'client_order_status_history')");
  /** La consulta incluye tipo, default y nulabilidad para no aceptar columnas incompatibles. */
  const [columnRows] = await connection.execute<(RowDataPacket & { TABLE_NAME: string; COLUMN_NAME: string; COLUMN_TYPE: string; IS_NULLABLE: string; COLUMN_DEFAULT: string | null; EXTRA: string | null })[]>("SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('client_products', 'client_orders', 'users', 'client_product_change_history', 'client_order_status_history')");
  /** Los índices se agrupan en orden de columna para comparar su definición real. */
  const [indexRows] = await connection.execute<(RowDataPacket & { TABLE_NAME: string; INDEX_NAME: string; NON_UNIQUE: number; SEQ_IN_INDEX: number; COLUMN_NAME: string | null })[]>("SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('client_products', 'client_orders', 'users', 'client_product_change_history', 'client_order_status_history') ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX");
  /** La consulta obtiene cada FK y su regla de borrado para impedir sustituciones incompatibles. */
  const [foreignKeyRows] = await connection.execute<(RowDataPacket & { TABLE_NAME: string; CONSTRAINT_NAME: string; COLUMN_NAME: string; REFERENCED_TABLE_NAME: string; REFERENCED_COLUMN_NAME: string; DELETE_RULE: string })[]>("SELECT kcu.TABLE_NAME, kcu.CONSTRAINT_NAME, kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME, rc.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE AS kcu INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS AS rc ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND rc.TABLE_NAME = kcu.TABLE_NAME AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME WHERE kcu.CONSTRAINT_SCHEMA = DATABASE() AND kcu.REFERENCED_TABLE_NAME IS NOT NULL AND kcu.TABLE_NAME IN ('client_products', 'client_product_change_history', 'client_order_status_history') ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION");
  /** Los metadatos de tablas se convierten en conjuntos para validar presencia y compatibilidad. */
  const tables = new Set<string>(tableRows.map(row => row.TABLE_NAME));
  /** Cada columna conserva los atributos utilizados por el planificador. */
  const columns: SchemaColumn[] = columnRows.map(row => ({ table: row.TABLE_NAME, name: row.COLUMN_NAME, type: row.COLUMN_TYPE, nullable: row.IS_NULLABLE === 'YES', defaultValue: row.COLUMN_DEFAULT, extra: row.EXTRA ?? '' }));
  /** Las filas sucesivas del índice se agrupan por tabla y nombre manteniendo su orden. */
  const indexGroups = new Map<string, { table: string; name: string; unique: boolean; columns: string[] }>();
  /** La clave compuesta evita mezclar índices homónimos de tablas distintas. */
  for (const row of indexRows) {
    /** La referencia SQL no genera índices funcionales ni expresiones para esta migración. */
    const key = `${row.TABLE_NAME}.${row.INDEX_NAME}`;
    /** El grupo se inicializa al encontrar la primera columna de cada índice. */
    const group = indexGroups.get(key) ?? { table: row.TABLE_NAME, name: row.INDEX_NAME, unique: Number(row.NON_UNIQUE) === 0, columns: [] };
    /** Los nombres no nulos se incorporan en el orden ordinal informado por MariaDB. */
    if (row.COLUMN_NAME) group.columns.push(row.COLUMN_NAME);
    /** El grupo actualizado queda disponible para la siguiente columna del índice. */
    indexGroups.set(key, group);
  }
  /** La lista resultante sirve para verificar índices primarios, únicos y de soporte. */
  const indexes: SchemaIndex[] = [...indexGroups.values()];
  /** Las filas de FK se agrupan para conservar relaciones compuestas en una sola definición. */
  const foreignKeyGroups = new Map<string, SchemaForeignKey>();
  /** Cada referencia conserva nombre, columnas, destino y política de borrado. */
  for (const row of foreignKeyRows) {
    /** La clave compuesta identifica una restricción dentro de una tabla. */
    const key = `${row.TABLE_NAME}.${row.CONSTRAINT_NAME}`;
    /** La FK se crea al encontrar su primera columna de origen. */
    const relation = foreignKeyGroups.get(key) ?? { table: row.TABLE_NAME, name: row.CONSTRAINT_NAME, columns: [], referencedTable: row.REFERENCED_TABLE_NAME, referencedColumns: [], deleteRule: row.DELETE_RULE };
    /** Las columnas locales y referenciadas se agregan respetando el orden del servidor. */
    relation.columns.push(row.COLUMN_NAME);
    /** Cada columna referenciada se mantiene alineada con la columna local correspondiente. */
    relation.referencedColumns.push(row.REFERENCED_COLUMN_NAME);
    /** La relación acumulada queda disponible para las columnas siguientes. */
    foreignKeyGroups.set(key, relation);
  }
  /** Las propiedades de motor, charset e intercalación provienen del catálogo real. */
  const engineByTable = new Map<string, string>(tableRows.filter(row => row.ENGINE).map(row => [row.TABLE_NAME, row.ENGINE as string]));
  /** Los juegos de caracteres se leen de la intercalación reportada por cada tabla. */
  const charsetByTable = new Map<string, string>(tableRows.filter(row => row.CHARACTER_SET_NAME).map(row => [row.TABLE_NAME, row.CHARACTER_SET_NAME as string]));
  /** Las intercalaciones se conservan para crear una tabla compatible con la tabla padre. */
  const collationByTable = new Map<string, string>(tableRows.filter(row => row.TABLE_COLLATION).map(row => [row.TABLE_NAME, row.TABLE_COLLATION as string]));
  /** El esquema se devuelve como datos de solo lectura para planificar el próximo paso. */
  return { tables, columns, indexes, foreignKeys: [...foreignKeyGroups.values()], engineByTable, charsetByTable, collationByTable };
}

/** Aplica y vuelve a comprobar un único DDL aditivo por iteración para poder reanudarlo con seguridad. */
// Función migrateProductOrigins: concentra la lógica dentro de este módulo.
export async function migrateProductOrigins(): Promise<void> { // La función no crea registros ni modifica datos de negocio.
  /** La conexión se adquiere solo al ejecutar explícitamente el comando del migrador. */
  const connection = await databasePool.getConnection();
  /** El contador limita un plan inesperadamente inestable sin ejecutar operaciones ilimitadas. */
  let appliedSteps = 0;
  try {
    /** El lock de base serializa el proceso entre instancias del backend. */
    await withDatabaseLock(connection, async () => {
      /** Cada ciclo vuelve a inspeccionar metadatos después del DDL con commit implícito. */
      for (let attempt = 0; attempt < 32; attempt += 1) {
        /** La lectura precede a toda operación y no consulta filas de usuarios o pedidos. */
        const schema = await readProductOriginSchema(connection);
        /** El planificador se detiene ante tablas, columnas, índices o claves incompatibles. */
        const steps = planProductOriginMigration(schema);
        /** Un plan vacío confirma que los objetos requeridos ya coinciden con la definición. */
        if (steps.length === 0) {
          // Las reservas activas anteriores reciben su vencimiento según created_at y sin alterar fechas ya fijadas.
          const [backfill] = await connection.execute('UPDATE client_orders SET expires_at=TIMESTAMPADD(HOUR,24,created_at) WHERE expires_at IS NULL AND status IN (\'PLACED\',\'CONFIRMED\',\'PROCESSING\',\'READY\')');
          // Los permisos nuevos reutilizan el módulo actual de productos y se insertan sin duplicar ni borrar grants.
          const permissions=[['products.create','Crear productos','Agregar productos al inventario propio']] as const;
          for(const [code,name,description] of permissions) await connection.execute('INSERT IGNORE INTO permissions(code,name,description,module_code,is_critical,opens_module) SELECT ?,?,?,module_code,0,0 FROM permissions WHERE code=\'products.update\' LIMIT 1',[code,name,description]);
          const [permissionRows]=await connection.execute<(RowDataPacket & {id:number;code:string})[]>('SELECT id,code FROM permissions WHERE code=?',['products.create']);
          const [roleRows]=await connection.execute<(RowDataPacket & {id:number;code:string})[]>('SELECT id,code FROM roles WHERE code IN (\'ADMIN\',\'SUPER_ADMIN\')');
          if(permissionRows.length!==1) throw new Error('No se pudo registrar el permiso de creación de productos: verificá que exista products.update y el esquema RBAC esté aplicado.');
          if(!['ADMIN','SUPER_ADMIN'].every(code=>roleRows.some(role=>role.code===code))) throw new Error('Aplicá primero la migración de roles de clínica: se requieren ADMIN y SUPER_ADMIN.');
          for(const role of roleRows){for(const permission of permissionRows)await connection.execute('INSERT IGNORE INTO role_permissions(role_id,permission_id) VALUES (?,?)',[role.id,permission.id]);}
          console.info(appliedSteps === 0 ? 'El esquema de productos y su auditoría ya está aplicado.' : `Migración local finalizada: ${appliedSteps} sentencias DDL verificadas.`);
          if ((backfill as { affectedRows?: number }).affectedRows) console.info(`Se asignó vencimiento a ${(backfill as { affectedRows: number }).affectedRows} reservas activas previas.`);
          console.info(`Se verificaron permisos de tienda para ${roleRows.map(role=>role.code).join(', ')||'ningún rol administrativo detectado'}.`);
          return;
        }
        /** Solo se toma el primer paso; los pasos restantes se recalculan tras verificarlo. */
        const step = steps[0];
        try {
          /** MariaDB confirma DDL por sentencia; no se simula una transacción reversible. */
          await connection.query(step.sql);
          /** La inspección siguiente confirma el objeto antes de avanzar al paso posterior. */
          appliedSteps += 1;
        } catch (error) {
          /** El mensaje indica el paso parcial y permite reanudar tras revisar information_schema. */
          const detail = error instanceof Error ? error.message : 'error SQL desconocido';
          throw new Error(`Falló «${step.description}» después de ${appliedSteps} DDL confirmados; no se revirtió el DDL previo. Revisá el esquema y reejecutá el migrador para reanudar si las definiciones son compatibles. Detalle: ${detail}`);
        }
      }
      /** El límite impide seguir si el esquema cambia repetidamente durante la inspección. */
      throw new Error('El esquema cambió durante demasiados pasos; no se ejecutaron más sentencias. Revisá la base antes de reintentar.');
    });
  } finally {
    /** La conexión vuelve al pool tanto al completar como al detectar incompatibilidades. */
    connection.release();
  }
}

/** La ejecución directa permite operación manual controlada y nunca se dispara al importar el módulo. */
if (require.main === module) void migrateProductOrigins().catch(error => {
  /** El error describe el problema operativo sin imprimir opciones del pool ni credenciales. */
  console.error(error instanceof Error ? error.message : 'No se pudo revisar el esquema de productos.');
  /** El estado distinto de cero informa el bloqueo al operador o al proceso invocador. */
  process.exitCode = 1;
}).finally(() => databasePool.end());
