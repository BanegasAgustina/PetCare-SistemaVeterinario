# Auditoría de SQL y migraciones de PetCare

Fecha: 21/10/2026

## Alcance y límites de la evidencia

Se revisaron las consultas y referencias de esquema en los repositorios, servicios, rutas y migradores del backend, además de los servicios y pantallas móviles de mascotas, turnos, administración, notificaciones, tienda, direcciones, pedidos y checkout.

Se intentó la comprobación de conexión documentada (`npm run db:check`) desde `backend`. Falló antes de conectarse con `ENOTFOUND` al resolver el host configurado. Por eso no se pudieron consultar `INFORMATION_SCHEMA`, `SHOW CREATE TABLE`, índices, claves foráneas ni los historiales de migración de Layerbase. No se ejecutó DDL ni se modificaron filas remotas.

## Diagnóstico de conexión actualizado

La configuración efectiva se cargó mediante `src/config/env.ts` y `dotenv/config`; el `.env` local prevalece sobre los valores de respaldo. Se confirmó, sin imprimir usuario ni contraseña:

- `NODE_ENV=development`, sin runtime Vercel.
- `DB_HOST` está definido explícitamente como `petcare-curt-stone.sage.cloud.layerbase.dev`; `DB_PORT=49116`; `DB_NAME=petcare`.
- TLS está habilitado (`DB_SSL_MODE` efectivo distinto de `disabled`). El código lo exige para hosts Layerbase y para producción.
- El formato del hostname no contiene protocolo, puerto embebido, ruta ni espacios. No se detectó un error de formato en el host que explique por sí solo el fallo.
- La resolución Node.js del hostname falla con `ENOTFOUND`. La comprobación directa al resolver DNS público desde este entorno respondió “Acceso denegado”, y la prueba de red al puerto DNS dio `False`.
- `npm run db:check` repitió el fallo `[DATABASE_UNAVAILABLE] {"code":"ENOTFOUND"}`. El fallo ocurre antes de autenticación MySQL/MariaDB; no demuestra que falten tablas ni que las credenciales estén mal.

**Conclusión limitada:** en este entorno el nombre no se resuelve y la salida DNS está restringida. No se puede decidir aquí si Layerbase retiró/cambió el hostname o si el entorno de ejecución impide resolverlo. El host tiene forma de endpoint DNS público de Layerbase, no de IP privada ni de nombre `.internal`; aun así, no se obtuvo una respuesta DNS autoritativa para confirmar su vigencia. No se sustituyó el hostname. La configuración de producción de Vercel no es accesible desde este checkout, por lo que no se compararon sus valores efectivos con los locales y no se modificó.

### Cómo probarlo desde tu computadora

En VS Code, abrí una terminal PowerShell en `backend` y ejecutá `npm run db:check`. Este comando usa el `.env` local, valida la conexión y no aplica migraciones. Para aislar DNS sin mostrar valores sensibles:

```powershell
npx tsx -e "import 'dotenv/config'; import {lookup} from 'node:dns/promises'; lookup(process.env.DB_HOST!, {all:true}).then(x => console.log(x)).catch(e => console.log(e.code))"
```

Si devuelve `ENOTFOUND`, revisá el hostname exacto en el panel de Layerbase, sección de conexión/Quick Connect, y comparalo con `DB_HOST` en `backend/.env`. No copies ni compartas `DB_PASSWORD`. Si DNS resuelve, probá el puerto configurado (en esta copia, `49116`) desde PowerShell:

```powershell
Test-NetConnection petcare-curt-stone.sage.cloud.layerbase.dev -Port 49116
```

`TcpTestSucceeded: False` después de resolver DNS apunta a bloqueo de red, firewall o endpoint/puerto inaccesible; si es `True` pero `db:check` falla, guardá solo el código de error y revisá usuario, contraseña, nombre de base y TLS en el `.env`, sin publicarlos. También podés probar en HeidiSQL: crear una sesión MariaDB/MySQL, ingresar el host y puerto exactos del panel de Layerbase, la base y usuario del `.env`, y habilitar SSL/TLS según el modo indicado por Layerbase. Ingresá la contraseña directamente en HeidiSQL y no la pegues en el chat. La prueba debe ser de conexión/lectura; no ejecutes scripts SQL de migración.

