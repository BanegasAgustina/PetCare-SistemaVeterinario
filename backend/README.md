# PetCare Backend — fase 3

> **Actualización:** la instalación vigente está en [guía OAuth y EAS de mobile](../mobile/README.md). Esta versión implementa OAuth Google/Facebook/X, refresh rotativo y revocación de familias. Para DB nueva: `npm run db:bootstrap` → `npm run db:migrate:auth` → `npm run create:super-admin`. Para DB existente: revisión/backup antes de extensiones; nunca bootstrap encima. Las secciones de fase 3 se conservan como referencia histórica y no acreditan la presencia de los SQL originales ausentes.

El módulo `/api/client` incorpora mascotas, turnos, clínica, tienda, carrito, pedidos, notificaciones y perfil con JWT/ownership. Ver [contratos, migración aditiva y verificación](../IMPLEMENTACION_CLIENTE.md).

## Autenticación tradicional

Configurar además estas variables en .env:

| Variable | Valor / requisito |
| --- | --- |
| JWT_ACCESS_SECRET | Clave aleatoria local, mínimo 32 bytes, nunca versionada |
| JWT_ACCESS_TTL_SECONDS | 900 por defecto, máximo 3600 |
| JWT_ISSUER / JWT_AUDIENCE | petcare-api / petcare-mobile |
| BCRYPT_SALT_ROUNDS | 12 por defecto; admite 10–14 |
| CORS_ALLOWED_ORIGINS | Orígenes HTTPS web separados por coma en producción; local solo en desarrollo |

Generar una clave local con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"` y copiarla a JWT_ACCESS_SECRET en .env. No compartirla ni agregarla a mobile. Usar HTTPS al publicar la API. Health y CLI DB funcionan sin clave; login exige configuración JWT válida.

Registro valida nombre/apellido Unicode sin números (obligatorios, hasta 100 caracteres), email válido (trim y minúsculas, hasta 254), teléfono opcional como texto (7–15 dígitos, conserva + y ceros) y contraseña de al menos 8 caracteres, mayúscula, minúscula, número y especial. Bcrypt admite máximo 72 bytes UTF-8; se rechazan contraseñas mayores, sin truncar, recortar ni normalizar. Confirmación existe únicamente en frontend. La restricción UNIQUE protege duplicados incluso entre solicitudes concurrentes. El registro asigna CLIENT y no inicia sesión automáticamente.

`POST /api/auth/register` sin token:

```json
{"firstName":"María","lastName":"Pérez","email":"maria@example.com","phone":"+54 11 1234-5678","password":"Ejemplo!123"}
```

Respuesta 201 (también incluye data.verification, documentado al final):

```json
{"success":true,"data":{"user":{"id":"1","firstName":"María","lastName":"Pérez","email":"maria@example.com","phone":"+541112345678","role":"CLIENT"}}}
```

`POST /api/auth/login`:

```json
{"email":"maria@example.com","password":"Ejemplo!123"}
```

Respuesta 200:

```json
{"success":true,"data":{"user":{"id":"1","firstName":"María","lastName":"Pérez","email":"maria@example.com","phone":"+541112345678","role":"CLIENT"},"accessToken":"<JWT emitido>","tokenType":"Bearer","expiresIn":900}}
```

`GET /api/auth/me` exige `Authorization: Bearer <accessToken>` y devuelve 200 con el mismo contrato `data.user` de registro. Cada consulta verifica firma HS256, issuer, audience, expiración, sujeto, usuario activo y email verificado en MySQL. El JWT contiene identidad/fechas, no contraseña ni rol confiado desde mobile. Los ejemplos son ilustrativos, nunca seeds.

Las respuestas omiten password_hash, secretos y detalles internos. Usuario inexistente, inactivo y contraseña incorrecta comparten 401/INVALID_CREDENTIALS. Se compara un hash dummy cuando no existe usuario para reducir diferencias de tiempo. Login/registro admiten 30 intentos por IP en 15 minutos, con contadores independientes en memoria; múltiples instancias requerirán un almacén compartido. No configurar trust proxy sin conocer el despliegue.

| HTTP | Código | Significado |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Datos inválidos o campos no admitidos |
| 409 | EMAIL_ALREADY_EXISTS | Email ya registrado |
| 401 | INVALID_CREDENTIALS | Email/contraseña incorrectos o usuario inactivo |
| 401 | AUTH_REQUIRED | Falta Authorization |
| 401 | INVALID_TOKEN / TOKEN_EXPIRED | Token inválido o vencido |
| 429 | TOO_MANY_ATTEMPTS | Límite de intentos; reintentar después |
| 503 | AUTH_UNAVAILABLE / DB_UNAVAILABLE | Configuración o dependencia no disponible |
| 500 | INTERNAL_ERROR / DB_ERROR | Fallo interno seguro |

Formato de error: `{"success":false,"error":{"code":"INVALID_CREDENTIALS","message":"Email o contraseña incorrectos."}}`. Auth responde Cache-Control: no-store. Access Token se renueva con refresh rotativo; hace falta volver a iniciar sesión si la familia vence o se revoca. Logout mobile borra su sesión local: un token emitido conserva validez hasta expirar salvo desactivación o cambio de versión de sesión. Esta versión incluye permisos y restablecimiento iniciado por Super Admin para veterinarios mediante invitación. OAuth Google/Facebook/X está implementado; requiere las credenciales/callbacks externos documentados en ../mobile/README.md.

API REST Express 5 y TypeScript con MySQL 8 y autenticación tradicional mediante bcrypt/JWT. Conserva health, modelo normalizado y comandos DB. Implementa OAuth Google/Facebook/X, refresh tokens y gestión de mascotas.

## Requisitos e instalación

Node.js >= 22.13, npm y MySQL 8.0.16+ / 9.x o MariaDB 11.8.x. La rama MariaDB 11.8 fue verificada contra el esquema y consultas usadas por PetCare; no se consideran compatibles otras ramas MariaDB sin repetir la auditoría. Se rechazan MySQL anterior a 8.0.16, MariaDB fuera de 11.8 y motores no identificados. PetCare depende de restricciones CHECK aplicadas, columnas generadas, InnoDB, bloqueos nombrados y colaciones utf8mb4; el guard de versión conserva una lista explícita de motores y versiones admitidos.

```bash
cd backend
npm install
```

Copiar `.env.example` a `.env`: PowerShell `Copy-Item .env.example .env`; Bash `cp .env.example .env`. Completar credenciales propias en ese archivo local. No hay credenciales reales versionadas. Las cuentas de empleados creadas desde administración reciben la contraseña inicial `empleadoPetCare1234`; el alta no manda invitación y la persona debe verificar el correo al iniciar sesión y reemplazar esa contraseña antes de usar PetCare.

### Alta de empleados y cambio obligatorio de contraseña

Después de desplegar esta versión, ejecutar una vez `npm run db:migrate:employee-password` desde `backend` para agregar `users.must_change_password`. La migración mantiene habilitadas las cuentas existentes y solo las nuevas cuentas de personal quedan obligadas a cambiar contraseña. Ejecutarla antes de iniciar la API con este código.

