/** Describe una columna leída de information_schema sin asumir el esquema de producción. */
export type SchemaColumn = { table: string; name: string; type: string; nullable: boolean; defaultValue: string | null; extra: string };
/** Describe un índice en el orden de sus columnas, incluido su nombre y unicidad. */
export type SchemaIndex = { table: string; name: string; unique: boolean; columns: string[] };
/** Describe una clave foránea y las columnas padre que protege. */
export type SchemaForeignKey = { table: string; name: string; columns: string[]; referencedTable: string; referencedColumns: string[]; deleteRule: string };
/** Agrupa solo metadatos necesarios para planificar la extensión de productos y reservas. */
export type ProductOriginSchema = { tables: Set<string>; columns: SchemaColumn[]; indexes: SchemaIndex[]; foreignKeys: SchemaForeignKey[]; engineByTable: Map<string, string>; charsetByTable: Map<string, string>; collationByTable: Map<string, string> };
/** Representa una sentencia DDL aditiva que se ejecuta y verifica individualmente. */
export type MigrationStep = { description: string; sql: string };
/** Normaliza tipos de MariaDB para comparar definiciones sin diferencias irrelevantes de mayúsculas. */
const normalizeType = (value: string): string => value.toLowerCase().replace(/\s+/g, ' ').trim();
/** Normaliza valores predeterminados para comparar NULL, cadenas y constantes del servidor. */
const normalizeDefault = (value: string | null): string | null => {
  if (value === null || value.trim().toLowerCase() === 'null') return null;
  return value.replace(/^['"]|['"]$/g, '').toLowerCase();
};
/** Falla con un mensaje accionable ante un objeto existente cuya definición no sea la esperada. */
const incompatible = (object: string, expected: string, actual: string): never => { throw new Error(`Esquema incompatible en ${object}: se esperaba ${expected}; se encontró ${actual}. No se ejecutaron más cambios.`); };
/** Recupera una columna existente o devuelve null si todavía puede añadirse de forma aditiva. */
const column = (schema: ProductOriginSchema, table: string, name: string): SchemaColumn | null => schema.columns.find(item => item.table === table && item.name === name) ?? null;
/** Comprueba que una columna existente coincida con la definición que consulta el backend. */
const ensureColumn = (schema: ProductOriginSchema, table: string, name: string, type: string, nullable: boolean, defaultValue: string | null): boolean => {
  /** Una columna ausente puede agregarse sin reescribir filas ni relaciones. */
  const existing = column(schema, table, name);
  /** La ausencia devuelve true para que el planificador genere un ALTER aditivo. */
  if (!existing) return true;
  /** Tipo, nulabilidad y valor predeterminado incompatibles requieren revisión manual. */
  if (normalizeType(existing.type) !== normalizeType(type) || existing.nullable !== nullable || normalizeDefault(existing.defaultValue) !== normalizeDefault(defaultValue)) incompatible(`${table}.${name}`, `${type}, nullable=${nullable}, default=${defaultValue}`, `${existing.type}, nullable=${existing.nullable}, default=${existing.defaultValue}`);
  /** La coincidencia evita crear de nuevo una columna compatible. */
  return false;
};
/** Valida que un tipo padre sea un entero compatible con una FK y seguro para interpolar en DDL. */
const foreignKeyIntegerType = (schema: ProductOriginSchema, table: string, name: string): string => {
  /** La migración usa la definición real de la clave padre, no un tipo supuesto. */
  const actual = column(schema, table, name);
  /** Una clave ausente o no entera impide formar una relación segura. */
  if (!actual) return incompatible(`${table}.${name}`, 'un tipo entero indexado apto para clave foránea', 'columna ausente');
  /** La lista estricta impide interpolar una definición de tipo desconocida en DDL. */
  if (!/^(tinyint|smallint|mediumint|int|bigint)(\(\d+\))?( unsigned)?$/i.test(actual.type)) return incompatible(`${table}.${name}`, 'un tipo entero indexado apto para clave foránea', actual.type);
  /** La cadena proviene de information_schema y pasó una lista estricta de tipos permitidos. */
  return actual.type;
};
/** Comprueba si un índice ya cubre las columnas requeridas como prefijo en el orden indicado. */
const hasIndexPrefix = (schema: ProductOriginSchema, table: string, columns: string[], unique = false): boolean => schema.indexes.some(index => index.table === table && (!unique || index.unique) && columns.every((name, position) => index.columns[position] === name));
/** Comprueba que las tablas padre tengan motor y claves indexadas aptos para las relaciones. */
const ensureParentKey = (schema: ProductOriginSchema, table: string): void => {
  /** InnoDB garantiza la comprobación referencial requerida por las claves foráneas. */
  if (schema.engineByTable.get(table)?.toUpperCase() !== 'INNODB') incompatible(`${table}.ENGINE`, 'InnoDB', schema.engineByTable.get(table) ?? 'desconocido');
  /** MySQL/MariaDB solo aceptan columnas padre con índice cuyo prefijo sea la clave referenciada. */
  if (!hasIndexPrefix(schema, table, ['id'])) incompatible(`${table}.id`, 'columna padre indexada', 'índice compatible ausente');
};
/** Comprueba que una clave foránea existente tenga el mismo destino y regla de borrado. */
const ensureForeignKey = (schema: ProductOriginSchema, table: string, name: string, columns: string[], referencedTable: string, referencedColumns: string[], deleteRule: string): boolean => {
  /** Una FK se reconoce tanto por su nombre declarado como por su columna de origen. */
  const matches = schema.foreignKeys.filter(item => item.table === table && (item.name === name || item.columns.join(',') === columns.join(',')));
  /** Los duplicados o una FK con destino/regla diferente se consideran deriva peligrosa. */
  if (matches.length > 1 || (matches.length === 1 && (matches[0].columns.join(',') !== columns.join(',') || matches[0].referencedTable !== referencedTable || matches[0].referencedColumns.join(',') !== referencedColumns.join(',') || matches[0].deleteRule.toUpperCase() !== deleteRule))) incompatible(`${table}.${name}`, `${columns.join(',')} -> ${referencedTable}.${referencedColumns.join(',')} ON DELETE ${deleteRule}`, matches.map(item => `${item.columns.join(',')} -> ${item.referencedTable}.${item.referencedColumns.join(',')} ON DELETE ${item.deleteRule}`).join('; ') || 'sin coincidencia');
  /** La clave ya presente no se recrea ni se modifica. */
  return matches.length === 0;
};
/** Construye el plan DDL sin conectarse a la base ni ejecutar ninguna escritura. */
export function planProductOriginMigration(schema: ProductOriginSchema): MigrationStep[] {
  /** El backend necesita estos objetos padre para productos, reservas y actores de auditoría. */
  for (const table of ['client_products', 'client_orders', 'users']) if (!schema.tables.has(table)) incompatible(table, 'tabla existente', 'tabla ausente');
  /** Los tipos reales de las claves determinan los tipos de las columnas referenciadas. */
  const userIdType = foreignKeyIntegerType(schema, 'users', 'id');
  /** La clave de reserva usa el tipo exacto ya declarado por client_orders. */
  const orderIdType = foreignKeyIntegerType(schema, 'client_orders', 'id');
  /** La columna de producto debe ser apta para ser referenciada por el historial existente. */
  foreignKeyIntegerType(schema, 'client_products', 'id');
  /** Se comprueban las tres tablas padre antes de planificar claves foráneas. */
  for (const table of ['users', 'client_orders', 'client_products']) ensureParentKey(schema, table);
  /** La lista acumula cambios puntuales y vuelve a quedar vacía cuando todo está aplicado. */
  const steps: MigrationStep[] = [];
  /** Estas definiciones provienen de la migración existente y conservan sus defaults funcionales. */
  const productColumns = [
    /** Clasifica productos sin reclasificar los registros existentes. */
    { name: 'product_type', type: "enum('GENERAL','MEDICINE','ACCESSORY')", nullable: false, defaultValue: 'GENERAL', sql: "ENUM('GENERAL','MEDICINE','ACCESSORY') NOT NULL DEFAULT 'GENERAL' COMMENT 'Clasificación manual del producto; GENERAL conserva el comportamiento previo.'" },
    /** Registra quién creó el producto usando el tipo de users.id. */
    { name: 'created_by', type: userIdType, nullable: true, defaultValue: null, sql: `${userIdType} NULL COMMENT 'Usuario que creó el producto, cuando se conoce.'` },
    /** Registra quién editó el producto por última vez usando el tipo de users.id. */
    { name: 'updated_by', type: userIdType, nullable: true, defaultValue: null, sql: `${userIdType} NULL COMMENT 'Usuario que realizó la última edición.'` },
  ];
  /** Cada columna se valida antes de generar su ALTER individual. */
  for (const item of productColumns) if (ensureColumn(schema, 'client_products', item.name, item.type, item.nullable, item.defaultValue)) steps.push({ description: `Agregar client_products.${item.name}`, sql: `ALTER TABLE client_products ADD COLUMN ${item.name} ${item.sql}` });
  /** La fecha límite queda en la misma fila que ya representa una reserva. */
  if (ensureColumn(schema, 'client_orders', 'expires_at', 'timestamp(3)', true, null)) steps.push({ description: 'Agregar client_orders.expires_at', sql: "ALTER TABLE client_orders ADD COLUMN expires_at TIMESTAMP(3) NULL COMMENT 'Vencimiento de la reserva calculado por MySQL.'" });
  /** Se añade EXPIRED al enum vigente sin retirar ni renombrar estados históricos. */
  const status = column(schema, 'client_orders', 'status');
  const enumBody=status?.type.match(/^enum\((.*)\)$/i)?.[1]??'';
  const currentStatuses=[...enumBody.matchAll(/'((?:[^']|'')*)'/g)].map(match=>match[1].replace(/''/g,"'"));
  if (!status || currentStatuses.length===0 || currentStatuses.some(value=>!['PLACED','CONFIRMED','PROCESSING','READY','COMPLETED','CANCELLED','EXPIRED'].includes(value)) || !['PLACED','PROCESSING','READY','COMPLETED','CANCELLED'].every(value=>currentStatuses.includes(value))) incompatible('client_orders.status', 'ENUM con estados de reserva conocidos', status?.type ?? 'columna ausente');
  if (!status!.type.includes("'EXPIRED'")) steps.push({ description: 'Agregar estado EXPIRED a client_orders', sql: "ALTER TABLE client_orders MODIFY COLUMN status ENUM('PLACED','CONFIRMED','PROCESSING','READY','COMPLETED','CANCELLED','EXPIRED') NOT NULL DEFAULT 'PLACED'" });
  /** Los índices de usuario se verifican o agregan antes de sus claves foráneas. */
  for (const item of [{ column: 'created_by', index: 'idx_client_products_created_by' }, { column: 'updated_by', index: 'idx_client_products_updated_by' }]) {
    /** Un nombre reservado no puede reutilizarse para un índice de columnas distintas. */
    const namedIndex = schema.indexes.find(index => index.table === 'client_products' && index.name === item.index);
    /** La definición del índice nombrado se valida incluso si otro índice ya cubre la columna. */
    if (namedIndex && (namedIndex.unique || namedIndex.columns.join(',') !== item.column)) incompatible(`client_products.${item.index}`, `INDEX(${item.column})`, `${namedIndex.unique ? 'UNIQUE' : 'INDEX'}(${namedIndex.columns.join(',')})`);
    /** Un índice existente por prefijo satisface el requisito de la FK sin duplicación. */
    if (!hasIndexPrefix(schema, 'client_products', [item.column])) steps.push({ description: `Agregar índice de ${item.column}`, sql: `ALTER TABLE client_products ADD INDEX ${item.index} (${item.column})` });
  }
  /** Las claves foráneas de productos se validan por definición y no solo por nombre. */
  for (const item of [{ column: 'created_by', name: 'fk_client_products_created_by' }, { column: 'updated_by', name: 'fk_client_products_updated_by' }]) if (ensureForeignKey(schema, 'client_products', item.name, [item.column], 'users', ['id'], 'RESTRICT')) steps.push({ description: `Agregar FK ${item.name}`, sql: `ALTER TABLE client_products ADD CONSTRAINT ${item.name} FOREIGN KEY (${item.column}) REFERENCES users (id) ON DELETE RESTRICT` });
  /** Una tabla de historial existente no se recrea ni se repara de forma automática. */
  if (schema.tables.has('client_order_status_history')) {
    /** Sus columnas se validan antes de cualquier operación para impedir asumir una forma correcta. */
    const historyColumns = [
      /** La PK del historial conserva el tipo definido en la migración versionada. */
      { name: 'id', type: 'bigint(20) unsigned', nullable: false, defaultValue: null },
      /** La relación de reserva debe coincidir exactamente con la clave padre. */
      { name: 'order_id', type: orderIdType, nullable: false, defaultValue: null },
      /** El estado previo admite NULL para el evento inicial. */
      { name: 'previous_status', type: 'varchar(20)', nullable: true, defaultValue: null },
      /** El estado nuevo es obligatorio para cada evento persistido. */
      { name: 'new_status', type: 'varchar(20)', nullable: false, defaultValue: null },
      /** El actor admite NULL para procesos internos sin usuario iniciador. */
      { name: 'actor_user_id', type: userIdType, nullable: true, defaultValue: null },
      /** La fecha se completa en el servidor cuando se registra el evento. */
      { name: 'occurred_at', type: 'timestamp(3)', nullable: false, defaultValue: 'current_timestamp(3)' },
    ];
    /** Cualquier columna faltante o incompatible detiene la migración sin tocar esta tabla. */
    for (const item of historyColumns) if (!column(schema, 'client_order_status_history', item.name) || ensureColumn(schema, 'client_order_status_history', item.name, item.type, item.nullable, item.defaultValue)) incompatible(`client_order_status_history.${item.name}`, `${item.type}, nullable=${item.nullable}, default=${item.defaultValue}`, column(schema, 'client_order_status_history', item.name)?.type ?? 'columna ausente');
    /** La PK autoincremental debe conservar su atributo, además del tipo y la nulabilidad. */
    if (!column(schema, 'client_order_status_history', 'id')?.extra.toLowerCase().includes('auto_increment')) incompatible('client_order_status_history.id', 'BIGINT UNSIGNED AUTO_INCREMENT', column(schema, 'client_order_status_history', 'id')?.extra ?? 'atributo ausente');
    /** La clave primaria y el índice temporal deben estar presentes en la tabla ya existente. */
    if (!schema.indexes.some(index => index.table === 'client_order_status_history' && index.name === 'PRIMARY' && index.columns.join(',') === 'id') || !hasIndexPrefix(schema, 'client_order_status_history', ['order_id', 'occurred_at']) || !hasIndexPrefix(schema, 'client_order_status_history', ['actor_user_id'])) incompatible('client_order_status_history', 'PRIMARY(id), índice (order_id, occurred_at) e soporte de actor_user_id', 'índice requerido ausente o incompatible');
    /** Un índice temporal con el nombre esperado debe conservar columnas, orden y no unicidad. */
    const historyOrderIndex = schema.indexes.find(index => index.table === 'client_order_status_history' && index.name === 'idx_client_order_history_order_time');
    /** Una definición homónima distinta bloquea la migración para revisión manual. */
    if (historyOrderIndex && (historyOrderIndex.unique || historyOrderIndex.columns.join(',') !== 'order_id,occurred_at')) incompatible('client_order_status_history.idx_client_order_history_order_time', 'INDEX(order_id, occurred_at)', `${historyOrderIndex.unique ? 'UNIQUE' : 'INDEX'}(${historyOrderIndex.columns.join(',')})`);
    /** Un índice homónimo de actor también debe apuntar únicamente a actor_user_id. */
    const historyActorIndex = schema.indexes.find(index => index.table === 'client_order_status_history' && index.name === 'idx_client_order_history_actor');
    /** El nombre reservado no puede describir una estructura de columnas diferente. */
    if (historyActorIndex && (historyActorIndex.unique || historyActorIndex.columns.join(',') !== 'actor_user_id')) incompatible('client_order_status_history.idx_client_order_history_actor', 'INDEX(actor_user_id)', `${historyActorIndex.unique ? 'UNIQUE' : 'INDEX'}(${historyActorIndex.columns.join(',')})`);
    /** Se validan las dos relaciones existentes para evitar tocar una tabla parcial. */
    if (ensureForeignKey(schema, 'client_order_status_history', 'fk_client_order_history_order', ['order_id'], 'client_orders', ['id'], 'RESTRICT') || ensureForeignKey(schema, 'client_order_status_history', 'fk_client_order_history_actor', ['actor_user_id'], 'users', ['id'], 'RESTRICT')) incompatible('client_order_status_history', 'FKs completas a client_orders y users', 'FK requerida ausente');
  } else {
    /** La tabla nueva usa las definiciones reales de client_orders.id y users.id. */
    const engine = schema.engineByTable.get('client_orders')?.toUpperCase();
    /** El motor InnoDB es requisito para imponer claves foráneas en esta tabla. */
    if (engine !== 'INNODB') incompatible('client_orders.ENGINE', 'InnoDB', engine ?? 'desconocido');
    /** La tabla copia el juego de caracteres y la intercalación padre para evitar incompatibilidades. */
    const charset = schema.charsetByTable.get('client_orders');
    /** La intercalación también se toma del esquema observado y no se inventa. */
    const collation = schema.collationByTable.get('client_orders');
    /** Solo se aceptan identificadores simples provenientes de metadatos confiables del servidor. */
    if (!charset || !/^[a-zA-Z0-9_]+$/.test(charset) || !collation || !/^[a-zA-Z0-9_]+$/.test(collation)) incompatible('client_orders charset/collation', 'identificadores válidos del servidor', `${charset ?? 'ausente'}/${collation ?? 'ausente'}`);
    /** La tabla de usuarios comparte el motor necesario para la referencia del actor. */
    ensureParentKey(schema, 'users');
    /** La definición conserva campos de auditoría usados por reservation.repository.ts. */
    steps.push({ description: 'Crear client_order_status_history', sql: `CREATE TABLE client_order_status_history (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del evento de estado.', order_id ${orderIdType} NOT NULL COMMENT 'Reserva a la que pertenece el evento.', previous_status VARCHAR(20) NULL COMMENT 'Estado anterior; NULL para la reserva inicial.', new_status VARCHAR(20) NOT NULL COMMENT 'Estado nuevo validado por el backend.', actor_user_id ${userIdType} NULL COMMENT 'Usuario que registró el evento.', occurred_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Momento UTC del cambio.', PRIMARY KEY (id), KEY idx_client_order_history_order_time (order_id, occurred_at), KEY idx_client_order_history_actor (actor_user_id), CONSTRAINT fk_client_order_history_order FOREIGN KEY (order_id) REFERENCES client_orders (id) ON DELETE RESTRICT, CONSTRAINT fk_client_order_history_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE RESTRICT) ENGINE=${engine} DEFAULT CHARACTER SET ${charset} COLLATE ${collation}` });
  }
  /** La tabla de auditoría de productos no se inspecciona con DDL ni se agrega al plan. */
  return steps;
}