Si el host resuelve y el puerto abre en tu computadora, pero falla aquí, la diferencia confirma una limitación de red/DNS del entorno de Codex. Si tampoco resuelve desde tu computadora o HeidiSQL, el hostname/configuración publicado por Layerbase necesita revisión en su panel o con su soporte; este informe no lo reemplaza por otro.

`backend/schema-audit.json` contiene 28 definiciones locales, pero no representa el esquema actual: el propio `backend/README.md` lo identifica como snapshot incompleto y menciona que no refleja columnas que el backend ya consulta. Ninguna diferencia de ese archivo se presenta aquí como ausencia confirmada en Layerbase.

## Hallazgos

### 1. Faltan archivos que los comandos de migración esperan

En el checkout actual no existen estas rutas:

| Comando o consumidor | Archivo esperado ausente | Consecuencia comprobable |
|---|---|---|
| `db:migrate`, `db:seed` | `backend/migrations/` | El runner estándar no encuentra migraciones; el seed también depende de ese historial. |
| `db:bootstrap` | `backend/bootstrap/001_fresh_schema.sql` | No puede preparar una base vacía. |
| `db:migrate:auth` | `backend/auth-migrations/001_oauth_sessions.sql` | No puede cargar la migración de OAuth/sesiones. |
| `db:migrate:client` | `backend/client-migrations/001_client_experience.sql` y `002_pet_breed_name.sql` | Solo están disponibles `003`–`006`. Si el ledger tiene las versiones históricas ausentes, la verificación del historial las rechaza; `db:migrate:pet-form` falla al leer `002`. |
| `db:migrate:clinic` | `backend/clinic-migrations/001_connected_clinic.sql` | Falla al leer el archivo antes de evaluar el esquema. |
| `db:reconcile:clinic` | `backend/clinic-migrations/002_adopt_existing_clinic_schema.sql` | No puede cargar la versión de adopción/reconciliación. |
| `db:migrate:employee-password` | `backend/employee-password-migrations/001_must_change_password.sql` | El migrador no puede completar su paso de DDL. |
| `db:migrate:password-reset` | `backend/password-reset-migrations/001_password_resets.sql` | No puede crear la tabla requerida por recuperación de contraseña. |
| `db:migrate:pet-photo` | `backend/pet-migrations/001_pets_photo_url.sql` | Si falta la columna que el código usa, no hay SQL para agregarla. |
| Seeds de referencia | `backend/seeds/001_reference_catalogs.json` | Los comandos de seed que lo cargan no tienen el catálogo fuente. |

El historial Git confirma que `backend/bootstrap/001_fresh_schema.sql`, `backend/auth-migrations/001_oauth_sessions.sql`, `backend/clinic-migrations/001_connected_clinic.sql` y `002_adopt_existing_clinic_schema.sql` fueron añadidos en `fd1c63d` y eliminados en `47409ed`. `backend/client-migrations/001_client_experience.sql` fue añadido en `b82de67` y eliminado en `49f3d46`. `backend/pet-migrations/001_pets_photo_url.sql` fue añadido/eliminado en commits previos (`3292418`, `8bd1f92`, `4e39786`, `158e9c0`). Esto confirma eliminación del checkout actual, pero no el motivo ni que Layerbase carezca de esos objetos. No se restauraron: el SQL clínico histórico incluye cambios de datos sobre productos/reservas y la reconciliación histórica contempla una posible eliminación de índice. Sin el esquema actual, reponerlos como migraciones ejecutables podría inducir una aplicación incorrecta.

### 2. Migraciones de tienda presentes en este checkout

`backend/client-migrations` contiene cuatro archivos locales: `003_demo_purchase_fields.sql`, `004_store_fulfillment_settings.sql`, `005_store_promotion_banners.sql` y `006_store_orders_and_addresses.sql`. Los tres últimos preparan configuración de retiro/envío y zonas, campos visuales opcionales de promociones, y snapshots/direcciones/historial/permisos de pedidos.

El lector local de migraciones pudo cargar los cuatro archivos y separar sus bloques: 1, 5, 1 y 6 bloques respectivamente. Esto valida nombres y división del runner, no la sintaxis completa del servidor MariaDB. No hay cliente `mariadb`, `mysql` ni `docker` local disponible para una validación SQL aislada.