El administrador crea la cuenta con nombre, email y rol. La contraseña inicial se comunica al empleado por un canal seguro, fuera del correo de invitación. En su primer login, el backend conserva el flujo actual de código de verificación del email; una vez verificado, exige que el empleado establezca una contraseña propia. Las peticiones protegidas quedan bloqueadas hasta completar ese cambio.

## Configurar MySQL y crear la base

1. Iniciar el servidor MySQL 8 local (desde su servicio/instalador o el administrador del sistema).
2. Desde MySQL Workbench, con una cuenta administradora existente, crear el usuario local `petcare` con una contraseña elegida localmente y permisos solo sobre la base del proyecto. No usar root como usuario habitual de la API.
3. Conceder permisos de preparación en desarrollo al usuario ya creado:

```sql
-- Adaptar base, usuario y host si se eligieron otros nombres en la configuración local.
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
ON petcare.* TO 'petcare'@'localhost';
```

4. Completar DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME en `.env` y ejecutar, dentro de backend:

```bash
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
```

`db:create` crea la base indicada por DB_NAME, con utf8mb4/utf8mb4_0900_as_ci, sin eliminar datos. Si la base ya existe, no cambia su configuración; los objetos nuevos declaran explícitamente charset/collation. El nombre de la base debe comenzar con una letra y contener hasta 64 letras, números o guiones bajos.

Alternativa: un administrador puede crearla desde Workbench y omitir `db:create`:

```sql
CREATE DATABASE IF NOT EXISTS petcare
CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci;
```

Después ejecutar migraciones, seeds y comprobación con las credenciales locales autorizadas. En producción separar el usuario de migraciones (DDL) del usuario de API (solo los permisos de datos necesarios), en lugar de otorgar permisos globales. Usar respaldos antes de aplicar cambios sobre datos existentes. Se recomienda configurar el servidor MySQL en UTC; el driver usa timezone Z y retorna fechas como strings.

## Variables de entorno

| Variable | Predeterminado | Uso |
| --- | --- | --- |
| NODE_ENV | development | development, test o production |
| PORT | 3000 | Puerto HTTP, entero entre 1 y 65535 |
| DB_HOST | 127.0.0.1 solo fuera de producción | En producción es obligatorio usar el host remoto de Layerbase; se rechaza loopback e IP LAN |
| DB_PORT | 3306 | Puerto MySQL, entero entre 1 y 65535 |
| DB_NAME | petcare | Base específica del proyecto; nombre validado |
| DB_USER | petcare solo fuera de producción | Usuario MySQL; obligatorio en producción |
| DB_PASSWORD | vacío solo fuera de producción | Contraseña MySQL; obligatoria en producción |
| DB_SSL_MODE | `disabled` en local; `required` para Layerbase y produccion | TLS: `disabled`, `required` o `verify_identity` |
| DB_CONNECTION_LIMIT | 5 | Conexiones del pool, entero de 1 a 100 |
| DB_CONNECT_TIMEOUT_MS | 30000 | Tiempo al abrir conexion, de 1 a 60000 ms |

Layerbase entrega host, puerto asignado, esquema, usuario y contrasena en Quick Connect. Configurar esos valores en `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`; PetCare usa el pool `mysql2` existente y no necesita un driver especifico ni una URL Layerbase. El codigo ignora `MYSQL_PUBLIC_URL`; no conservar esa variable si apunta a otra conexion. El host Railway se rechaza para evitar volver a conectar al proveedor anterior.

Layerbase requiere TLS. `DB_SSL_MODE=required` cifra la conexion del puerto pooler; su certificado no es de confianza publica, por lo que la verificacion estricta falla en ese endpoint. Si Quick Connect selecciona el endpoint directo, usar `verify_identity` para validar el certificado y el nombre del host. En MySQL local se puede usar `disabled`; no se permite desactivar TLS para Layerbase ni en produccion. El timeout predeterminado de 30 s contempla el despertar de una base hibernada. `DB_CONNECT_TIMEOUT_MS` limita solo la apertura de conexion, no las consultas ni la espera de cola. El pool tiene cola maxima de 50 y `multipleStatements=false`. BIGINT se devuelve como string para evitar perdida de precision. `.env` esta ignorado por Git; nunca copiar DB_* al bundle mobile.

El repositorio contiene `mobile/vercel.json` para el frontend. El backend Express esta en `backend/src/app.ts`; Vercel reconoce esa entrada cuando el proyecto usa `backend` como `Root Directory`. Los dos proyectos Vercel tienen entornos y variables independientes.

## Produccion remota en Vercel

En el proyecto Vercel del backend (Root Directory `backend`) define las variables server-side. No copies estos valores al proyecto mobile ni al bundle Expo.

| Variable | Valor de produccion / requisito |
| --- | --- |
| NODE_ENV | `production` |
| BACKEND_URL | `https://pet-care-sistema-veterinario.vercel.app` (origen, sin `/api`) |
| DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD | Valores privados de Layerbase; son obligatorios y se leen solo en backend |
| DB_SSL_MODE | `required` para TLS del endpoint pooler de Layerbase; usa `verify_identity` si el endpoint directo presenta certificado verificable |
| CORS_ALLOWED_ORIGINS | `https://petcare-sistemaveterinario-mobile.vercel.app` (solo orígenes web HTTPS; el esquema `petcare://` no va aquí) |
| JWT_ACCESS_SECRET | Secreto aleatorio independiente, mínimo 32 bytes |
| EMAIL_CODE_SECRET | Secreto aleatorio independiente de JWT, mínimo 32 bytes |
| OAUTH_RETURN_URLS | `https://petcare-sistemaveterinario-mobile.vercel.app/oauth,petcare://oauth` |
| PASSWORD_RESET_URL | `https://petcare-sistemaveterinario-mobile.vercel.app/reset-password` |
| VETERINARIAN_INVITATION_URL | `https://petcare-sistemaveterinario-mobile.vercel.app/activate-vet` |
| ACCOUNT_INVITATION_URL | `https://petcare-sistemaveterinario-mobile.vercel.app/activate-account` si se usa esa invitacion |

Configura tambien `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD` y `MAIL_FROM` para correo; `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` para las fotos si se mantiene Cloudinary; y `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET`, `FACEBOOK_GRAPH_VERSION` y `X_CLIENT_ID`/`X_CLIENT_SECRET` para OAuth. X conserva compatibilidad con `TWITTER_CLIENT_ID`/`TWITTER_CLIENT_SECRET`. Los secretos se cargan como variables privadas en el proyecto `backend`; los valores que el cliente incluye en su JavaScript, como `EXPO_PUBLIC_API_URL`, son publicos.

En el proyecto Vercel del frontend (Root Directory `mobile`) define `EXPO_PUBLIC_API_URL=https://pet-care-sistema-veterinario.vercel.app/api` para Production. Usa una API HTTPS de preview separada para Preview. En EAS, define ese mismo nombre en el entorno `production` antes de crear un `production-apk`; el cliente ahora solo acepta HTTP en builds de desarrollo. Los `.env.example` locales no estan presentes actualmente en el checkout; usa las tablas/documentacion y no subas `.env`.

Los callbacks exactos de los proveedores son:

