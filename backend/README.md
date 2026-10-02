# PetCare Backend — fase 3

El módulo `/api/client` incorpora mascotas, turnos, clínica, tienda, carrito, pedidos, notificaciones y perfil con JWT/ownership. Ver [contratos, migración aditiva y verificación](../IMPLEMENTACION_CLIENTE.md).

## Autenticación tradicional

Configurar además estas variables en .env:

| Variable | Valor / requisito |
| --- | --- |
| JWT_ACCESS_SECRET | Clave aleatoria local, mínimo 32 bytes, nunca versionada |
| JWT_ACCESS_TTL_SECONDS | 900 por defecto, máximo 3600 |
| JWT_ISSUER / JWT_AUDIENCE | petcare-api / petcare-mobile |
| BCRYPT_SALT_ROUNDS | 12 por defecto; admite 10–14 |
| CORS_ALLOWED_ORIGINS | Orígenes web separados por coma; ejemplo http://localhost:8081 |

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

Formato de error: `{"success":false,"error":{"code":"INVALID_CREDENTIALS","message":"Email o contraseña incorrectos."}}`. Auth responde Cache-Control: no-store. Access Token vence sin refresh; se requiere nuevo login. Logout mobile borra su sesión local: un token emitido conserva validez hasta expirar salvo desactivación o cambio de versión de sesión. Esta versión incluye permisos y restablecimiento iniciado por Super Admin para veterinarios mediante invitación; OAuth y recuperación pública de clientes siguen pendientes.

API REST Express 5 y TypeScript con MySQL 8 y autenticación tradicional mediante bcrypt/JWT. Conserva health, modelo normalizado y comandos DB. No implementa OAuth, refresh tokens ni gestión de mascotas.

## Requisitos e instalación

Node.js >= 22.13, npm y MySQL 8.0.16+ o MySQL 8.4. No usar MariaDB, MySQL 5.7, PostgreSQL, Supabase o MongoDB. La comprobación central valida versión y conectividad; desde MySQL 8.0.16 las restricciones CHECK se aplican efectivamente. Ver [documentación MySQL CHECK](https://dev.mysql.com/doc/refman/8.0/en/create-table-check-constraints.html).

```bash
cd backend
npm install
```

Copiar `.env.example` a `.env`: PowerShell `Copy-Item .env.example .env`; Bash `cp .env.example .env`. Completar credenciales propias en ese archivo local. No hay credenciales reales versionadas ni se genera una contraseña predeterminada para la aplicación.

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
| DB_HOST | 127.0.0.1 | Host del servidor MySQL |
| DB_PORT | 3306 | Puerto MySQL, entero entre 1 y 65535 |
| DB_NAME | petcare | Base específica del proyecto; nombre validado |
| DB_USER | petcare | Cuenta autorizada localmente |
| DB_PASSWORD | vacío | Completar contraseña real solo en .env |
| DB_CONNECTION_LIMIT | 10 | Conexiones del pool, entero de 1 a 100 |
| DB_CONNECT_TIMEOUT_MS | 5000 | Tiempo al abrir conexión, de 1 a 60000 ms |

DB_CONNECT_TIMEOUT_MS limita la apertura de una conexión, no es un timeout de consultas ni de espera en la cola. El pool tiene cola máxima de 50 y multipleStatements=false. BIGINT se devuelve como string para evitar pérdida de precisión en JavaScript. `.env` está ignorado por Git; nunca copiar DB_* al bundle mobile.

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
- src/services/database.service.ts: checkDatabaseConnection y validación de MySQL 8.
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

Respuesta 200: `{"success":true,"data":{"verified":true}}`. Marca email_verified_at con UTC, consume el desafío y elimina code_hash. No emite Access Token. Después de verificar se continúa a Login; credenciales correctas de una cuenta verificada conservan la respuesta JWT existente.

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

`effective = override ?? inherited`; una denegación explícita gana a la herencia. PUT de permisos reemplaza el conjunto de excepciones completo; `allowed:null` o ausencia restaura la herencia. Un permiso crítico nunca es efectivo fuera de SUPER_ADMIN, aun si una carga SQL errónea lo concede. La API rechaza códigos desconocidos, duplicados y cualquier modificación de permisos críticos en veterinarios. La UI los muestra bloqueados. Nadie puede modificar sus propios privilegios mediante estas rutas porque solo aceptan objetivos con rol VETERINARIAN.

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