El estado aplicado de estas migraciones en Layerbase es **desconocido**. La documentación del checkout las describe como preparadas/no aplicadas, pero el ledger remoto no se pudo consultar. No se creó una migración nueva basándose únicamente en el snapshot.

### 3. El snapshot local no cubre el esquema que consulta el código actual

Entre las diferencias entre consultas actuales y `schema-audit.json` están tablas como `professional_types`, `professional_services`, `professional_blocks`, `client_delivery_addresses`, `client_store_fulfillment_settings`, `client_store_delivery_zones`, `client_order_status_history`, `client_push_tokens`, `refresh_tokens`, `oauth_accounts` y las tablas de entrega de notificaciones.

También hay columnas consultadas que no aparecen en las definiciones del snapshot, por ejemplo `client_products.reserved_stock`, `client_product_categories.is_active`, columnas de evento en `client_notifications`, datos profesionales/agenda, y campos de pedido de tienda. Son diferencias **contra el snapshot**, no un diagnóstico de la base remota.

### 4. El mensaje «No encontramos el registro solicitado» no demuestra por sí solo que falte SQL

En el código actual existe `GET /api/client/store/fulfillment`. Si una consulta falla por tabla o columna faltante, el backend la clasifica como error de esquema/servicio (HTTP 500 general o 503 específico para configuración y direcciones), no como `NOT_FOUND` de un registro.

Una ruta no desplegada responde 404 y se registra como `[API_ROUTE_NOT_FOUND]`; un objeto SQL ausente se registra como `[DATABASE_SCHEMA_ERROR]` o `[DATABASE_SCHEMA_REQUEST]`. Revisar cuál aparece en los logs del backend que atiende la app permite distinguir un despliegue desactualizado de un problema de esquema. No se obtuvieron esos logs ni se observó la respuesta de Layerbase durante esta auditoría.

### 5. Checkout y reparto: limitaciones de aplicación, no migraciones probadas

- La pantalla móvil de checkout está etiquetada como demostrativa. `finishDemo` solo cambia estado local; no llama a `api.checkout`. Los formularios de pago y el resumen de envío no crean un pedido ni guardan los datos en la base.
- El endpoint backend de checkout existente crea un `DEMO_PURCHASE`, no un pedido de tienda con `is_store_order=1`, dirección, método de entrega y pago. Los campos de la migración `006` no se completan desde el flujo visible actual.
- El panel de pedidos usa `orders.manage`/`orders.payment.manage`, pero las rutas restringen el acceso a `ADMIN` y `SUPER_ADMIN`. No se encontró rol o pantalla de repartidor, asignación de pedido a un repartidor ni historial de asignaciones. `006` añade estados y snapshots, no asignaciones.
- `004` y `006` registran permisos, pero no los conceden automáticamente a roles. La matriz real de permisos de Layerbase no se verificó.

Agregar columnas o tablas no resolvería estos tres límites de flujo y autorización.

## Cobertura por módulo

| Módulo | Objetos/requisitos que aparecen en el código | Resultado de auditoría |
|---|---|---|
| Autenticación y sesión | `users`, `roles`, verificación de email, OAuth, refresh tokens y recuperación | Esquema real no verificado; migración de OAuth y SQL de recuperación ausentes del checkout. |
| RBAC y administración | `permissions`, `permission_modules`, `role_permissions`, `user_permissions`, usuarios y catálogos | Tablas base visibles en el snapshot; filas, grants y tipos de rol reales no consultados. SQL histórico/base incompleto. |
| Mascotas | `pets`, `species`, `breeds`, `client_pet_details`, foto en `pets.photo_url` | Snapshot no tiene `pets.photo_url` y sí muestra foto auxiliar; es una discrepancia del snapshot, no prueba del estado remoto. SQL de foto ausente si la columna falta. |
| Veterinaria y turnos | servicios, especialidades, profesionales, slots, turnos, bloqueos y relaciones | Código requiere ampliaciones clínicas que no figuran en el snapshot; fuente clínica histórica ausente. No se generó DDL sin inspección. |
| Clínica e historial | registros clínicos, receta/vacunas, detalles de cita e historial | Migraciones inline existen para algunas columnas; se desconoce qué versiones están aplicadas remotamente. |
| Ecommerce | productos, stock reservado, promociones, carrito, pedidos, configuración, zonas, direcciones e historial | `003`–`006` presentes en el workspace; aplicación remota desconocida. Repositorios actuales esperan además el esquema de base/histórico ausente. |
| Notificaciones | eventos, tokens push y entregas por canal | La consulta requiere columnas/tablas más amplias que el snapshot; no se encontró un archivo SQL versionado de notificaciones en el checkout. Estado remoto desconocido. |
| Reparto | estado de entrega y datos de destino | Estado/dirección aparecen en `006`; no hay asignación ni acceso de rol repartidor implementados en las rutas actuales. |