- Google: `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/google/callback`
- Facebook: `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/facebook/callback`
- X: `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/x/callback`

Registra cada URL en el portal correspondiente como redirect/callback URI. Los destinos finales son `/oauth` en web y `petcare://oauth` en la app; no los registres como callbacks del proveedor. El callback configura `Cross-Origin-Opener-Policy: same-origin-allow-popups` para que Expo pueda devolver el resultado al popup que inició el flujo; las demás respuestas conservan la política predeterminada de Helmet. La configuración de Vercel o los portales externos debe comprobarse en esas cuentas; el código no acredita la aprobación de credenciales OAuth ni permisos.

## Ejecutar la API

```bash
npm run dev
```

Por defecto disponible en `http://localhost:3000`. Escucha 0.0.0.0 para pruebas LAN; desde teléfono usar la IP LAN de la computadora. No se publica a Internet automáticamente.

```bash
npm run build
npm start
```

Iniciar HTTP no crea tablas ni ejecuta seeds/migraciones automáticamente. La API puede iniciar sin MySQL, para conservar el health de disponibilidad HTTP.

## Arquitectura

- src/app.ts y src/server.ts: Express, escucha y liberación del pool.
- src/config: validación de entorno y único pool reutilizable.
- src/database: CLI, creación de base, historial SQL, migraciones y seeds.
- src/services/database.service.ts: checkDatabaseConnection y validación explícita de versiones compatibles de MySQL/MariaDB.
- src/controllers y src/routes: liveness y readiness.
- src/middlewares/error.middleware.ts: respuesta uniforme sin detalles internos.
- src/utils/database-error.ts: normalización central de errores DB y runDatabaseOperation.
- src/types: contratos de respuesta públicos.
- migrations: SQL versionado; seeds: datos reales de catálogo en JSON; tests: regresión y MySQL real.

Repositories y validators de autenticación separan SQL y validación de servicios, controllers y rutas. El JSON de seeds se valida y SQL conserva integridad aun sin frontend.

## Modelo relacional: PK, FK y relaciones

| Tabla | PK | FK | Unicidad y finalidad |
| --- | --- | --- | --- |
| roles | id, SMALLINT UNSIGNED | — | code único: CLIENT, VETERINARIAN, ADMIN |
| users | id, BIGINT UNSIGNED | role_id → roles.id | email único; nombres, teléfono opcional, password_hash, estado y timestamps |
| species | id, SMALLINT UNSIGNED | — | code y name únicos; catálogo de especies |
| breeds | id, INT UNSIGNED | species_id → species.id | (species_id, name) único; catálogo de razas |
| pets | id, BIGINT UNSIGNED | owner_id → users.id; species_id → species.id; breed_id → breeds.id | microchip_number único si existe; nombre, sexo, nacimiento opcional, estado y timestamps |
| schema_migrations | version | — | Tabla técnica: checksum, estado running/applied y fecha de aplicación |

Relaciones: roles 1:N users; users 1:N pets como propietario; species 1:N breeds; species 1:N pets sin raza conocida; breeds 1:N pets con raza conocida. InnoDB mantiene FK con ON DELETE/UPDATE RESTRICT; no se borran mascotas en cascada al eliminar usuarios ni se dejan referencias huérfanas. users/pets admiten desactivación mediante is_active. Los índices de FK y el índice (owner_id, is_active) preparan consultas por propietario. Ver [FK de MySQL](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).

Cada usuario tiene un único rol. El registro asigna CLIENT en backend y rechaza campos extra como role. El middleware consulta el usuario activo y su rol en MySQL en cada /me. La FK verifica existencia; los permisos de futuras funciones se definirán al implementarlas.

### 1. Primera forma normal (1FN)

Cada fila tiene una PK, cada columna contiene un valor atómico y no hay listas de mascotas, razas, teléfonos ni roles en campos separados por comas. Los catálogos son filas independientes. Los valores desconocidos opcionales usan NULL (por ejemplo nacimiento o microchip), sin fechas inventadas ni textos de relleno. sex admite FEMALE/MALE/UNKNOWN, con UNKNOWN como información aún no registrada.

### 2. Segunda forma normal (2FN)

El esquema cumple 1FN y los atributos de cada entidad dependen de la clave completa. Las PK son simples, por lo que no existen dependencias parciales de una PK compuesta. En breeds, la clave candidata (species_id, name) identifica la raza completa: el nombre por sí solo puede repetirse entre especies; tampoco se guarda información que dependa solo de species_id, como el nombre de la especie. Los demás identificadores únicos (code/email/microchip informado) son claves candidatas, no grupos de datos repetidos.

### 3. Tercera forma normal (3FN)

No se guardan nombres de rol en users, datos del dueño en pets, ni nombres de especie en breeds. Se consultan mediante FK/JOIN, evitando dependencias transitivas entre atributos no clave.

En pets no se guarda simultáneamente breed_id y la especie que esa raza determina. CHECK exige exactamente una referencia de clasificación:

- Raza conocida: breed_id informado y species_id NULL; especie derivada desde breeds.species_id.
- Raza desconocida o mascota mestiza sin raza catalogada: species_id informado y breed_id NULL.

Así no se repite la dependencia breed_id → species_id en la fila de la mascota ni puede guardarse una raza de perro junto con especie gato. No se inventa una raza «desconocida» para poder registrar una especie. La especie efectiva se consulta, por ejemplo, con:

```sql
-- El ID se pasa como parámetro a mysql2.execute; no se concatena.
SELECT p.id, p.name, COALESCE(p.species_id, b.species_id) AS effective_species_id
FROM pets AS p
LEFT JOIN breeds AS b ON b.id = p.breed_id
WHERE p.id = ?;
```

### 4–6. Claves y relaciones

La tabla anterior documenta PK/FK y cardinalidades. Los IDs sustitutos son estables aunque cambien etiquetas o email; las restricciones únicas protegen las claves naturales. Las FK no almacenan copias de nombres. Cambiar el nombre de un catálogo se hace en una sola fila, sin actualizar todos sus dependientes.

### 7. Por qué separar species y breeds

Una especie tiene múltiples razas, pero puede conocerse sin conocer una raza. Separarlas permite ampliar el catálogo a otras especies, usar el mismo nombre de raza en especies distintas y registrar mascotas sin una raza inventada. El catálogo de razas inicia vacío; no se carga una lista ficticia ni se asume que todas las mascotas son de raza pura.

### 8. Cómo evitar duplicación

code único en roles; code/name únicos en species; email único en users; (species_id, name) único en breeds; microchip único si está informado en pets. La collation compara etiquetas/email sin distinguir mayúsculas, conservando diferencias de acentos. Los códigos técnicos son ASCII y deben estar en mayúsculas. CHECK evita espacios añadidos a códigos, etiquetas de catálogos y microchip, que producirían variantes artificiales. No se aplica unicidad al nombre de mascota ni al teléfono de usuario: pueden repetirse legítimamente.

El registro valida y normaliza email, aplica bcrypt y persiste únicamente password_hash. Las respuestas seleccionan explícitamente campos públicos. El CHECK de longitud es estructural, no una verificación criptográfica. Las reglas de mascotas se implementarán en su fase correspondiente.

