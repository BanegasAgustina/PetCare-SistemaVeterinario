# Configuración completa de PetCare

Guía del código presente en este repositorio, revisada el 5 de octubre de 2026. Los valores con `<...>` se reemplazan por los del entorno propio; `example.invalid` es un dominio de documentación, nunca un servidor de producción. No copies contraseñas, tokens ni archivos de credenciales al repositorio.

## 1. Qué funciona y qué requiere configuración

PetCare tiene backend Express/TypeScript, MySQL y mobile Expo SDK 57. Registro y Login comparten verificación de email por código. El backend consulta usuario, rol y permisos en MySQL en cada request; el frontend selecciona el panel con `/api/auth/me`.

Esta versión agrega Google, Facebook y X mediante Authorization Code con cliente confidencial en backend, `state` persistido y PKCE S256 para Google/X. La app recibe un ticket de un uso protegido por una prueba del dispositivo, nunca tokens en el deep link. Los tres proveedores requieren credenciales propias y configuración en sus portales para poder probarse realmente.

Access tokens JWT duran 15 minutos por defecto. Refresh tokens opacos se guardan como SHA-256 en MySQL, rotan al renovar y conservan una caducidad absoluta de familia de 30 días por defecto. Reutilizar un refresh consumido revoca la familia. Logout revoca la familia en servidor y borra SecureStore; si no hay red, la app informa que solo pudo cerrar localmente. Los JWT nuevos tienen familia y se rechazan después de revocarla. Los JWT anteriores a esta implementación, sin familia, conservan su TTL original.

**Situación de las migraciones:** este checkout no contiene `backend/migrations`, `backend/client-migrations` ni `backend/clinic-migrations`. Los README anteriores mencionan archivos que ya no están. No deben ejecutarse esos comandos sobre una base nueva ni inventar sus checksums. Para una instalación vacía existe ahora `backend/bootstrap/001_fresh_schema.sql`, basado en el DDL de `schema-audit.json` y las columnas usadas por los repositories actuales. Usa un historial propio y rechaza bases con tablas. No reemplaza migraciones históricas de instalaciones existentes.

El bootstrap solo incluye catálogos estructurales del diseño existente: seis roles, permisos, especies DOG/CAT y tipos profesionales Veterinario/Peluquería. Son necesarios para las FK, navegación y autorización. No crea usuarios, mascotas, especialidades, servicios, horarios, productos, reservas ni historias clínicas. ADMIN comienza sin grants: SUPER_ADMIN debe conceder únicamente los necesarios. La recuperación pública de contraseña de clientes sigue pendiente; los restablecimientos por invitación del personal sí existen.

## 2. Herramientas necesarias