## Resultado

- Tablas verificadas en Layerbase: **0**; no se pudo conectar.
- Tablas en el snapshot local: **28**, no autoritativas.
- Archivos SQL locales del migrador cliente: **4** (`003`–`006`).
- Migraciones nuevas generadas en esta auditoría: **0**. Sin el esquema/ledger remoto no es posible demostrar que un cambio falte, y crear DDL desde un snapshot advertidamente viejo podría duplicar o alterar estructuras existentes.
- Migraciones aplicadas o pendientes en Layerbase: **desconocido**.
- Escrituras remotas ejecutadas: **0**.

Para cerrar la comparación real falta que el host configurado resuelva y permita conexión de lectura. Con esa conexión se deben obtener tablas, columnas, índices, claves foráneas y ledgers mediante consultas de metadatos; recién entonces se puede clasificar cada diferencia remota y preparar migraciones nuevas estrictamente necesarias.

**Estado de esta entrega:** auditoría parcial, no completa. ENOTFOUND se reprodujo y se documentaron pruebas para el equipo local. El esquema real y su historial siguen sin inspeccionar; por eso no se generaron migraciones y no se puede afirmar cuáles faltan en Layerbase. Después de recuperar la conectividad, ejecutar `npm run db:check`, recopilar metadatos en solo lectura y comparar los ledgers antes de preparar DDL. La aplicación remota de cualquier DDL requiere autorización explícita.

## Continuación: auditoría de solo lectura desde el equipo local

El usuario confirmó que desde su computadora `npm run db:check` funciona, que DNS resuelve y que el puerto `49116` está accesible. El mismo comando desde este entorno volvió a fallar con `ENOTFOUND`; también falló aquí `npm run db:audit:readonly` antes de cualquier consulta. Esta diferencia confirma que el checkout de Codex no alcanza el DNS del endpoint en esta sesión, no que la configuración local de Layerbase esté mal. No se tocó host, puerto, TLS ni credenciales.

Se agregó `backend/src/database/sql-audit-readonly.ts` y el script `db:audit:readonly` en `backend/package.json`. Importa `databasePool` del backend; no define otra conexión. Consulta metadatos de tablas/vistas, columnas y tipos, constraints (incluidas PK/FK/UNIQUE/CHECK), índices e historiales candidatos de migración. Para el historial solo proyecta campos de versión/nombre, checksum, estado y fechas conocidas. No lee filas de negocio, credenciales, tokens ni datos de clientes, y no ejecuta DDL/DML ni altera `read_only`.

El script también escanea literales de TypeScript para inventariar referencias candidatas a tablas y cruzarlas contra el esquema. Es una búsqueda heurística: SQL construido dinámicamente puede no aparecer y CTEs/fracciones de consulta pueden producir falsos positivos. La revisión final de columnas y consultas requiere el JSON generado junto con lectura manual del código.

Desde PowerShell, ejecutá en `backend`:

```powershell
npm run db:audit:readonly -- --out layerbase-sql-audit.json
```

El archivo nuevo se crea en `backend/layerbase-sql-audit.json`. El script usa modo de creación exclusiva y no pisa resultados previos; si ya existe, elegí otro nombre de salida. Compartí ese JSON para comparar las consultas y revisar las migraciones. Si preferís ver la salida en terminal, ejecutá `npm run db:audit:readonly` sin `--out`.

### Estado solicitado por la entrega