## Migraciones SQL versionadas

- 001_initial_schema.sql crea las cinco entidades, FK, índices y CHECK iniciales.
- 002_canonical_catalogs.sql evita variantes por espacios o códigos en minúsculas, sin reescribir la primera versión.
- 003_email_verification.sql incorpora verificación de correo y su desafío restringido.

El ejecutor aplica versiones numéricas en orden, registra SHA-256 en schema_migrations y omite las ya aplicadas. Repetir db:migrate es seguro. No editar, renombrar ni borrar archivos aplicados; crear una nueva versión posterior. Una versión insertada detrás del historial también se rechaza. Usar `-- petcare:statement` entre sentencias: cada bloque se ejecuta por separado con multipleStatements=false. No se admite DELIMITER ni se divide SQL ingenuamente por puntos y coma dentro de literales.

Migraciones y seeds usan GET_LOCK parametrizado, compartido por base y liberado al finalizar, para serializar procesos concurrentes. Los valores del historial también usan placeholders. El SQL DDL procede únicamente de archivos internos versionados; DB_NAME es el único identificador dinámico, validado con lista permitida y delimitado con backticks porque los identificadores SQL no aceptan placeholders.

MySQL hace commits implícitos con CREATE/ALTER; una transacción global no revierte una migración parcialmente ejecutada. Antes de ejecutarla se registra state=running; solo pasa a applied tras completar todos sus bloques. Si hay fallo, el siguiente intento se detiene con MIGRATION_INCOMPLETE. Ver [commits implícitos de MySQL](https://dev.mysql.com/doc/refman/8.0/en/implicit-commit.html).

Recuperación: detener otros procesos de preparación, inspeccionar el esquema con un administrador y comparar las sentencias aplicadas. Restaurar un respaldo consistente (datos e historial) o completar la reparación de forma controlada antes de registrar la versión como aplicada. No borrar la marca ni ejecutar DROP/rollback improvisados: podría haber DDL ya confirmado. El ejecutor no ofrece rollback destructivo automático ni puede detectar todos los cambios manuales realizados fuera de migraciones.

## Seeds mínimos

seeds/001_reference_catalogs.json contiene solo CLIENT/VETERINARIAN/ADMIN y DOG/CAT (Perro/Gato). El ejecutor valida el JSON y usa INSERT parametrizados dentro de una transacción. Deben estar aplicadas todas las migraciones y su historial debe ser íntegro.

Repetir db:seed no duplica datos ni cambia etiquetas existentes con el mismo código; tampoco elimina registros. Un conflicto con otro código/nombre provoca rollback y un error seguro, en lugar de ocultarse con INSERT IGNORE. No se crean administradores de ejemplo, contraseñas, usuarios, razas o mascotas.

## API y errores seguros

`GET /api/health` conserva el contrato de fase 1 (200), sin depender de MySQL:

```json
{ "success": true, "data": { "status": "ok", "message": "PetCare API funcionando" } }
```

`GET /api/health/database` comprueba conexión y versión (200):

```json
{ "success": true, "data": { "status": "ok", "database": "available" } }
```

Si no puede conectar, responde 503 sin host, usuario, contraseña, nombre de base, SQL ni stack:

```json
{ "success": false, "error": { "code": "DB_UNAVAILABLE", "message": "La base de datos no está disponible. Intentá nuevamente." } }
```

Una versión incompatible devuelve 503/DB_VERSION_UNSUPPORTED. Readiness no verifica que el esquema o seeds estén completos: comprobarlos con los comandos de preparación. No existen endpoints CRUD de usuarios/mascotas.

Errores DB centralizados: DB_CONFLICT (409), DB_RELATION_CONFLICT (409), DB_INVALID_DATA (400), DB_UNAVAILABLE (503) y DB_ERROR (500). Conservan la causa internamente pero la respuesta selecciona solo code/message públicos. Futuros repositorios deben usar runDatabaseOperation y consultas parametrizadas. Los comandos CLI también ocultan detalles de MySQL.

Se mantienen 404/NOT_FOUND, 400/INVALID_JSON, 413/PAYLOAD_TOO_LARGE y 500/INTERNAL_ERROR. CORS permite únicamente los orígenes web explícitos de CORS_ALLOWED_ORIGINS; el cliente nativo no requiere CORS.

## Verificaciones y pruebas

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

typecheck incluye src y tests; build compila solo src. npm test no requiere MySQL: cubre regresión HTTP, validaciones y verificación de JWT.

La suite adicional requiere una instancia local MySQL 8 y una base exclusiva de pruebas. No apuntarla a la base habitual. En una terminal PowerShell, después de configurar usuario/contraseña locales de prueba sin mostrarlos ni versionarlos:

```powershell
$env:NODE_ENV = 'test'
$env:DB_NAME = 'petcare_integration_test'
# DB_HOST, DB_PORT, DB_USER y DB_PASSWORD se obtienen del .env local
# o se configuran en esta terminal para la instancia exclusiva de pruebas.
npm run test:db
```

La suite rechaza NODE_ENV distinto de test, host remoto o nombre sin sufijo _test. Prepara esquema/catálogos y comprueba idempotencia, registro válido, email duplicado/inválido, contraseña inválida, login válido, contraseña incorrecta, usuario inexistente, /me sin/con token, rechazo de rol, hash bcrypt y desactivación. Usa clave JWT aleatoria en memoria y elimina solo sus usuarios temporales. La base queda con esquema y catálogos reales.

En esta fase se verificó con MySQL 8.0.39 en una instancia temporal separada, sin acceder a bases existentes ni utilizar credenciales del usuario. La puesta en marcha en la instancia habitual requiere completar su .env con credenciales autorizadas.

## Verificación obligatoria de email

Preparar `.env` con EMAIL_CODE_SECRET independiente del secreto JWT (aleatorio, mínimo 32 bytes), SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_REQUIRE_TLS, SMTP_USER, SMTP_PASSWORD y MAIL_FROM autorizado por el proveedor. No copiar secretos al frontend. SMTP con STARTTLS: puerto 587, SMTP_SECURE=false y SMTP_REQUIRE_TLS=true; TLS implícito: puerto 465, SMTP_SECURE=true. Usuario/contraseña deben configurarse juntos; un relay autorizado puede no requerirlos. TLS es obligatorio salvo SMTP loopback exclusivo de NODE_ENV=test. La conexión, saludo y socket tienen límites de 5 segundos. Nodemailer es la única nueva dependencia funcional backend.

El registro valida configuración antes de crear la cuenta. Crea CLIENT pendiente con email_verified_at=NULL y devuelve `data.user` más `data.verification`:

```json
{"verificationToken":"<64 caracteres hexadecimales aleatorios>","maskedEmail":"ma***@example.com","retryAfterSeconds":45,"expiresAt":"2026-10-01T16:10:00.000Z","delivery":"sent"}
```

Los valores de ejemplo son ilustrativos. delivery=sent significa aceptación por SMTP, no confirmación de llegada a la bandeja. Si falla el envío devuelve 201 con delivery=failed y expiresAt=null; la cuenta pendiente se conserva y puede reenviar. Si un fallo DB interrumpe la preparación después de crear el usuario, se retoma mediante Login, sin crear duplicados. Un SMTP no configurado devuelve 503/EMAIL_UNAVAILABLE antes de crear el usuario.

`POST /api/auth/verify-email`:

```json
{"verificationToken":"<prueba recibida>","code":"012345"}
```

Respuesta 200: `{"success":true,"data":{"verified":true}}` para una cuenta sin identidad OAuth. Marca email_verified_at con UTC, consume el desafío y elimina code_hash; luego el usuario continúa a Login. Si la cuenta ya tiene una identidad OAuth vinculada, una verificación correcta también devuelve `data.session` con la sesión PetCare, sin cambiar el rol existente. En ambos casos el token/código de verificación es de un solo uso y no basta por sí solo para acceder a `/me`.

`POST /api/auth/resend-verification`:

```json
{"verificationToken":"<prueba recibida>"}
```

Respuesta 200: `{"success":true,"data":{"verification":{...}}}` con el mismo contrato del registro. No acepta email arbitrario ni envía códigos a otra cuenta.

Login con contraseña correcta y cuenta pendiente devuelve 403/EMAIL_NOT_VERIFIED con `error.verification`. Rota la prueba opaca sin reiniciar intentos, cuotas o código vigente. Mobile ofrece «Verificar ahora» y abre el mismo modal; reutiliza código vigente o inicia envío. /me rechaza también usuarios pendientes incluso si presentan un JWT emitido antes de aplicar esta corrección.

### Seguridad y límites

Código aleatorio criptográfico de seis dígitos, incluyendo ceros iniciales; vence en 10 minutos. HMAC-SHA256 con EMAIL_CODE_SECRET y user_id: un volcado DB no permite probar códigos offline sin el secreto. La prueba opaca tiene 256 bits, vence en 24 horas, se guarda solo su SHA-256 y no autoriza acceso a la cuenta. No devolver códigos, hashes, secretos SMTP ni detalles internos. No registrar contenido del correo. Cambiar EMAIL_CODE_SECRET invalida los códigos pendientes; mantenerlo estable entre instancias.

Máximo cinco intentos por código; los fallos se confirman antes de responder error. Máximo cinco envíos por usuario en una ventana de una hora, contando fallos SMTP; espera de 45 segundos entre solicitudes. Cada reenvío invalida el anterior y restablece intentos. Locks por usuario y transacciones serializan consumo/reenvío entre procesos; SMTP sucede después de reservar/confirmar cuota, sin mantener locks durante el envío. Límites persistidos sobreviven reinicios. Además cada endpoint auth tiene 30 solicitudes por IP/15 minutos en memoria; varias instancias requieren un almacén compartido para esta capa IP.

| HTTP | Código | Comportamiento |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Prueba/código/formato/campos inválidos |
| 400 | VERIFICATION_CODE_INVALID | Incorrecto; consume un intento |
| 410 | VERIFICATION_CODE_EXPIRED | Vencido o no entregado; reenviar |
| 429 | VERIFICATION_ATTEMPTS_EXCEEDED | Cinco fallos; solicitar otro código |
| 429 | VERIFICATION_COOLDOWN | Incluye error.verification con espera restante |
| 429 | VERIFICATION_SEND_LIMIT | Incluye error.verification con espera hasta nueva ventana |
| 401 | VERIFICATION_SESSION_EXPIRED | Prueba desconocida/vencida/rotada o usuario inactivo; retomar Login |
| 409 | EMAIL_ALREADY_VERIFIED | Consumido; continuar a Login |
| 403 | EMAIL_NOT_VERIFIED | No se permite sesión; Login incluye desafío seguro |
| 503 | EMAIL_UNAVAILABLE | SMTP/secreto no configurado; mensaje seguro |

### Migración 003 y normalización

Ejecutar `npm run db:migrate` después de preparar DB_*; no editar 001/002. 003_email_verification.sql agrega users.email_verified_at nullable y email_verifications. No se asignan fechas falsas a usuarios existentes: deben verificar. No requiere seeds adicionales ni crea cuentas de prueba en producción.

email_verifications: PK user_id, FK → users.id, relación 1:0..1, ON DELETE CASCADE para su desafío y ON UPDATE RESTRICT. token_hash es UNIQUE. Sus columnas atómicas representan un único desafío vigente: hashes, expiraciones, intentos, ventana/cuota y estado de entrega/consumo. 1FN: valores atómicos; 2FN: PK simple y dependencia completa; 3FN: no almacena email, rol ni nombres del usuario, obtenidos mediante JOIN. email_verified_at pertenece al usuario y consumed_at al desafío. Se actualiza una fila por usuario, evitando desafíos duplicados. Los contadores tienen CHECK; el resto se valida en servicios con consultas parametrizadas.

### UX y pruebas de verificación por código

El backend responde JSON; mobile usa inputs inline, AppModal/ConfirmModal y toast propio. Verificación por código → modal sobre Registro/Login, sin pantalla dedicada ni alerts nativos. El restablecimiento iniciado por Super Admin para veterinarios usa el flujo de invitación documentado abajo; recuperación pública de clientes sigue pendiente.

## AUTORIZACIÓN Y PERMISOS — gestión veterinaria

### Instalación y primer Super Admin

Aplicar `npm run db:migrate` y `npm run db:seed`, sin modificar 001–003. La migración 004 también asegura los roles iniciales antes de cargar permisos: funciona cuando las migraciones preceden a los seeds. No crea cuentas ni promueve ADMIN. El rol `SUPER_ADMIN` es distinto de `ADMIN`, que no hereda privilegios críticos.

Para preparar la primera cuenta, un operador con acceso al servidor/MySQL ejecuta `npm run admin:promote -- <ID_REAL>` sobre una cuenta existente, activa y con email verificado. Rechaza perfiles veterinarios para preservar su rol profesional. Requiere acceso de consola confiable; no hay endpoint HTTP equivalente. La sesión previa queda revocada. Guardar credenciales fuera de Git.

Configurar SMTP como en la verificación por código y `VETERINARIAN_INVITATION_URL=https://<host-real>/activate-vet` apuntando a la pantalla Expo web accesible. En desarrollo se admite HTTP únicamente en localhost/127.0.0.1. El backend rechaza URL con credenciales, query o fragmento previo. El despliegue web y, si se desea abrir directamente la app instalada, la asociación de Universal/App Links dependen del entorno y no se configuran automáticamente. No hay envío de contraseña permanente.

### Relaciones de la migración 004

Se reutilizan `users`, `roles` y `pets`, además de SMTP, bcrypt, JWT, `email_verifications`, pool, ejecutor de migraciones y manejo de errores existente.

| Tabla/cambio | PK y relaciones | Restricciones/índices |
| --- | --- | --- |
| users | Mantiene PK id y FK role_id; agrega session_version | Índice role_id/is_active/last_name/first_name; versión UNSIGNED |
| veterinarians | PK id; FK user_id → users, 1:0..1 | UNIQUE user_id, UNIQUE license_number, CHECK matrícula no vacía |
| specialties | PK id | UNIQUE name, CHECK no vacío |
| veterinarian_specialties | PK (veterinarian_id,specialty_id); FKs a ambos catálogos, N:M | Índice inverso (specialty_id,veterinarian_id) |
| permission_modules | PK code | Nombre y orden de presentación independientes del frontend |
| permissions | PK id; FK module_code → permission_modules, N:1 | UNIQUE code, CHECK is_critical/opens_module booleanos |
| role_permissions | PK (role_id,permission_id); FKs roles/permissions, N:M | Sin grants duplicados |
| user_permissions | PK (user_id,permission_id); FKs users/permissions, N:M | CHECK allowed booleano; ausencia = herencia |
| veterinarian_invitations | PK user_id; FK users, 1:0..1 | UNIQUE token_hash; expiración/consumo/envío/delivery de un desafío vigente |
| veterinarian_patients | PK (veterinarian_id,pet_id); FKs veterinarians/pets, N:M | Índice inverso (pet_id,veterinarian_id) para scope futuro |

Todas las nuevas FKs usan `ON DELETE RESTRICT`. Los IDs BIGINT se transportan como strings. Las PK compuestas dependen de ambos componentes; etiquetas pertenecen únicamente al catálogo correspondiente. No se duplican email, rol ni nombres en el perfil o relaciones. `session_version` pertenece a credenciales del usuario, `delivery` al desafío. Cumplen 1FN/2FN/3FN sin guardar listas como JSON en MySQL. La especialidad es N:M y admite una o varias; la API exige al menos una. Solo se utiliza información profesional que existe en el modelo: matrícula y especialidades.

### Resolución y límites de seguridad

`effective = override  inherited`; una denegación explícita gana a la herencia. PUT de permisos reemplaza el conjunto de excepciones completo; `allowed:null` o ausencia restaura la herencia. Un permiso crítico nunca es efectivo fuera de SUPER_ADMIN, aun si una carga SQL errónea lo concede. La API rechaza códigos desconocidos, duplicados y cualquier modificación de permisos críticos en veterinarios. La UI los muestra bloqueados. Nadie puede modificar sus propios privilegios mediante estas rutas porque solo aceptan objetivos con rol VETERINARIAN.

Cada request protegido ejecuta `authenticate`: firma/issuer/audience/expiración JWT → usuario activo y verificado → versión de sesión → permisos y perfil de MySQL. El JWT solo identifica usuario y versión; no contiene rol ni permisos. Sigue `requireRole` → `requirePermission` → scope cuando corresponde → controlador. Las siguientes solicitudes ven las modificaciones de permisos sin reemitir JWT; no se garantiza cancelar una solicitud que ya estaba en ejecución. `Cache-Control: no-store` en datos de autenticación y paneles.

`requirePatientScope` obtiene el profesional desde la identidad autenticada y consulta `veterinarian_patients`; deniega pacientes ajenos salvo `pets.view_all`, y exige `pets.view_assigned` para asignados. Debe combinarse con el permiso concreto de la operación. No existen todavía endpoints/tablas de turnos, consultas, vacunas, recetas ni productos; por eso no se afirma que haya CRUD clínico funcional. Cuando se implementen deberán agregar comprobaciones de autoría para `update_own` además de scope del paciente, filtros SQL por profesional para listados y permisos separados para cada acción. Un código de permiso de referencia no habilita un endpoint inexistente; hoy este responde 404. Las rutas ya existentes de módulos responden 403 ante acceso manual sin permiso de entrada.

### Invitación y contraseña

Crear genera un hash bcrypt de una contraseña aleatoria desconocida, no utilizable por el administrador. La transacción crea usuario VETERINARIAN, perfil, especialidades, excepciones e invitación si está activo. El token tiene 256 bits, SHA-256 en MySQL, vence en 24 h y se consume bajo locks/transacción. Se envía en el fragmento del enlace para evitar logs HTTP; la pantalla lo mantiene en memoria y limpia el fragmento web. Nunca se devuelve por API ni se imprime.

Aceptar valida fortaleza y límite de 72 bytes bcrypt, reemplaza el hash, marca email verificado mediante la posesión del token, incrementa session_version y consume la invitación atómicamente. El profesional inicia sesión en el Login común. Registro/Login conservan el VerificationCodeModal existente. Un reenvío invalida el token anterior, tiene cooldown persistido de 60 segundos y rate limit por IP. Un restablecimiento revoca sesiones al consumirse, no al solicitarse.

SMTP sucede después del commit. Si falla, creación/reenviar responde con `delivery:'failed'` y conserva la cuenta; el estado también queda en MySQL. Si faltan configuración SMTP/URL, crear devuelve 503 antes de persistir. Un error de actualización de delivery después del envío puede responder como error DB aunque el commit ya haya ocurrido; consultar el listado antes de repetir creación. No se implementó cola/outbox con reintentos automáticos. Cuenta creada inactiva no recibe invitación hasta activarse y solicitar envío.

Cambiar email borra desafíos previos, revoca sesiones, reemplaza la credencial por hash aleatorio y requiere nueva invitación. Desactivar marca estado y aumenta la versión; bloquea JWT/Login, borra desafíos y conserva perfil/especialidades/asignaciones. Reactivar exige nueva sesión, y para una cuenta sin contraseña configurada requiere enviar invitación. No hay DELETE de veterinarios. Las futuras FKs clínicas deberán usar RESTRICT al profesional que firmó cada registro, preservando autoría.

### API real (prefijo /api)

Todas las respuestas usan `{success:true,data:...}` y errores seguros `{success:false,error:{code,message}}`.

| Método / ruta | Acceso | Resultado |
| --- | --- | --- |
| GET /admin/veterinarians/catalog | SUPER_ADMIN + veterinarians.manage | Especialidades y permisos agrupables, flags critical e inherited |
| GET /admin/veterinarians | Igual | items/page/pageSize/total/hasMore; 20 por página |
| GET /admin/veterinarians/:id | Igual | Perfil, especialidades, estado de cuenta/correo/invitación, permisos efectivos y overrides |
| POST /admin/veterinarians | Igual + permissions.manage | 201; veterinarian y delivery sent/failed/pending |
| PUT /admin/veterinarians/:id | Igual + permissions.manage | Reemplaza datos, especialidades y excepciones en transacción |
| PUT /admin/veterinarians/:id/permissions | Igual + permissions.manage | Reemplaza excepciones; devuelve perfil actualizado |
| PATCH /admin/veterinarians/:id/status | SUPER_ADMIN + veterinarians.manage | Activación/desactivación sin borrar historial |
| POST /admin/veterinarians/:id/invitation | Igual | Invita o inicia restablecimiento; delivery sent/failed |
| GET /admin/specialties | SUPER_ADMIN + specialties.manage | Catálogo real |
| POST /admin/specialties | Igual | 201; crea nombre único |
| PUT /admin/specialties/:id | Igual | Renombra manteniendo relaciones; no ofrece DELETE |
| POST /auth/veterinarian-invitations/accept | Público, rate limit | accepted:true; no inicia sesión ni retorna secretos |
| GET /vet/home | VETERINARIAN autenticado | Perfil y módulos dinámicos; clinicalAvailable:false, sin métricas clínicas hasta implementar las consultas reales |
| GET /vet/modules/:module | Igual + permiso de entrada del catálogo | Metadatos; 403 si no habilitado |
| POST /auth/login / GET /auth/me | Contratos existentes | user incorpora roleName, permissions y veterinarian |

GET listado: `search` busca nombre/apellido/matrícula/email; `status=all|active|inactive`, `specialtyId=<string>`, `order=asc|desc`, `page=<entero positivo>`. ORDER y paginación usan listas blancas; consultas parametrizadas. El ID del recurso veterinario es `veterinarians.id`, no `users.id`.

Cuerpo de crear/editar (sin role/password):

```json
{
  "firstName": "<nombre real>", "lastName": "<apellido real>",
  "email": "<email real>", "phone": "<teléfono>",
  "licenseNumber": "<matrícula real>", "isActive": true,
  "specialtyIds": ["<ID del catálogo>"],
  "overrides": [{"code": "appointments.view_all", "allowed": true}]
}
```

Permisos: `{"overrides":[{"code":"vaccines.view","allowed":false}]}`. Estado: `{"isActive":false}`. Especialidad: `{"name":"<nombre>"}`. Aceptar: `{"token":"<token del correo>","password":"<contraseña elegida>"}`. Los nombres y códigos son ejemplos de contrato, no asignaciones a una cuenta fija.

400 VALIDATION_ERROR/INVALID_PERMISSION/INVALID_INVITATION, 401 AUTH_REQUIRED/INVALID_TOKEN, 403 FORBIDDEN, 404 NOT_FOUND, 409 DB_CONFLICT/ACCOUNT_INACTIVE, 429 INVITATION_COOLDOWN/TOO_MANY_ATTEMPTS, 503 INVITATION_UNAVAILABLE/EMAIL_UNAVAILABLE/DB_UNAVAILABLE. No se filtran password_hash ni detalles SQL.

### Panel móvil y alcance

Formulario con secciones personales/profesionales/especialidades/cuenta/permisos/revisión. Errores inline, confirmación de desactivación mediante ConfirmModal, toast al guardar. Checkbox distingue herencia/excepción y permite restaurar herencia. Un único panel `/vet` y una ruta de módulo compartida; módulos salen de MySQL filtrando permisos efectivos con `opens_module=1`. No se muestran turnos/pacientes ficticios: métricas null y avisos de próxima etapa, únicamente en módulos habilitados.

La sesión conserva token/expiración, no catálogos permanentes. Consulta /me al restaurar, al volver a primer plano, al regresar al panel y al refrescar; 401 cierra sesión y 403 dispara actualización. Safe Area, ThemeContext, accesibilidad y claro/oscuro se reutilizan. Login sigue siendo único.

La gestión completa de usuarios/mascotas/turnos/servicios/productos/medicamentos/categorías/pedidos/promociones/destacados y edición general de roles pertenece a futuras etapas. Esta entrega implementa veterinarios, especialidades y personalización de sus permisos; no anuncia botones de CRUD inexistentes. Las credenciales y privilegios del propio SUPER_ADMIN no son editables desde el recurso veterinario.

Pruebas: `npm test`, `npm run typecheck`, `npm run lint` en backend/mobile. `NODE_ENV=test`, DB_HOST loopback y DB_NAME terminado en `_test` para `npm run test:db`; usa SMTP efímero en memoria y fixtures temporales. No usar base real. Cobertura: creación/rol/relaciones, rechazo de escalamiento, override/denegación/herencia, cambios con JWT vigente, entrada manual 403, transacciones, scope asignado, caducidad/uso concurrente/rotación, SMTP fallido, desactivación/reactivación y revocación al cambiar contraseña. Si MySQL no está accesible, estas pruebas no certifican integración. Resultados actuales en [../INFORME_GESTION_VETERINARIOS.md](../INFORME_GESTION_VETERINARIOS.md).

`npm run test:db` prepara exclusivamente MySQL local terminado en _test y arranca SMTP loopback efímero de prueba: captura mensajes en memoria, no envía a terceros y no requiere credenciales SMTP reales. Genera secretos de prueba en memoria y limpia usuarios. Comprueba expiración, hash, cooldown, intentos, cuota, invalidación, concurrencia/uso único, fallo de entrega, pending Login y regresión JWT/health/migraciones/seeds. Pruebas unitarias de máscara/validador/hash en `npm test`. Resultados: [../INFORME_VERIFICACION_EMAIL.md](../INFORME_VERIFICACION_EMAIL.md).



## Clínica compartida, Secretaría y reservas

PETCARE NO PROCESA PAGOS. La tienda usa client_orders/client_order_items como reservas para retiro. Profesional, especialidades, peluquería, servicios, disponibilidad, agenda, clínica, stock, estados, notificaciones y administración comparten MySQL y permisos efectivos. Ver [modelo, endpoints, migración nueva y verificaciones](../AMPLIACION_CLINICA_PETCARE.md). Aplicar manualmente clinic-migrations/001_connected_clinic.sql antes de desplegar la ampliación. No ejecutar SQL dos veces ni crear registros para llenar pantallas.
## Recuperación de contraseña

`POST /api/auth/password-reset/request` acepta `{ "email": "..." }` y evita confirmar si existe una cuenta. Para usuarios activos y verificados genera 256 bits aleatorios, conserva solo SHA-256 en `password_resets` y envía un enlace por SMTP. El token vence a los 30 minutos; `POST /api/auth/password-reset/confirm` acepta `{ "token": "...", "password": "..." }`, aplica las mismas reglas y bcrypt del registro, consume los tokens pendientes y aumenta `session_version` para revocar sesiones previas. Se limita la solicitud a 5 intentos por IP y el uso del token a 10 por IP en 15 minutos.

La migración es aditiva y separada del historial SQL histórico que no está presente en este checkout. Aplicarla una vez sobre el MySQL activo, después de confirmar que el esquema de autenticación ya está preparado: `npm run db:migrate:password-reset`. No modifica cuentas existentes. La app debe publicarse con una ruta accesible `/reset-password`; configurar `PASSWORD_RESET_URL` con la URL pública completa de esa pantalla, por ejemplo `https://petcare-sistemaveterinario-mobile.vercel.app/reset-password`. La instancia local usa el mismo valor con su origen Expo web. Configurar SMTP con las variables de verificación de email ya documentadas; `EMAIL_CODE_SECRET` debe ser estable y tener al menos 32 bytes. No se debe publicar el token ni las credenciales.

La aceptación por SMTP indica que el servidor de correo aceptó el mensaje, no garantiza su llegada a la bandeja. Si el token vence o ya se usó, el backend rechaza el cambio.

## Fotos persistentes

El backend sube las fotos de perfiles y mascotas a Cloudinary en memoria después de validar y convertir el archivo a WebP. El código espera `users.profile_photo_url` para perfiles y `pets.photo_url` para mascotas; ninguna de las columnas pudo confirmarse en la base Layerbase desde este entorno. El CRUD y ownership de mascotas usan `pets.id` y `pets.owner_id`. `client_pet_details` continúa referenciada en el código para `weight_kg` y `breed_name`; verificá que también exista en el esquema desplegado.

La existencia del esquema de Layerbase no pudo comprobarse desde el entorno actual: `npm run db:check` devolvió `DB_UNAVAILABLE`. Ejecutá la consulta documentada en el README raíz para revisar `pets`, `users` y sus columnas. La extensión de mascotas es aditiva y manual: `npm run db:migrate:pet-photo` verifica `pets`, `owner_id`, `microchip_number` y cualquier `photo_url` existente antes de añadir `pets.photo_url VARCHAR(2048) NULL`; no se ejecutó. La columna de usuario tiene el script existente `npm run db:migrate:profile-photo`, que también debe usarse solo si la consulta muestra que falta.

Configurar exclusivamente en el backend `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. Las fotos nuevas de productos también se suben a Cloudinary y su URL HTTPS se guarda en `client_products.image_url`, ya presente en el esquema activo; no requieren una migración adicional. Las claves antiguas `products/...` todavía pueden leerse desde S3 si el bucket está configurado; si no, el producto sigue apareciendo y su foto se muestra vacía hasta volver a subirla. No poner secretos en variables `EXPO_PUBLIC_*`.

## Tienda propia y reservas con vencimiento

La tienda consulta `client_products` del inventario PetCare. ADMIN y SUPER_ADMIN crean/actualizan productos mediante el formulario administrativo, sujeto a `products.update`, `products.create`, `products.update_price` y `products.update_stock`. CLIENT crea reservas; SECRETARY, ADMIN y SUPER_ADMIN consultan o gestionan reservas según `reservations.view_all` y `reservations.manage`. El servidor ignora campos de precio o stock enviados al crear reservas.

La reserva fija precio, creación y vencimiento en MySQL; el vencimiento es `created_at + 24 horas` según UTC. El stock disponible baja en la misma transacción que inserta la reserva. Cancelar o vencer libera `reserved_stock` una sola vez; retirar descuenta unidades físicas. Un worker del backend revisa vencimientos al iniciar y cada 30 segundos, y el listado/detalle ejecuta además una revisión inmediata.

Antes de habilitarlo en Layerbase, inspeccionar el esquema y permisos RBAC del entorno elegido y ejecutar manualmente `npm run db:migrate:reservations` desde `backend` con la conexión correcta. La migración es aditiva, registra permisos faltantes, concede la gestión de reservas a SECRETARY/ADMIN/SUPER_ADMIN y backfillea fechas de pedidos activos con `created_at + 24 horas`; no elimina columnas externas antiguas ni ejecuta cambios al iniciar la API. No se ejecutó contra producción ni se verificó una conexión a Layerbase en esta tarea. Si el proceso backend está detenido, las reservas vencidas se liberan al reiniciar el servicio.

## Error del panel: «Este módulo requiere actualizar el esquema de la clínica»

### Qué significa y por qué aparecía en varias pantallas

La app recibe el código `SCHEMA_UPDATE_REQUIRED` cuando una consulta encuentra una tabla o columna que falta en MySQL. La interfaz reutiliza ese mensaje en los módulos afectados, por eso el mismo cartel aparecía en distintas pantallas.

La causa quedó confirmada en la base: faltaban `client_appointments.observations`, `client_appointments.cancellation_reason` y `client_order_status_history.reason`. Esas columnas son necesarias para los detalles de turnos, sus observaciones y cancelaciones, y el historial de rechazos de reservas.

### Solución aplicada

El 15/10/2026 se ejecutaron las migraciones aditivas `db:migrate:appointment-details` y `db:migrate:reservation-reason`. Después se consultaron los metadatos de MySQL y se confirmó que las tres columnas ya existen. No se modificaron ni borraron turnos, reservas o historiales existentes.

Además, el resumen de Administración ahora consulta el próximo turno sin depender de las columnas opcionales del detalle, así la falta de una ampliación de detalle no bloquea el inicio.

### Si el cartel aparece en otro entorno

Cada entorno tiene su propia base. El error se genera cuando cualquier consulta encuentra una tabla o columna ausente; varias pantallas pueden mostrar el mismo error porque consultan esos datos por separado. La causa ya identificada fue la falta de columnas en turnos e historial de reservas. La migración aplicada a una base no actualiza otras bases ni otro entorno.

Desde `backend`, primero comprobá que `.env` apunte al MySQL del backend que usa la app y que `EXPO_PUBLIC_API_URL` en Mobile señale a ese mismo backend. Después ejecutá `npm run db:check`. Si la conexión corresponde al entorno afectado, hacé un respaldo y aplicá el comando idempotente:

```sh
npm run db:migrate:clinic-schema
```

El comando verifica y agrega únicamente las columnas faltantes `client_appointments.cancellation_reason`, `client_appointments.observations` y `client_order_status_history.reason`; conserva los datos existentes y se detiene si encuentra una definición incompatible. Luego reiniciá el backend. Si vuelve a aparecer, buscá `[DATABASE_SCHEMA_ERROR]` en el registro de ese backend: contiene el código MySQL y el identificador de la tabla/columna faltante, sin SQL ni datos privados. Confirmá que corregís la base a la que apunta ese backend; no repitas una migración en una base distinta esperando que actualice el entorno activo.

**Estado de esta revisión:** el comando `npm.cmd run db:check` desde el entorno local de trabajo no pudo conectar con la base configurada (devolvió `DB_ERROR`). Por eso no fue posible confirmar ni reparar desde aquí la base del backend que muestra el cartel. El cambio agrega un único comando seguro para aplicar las dos migraciones conocidas; ejecutalo desde el entorno y con las credenciales del backend afectado.

## Perfil clínico del veterinario

El panel del veterinario consulta `/api/clinic` y `/api/vet`; el backend aplica `appointments.*`, `pets.*`, `medical_records.*` y los permisos específicos de vacunas, recetas e indicaciones. Los propietarios (`/clinic/clients`) y sus mascotas se limitan a los pacientes visibles para el profesional autenticado. Nunca se toma el ID de veterinario desde el cuerpo de una solicitud.

Las observaciones privadas se guardan en `client_clinical_records.internal_notes`; el campo histórico `content` queda como indicaciones destinadas al propietario. La API del cliente no selecciona las notas privadas, motivos, diagnósticos ni tratamientos internos. Las consultas pueden vincularse a `client_appointments` usando `appointment_id`, con unicidad para impedir duplicar una consulta por turno. Las recetas guardan dosis, frecuencia y duración en campos propios. La descripción profesional se guarda en `veterinarians.professional_description`; la matrícula y las especialidades siguen sujetas a gestión administrativa.

La migración aditiva es `npm run db:migrate:veterinarian-clinical`. Agrega `internal_notes`, `appointment_id`, `dose`, `frequency`, `duration` y `professional_description`, además de la referencia opcional al turno y una restricción única. No reescribe datos clínicos existentes y no corre al iniciar el servidor. Fue aplicada y verificada en la base MySQL conectada el 16/10/2026. Aplicala una vez en cada entorno después de revisar que esa conexión apunta a la base esperada.

### Verificación

`npm run db:check` confirmó una conexión MySQL compatible. Los metadatos de la base mostraron las tres columnas después de la migración. También pasan el typecheck, el lint y las 7 pruebas unitarias existentes del backend.