| Herramienta | Uso y dónde instalar | Comprobación |
| --- | --- | --- |
| Node.js 22.13 o posterior compatible con SDK 57 | Ejecuta backend, Expo y TypeScript. Instalar desde [Node.js](https://nodejs.org/en/download). | `node --version` |
| npm | Instala dependencias; viene con Node. | `npm --version` |
| Git | Clona y conserva versiones. [Descarga](https://git-scm.com/downloads). | `git --version` |
| MySQL 8.0.16+ de las ramas 8/9 | Persistencia; puede ejecutarse en Railway o localmente. El backend rechaza MariaDB y MySQL anterior. | En el cliente: `SELECT VERSION();` |
| Cliente MySQL o Workbench | Revisa esquema, backup y tablas. No es necesario para iniciar HTTP, pero ayuda a administrar DB. | `mysql --version`, o abrir Workbench |
| Expo CLI del proyecto | Levanta mobile; se instala con sus dependencias. No instalar `expo-cli` global antiguo. | Dentro de mobile: `npx expo --version` |
| Android Studio, opcional | Emulador Android y compilación nativa local; un teléfono o EAS cloud evitan necesitarlo para ese caso. | Abrir Device Manager; `adb --version` si platform-tools está en PATH |
| EAS CLI, opcional | Compilación y firma cloud de una app propia. | `npx eas-cli@latest --version` |

SDK 57 usa React Native 0.86 y React 19.2.3; su mínimo de Node está en la [referencia versionada de Expo](https://docs.expo.dev/versions/v57.0.0/). Windows permite desarrollar Android/web. Una compilación iOS local requiere macOS/Xcode; para iOS en Windows usar EAS y la cuenta Apple necesaria.

## 3. Clonar e instalar

Abrí PowerShell o una terminal. Elegí una carpeta donde puedas escribir:

```powershell
git clone https://github.com/BanegasAgustina/PetCare-SistemaVeterinario.git
cd PetCare-SistemaVeterinario
cd backend
npm install
Copy-Item .env.example .env
cd ../mobile
npm install
Copy-Item .env.example .env
cd ..
```

Si `.env` ya existe, no lo sobrescribas: compará con `.env.example` y agregá solo lo faltante. Para instalaciones reproducibles con los lockfiles actuales también podés usar `npm ci` en cada carpeta. No hay un `package.json` raíz ni un único comando de instalación para ambos módulos.

## 4. Dependencias reales

**Backend:** Express 5 (HTTP), TypeScript/tsx (compilación y desarrollo), mysql2 (pool y consultas parametrizadas), dotenv (entorno), bcrypt (hash de contraseña), jsonwebtoken (JWT), Helmet/CORS/express-rate-limit (cabeceras, orígenes y límites), validator (inputs), Nodemailer (SMTP), Sharp (validación/conversión de imágenes), AWS SDK S3 y request-presigner (bucket privado y lectura temporal). OAuth utiliza `fetch`, `crypto` y `URL` de Node; no requiere Passport ni un SDK de login nativo.

**Mobile:** React/React Native, Expo SDK 57, Expo Router, SecureStore, WebBrowser y Crypto (sesión nativa y OAuth), Linking/Constants (entorno Expo), ImagePicker (galería), DateTimePicker (fecha), Safe Area, Screens, Reanimated/Worklets, vector-icons, react-native-web/react-dom (web), expo-status-bar/system-ui y validator. `expo-dev-client` permite una compilación de desarrollo propia. ESLint y TypeScript verifican ambos módulos. Los números exactos y lockfiles están en sus `package.json`/`package-lock.json`.

## 5. Variables del backend

Todas se configuran en **`backend/.env` local** o en **Railway → servicio backend → Variables**. Railway no lee tu `.env` local desde Git. Variables públicas del backend tampoco se convierten en variables de Expo automáticamente.

| Nombre | Para qué sirve / dónde obtenerlo | Secreto | Ejemplo seguro o valor inicial |
| --- | --- | --- | --- |
| `NODE_ENV` | Modo del servidor; producción exige URLs seguras. | No | `production` en Railway; `development` local |
| `PORT` | Puerto HTTP. Railway lo administra; local elegís uno libre. | No | `3000` local |
| `REGISTER_DIAGNOSTICS` | Diagnóstico temporal de etapas de registro; no imprime credenciales y se deshabilita en producción. | No | `false` |
| `DB_HOST` | Host de MySQL desde Railway Variables/Connect o tu instalación local. | Infraestructura privada | `127.0.0.1` local |
| `DB_PORT` | Puerto MySQL; usar el puerto público del TCP proxy desde tu PC. | No | `3306` interno/local |
| `DB_NAME` | Base existente seleccionada. Railway publica `MYSQLDATABASE`; debe empezar con letra y usar letras/números/guion bajo, máximo 64. | No | `petcare` local; en Railway copiar el nombre real |
| `DB_USER` | Usuario MySQL autorizado, de Credentials/Variables. | Privado | `petcare` local, si lo creaste |
| `DB_PASSWORD` | Contraseña del usuario MySQL, del servicio DB. | **Sí** | Vacío en example; completar con la propia |
| `DB_CONNECTION_LIMIT` | Tamaño del pool, 1–100; adaptar al límite de conexiones de DB. | No | `10` |
| `DB_CONNECT_TIMEOUT_MS` | Espera al conectar, 1–60000 ms. | No | `5000` |
| `JWT_ACCESS_SECRET` | Clave aleatoria para firmar JWT; generarla localmente. Mínimo 32 caracteres/bytes no vacíos. | **Sí** | No usar una contraseña de ejemplo |
| `JWT_ACCESS_TTL_SECONDS` | Caducidad access, 1–3600 segundos. | No | `900` |
| `JWT_REFRESH_TTL_SECONDS` | Caducidad absoluta de renovación, 3600–7776000 segundos. | No | `2592000` |
| `JWT_ISSUER` | Emisor esperado por firma/verificación. Debe coincidir entre instancias. | No | `petcare-api` |
| `JWT_AUDIENCE` | Audiencia esperada por firma/verificación. | No | `petcare-mobile` |
| `BCRYPT_SALT_ROUNDS` | Coste bcrypt, entre 10 y 14. | No | `12` |
| `BACKEND_URL` | **Origen** público del backend, sin `/api`, query ni credenciales. Lo obtenés al generar el dominio Railway. | No | `https://api.example.invalid` como marcador; `http://localhost:3000` local |
| `OAUTH_RETURN_URLS` | Destinos exactos autorizados del retorno, separados por coma. Sale del scheme y del origen web real. | No | `petcare://oauth,http://localhost:8081/oauth` para desarrollo local |
| `GOOGLE_CLIENT_ID` | Cliente tipo Web application, de Google Auth Platform → Clients. | Público técnicamente; solo backend en este flujo | Completar ID propio |
| `GOOGLE_CLIENT_SECRET` | Secreto de ese cliente web, mostrado por Google. | **Sí** | Vacío hasta configurarlo |
| `FACEBOOK_CLIENT_ID` | App ID de Meta Developers. | Público técnicamente; solo backend en este flujo | Completar ID propio |
| `FACEBOOK_CLIENT_SECRET` | App Secret de Meta → Settings → Basic. | **Sí** | Vacío hasta configurarlo |
| `FACEBOOK_GRAPH_VERSION` | Versión Graph soportada que seleccionaste en Meta; revisar el portal/documentación al configurar. | No | Forma `vNN.N`; **no usar ese marcador como valor** |
| `X_CLIENT_ID` | OAuth 2.0 Client ID de X Developer Portal. | Público técnicamente; solo backend en este flujo | Completar ID propio |
| `X_CLIENT_SECRET` | Secreto OAuth 2.0 del cliente confidencial de X; no es OAuth 1.0 API Secret. | **Sí** | Vacío hasta configurarlo |
| `EMAIL_CODE_SECRET` | Clave HMAC para códigos; generar independiente de JWT. Mínimo 32 bytes/caracteres. | **Sí** | No reutilizar `JWT_ACCESS_SECRET` |
| `SMTP_HOST` | Servidor SMTP del proveedor de correo que elegiste. No hay proveedor hardcodeado. | No | `smtp.example.invalid` como marcador |
| `SMTP_PORT` | Puerto SMTP del proveedor. | No | `587` con STARTTLS; `465` con TLS implícito |
| `SMTP_SECURE` | TLS implícito desde conexión. | No | `false` para 587; `true` para 465 |
| `SMTP_REQUIRE_TLS` | Exige upgrade STARTTLS cuando no hay TLS implícito. | No | `true` |
| `SMTP_USER` | Credencial de envío autorizada por el proveedor. | Privado | Completar usuario propio |
| `SMTP_PASSWORD` | Contraseña SMTP/app password autorizada. | **Sí** | Completar clave propia |
| `MAIL_FROM` | Dirección de remitente validada por proveedor; el código exige email simple. | No | `correo@example.invalid` como marcador, sin nombre envolvente |
| `VETERINARIAN_INVITATION_URL` | URL publicada de `/activate-vet` en Expo web. | No | `http://localhost:8081/activate-vet` solo desarrollo local |
| `ACCOUNT_INVITATION_URL` | URL publicada de `/activate-account`; si falta usa la URL veterinaria existente. Conviene configurar cada pantalla. | No | `http://localhost:8081/activate-account` solo desarrollo local |
| `CORS_ALLOWED_ORIGINS` | Orígenes **web**, sin rutas, separados por coma. Sale del host real de Expo web. React Native no necesita CORS. | No | `http://localhost:8081,http://127.0.0.1:8081` |
| `BUCKET` | Nombre del bucket Railway → Credentials. | Backend, infraestructura | Copiar valor real |
| `ACCESS_KEY_ID` | Access key del bucket. | **Credencial privada** | No copiar a mobile |
| `SECRET_ACCESS_KEY` | Secret access key del bucket. | **Sí** | No copiar a mobile |
| `REGION` | Región que informa Credentials; no asumir otra región. | No | Copiar valor real |
| `ENDPOINT` | Origen S3 HTTPS de Credentials, sin bucket en la ruta ni query. | No | Copiar URL real |
| `PET_PHOTO_S3_URL_STYLE` | Estilo de URL indicado por Credentials. | No | `virtual`; `path` para bucket que lo requiera |

Para generar **cada** clave independiente, desde backend:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copiá la salida a la variable correspondiente, evitá compartirla y generá una nueva para la otra clave. Cambiar JWT invalida access tokens. Cambiar EMAIL_CODE_SECRET invalida códigos pendientes. Todas las instancias del mismo entorno necesitan las mismas claves.

## 6. Variables del mobile y protección de secretos

En `mobile/.env` existe **solo** `EXPO_PUBLIC_API_URL`: URL base pública de la API **con `/api`**. Se obtiene del dominio backend o de la IP de tu PC.

| Entorno | Ejemplo de desarrollo |
| --- | --- |
| Expo web en la misma PC | `http://localhost:3000/api` |
| Emulador Android estándar | `http://10.0.2.2:3000/api` |
| Teléfono en Wi-Fi | `http://<IP-LAN-DE-TU-PC>:3000/api` |
| Producción | `https://<DOMINIO-REAL-BACKEND>/api` |

`EXPO_PUBLIC_*` queda incluido en el bundle: no es secreto. Mobile no necesita Client ID/Secret en esta arquitectura, ni DB_PASSWORD, JWT secret, App Secret, X secret, bucket keys o SMTP password. El retorno nativo se calcula como `petcare://oauth`; web usa su propio origen y `/oauth`, sin variable duplicada. Configurá ese valor exacto en `OAUTH_RETURN_URLS` del backend.

Para builds cloud, configurar `EXPO_PUBLIC_API_URL` en el entorno EAS seleccionado o mediante el mecanismo de variables de Expo correspondiente a tu build, antes de compilar. Reiniciar Expo tras cambiar `.env`; una app distribuida requiere reconstrucción para cambiar una variable incluida en el bundle.

`.gitignore` ignora `.env`, `.env.*` salvo `.env.example`, credenciales JSON comunes y certificados/keystores. Verificá antes de hacer commit:

```powershell
git check-ignore backend/.env mobile/.env
git ls-files -- backend/.env mobile/.env
```

El segundo comando no debe listar archivos. Si un secreto alguna vez se publicó, ignorarlo ahora no lo borra del historial: revocarlo/rotarlo en su proveedor y revisar el historial. Los secretos backend de producción se guardan en Railway; no tienen que existir en el `.env` de un frontend ni en Git.

## 7. Railway MySQL o MySQL local

### Railway

1. Entrá a [Railway](https://railway.com), elegí el proyecto y entorno correctos o creá uno.
2. Agregá un servicio MySQL y esperá a que esté disponible. Revisá la versión con `SELECT VERSION()`.
3. Abrí Variables/Connect del servicio y obtené host, puerto, usuario, contraseña y base. No publiques capturas con credenciales.
4. **Backend dentro del mismo proyecto Railway:** usá referencias a variables del servicio MySQL y la red privada. Mapear `MYSQLHOST` → `DB_HOST`, `MYSQLPORT` → `DB_PORT`, `MYSQLDATABASE` → `DB_NAME`, `MYSQLUSER` → `DB_USER`, `MYSQLPASSWORD` → `DB_PASSWORD`. El nombre real del servicio puede variar; seleccioná la referencia en la UI.
5. **Comandos desde tu PC:** usá el host y puerto públicos del TCP proxy que muestra Connect, manteniendo base/usuario/contraseña de ese servicio. Un host `*.railway.internal` no resuelve desde tu computadora. El puerto público puede ser distinto de 3306.
6. Railway ya crea una base: seleccioná ese nombre en `DB_NAME`. No ejecutes `db:create` salvo que quieras crear otra base y tengas permisos.
7. Cargá DB_* en `backend/.env` para los comandos locales. El cliente SQL debe usar las mismas credenciales, sin contraseña en argumentos/historial; Workbench puede pedirla al conectar.
8. Ejecutá `npm run db:check` desde backend. Esto verifica conexión y versión, todavía no el esquema.
9. Elegí el camino de instalación de la sección siguiente. En instalaciones existentes, hacé backup y revisá esquema/historial antes de aplicar extensiones.
10. Comprobá tablas y luego `/api/health/database`. `/api/health` por sí solo no confirma DB.

La elección de hosts interno/público sigue la [documentación MySQL de Railway](https://docs.railway.com/databases/mysql).

### Local

Instalá MySQL compatible, iniciá su servicio y creá un usuario real con permisos sobre la base elegida. Para crear la base mediante el proyecto, DB_USER necesita permiso CREATE. Desde backend, con DB_* configuradas:

```powershell
npm run db:create
npm run db:check
```

No hay contraseña ni usuario predeterminado creado por el proyecto. El comando crea la base si falta, sin eliminar la existente. El usuario que aplica el esquema requiere CREATE/ALTER/INDEX/REFERENCES y acceso DML; para el servidor en producción conviene una cuenta limitada a las operaciones necesarias después de preparar el esquema.

## 8. Esquema nuevo y migraciones existentes

### Instalación nueva: base completamente vacía

Desde `backend`, después de `db:check`:

```powershell
npm run db:bootstrap
npm run db:migrate:auth
```

Orden real:

1. `bootstrap/001_fresh_schema.sql`: esquema de cliente, clínica, personal, RBAC y verificación; catálogos estructurales únicamente. Guarda checksum, estado y número de bloques completados en `bootstrap_schema_migrations`.
2. `auth-migrations/001_oauth_sessions.sql`: `oauth_accounts`, `refresh_tokens` y `oauth_attempts`. Guarda checksum/estado en `auth_schema_migrations`.

No ejecutés después `db:migrate`, `db:migrate:client`, `db:migrate:pet-form`, `db:migrate:clinic` o `db:seed`: apuntan a SQL histórico ausente o al historial antiguo, que el bootstrap no finge haber aplicado. El nuevo esquema ya incluye las columnas clínicas y raza libre. Los comandos nuevos omiten su versión si ya está aplicada con el mismo checksum; ante aplicación parcial se detienen. El bootstrap rechaza una DB preexistente sin su historial.

Comprobación SQL, seleccionando previamente la base correcta:

```sql
SELECT DATABASE(), VERSION();
SHOW TABLES;
SELECT * FROM bootstrap_schema_migrations;
SELECT * FROM auth_schema_migrations;
SHOW CREATE TABLE users;
SHOW CREATE TABLE client_appointments;
SHOW CREATE TABLE refresh_tokens;
SELECT code,name FROM roles ORDER BY code;
SELECT COUNT(*) AS usuarios FROM users;
```

Al terminar el bootstrap nuevo, `usuarios` debe ser cero. Solo creá después cuentas reales del proyecto. El esquema usa FK e índices únicos, incluido un índice de turno ocupado que permite conservar cancelaciones sin bloquear una nueva reserva.

### Instalación existente

Nunca uses `db:bootstrap` para actualizarla. Primero backup, revisión de tablas/columnas actuales y de sus historiales. Si ya está preparada la ampliación clínica, aplicá únicamente `npm run db:migrate:auth` para esta versión. Si faltan las tablas clínicas, hay que recuperar o preparar una migración aditiva auditada específica para ese esquema: no ejecutar el bootstrap encima ni reconstruir el stock a ciegas.

Referencias históricas que aparecen en documentos previos, **no archivos ejecutables presentes**: `001_initial_schema.sql`, `002_canonical_catalogs.sql`, `003_email_verification.sql`, una versión 004 de autorización/veterinarios cuyo nombre completo no se confirma en este checkout, `client-migrations/001_client_experience.sql`, `client-migrations/002_pet_breed_name.sql` y `clinic-migrations/001_connected_clinic.sql`. Sus runners todavía existen para compatibilidad documental. No se editaron ni se reemplazaron checksums de versiones históricas. El stock de una clínica existente requiere revisión especial porque versiones anteriores descontaban físicamente unidades de pedidos activos.

DDL MySQL no admite rollback global: CREATE/ALTER hacen commits implícitos. Si un historial queda `running`, revisá el último bloque y el esquema con un operador de DB. No borres el historial, no marques `applied` sin comprobar todas las sentencias y no repitas manualmente todo el SQL. Una nueva extensión debe tener una versión posterior y archivo inmutable.

## 9. Tablas principales y relaciones

| Tablas | Responsabilidad |
| --- | --- |
| `users`, `roles` | Identidad, contraseña bcrypt, estado, verificación y versión de sesión. `users.role_id` es FK a roles. |
| `permission_modules`, `permissions`, `role_permissions`, `user_permissions` | Catálogo RBAC, grants de rol y overrides individuales. `/auth/me` devuelve permisos efectivos calculados en backend. |
| `oauth_accounts` | Única identidad externa por provider+subject, enlazada a `users`; no se une por email. |
| `oauth_attempts` | State hasheado, desafío del dispositivo, PKCE proveedor, retorno permitido y ticket de un uso. |
| `refresh_tokens` | Hash, familia, usuario, versión, consumo, revocación y expiración absoluta. |
| `email_verifications`, `veterinarian_invitations` | Pruebas restringidas de email e invitaciones, con hashes/expiración. No autorizan endpoints normales. |
| `species`, `breeds`, `pets`, `client_pet_details` | Mascota vinculada al propietario, especie/raza, peso y clave de foto privada. |
| `veterinarians`, `specialties`, `veterinarian_specialties`, `veterinarian_patients` | Matrícula, especialidades y pacientes asignados. |
| `professional_types`, `professional_services`, `professional_blocks` | Tipo vinculado al rol, servicios por usuario profesional y bloqueos reales de agenda. |
| `client_services`, `client_appointment_slots`, `client_appointments` | Servicio, horario/profesional/tipo y turno del cliente/mascota. Locks e índice de ocupación evitan doble reserva. |
| `client_clinical_records` | Consultas, vacunas, recetas y recomendaciones del veterinario, relaciones con producto/consulta y vigencia explícita. |
| `client_product_categories`, `client_products`, `client_promotions` | Catálogos administrados, precio informativo, stock físico/reservado y promociones reales. |
| `client_orders`, `client_order_items` | Reservas para retiro y sus ítems; no procesan pagos. |
| `client_notifications` | Notificaciones originadas por acciones reales, filtradas por propietario. |
| `client_cart_items` | Compatibilidad del flujo anterior; carrito/checkout no son el flujo visible de reservas. |

## 10. Crear el primer SUPER_ADMIN

Con esquema y DB configurados, desde una terminal interactiva en backend:

```powershell
npm run create:super-admin
```

Solicita nombre, apellido, email, teléfono opcional, contraseña oculta y repetición. Usa el validador de registro, bcrypt y una transacción/lock. Busca `roles.id` por el **código `SUPER_ADMIN` en MySQL**, sin IDs fijos ni emails especiales. Crea una cuenta real activa y verificada por el operador de confianza que tiene acceso local a la DB. No envía contraseña por email ni expone un endpoint público. Si ya hay un SUPER_ADMIN, rechaza el bootstrap; tampoco promueve una cuenta cuyo email ya existe.

Verificación en SQL:

```sql
SELECT u.id,u.email,u.is_active,u.email_verified_at,r.code
FROM users u JOIN roles r ON r.id=u.role_id
WHERE r.code='SUPER_ADMIN';
```

Iniciá sesión en el Login habitual, confirmá `/api/auth/me` y el panel `/admin`. No hay usuario/contraseña de demostración. Desde administración, creá personal real por invitaciones, asigná permisos y completá catálogos necesarios. `admin:promote` es un comando anterior de consola, no el camino recomendado para el primer administrador de esta instalación nueva.

## 11. Levantar backend local

Desde backend:

```powershell
npm run dev
```

Escucha en `0.0.0.0`, puerto `PORT` o 3000. URL base local: `http://localhost:3000/api`. En otra terminal PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/health/database
```

Health confirma HTTP; database confirma conexión/versión MySQL. Ninguno confirma por sí mismo todas las tablas ni SMTP. Para comprobar sesión y permisos, ingresá con una cuenta real en mobile y revisá su panel o llamá a `/api/auth/me` con `Authorization: Bearer <ACCESS-TOKEN-PROPIO>` desde un cliente privado; no publiques ese token.

Build de producción local:

```powershell
npm run build
npm start
```

## 12. Deploy backend en Railway

1. Crear un servicio desde el repositorio GitHub de PetCare, seleccionando la rama correcta.
2. Configurar **Root Directory `/backend`** para que Railway encuentre su package y lockfile. No desplegar mobile como servidor Express.
3. Build Command: **`npm run build`**. Railway instala las dependencias de ese módulo; TypeScript debe estar disponible durante build. Start Command: **`npm start`**, que ejecuta `node dist/server.js`.
4. Cargar las variables backend, incluyendo las referencias DB internas. Usar `NODE_ENV=production`; respetar el PORT asignado por Railway.
5. Preparar el esquema explícitamente según sección 8, con el cliente autorizado conectado al entorno correcto. Arrancar HTTP no ejecuta SQL ni seeds.
6. Generar dominio público en Networking. Usarlo como `BACKEND_URL` sin `/api`; mobile usa ese mismo dominio **con `/api`**.
7. Configurar Healthcheck Path **`/api/health/database`** para disponibilidad DB, o `/api/health` si se desea comprobar solo HTTP. Las tablas deben comprobarse separadamente antes de habilitar usuarios.
8. Redeploy luego de cambiar variables/código. Revisar build logs y deployment logs, sin imprimir secretos ni habilitar diagnósticos de registro en producción.
9. Confirmar ambos endpoints health desde el dominio generado. Actualizar callbacks y Expo con ese dominio.

La raíz separada por servicio está descrita en [monorepos de Railway](https://docs.railway.com/deployments/monorepo). No hay un archivo `railway.json` en este proyecto: estos valores se configuran en el servicio.

## 13. SMTP, códigos e invitaciones

1. Elegí un proveedor SMTP y autorizá un remitente real. El código no impone Gmail ni otro proveedor. Si tu proveedor utiliza app passwords, creá una específica de envío siguiendo sus instrucciones.
2. Copiá host, puerto, usuario y contraseña a las variables backend. Usuario/password se configuran juntos; un relay autenticado por otra vía puede no necesitarlos.
3. Para 587: `SMTP_SECURE=false`, `SMTP_REQUIRE_TLS=true`. Para 465: `SMTP_SECURE=true`. TLS es obligatorio salvo SMTP loopback exclusivo de tests.
4. Configurá `MAIL_FROM` como email autorizado y `EMAIL_CODE_SECRET` independiente.
5. Configurá los enlaces publicados `VETERINARIAN_INVITATION_URL` y `ACCOUNT_INVITATION_URL`. No aceptan credenciales, query ni fragmento previos; HTTPS obligatorio en producción. El usuario que recibe el correo debe poder acceder a esas pantallas Expo web, no a un localhost de tu PC.
6. Probá registro con tu propio email: cuenta pendiente → código → `VerificationCodeModal` → continuar → Login. Código vence en diez minutos, máximo cinco intentos, espera de 45 segundos entre reenvíos y cuota de cinco envíos por hora. Backend controla esos límites, no el contador del modal.
7. Probá invitación de una persona real autorizada. El enlace de un uso vence en 24 horas y permite definir contraseña; reenvío invalida el anterior. También sirve para restablecimiento del personal mediante administración.

`delivery=sent` significa que SMTP aceptó el envío, no que llegó a Inbox. Revisá spam, logs del proveedor y dominios autorizados. Si SMTP falla después de crear una cuenta, se conserva pendiente y se informa el error; no repetir el alta sin consultar primero. La recuperación pública de contraseña de clientes no está implementada; no hay una URL de reset que configurar.

## 14. Railway Storage Bucket: fotografías

1. En el proyecto Railway, crear un Storage Bucket privado y abrir **Credentials**.
2. Copiar **exactamente** bucket name, endpoint, region, access key ID y secret access key a `BUCKET`, `ENDPOINT`, `REGION`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY` del servicio backend. Usar referencias de Railway cuando la UI las ofrezca.
3. Endpoint es el origen HTTPS S3, sin nombre del bucket en el path. Elegir `PET_PHOTO_S3_URL_STYLE=virtual` o `path` según el tipo de credenciales/bucket; no cambiar el estilo por ensayo sin revisar Credentials.
4. El backend construye S3Client, procesa imágenes con Sharp y guarda claves `pets/<OWNER-ID>/<UUID>.webp`. La app envía la foto al backend en `POST /api/client/pets` o `PUT /api/client/pets/:id`, autenticada como CLIENT; **no conecta con credenciales privilegiadas al bucket**.
5. Seleccionar una foto propia al crear una mascota real. Formatos JPEG/PNG/WebP, máximo 5 MB y 25 megapíxeles; se convierte a WebP y se reduce hasta 1200×1200 sin agrandar. Verificar objeto nuevo en bucket y clave estable en `client_pet_details.photo_url`.
6. Reabrir ficha/listado para comprobar lectura: la API autoriza al propietario y firma URL por 900 segundos. `/media/pets/:id` también requiere JWT/CLIENT y devuelve una URL autorizada; no es una carpeta pública.
7. Reemplazar foto: el guardado en DB debe terminar antes de borrar la anterior. Confirmar nuevo objeto y ausencia del previo. Quitar la foto desde edición permite comprobar eliminación; desactivar una mascota no equivale a borrar su archivo.
8. Si falla el borrado después del commit, revisar el mensaje seguro del servidor y objetos huérfanos con el operador de almacenamiento; el código no simula una eliminación exitosa. Si falla DB después de subir, intenta limpiar el objeto sin referencia.

Una foto heredada del volumen anterior requiere volver a subirla; un placeholder gráfico no representa una mascota ficticia. Características/credenciales del servicio: [Railway Storage Buckets](https://docs.railway.com/storage-buckets).

## 15. Deep links y callbacks: antes de configurar proveedores

Arquitectura común:

```text
PetCare → POST /api/auth/oauth/<proveedor>/start
        → navegador del proveedor
        → BACKEND_URL/api/auth/oauth/<proveedor>/callback
        → petcare://oauth?ticket=... (nativo) o ORIGEN_WEB/oauth?ticket=...
        → POST /api/auth/oauth/exchange con ticket + prueba del dispositivo
        → sesión → /api/auth/me → panel del rol de MySQL
```

Scheme real en `mobile/app.json`: **`petcare`**. La URI **`petcare://oauth` es el retorno de la app**, no la callback que se pega en Google/Meta/X. La callback de los proveedores es siempre la ruta HTTPS del backend. Web exige su origen exacto en `OAUTH_RETURN_URLS` y CORS; `localhost` y `127.0.0.1` son orígenes distintos.

Después de completar `BACKEND_URL`, desde backend:

```powershell
npm run oauth:callbacks
```

Este comando imprime las **tres URLs reales calculadas del entorno** y ningún secreto. Copiá cada salida en su proveedor. Si backend local usa `BACKEND_URL=http://localhost:3000`, las rutas calculadas son:

- Google: `http://localhost:3000/api/auth/oauth/google/callback`
- Facebook: `http://localhost:3000/api/auth/oauth/facebook/callback`
- X: `http://localhost:3000/api/auth/oauth/x/callback`

La aceptación de HTTP local depende del proveedor. Para teléfono y pruebas entre dispositivos, usá el backend público HTTPS de Railway: localhost del teléfono no es tu PC. No inventes una callback Android adicional, OAuth proxy o package SHA para esta arquitectura web confidencial.

## 16. Configurar Google Login

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/), seleccioná o creá un proyecto.
2. Abrí Google Auth Platform y completá Branding (nombre, contacto y dominios), Audience y Data Access. Para pruebas con audiencia externa, agregá tus usuarios de prueba antes de habilitar producción.
3. En Clients, creá un cliente **Web application**. El intercambio sucede en Express, incluso cuando el usuario inició desde Android.
4. En **Authorized redirect URIs**, pegá **la línea `google:` que imprime `npm run oauth:callbacks`**. COPIÁ ESA URL EN GOOGLE, sin agregar `/`, cambiar puerto ni usar `petcare://oauth`.
5. Guardá Client ID como `GOOGLE_CLIENT_ID` y Client Secret como `GOOGLE_CLIENT_SECRET`, solo en backend/Railway. No subir el JSON descargado a Git.
6. Reiniciá/redeploy backend. Mobile solo necesita `EXPO_PUBLIC_API_URL` y app propia para el scheme; no usa Client ID Android ni SHA-1 en este flujo.
7. Iniciá desde botón Google. Identidad nueva: completar datos/contraseña PetCare y verificar el email con SMTP. Identidad vinculada: sesión y panel de MySQL. Si el email ya tiene cuenta, ingresar con contraseña y vincular desde Perfil/Mi cuenta; nunca se fusiona por coincidencia de email.
8. Antes de producción, completar los requisitos de publicación/verificación que indique Google. Scopes implementados: `openid email profile`; no se pide acceso offline a servicios Google.

Referencia oficial del flujo/callback web: [Google OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server).

## 17. Configurar Facebook Login / Meta

1. Entrá a [Meta for Developers](https://developers.facebook.com/apps/), creá o seleccioná una app con el caso de uso Facebook Login adecuado a tu cuenta.
2. Habilitá Facebook Login y su configuración web. En Settings → Basic, completá los datos solicitados, dominio y URLs de privacidad/eliminación que correspondan a tu publicación real.
3. Obtené App ID y App Secret: backend utiliza `FACEBOOK_CLIENT_ID` y `FACEBOOK_CLIENT_SECRET`. Seleccioná una versión Graph vigente soportada por tu app y guardala en `FACEBOOK_GRAPH_VERSION`.
4. En **Facebook Login → Settings → Valid OAuth Redirect URIs**, pegá **la línea `facebook:` de `npm run oauth:callbacks`**. COPIÁ ESA URL EN META. Habilitá los ajustes de login web/client OAuth que exija esa configuración; usá HTTPS público para pruebas compartidas.
5. No pegues `petcare://oauth` en Valid OAuth Redirect URIs. Backend vuelve a la app después del intercambio; no hay SDK Facebook nativo ni necesidad de key hashes Android para el flujo implementado.
6. Redeploy backend y probá con una cuenta administradora/desarrolladora/tester admitida por la app en modo desarrollo. Se piden `public_profile` y `email`; email puede no devolverse, por lo que PetCare permite completarlo y exige código SMTP.
7. Para usuarios fuera de los roles de prueba, configurar modo Live y completar revisión/requisitos del portal para los permisos/caso de uso seleccionados. No simular éxito si Meta rechaza acceso.
8. Backend utiliza `appsecret_proof` al consultar Graph. El App Secret nunca viaja al mobile.

Referencia oficial: [flujo manual de Facebook Login](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/). Si el portal cambia etiquetas, buscar el campo de redirect OAuth web; no reemplazarlo por el retorno nativo.

## 18. Configurar X Login / Twitter

1. Entrá a [X Developer Portal](https://developer.x.com/), elegí proyecto/app con acceso permitido al endpoint `/2/users/me` según tu plan vigente.
2. Abrí **User authentication settings**, habilitá **OAuth 2.0** y configurá la app como cliente **Web App/confidential**. Esta implementación requiere Client Secret de OAuth 2.0, no credenciales OAuth 1.0a.
3. En **Callback URI / Redirect URL**, pegá **la línea `x:` que imprime `npm run oauth:callbacks`**. COPIÁ ESA URL EN X. Website URL debe ser el sitio real que solicita el portal; no es la callback.
4. Copiá OAuth 2.0 Client ID y Client Secret a `X_CLIENT_ID`, `X_CLIENT_SECRET`, solo backend.
5. Scopes del código: `users.read tweet.read`. Usa Authorization Code, `state` y PKCE **S256**, y autentica el intercambio con Basic del cliente confidencial. No pide `offline.access`: PetCare renueva su sesión propia, no una sesión de API X.
6. Redeploy y probá botón X. `/users/me` identifica por ID, sin asumir que X proporciona email. El alta pide datos reales y verifica el correo por SMTP; cuenta existente requiere vínculo explícito desde sesión PetCare.
7. Si X devuelve acceso denegado/403, revisar acceso/plan/permisos de la app y sus credenciales, no inventar un perfil ni reemplazar OAuth por OAuth 1.0.

Referencia: [Authorization Code con PKCE de X](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).

## 19. Expo, Android y development build

Desde mobile, con `mobile/.env` preparado:

```powershell
npm start
```

También están implementados `npm run android`, `npm run ios`, `npm run web`. El teléfono físico y la PC deben poder comunicarse; abrir el puerto backend en el firewall solo para la red adecuada. El tunnel de Expo no convierte automáticamente tu backend local en público.

**Expo Go:** sirve para revisar funciones que soporten sus módulos y versión SDK, incluido login tradicional. No instala el scheme propio de PetCare para cerrar este OAuth; probar login social nativo con una app compilada propia. Web puede probar OAuth usando callback web y popups permitidos, preferentemente HTTPS; WebBrowser requiere un contexto seguro para completar el flujo web. Si el navegador bloquea la ventana emergente, permitirla para el origen de PetCare y reintentar.

`mobile/eas.json` tiene perfiles development, preview y production. `expo-dev-client` está instalado. Antes del primer build, elegir identificadores propios estables en `app.json`: `expo.android.package` y, si corresponde, `expo.ios.bundleIdentifier`. No hay identificadores registrados preasignados en este repositorio; EAS puede solicitarlos y vincular el proyecto a tu cuenta.

Para EAS cloud:

```powershell
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile development
```

Instalar el build obtenido en el teléfono/emulador; después:

```powershell
npx expo start --dev-client
```

No hace falta Android Studio para compilar en EAS cloud. Para compilación Android local, configurar Android Studio/SDK/JDK según [development builds de Expo](https://docs.expo.dev/develop/development-builds/introduction/) y ejecutar desde mobile `npx expo run:android`. No editar carpetas nativas generadas manualmente. Cambio de scheme/plugin/módulo nativo requiere rebuild; reiniciar Metro no basta.

## 20. Pruebas de login, OAuth, renovación y roles

1. Verificar health HTTP y DB, tablas e historiales.
2. Crear primer SUPER_ADMIN real y entrar por Login. Comprobar rol y permisos de `/auth/me`.
3. Crear CLIENT con email propio, verificar código y entrar al panel Cliente.
4. Desde Perfil/Mi cuenta, usar **Vincular Google/Facebook/X** con la cuenta externa propia. Cerrar sesión y entrar con ese proveedor: debe volver al mismo usuario y rol, aunque su email del proveedor sea distinto.
5. Probar alta social con otra identidad real autorizada: completar formulario, recibir/verificar código, luego entrar. No cambia el rol elegido por backend: CLIENT.
6. Cancelar autorización: mostrar error/cancelación inline, sin sesión. Cambiar `state`, repetir callback o canjear ticket sin su prueba: rechazo, sin login.
7. Esperar vencimiento del access token o usar un TTL menor válido en un entorno de prueba y volver a consultar. Mobile rota un único refresh aun con solicitudes concurrentes y actualiza datos/permisos reales.
8. Logout con conexión: el refresh y los access de su familia deben dejar de funcionar. Reutilizar un refresh ya consumido en una prueba aislada revoca toda esa familia.
9. Crear personal real por administración/invitación: VETERINARIAN requiere matrícula/perfil; GROOMER y SECRETARY usan rol correspondiente. Configurar servicios, especialidades y disponibilidad reales antes de esperar turnos.
10. Confirmar VETERINARIAN → `/vet`, GROOMER → `/professional`, SECRETARY → `/secretary`, ADMIN/SUPER_ADMIN → `/admin`, CLIENT → `/client`. Acceso manual a ruta/endpoint ajeno debe rechazarse. ADMIN necesita grants reales; no tiene un bypass.

No añadir cuentas o citas ficticias para demostrar paneles vacíos. Un endpoint fallido no equivale a una consulta exitosa sin filas.

## 21. Verificaciones de desarrollo

Ejecutar en cada carpeta:

```powershell
npm run typecheck
npm run lint
npm test
```

Backend: tests aislados verifican callbacks, allowlist, PKCE, firma JWT, state usado, prueba de otro dispositivo, rotación/replay y revocación con dobles de infraestructura exclusivos de tests. Mobile verifica navegación por roles y permisos independientes del email. Esas pruebas no certifican configuración externa.

`npm run test:db` exige **MySQL local dedicado**: `NODE_ENV=test`, DB_HOST loopback y DB_NAME terminado en `_test`. Creá una base descartable vacía antes; el test prepara bootstrap/auth, usa fixtures temporales y los elimina. Nunca apuntarlo a Railway/producción. Si estas condiciones no están presentes, la integración se omite, no se declara aprobada. Los scripts anteriores de tests específicos cuya ruta no existe no deben usarse como evidencia de validación.

## 22. ¿Dónde está cada cosa?

```text
PetCare-SistemaVeterinario/
  CONFIGURACION_COMPLETA.md
  README.md y documentos de implementación históricos
  backend/
    .env.example, package.json, package-lock.json, tsconfig*.json
    bootstrap/                 esquema nuevo para bases vacías
    auth-migrations/           extensión OAuth y renovación
    seeds/                     catálogos estructurales anteriores
    schema-audit.json          referencia del DDL auditado, no respaldo completo
    src/
      config/                  entorno, pool, correo y OAuth
      routes/                  HTTP y middleware por módulo
      controllers/             adaptación request/response
      services/                flujos y validación de operaciones
      repositories/            consultas y transacciones MySQL
      middlewares/             JWT, permisos, límites y errores
      validators/              inputs confiables para backend
      types/                   contratos de dominio/API
      utils/                   errores y reglas compartidas
      database/                comandos explícitos de instalación/admin
      app.ts, server.ts
    tests/                     pruebas aisladas e integración optativa
  mobile/
    .env.example, app.json, eas.json, package.json
    src/
      app/                     rutas Expo Router y layouts por rol
      components/              formularios, modales y vistas compartidas
      contexts/                sesión, tema y feedback
      hooks/                   acceso a contextos y consultas
      services/                API y almacenamiento de sesión
      types/                   contratos de backend
      utils/                   validación/presentación/navegación
      constants/               tema visual
      assets/                  imágenes e iconos permitidos
    tests/                     contratos de navegación
    src-backups/               copias antiguas; no editar como código activo
    layout-review/             artefactos de revisión visual anteriores
  imagenes/                    referencias gráficas del diseño
```

### Archivos clave

| Archivo real | Responsabilidad |
| --- | --- |
| `backend/src/app.ts`, `server.ts` | Express, parsers, CORS y escucha HTTP. |
| `backend/src/config/env.ts`, `database.ts`, `mail.ts`, `oauth.ts` | Configuración validada; secretos exclusivos de backend. |
| `backend/src/routes/auth.routes.ts` | Login, registro, código, me, OAuth, refresh y logout. |
| `backend/src/services/auth.service.ts` | Registro/login tradicional con bcrypt. |
| `backend/src/services/oauth.service.ts`, `oauth-provider.service.ts` | Intentos, callback y datos confirmados por proveedor. |
| `backend/src/repositories/oauth.repository.ts`, `session.repository.ts` | State/ticket/PKCE y rotación/revocación durable. |
| `backend/src/services/token.service.ts`, `session.service.ts` | JWT y sesiones propias de PetCare. |
| `backend/src/middlewares/auth.middleware.ts`, `permission.middleware.ts` | Revalidación de identidad, versión/familia y permisos. |
| `backend/src/repositories/authorization.repository.ts` | Grants/overrides reales y perfiles de `/me`. |
| `backend/src/services/pet-photo.service.ts` | Sharp, S3 y lectura privada firmada. |
| `backend/src/repositories/clinic.repository.ts`, `reservation.repository.ts` | Locks de turnos, alcance clínico y stock de reservas. |
| `backend/src/database/bootstrap.ts`, `auth-migrate.ts`, `create-super-admin.ts` | Preparación explícita sin HTTP público de privilegios. |
| `mobile/src/contexts/AuthContext.tsx` | Restauración, renovación única, login social y verificación compartida. |
| `mobile/src/services/api.ts`, `auth.service.ts`, `oauth.service.ts`, `session-store.ts` | HTTP, validación de sesión, navegador y SecureStore. |
| `mobile/src/app/_layout.tsx`, `utils/role-home.ts` | Guards y destino de cada rol; backend sigue autorizando. |
| `mobile/src/components/forms/OAuthRegistrationModal.tsx` | Completar alta social con inputs inline. |
| `mobile/src/components/ui/VerificationCodeModal.tsx`, `OAuthLinks.tsx` | Código compartido y vínculo explícito desde sesión existente. |
| `mobile/src/app/oauth.tsx` | Completa popup web; no recibe tokens ni otorga permisos. |
| `mobile/app.json`, `eas.json` | Scheme/plugins/estilo y perfiles cloud; JSON sin comentarios. |

Los comentarios educativos viven **dentro de los archivos**; este mapa no los sustituye. Se revisa código activo `backend/src` y `mobile/src`, excluyendo dependencias, dist y copias antiguas.

## 23. Problemas frecuentes

| Problema | Significa / qué revisar / solución |
| --- | --- |
| DB_UNAVAILABLE / conexión fallida | Revisar servicio MySQL, DB_* del backend, puerto público vs privado y permisos. Desde PC no usar railway.internal. Ejecutar db:check; no mostrar cero registros ante este error. |
| DB_VERSION_UNSUPPORTED | Consultar VERSION(); usar MySQL 8.0.16+ rama 8/9; MariaDB no es compatible con este esquema. |
| MIGRATIONS_MISSING / ENOENT | Un comando histórico apunta a SQL ausente. Base vacía: db:bootstrap y db:migrate:auth. Base existente: recuperar historial/extensión real; no simular aplicación. |
| Bootstrap rechazado / running | DB con tablas o instalación parcial. Revisar bootstrap_schema_migrations/completed_steps y DDL. No borrar tablas ni repetir bloques automáticamente. |
| SCHEMA_UPDATE_REQUIRED | Tabla/columna esperada no está instalada. Health DB puede estar bien. Revisar sección 8 y SHOW CREATE TABLE del entorno correcto. |
| Google redirect_uri_mismatch | Comparar la URI registrada con oauth:callbacks: scheme HTTPS, dominio, puerto y path exactos. No usar el deep link de app como callback Google. |
| Facebook callback inválida | Revisar Valid OAuth Redirect URIs, ajustes web OAuth, app/caso de uso, versión Graph y rol tester/Live. App Secret solo backend. |
| X callback/403/PKCE | Revisar cliente OAuth 2.0 confidencial, callback exacta, scopes y acceso del plan a users/me. No usar API keys de OAuth 1.0 ni cambiar S256. |
| OAUTH_UNAVAILABLE | Falta BACKEND_URL, ID/secret o versión Meta válida. Revisar Variables del servicio backend y redeploy. |
| OAUTH_INVALID_STATE | Intento vencido, state distinto, proveedor equivocado o callback ya usado. Reiniciar desde PetCare; no reutilizar la URL anterior. |
| OAUTH_INVALID_PROOF | Ticket vencido/usado o prueba de otro dispositivo. Volver a iniciar OAuth; no compartir ni guardar tickets/pruebas en logs. |
| OAUTH_LINK_REQUIRED / conflicto | Email ya pertenece a una cuenta o identidad externa ya está vinculada. Entrar con contraseña y vincular desde esa sesión; no promover ni fusionar por email. |
| 401 /auth/me | Bearer ausente, JWT vencido/firmado con otra clave, usuario desactivado o familia/versión revocada. Mobile renueva si corresponde; luego pedir login real. |
| 403 permisos | Sesión válida pero sin rol/grant requerido. Revisar /me, role_permissions y overrides desde un administrador autorizado. OAuth nunca decide ADMIN. |
| Panel equivocado | Revisar users.role_id → roles.code y /me; cerrar/restaurar sesión tras cambios. No corregir por comparación de email en frontend. |
| SMTP / EMAIL_UNAVAILABLE | Revisar host, remitente, TLS, app password y EMAIL_CODE_SECRET en backend/config/mail.ts y proveedor. No declarar delivery sent sin aceptación SMTP. |
| PHOTO_STORAGE_UNAVAILABLE | Revisar bucket keys, endpoint HTTPS, region y virtual/path en pet-photo.service.ts y Credentials. Verificar permisos Put/Get/Delete sin publicar claves. |
| Foto dejó de abrir | URL firmada vencida: reconsultar API. Si PHOTO_REFERENCE_UNSUPPORTED, volver a subir foto del almacenamiento antiguo. No persistir la URL temporal. |
| Expo no abre retorno | Expo Go no registra el scheme propio; usar development build, reinstalar tras cambiar scheme y comprobar OAUTH_RETURN_URLS. Web: popup permitido y mismo origen/contexto seguro. |
| Error de red en teléfono | localhost apunta al teléfono; configurar IP LAN o backend público, firewall y puerto. Reiniciar Expo tras cambiar EXPO_PUBLIC_API_URL. |
| Logout sin red / refresh reutilizado | Logout local informa falta de revocación remota. Refresh perdido tras timeout puede haber sido consumido; replay revoca familia y exige nuevo Login. No reintentar indiscriminadamente el mismo secreto. |
| Puerto ocupado / backend no inicia | Revisar PORT y otro proceso en esa dirección; servidor muestra error seguro. Railway debe usar su PORT, no fijar uno incompatible. |

## 24. Checklist en orden

- [ ] Instalar Node/npm/Git y elegir MySQL compatible.
- [ ] Clonar repo; instalar backend y mobile.
- [ ] Copiar `.env.example` sin sobrescribir archivos existentes; verificar `.gitignore`.
- [ ] Crear servicio/base MySQL y configurar DB_*; comprobar db:check.
- [ ] Base nueva vacía: db:bootstrap → db:migrate:auth; base existente: backup/revisión y extensión correspondiente.
- [ ] Revisar tablas e historiales; no ejecutar SQL histórico ausente.
- [ ] Crear primer SUPER_ADMIN real con create:super-admin.
- [ ] Generar JWT_ACCESS_SECRET y EMAIL_CODE_SECRET independientes; configurar TTL/issuer/audience.
- [ ] Configurar SMTP, remitente e invitaciones a pantallas publicadas.
- [ ] Crear Railway Bucket y configurar S3 solo en backend.
- [ ] Levantar backend local o desplegar Railway con raíz/build/start correctos.
- [ ] Obtener dominio; configurar BACKEND_URL sin /api y EXPO_PUBLIC_API_URL con /api.
- [ ] Configurar retornos exactos y CORS web; ejecutar oauth:callbacks.
- [ ] Configurar Google Web, Meta Login Web y X OAuth 2.0 confidencial con sus callbacks calculadas.
- [ ] Redeploy/reiniciar backend y Expo tras cambios de variables.
- [ ] Probar health, health/database y /auth/me con cuenta propia.
- [ ] Configurar identificadores propios/EAS e instalar development build para OAuth nativo.
- [ ] Probar registro/código/login tradicional, Google, Facebook y X.
- [ ] Probar vínculo explícito, renovación, logout y rechazos de replay/state/prueba inválidos.
- [ ] Crear personal real e invitaciones; probar CLIENT, VETERINARIAN, GROOMER, SECRETARY, ADMIN y SUPER_ADMIN con grants reales.
- [ ] Configurar catálogos/horarios/productos reales si se usarán esos módulos; verificar fotos y reservas sin datos de demostración.
- [ ] Ejecutar typecheck/lint/tests; integración MySQL solo en DB local descartable.
- [ ] Registrar qué proveedores/entornos se probaron realmente y guardar secretos en el gestor privado elegido.

## 25. Alcance de la verificación de esta entrega

La configuración externa no se provisiona con editar estos archivos. Railway, SMTP, bucket y cada proveedor necesitan credenciales/cuentas reales y pruebas en el entorno elegido. Las pruebas aisladas verifican código y controles; el test MySQL se omite si no se dispone de una instancia local descartable. El bootstrap nuevo debe verificarse en esa instancia antes de habilitar una instalación productiva; no se ejecutó sobre la DB configurada del usuario. No se insertaron datos de negocio ni se modificó la base existente.

La auditoría global de mock/fake/sample/demo/dummy/placeholderData/testData encontró únicamente referencias documentales, nombres del modal de verificación y el hash bcrypt aleatorio de seguridad para cuentas inexistentes en código activo; los fixtures quedan exclusivamente en tests. No se agregaron registros de muestra a producción.

Resultados registrados en esta revisión:

| Comprobación | Resultado |
| --- | --- |
| TypeScript backend y mobile | Aprobado |
| ESLint backend y mobile | Aprobado, sin errores ni advertencias |
| `npm test` backend | 7 tests aprobados (incluye subtests y contenedor) |
| `npm test` mobile | 1 test aprobado |
| `npm run build` backend | Aprobado |
| `npx expo export --platform web` | Aprobado |
| Integración MySQL local | 1 test omitido: entorno local `_test` no configurado |
| OAuth real / SMTP / bucket / build nativo | Requiere configuración y prueba externa; no certificado por estas verificaciones |