1. **Estructura real inspeccionada:** ninguna desde Codex; la conectividad vuelve a fallar con `ENOTFOUND`. Pendiente de correr el exportador en la terminal local.
2. **Diferencias confirmadas contra Layerbase:** ninguna aún. Los faltantes del snapshot o del repositorio siguen sin ser prueba de ausencia remota.
3. **Migraciones necesarias:** no determinables antes de comparar esquema y ledgers. No se generó DDL.
4. **Archivos SQL generados:** ninguno. Se creó solamente el exportador TypeScript de metadatos.
5. **Errores de código identificados:** los hallazgos anteriores de checkout demostrativo, permisos de pedidos limitados a ADMIN/SUPER_ADMIN y ausencia de flujo/asignación de repartidor siguen siendo brechas de aplicación verificadas en código, sin evidencia de que requieran migración.
6. **Ecommerce:** la configuración pública `GET /api/client/store/fulfillment` existe en este código; falta observar en el backend desplegado si responde 404 por ruta/versión, o 503/500 por configuración/esquema. El checkout móvil sigue siendo demostrativo y el endpoint `client/orders` inspeccionado no implementa el flujo comercial completo. Sin logs/respuesta del despliegue no se atribuye «No encontramos el registro solicitado» a SQL.
7. **Orden recomendado:** exportar metadatos localmente; confirmar los ledgers y comparar cada tabla/columna/índice/FK contra rutas, servicios y repositorios; preparar migraciones aditivas idempotentes solo para diferencias comprobadas; revisar el SQL y su orden; solicitar autorización antes de cualquier ejecución remota; aplicar luego cada migración y repetir la auditoría de metadatos.
8. **Riesgos y dependencias:** el JSON no incluye datos de negocio, pero sí nombres de esquema y versiones/checksums de migración; tratarlo como información interna. La generación de DDL depende del JSON real y del historial. SQL histórico eliminado no debe restaurarse ni ejecutarse a ciegas, y los problemas de endpoint, permisos o flujo móvil necesitan cambios de backend/app en vez de migraciones.


## Corrección de compatibilidad MariaDB 11.x

El reporte `ER_BAD_FIELD_ERROR` corresponde a la consulta de `information_schema.STATISTICS`: seleccionaba `EXPRESSION AS expression`, campo no disponible en la vista `STATISTICS` de MariaDB 11.x (es una diferencia con MySQL). Se quitó `EXPRESSION`; la consulta conserva nombre de índice, unicidad, posición, columna, prefijo, tipo y nulabilidad. La consulta de constraints se dividió: PK/UNIQUE/FK y reglas referenciales se obtienen aparte de la consulta de CHECK. Así, si CHECK falla por permisos o compatibilidad, las otras secciones todavía se recopilan.

Cada consulta ahora informa etapa, SQL de metadatos, código, mensaje técnico y columna desconocida cuando MariaDB la identifica. Los errores quedan en `errors` del JSON y se imprimen por stderr. Se registran estados por sección; `auditComplete` solo puede ser `true` si conexión, tablas, columnas, constraints, CHECK, índices e historial pasan. Si no se puede inspeccionar una sección, se genera JSON parcial con `auditComplete:false` y el proceso termina con código 2. El script nunca presenta arreglos vacíos por desconexión como resultado completo.

Validación local en Codex: `npm run typecheck` pasó; `npx eslint src/database/sql-audit-readonly.ts` pasó. `npm test` terminó con cero archivos/suites encontrados, así que no ejecutó casos de prueba. `npm run lint` no pudo recorrer el patrón `tests` porque esa carpeta no existe en este checkout; el lint directo del archivo nuevo sí pasó. Se probó generar y parsear JSON parcial con `--out`; quedó marcado incompleto por `ENOTFOUND` y el artefacto temporal se eliminó. No se pudo ejecutar las consultas contra MariaDB en esta sesión, por lo que su validación final requiere el comando local.

Repetí desde Git Bash, en `backend`:

```bash
npm run db:audit:readonly -- --out layerbase-sql-audit.json
```

Con conexión local, se creará el JSON con secciones y tablas/columnas/índices/relaciones. Si una consulta sigue fallando, el proceso generará el JSON parcial y mostrará etapa, consulta, código y mensaje; compartir ese archivo y el error permite corregir cualquier diferencia restante. No se generaron migraciones nuevas ni se ejecutó ninguna instrucción de escritura.

La auditoría sigue **incompleta** hasta que el export contenga las secciones obligatorias obtenidas de Layerbase y se compare contra el backend.

## Resultado de la comparación con Layerbase — export local 2026-10-21

**Esta actualización reemplaza los estados incompletos anteriores.** Se recibió el JSON completo generado desde la computadora local. Confirma Layerbase `11.8.9-MariaDB`, base `petcare`, `auditComplete=true`, 41 tablas, 262 columnas, 158 constraints en total, 23 CHECK, 60 claves foráneas, 138 índices y 4 ledgers con 5 versiones aplicadas. No contiene filas de clientes. Esto reemplaza los conteos “0 tablas” de las secciones anteriores, que describían la sesión de Codex sin red.

El `possibleMissingTables` del export es solo heurístico. Se descartaron falsos positivos como `information_schema.*`, `quantity`, `user_id`, `token_hash`, `weight_kg`, `RESTRICT`, `SKIP` y `y`: son metadatos, nombres de columnas/alias o palabras dentro de fragmentos SQL, no tablas de negocio. El cruce manual contra las 41 tablas y las referencias SQL confirmó estas ausencias funcionales:

| Objeto ausente confirmado | Referencia/función que lo necesita | Estado |
|---|---|---|
| `client_store_fulfillment_settings` | Retiro, horarios, tarifas y habilitación de envío | Lo crea `004_store_fulfillment_settings.sql`; el valor inicial queda deshabilitado y requiere configuración comercial. |
| `client_store_delivery_zones` | Cotización y administración de zonas | Lo crea `004`; todavía no hay zonas comerciales configuradas. |
| `client_delivery_addresses` | Direcciones guardadas por cliente | Lo crea `006_store_orders_and_addresses.sql`. |
| `client_push_tokens` | Registro/revocación de dispositivos push | Lo crea la nueva `007_notification_push_schema.sql`. |
| `client_notification_push_deliveries` | Cola, reintentos y recibos push | Lo crea la nueva `007`. |

También faltan de `client_notifications` las columnas `event_type`, `reference_type`, `reference_id`, `event_key` y el índice único de `event_key`. Las consultas de notificaciones actuales las usan. `client_order_status_history.state_type` falta. `client_orders` todavía solo tiene campos de reservas/demostración: faltan `is_store_order`, `store_order_status`, `store_payment_status`, `payment_method`, `fulfillment_method`, `delivery_status`, subtotal/tarifa y snapshots del destinatario/dirección. Todo esto está cubierto por `006` salvo la ampliación de notificaciones, que se agregó como `007`.

### Estructuras presentes y migraciones aplicadas

- **Autenticación/RBAC:** existen `users`, `roles`, `permissions`, `permission_modules`, `role_permissions` y `user_permissions`, con PK, unicidad y FKs. `users.profile_photo_url`, `session_version`, `must_change_password`, OAuth (`oauth_accounts`, `oauth_attempts`), refresh tokens, verificación de correo y `password_resets` están presentes. El ledger confirma OAuth `001` y empleado `001` aplicados.
- **Mascotas:** `pets.photo_url` ya existe; `client_pet_details.breed_name` también. No se necesita crear esas columnas.
- **Clínica/turnos:** existen servicios, especialidades, tipos y asignaciones profesionales, bloqueos, slots, turnos, historial clínico y relaciones veterinarias. El esquema tiene columnas generadas e índices únicos para evitar solapamientos de turnos. El ledger registra adopción clínica `002` como aplicada (`completed_steps=0`); su checksum coincide con el SQL documental histórico, que no ejecuta transformaciones de negocio.
- **Productos/carrito/promociones:** existen `reserved_stock` y su CHECK contra stock, categorías activas, carrito con PK `(owner_id, product_id)`, catálogo, pedidos/reservas e historial. Las columnas visuales de promoción `banner_image_url`, `banner_subtitle` y `banner_cta_text` ya existen. No se confirmó una diferencia estructural en estos objetos.
- **Notificaciones por email:** `client_notification_email_deliveries` ya existe con columnas e índices esperados. `007` no la vuelve a crear.
- **Historial cliente:** el ledger remoto contiene `001_client_experience.sql` y `002_pet_breed_name.sql` aplicadas. `001` se restauró desde Git y su SHA-256 coincide con el ledger. El archivo fuente de `002` no aparece en refs ni objetos recuperables de Git; el checksum del ledger y `client_pet_details.breed_name` sí están confirmados. `client-migrate.ts` conserva ese checksum como huella aplicada sin contenido ejecutable y exige estado/checksum exactos antes de validar versiones nuevas. No se inventó ni ejecuta el SQL 002.
- Se restauraron los archivos históricos exactos de OAuth `001`, cliente `001`, adopción clínica `002` y contraseña de empleado `001` solo después de comprobar su SHA-256 contra el ledger remoto. El SQL histórico de recuperación de contraseña se recuperó de un blob huérfano de Git y coincide estructuralmente con `password_resets` (columnas, PK, índices y FK). Sin embargo, `password_reset_schema_migrations` no existe; por eso la versión no figura como aplicada en un ledger y el migrador actual aborta de forma segura cuando encuentra esa tabla sin historial. No se crea otra tabla `password_resets` ni se afirma una aplicación histórica que no está registrada.

Las tablas ausentes `schema_migrations` y `bootstrap_schema_migrations` son ledgers de herramientas de base vacía. En este checkout tampoco hay `backend/migrations/` ni `backend/bootstrap/001_fresh_schema.sql`; sus comandos genéricos no pueden preparar una base nueva, pero esas ausencias no prueban que falten objetos en esta base poblada ni se necesitan para el ecommerce actual. La falta de `password_reset_schema_migrations` es una deriva de historial distinta: la tabla funcional sí existe.

### Migraciones preparadas y orden

1. `003_demo_purchase_fields.sql`: sus columnas `order_type` y `payment_status` ya están en la base, pero `003` no figura en el ledger. Se cambió a `ADD COLUMN IF NOT EXISTS` para que el runner pueda verificar y registrar la versión sin duplicar columnas.
2. `004_store_fulfillment_settings.sql`: estructuras de retiro/envío confirmadas ausentes. Además de `CREATE TABLE IF NOT EXISTS`, la migración agrega solo con `INSERT IGNORE` permisos y grants faltantes a `ADMIN`/`SUPER_ADMIN`; crea la fila singleton inicialmente deshabilitada. No define dirección, tarifa ni zonas comerciales.
3. `005_store_promotion_banners.sql`: sus tres columnas ya existen, pero no está registrado en el ledger. Se cambió a `ADD COLUMN IF NOT EXISTS` para reconciliar la versión sin columnas duplicadas.
4. `006_store_orders_and_addresses.sql`: agrega campos de pedido de tienda e historial solo si faltan, crea la tabla de direcciones y registra permisos/grants de gestión faltantes para `ADMIN`/`SUPER_ADMIN`. No crea pedidos ni direcciones de ejemplo.
5. `007_notification_push_schema.sql`: nueva migración aditiva para columnas/event key y las dos tablas push confirmadas ausentes. Conserva intacta la cola email existente.

En la primera exportación, las versiones `003`–`007` no aparecían en `client_schema_migrations`; el historial confirmado terminaba en `002`. Tras aplicar las migraciones, una nueva exportación registra `003`–`007` con estado `applied`. Los checksums del ledger de las cinco versiones coinciden con los archivos SQL locales. Los `INSERT IGNORE` de permisos/configuración solo añaden filas que faltan; no actualizan ni eliminan filas existentes. La tabla singleton de configuración empieza con retiro/envío apagados y debe configurarse desde administración antes de ofrecerlos.

### Checkout, roles y pagos

La ausencia de las tablas de `004`/`006` sí impide que el flujo actual lea configuración de retiro/envío y direcciones. El repositorio transforma ese error de esquema en HTTP 503 (`STORE_FULFILLMENT_SCHEMA_REQUIRED` o `STORE_ADDRESSES_SCHEMA_REQUIRED`). Por sí sola no produce el genérico HTTP 404 `NOT_FOUND` (“No encontramos el registro solicitado”). Una ruta no desplegada se registra como `[API_ROUTE_NOT_FOUND]`; un registro inexistente genera `NOT_FOUND`; un esquema faltante genera el error de esquema. Para atribuir el mensaje exacto hay que identificar ruta/estado y revisar el log correspondiente del backend desplegado.

La pantalla móvil `store/checkout.tsx` termina en `finishDemo` local y no llama al checkout API. El endpoint backend existente crea una compra `DEMO_PURCHASE`; no persiste un pedido de tienda con dirección, retiro/envío y método de pago. No hay integración de pasarela ni tabla de transacciones de pago. Las rutas de pedidos limitan acceso a `ADMIN`/`SUPER_ADMIN`; el tipo de rol del backend no incluye `REPARTIDOR`, ni existe asignación/seguimiento de repartidor. Son brechas de backend/app, no cambios SQL suficientes para implementarlas.

La exportación incluye estructura de RBAC pero deliberadamente no exporta filas de `roles` ni `role_permissions`; por ello no confirma qué roles/grants concretos existen en Layerbase. Las migraciones preparadas solo conceden los nuevos permisos si ya existen las filas `ADMIN` y `SUPER_ADMIN`. No se inspeccionaron usuarios ni datos personales.

### Estado final

- Comparación estructural contra Layerbase: **realizada** con el export completo y referencias SQL del backend; quedan distinguidas las limitaciones de la búsqueda heurística y de la configuración de filas RBAC, que no se exportó.
- Migraciones nuevas generadas: `backend/client-migrations/007_notification_push_schema.sql`.
- Migraciones existentes confirmadas necesarias: `004_store_fulfillment_settings.sql` y `006_store_orders_and_addresses.sql`.
- Migraciones `003` y `005`: no faltan sus columnas; son versiones sin ledger y ahora son idempotentes para ese estado real.
- Aplicación remota ejecutada por Codex: **ninguna**. El usuario confirmó que ejecutó `npm run db:migrate:client` desde su computadora; la salida indicó `Aplicada` para `003`–`007`.
- Verificación posterior: completa con una segunda exportación de metadatos de Layerbase. La conexión es MariaDB `11.8.9`, `auditComplete=true`, 46 tablas, 342 columnas, 181 restricciones, 30 CHECK y 169 filas de índices. Las secciones de conexión, tablas, columnas, restricciones, CHECK, índices e historial figuran `ok`; no hay errores ni advertencias.
- Las cinco tablas faltantes de tienda/direcciones/push aparecen ahora en InnoDB. Las entregas push tienen ambas FKs: a `client_notifications(id)` y `client_push_tokens(id)`. Las columnas de pedido y notificación, y los índices event key, pedidos y push, están presentes.
- Historial cliente: `003_demo_purchase_fields.sql`, `004_store_fulfillment_settings.sql`, `005_store_promotion_banners.sql`, `006_store_orders_and_addresses.sql` y `007_notification_push_schema.sql` están `applied`; sus cinco checksums coinciden con los SQL locales.
- La auditoría SQL estructural y su verificación posterior están **completas** para el esquema exportado. La configuración comercial de retiro/envío sigue requiriendo revisión y carga desde administración; la exportación no incluye sus filas de negocio ni datos RBAC.
- No ejecutar el runner genérico `db:migrate`/`db:bootstrap` en esta base: faltan sus fuentes históricas/base y no forman parte de la secuencia cliente.

### Seguimiento — error de FK en migración 007

El usuario compartió el bloque `LATEST FOREIGN KEY ERROR` de InnoDB. La FK `fk_notification_push_delivery_token` falla porque el diccionario InnoDB no encuentra `petcare.client_push_tokens` cuando intenta crear `client_notification_push_deliveries`. Esto descarta como causa inmediata una diferencia de tipo entre `push_token_id` y `client_push_tokens.id`; el mensaje es que la tabla referenciada no está visible.

`client-migrate.ts` ahora confirma cada sentencia DDL por separado y permite reanudar únicamente `007_notification_push_schema.sql` cuando su fila está en estado `running` y el checksum coincide exactamente. Las cuatro sentencias de 007 son aditivas/idempotentes (`IF NOT EXISTS`), por lo que la reanudación repite la preparación de columnas/índice y tablas sin borrar ni modificar filas existentes. Otras migraciones incompletas siguen bloqueadas. El runner registra ahora el número de sentencia que falle.

El usuario reintentó desde `backend` con `npm run db:migrate:client`; las versiones `003`–`007` se aplicaron correctamente. La siguiente auditoría de solo lectura confirmó ambas tablas push y sus claves foráneas, así como checksums coincidentes en el historial. No se requiere otro reintento.
