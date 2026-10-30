# Guía de instalación y configuración de PetCare

> Guía basada en el código, los `package.json`, plantillas de entorno y configuración de despliegue presentes en este checkout. Los dominios indicados son los esperados por los README y builds; el estado real de Vercel, Layerbase, SMTP y proveedores debe comprobarse en sus consolas.

## Índice

1. [Introducción y arquitectura](#1-introducción-y-arquitectura)
2. [Requisitos](#2-requisitos)
3. [Clonación e instalación](#3-clonación-e-instalación)
4. [Configuración del frontend](#4-configuración-del-frontend)
5. [Configuración del backend](#5-configuración-del-backend)
6. [Layerbase, SQL y migraciones](#6-layerbase-sql-y-migraciones)
7. [Autenticación y cuentas](#7-autenticación-y-cuentas)
8. [Notificaciones](#8-notificaciones)
9. [Despliegue en Vercel](#9-despliegue-en-vercel)
10. [APK Android con EAS](#10-apk-android-con-eas)
11. [Verificaciones posteriores](#11-verificaciones-posteriores)
12. [Solución de problemas](#12-solución-de-problemas)

## 1. Introducción y arquitectura

PetCare es un sistema web y móvil para coordinar atención veterinaria, peluquería, pacientes, turnos, historia clínica, tienda y administración de una clínica. El repositorio separa cliente y API:

| Parte | Ubicación | Tecnologías y función |
|---|---|---|
| Cliente web y Android | `mobile/` | Expo SDK 58, React Native 0.88, TypeScript, Expo Router. Se compila a web y Android. |
| API | `backend/` | Node.js, Express 5, TypeScript. Rutas, middleware, validadores, servicios y repositorios. |
| Persistencia | proveedor MySQL/MariaDB (Layerbase en producción según configuración y README) | Acceso mediante `mysql2/promise`; las conexiones de producción requieren TLS. |
| Imágenes | Cloudinary y/o almacenamiento S3 compatible | Backend procesa referencias, valida fotos y, según el flujo, almacena objetos o URLs. |
| Correo/OAuth | SMTP y proveedores Google, Facebook y X, configurables | Integraciones opcionales que requieren credenciales válidas en el entorno. |
| Hosting | Vercel | Dos proyectos separados, uno para `mobile/` y otro para `backend/`. EAS construye Android. |

El backend inicia Express desde `backend/src/app.ts`; `backend/src/server.ts` sirve para ejecución local. El prefijo API se monta en `/api`. El frontend obtiene su URL de API en `mobile/src/services/api.ts` y usa las pantallas y layouts de `mobile/src/app/`.

```text
backend/src/{routes,controllers,middlewares,services,repositories,validators,config,database,utils}
mobile/src/{app,components,contexts,hooks,services,types,utils,assets}
```

## 2. Requisitos

| Herramienta | Requisito observado |
|---|---|
| Node.js | La raíz y README recomiendan Node 22.x. Los `package.json` no declaran `engines`; no se encontró un pin `.nvmrc`. |
| npm | Incluido con Node. Usar `npm ci` porque existen lockfiles (`package-lock.json`) en ambos proyectos. |
| Git | Necesario para clonar y para que Vercel/EAS relacionen builds con commits. |
| Expo | Dependencia `expo` `~58.0.16`; `expo-router` está declarado como `~58.0.24` en el manifiesto de este checkout. |
| React Native | `0.88.0`, React `19.3.0`, TypeScript del cliente `~6.0.3`. |
| Android | Android Studio, Android SDK/Build Tools y un emulador/dispositivo para build local. EAS puede compilar en la nube; el perfil Android produce APK en perfiles internos. |
| Navegador | Navegador moderno con soporte para la versión de React Native Web y Expo export instalada por el lockfile. |
| Base de datos | MySQL/MariaDB compatible, base accesible desde backend y credenciales/TLS. Layerbase remoto requiere configuración autorizada. |
| Proveedores opcionales | SMTP para correos; credenciales OAuth para login social; Cloudinary y/o endpoint S3 compatible para fotos; cuenta Vercel para hosting y cuenta Expo/EAS para builds. |

Los rangos exactos de dependencias se encuentran en `backend/package.json`, `mobile/package.json` y sus lockfiles. Expo Go debe ser compatible con el SDK instalado; para callbacks OAuth con el esquema nativo `petcare://oauth`, use un Development Build, no dé por hecho que Expo Go ofrece esa integración.

## 3. Clonación e instalación

Desde la ubicación donde se guardará el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd PetCare-SistemaVeterinario
```

Instale dependencias de cada aplicación en su carpeta:

```bash
# Desde la raíz del repositorio
cd backend
npm ci
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
npm run dev
```

En una segunda terminal:

```bash
# Desde la raíz del repositorio
cd mobile
npm ci
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
npm start
```

Antes de probar rutas que consultan datos, complete en `backend/.env` una base de datos de desarrollo. No copie secretos de producción ni suba archivos `.env`. El servidor local usa el puerto 3000 por defecto y el frontend con Expo intenta derivar el host LAN de Metro si no se configura una URL explícita.

## 4. Configuración del frontend

### 4.1 Organización

- `mobile/src/app/`: rutas Expo Router por rol, entre ellas cliente, administración, veterinario y peluquería.
- `mobile/src/components/`: pantallas y componentes visuales.
- `mobile/src/services/api.ts`: normaliza la ruta, adjunta JSON/JWT y presenta errores seguros.
- `mobile/src/contexts/`: sesión, checkout, tema y feedback.
- `mobile/app.json`: nombre, scheme `petcare`, paquete Android `com.anonymous.petcare`, iconos y plugins nativos.
- `mobile/eas.json`: perfiles `development`, `preview`, `production`, `production-apk` e `internal-production-api`.

### 4.2 Variables de API

`mobile/.env.example` incluye `EXPO_PUBLIC_APP_ENV=development` y `EXPO_PUBLIC_API_PORT=3000`. También documenta estas variables:

| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base API usada por la app. Debe terminar en `/api`. Para Android Emulator local puede ser `http://10.0.2.2:3000/api`. |
| `EXPO_PUBLIC_DEV_API_URL` | En desarrollo, fuerza una URL HTTPS explícita de backend y tiene prioridad. |
| `EXPO_PUBLIC_API_PORT` | Puerto usado al derivar el backend local desde el host de Metro; predeterminado `3000`. |
| `EXPO_PUBLIC_APP_ENV` | Etiqueta de entorno; producción requiere el origen oficial de API que valida el cliente. |

No coloque secretos en variables `EXPO_PUBLIC_*`: Expo las incorpora al bundle. La URL de API es el origen del backend más prefijo `/api`, no el origen del sitio web. Ejemplos:

```env
# Desarrollo en emulador Android; backend en el host de desarrollo
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

```env
# Producción, configurado en el perfil EAS de este repositorio
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://pet-care-sistema-veterinario.vercel.app/api
```

El cliente añade `/api` si no se configuró en la ruta base, pero es preferible configurarlo correctamente. En producción valida que el host/ruta coincida con el backend permitido y falla cerrado ante configuración incorrecta. No use la URL de frontend como `EXPO_PUBLIC_API_URL`.

### 4.3 Ejecución y compilación

Desde `mobile/`:

```bash
npm start                 # Expo/Metro
npm run web               # cliente web
npm run android           # Android local; requiere SDK configurado
npm run typecheck
npm run lint
npm test
```

Expo Go sirve para iterar pantallas compatibles con el cliente Expo instalado. Para probar retornos sociales al esquema `petcare://oauth`, use development build y arranque con `npx expo start --dev-client`. Si se cambia el scheme o módulos nativos, reconstruya e instale la app.

## 5. Configuración del backend

### 5.1 Estructura y arranque

`backend/src/routes/` registra endpoints; `controllers/` adapta HTTP; `middlewares/` maneja autenticación, permisos, rate limiting y errores; `services/` concentra reglas/integraciones; `repositories/` ejecuta consultas; `validators/` valida entrada; `config/` comprueba configuración; `database/` contiene herramientas explícitas para DB.

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

El servidor local escucha en `PORT` (predeterminado `3000`) y monta la API en `http://localhost:3000/api`. El arranque no aplica migraciones. Para producción, la entrada Express se exporta desde `src/app.ts` y el proyecto Vercel debe usar Root Directory `backend`.

### 5.2 Variables de entorno

La plantilla autoritativa es `backend/.env.example`; los valores de esta tabla son descripciones, no credenciales:

| Grupo | Variables | Requerimiento/validación |
|---|---|---|
| Runtime | `NODE_ENV`, `PORT` | `development`, `test` o `production`; puerto entre 1 y 65535. |
| SQL | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`, `DB_CONNECTION_LIMIT`, `DB_CONNECT_TIMEOUT_MS` | En producción host, usuario y password son obligatorios. No admite host local/Railway en producción. `DB_NAME` usa identificador restringido. TLS debe ser `required` o `verify_identity` para remoto/producción. Límites validados por `config/env.ts`. |
| JWT/sesión | `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `JWT_ISSUER`, `JWT_AUDIENCE`, `BCRYPT_SALT_ROUNDS` | Access secret debe tener al menos 32 bytes; access TTL válido de 1 a 3600 s; bcrypt rounds 10–14. Refresh TTL tiene valor por defecto de 30 días. |
| Verificación | `EMAIL_CODE_SECRET` | Secreto aleatorio distinto de JWT, mínimo 32 bytes; requerido por códigos/correo. |
| URLs/OAuth | `BACKEND_URL`, `PUBLIC_FRONTEND_URL`, `OAUTH_RETURN_URLS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_GRAPH_VERSION`, `X_CLIENT_ID`, `X_CLIENT_SECRET` | OAuth es opcional; callback se construye desde `BACKEND_URL`. `OAUTH_RETURN_URLS` es allowlist exacta de destinos de retorno. Para X se mantiene compatibilidad con `TWITTER_CLIENT_ID` y `TWITTER_CLIENT_SECRET`. |
| Correo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Necesario para verificación, invitaciones, recuperación y entregas de notificaciones. Usuario/clave SMTP deben darse juntos; TLS se valida. |
| CORS | `CORS_ALLOWED_ORIGINS` | Lista separada por coma de orígenes HTTPS exactos en producción, sin rutas. La web oficial y ciertos previews de Vercel se permiten en código. |
| Cron | `CRON_SECRET` | Mínimo 32 bytes para ejecutar trabajos protegidos. |
| Fotos | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `REGION`, `BUCKET`, `ENDPOINT`, `PET_PHOTO_S3_URL_STYLE` | Configure el proveedor que corresponda al flujo de almacenamiento. S3 debe usar endpoint HTTPS válido; estilo `virtual` o `path`. Cloudinary se usa para imágenes web públicas en varios flujos. |
| Tienda/diagnóstico | `STORE_DEMO_MODE`, `REGISTER_DIAGNOSTICS` | `STORE_DEMO_MODE=false` por defecto; si se activa, habilita sólo el flujo de tarjeta de demostración, no un cobro real. `REGISTER_DIAGNOSTICS` optativo. |

El runtime también reconoce variables de plataforma como `VERCEL`, `VERCEL_ENV`, `VERCEL_REGION`, `AWS_LAMBDA_FUNCTION_NAME` y `LAMBDA_TASK_ROOT`; no son secretos que deba inventar ni configurar manualmente. El preflight de migraciones acepta opcionalmente `PETCARE_EXPECTED_DB_HOST` y `PETCARE_EXPECTED_DB_NAME` para verificar el destino esperado.

`PUBLIC_FRONTEND_URL` genera enlaces web de invitación, verificación/recuperación según los flujos; `BACKEND_URL` es origen para callbacks OAuth. No son intercambiables. Ninguna plantilla contiene valores secretos reales.

### 5.3 CORS, autenticación y validación

Express limita JSON general a `100kb`; algunas rutas de subida procesan JSON `8mb` después de autenticación, permiso/rate limiter; comprobantes binarios se limitan a `5mb`. Estos límites de Express no sustituyen los límites del hosting. CORS protege el acceso de navegadores web: el cliente nativo no depende de CORS. Se aplica Helmet, proxy trust acotado y `Cache-Control: no-store` a datos privados.

Las rutas privadas exigen `Authorization: Bearer <access-token>`. Middleware comprueba JWT y, según recurso, rol, permiso efectivo, propiedad del registro y/o rate limit. La app nunca es fuente autoritativa de permisos. Login/registro y validadores restringen campos; contraseñas se almacenan con bcrypt. Respuestas de error no deben revelar SQL, tokens o stack traces.

### 5.4 Correo y OAuth

SMTP debe aceptar TLS según `SMTP_SECURE`/`SMTP_REQUIRE_TLS`. `MAIL_FROM` debe ser un email válido. Los proveedores sociales disponibles son Google, Facebook y X; cada uno necesita credenciales y callbacks HTTPS configurados en el proveedor. Facebook exige `FACEBOOK_GRAPH_VERSION` con formato `vN.N`. La API sólo permite `returnUrl` incluido literalmente en `OAUTH_RETURN_URLS`.

## 6. Layerbase, SQL y migraciones

El backend utiliza pool `mysql2/promise`, charset `utf8mb4`, zona horaria UTC y límite de conexiones reducido para runtime serverless. Use las credenciales, hostname y configuración TLS proporcionados por Layerbase; no incluya credenciales en `mobile/`.

Comandos definidos en `backend/package.json`:

| Comando | Efecto |
|---|---|
| `npm run db:check` | Comprueba conectividad. |
| `npm run db:audit:readonly` | Auditoría de solo lectura del esquema y referencias. |
| `npm run db:migrate` | Ejecuta el runner de migraciones y puede cambiar esquema. |
| `npm run db:bootstrap` | Prepara esquema inicial sólo si la DB está vacía; rechaza una DB no vacía. |
| `npm run db:seed` | Prepara catálogos; puede escribir registros. |
| `npm run db:migrate:*` | Scripts de migración explícitos; el nombre y efecto están en `package.json` y cada `src/database/*-migrate.ts`. |

La herramienta de migraciones busca SQL versionado en `backend/migrations/`; `bootstrap` busca `backend/bootstrap/`. Esas carpetas no están presentes en este checkout. El repositorio, por tanto, **no contiene en esta versión un conjunto completo de SQL versionados listo para instalar desde cero**. No suponga que `npm run db:migrate` aplicará algo: el código falla si no encuentra archivos SQL. El startup de Express no corre migraciones de forma automática. Hay también scripts TypeScript específicos cuyo comportamiento es independiente de las carpetas anteriores.

Cuando el operador haya provisto y revisado los SQL correctos para este entorno, el runner explícito es `npm run db:migrate`; compara versiones/checksums guardados, rechaza historial divergente o parcial y aplica cada archivo bajo su mecanismo de bloqueo. La validación de conectividad es `npm run db:check`; no demuestra que el esquema esté al día. `npm run db:audit:readonly` y `src/database/migration-preflight-readonly.ts` hacen inspecciones de solo lectura, pero tampoco reemplazan una revisión de historial y esquema. En este checkout no se puede dar un comando de migración inicial reproducible porque faltan sus SQL.

Antes de un cambio de datos: identificar con el operador el entorno, confirmar backup restaurable, revisar SQL y preflight, validar esquema y conteos, acordar ventana de ejecución y plan de reversión. Los comandos de migración, bootstrap, seed y administración pueden modificar datos; este documento no los ejecuta. Consulte `backend/README.md` para decisiones operativas/manuales del checkout, sin asumir que el estado remoto está verificado desde el repositorio.

## 7. Autenticación y cuentas

- Registro público crea cuenta cliente y requiere verificación de correo; el cliente no envía un rol privilegiado.
- Login emite access token y sesión refresh persistida; hay rutas de refresh y logout.
- `/api/auth/me` recupera la identidad autenticada. La app usa SecureStore en Android y `sessionStorage` en web.
- Invitaciones administrativas/profesionales se envían por email y se aceptan en endpoint público con token; el usuario establece su contraseña inicial con flujo separado.
- Verificación de email y recuperación de contraseña usan códigos/tokens con caducidad y rate limits.
- Los roles operativos incluyen `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN` y `SUPER_ADMIN`. La base inspeccionada también conserva `SECRETARY` como rol reservado heredado; no se ofrece para asignación o eliminación desde el panel. Las capacidades concretas dependen de permisos efectivos almacenados y leídos por backend.
- OAuth es opcional; no declarar funcional un proveedor sin credenciales, callbacks y URL de retorno correctamente autorizados.
- Revocar sesión/cambiar credenciales invalida sesiones mediante controles de versión/rotación. No reutilice tokens filtrados.

Los enlaces públicos generados por el backend deben usar `PUBLIC_FRONTEND_URL`. Para callbacks sociales el servidor necesita `BACKEND_URL`, que apunta al backend; el frontend usa su propio origen y `/api` sólo para llamadas API.

## 8. Notificaciones

Hay un centro de notificaciones persistido en SQL, endpoints de consulta/lectura/ocultación y correos de ciertos eventos. No se encontró implementación de Expo Push ni Web Push en estos flujos. La ruta `GET /api/cron/notifications` existe y exige `Authorization: Bearer <CRON_SECRET>`; sin embargo, `backend/vercel.json` está vacío en este checkout, por lo que no hay una programación de Vercel declarada aquí. El endpoint no se ejecutará periódicamente por el mero hecho de existir: hay que configurar y confirmar el cron desde Vercel/proyecto. Los jobs crean recordatorios de turnos y procesan una tanda de correos. SMTP debe funcionar para la entrega.

El frontend sincroniza notificaciones mientras la aplicación está activa. Las respuestas del trabajo informan `remindersCreated` y `emailsSent`; el estado por correo se persiste/reintenta mediante la cola SQL. No presente las notificaciones internas como mensajes push del sistema operativo.

## 9. Despliegue en Vercel

Los destinos previstos por README/configuración son:

| Proyecto | Dominio esperado | Root Directory | Configuración observada |
|---|---|---|---|
| Frontend | `https://petcare-sistemaveterinario-mobile.vercel.app` | `mobile` | `mobile/vercel.json`: `npx expo export -p web`, salida `dist`, rewrite SPA. Inyecta URL de API de producción. |
| Backend | `https://pet-care-sistema-veterinario.vercel.app` | `backend` | `backend/vercel.json` está vacío; el backend exporta Express desde `src/app.ts`. Variables y runtime se configuran en Vercel. |

Los dominios son los esperados por este checkout, no prueba de que los proyectos, alias, deployments o variables actuales coincidan. Verifíquelos en Vercel antes de publicar.

### Procedimiento de publicación

1. Vincule el repositorio a los dos proyectos Vercel y establezca Root Directory `mobile` para frontend y `backend` para API.
2. Configure variables en el entorno correcto (`Production`, `Preview`, `Development`). El backend necesita SQL/TLS, JWT, correo si se usa, URLs, CORS y secretos de integraciones. El frontend necesita `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_APP_ENV` correspondientes. Los secretos sólo van al proyecto backend.
3. Revise Build Logs y el commit SHA mostrado en el deployment, luego inicie un deployment a partir del commit deseado.
4. Configure el cron de notificaciones en Vercel si se requiere; el `backend/vercel.json` actual no declara un schedule. Confirme también compatibilidad del plan desde Vercel.
5. Espere estado **Ready** y confirme alias/dominio, no sólo que el proceso de build haya terminado.
6. Verifique `GET https://<dominio-api>/api/health`, `/api/health/database`, web, login y una llamada API real con credenciales de prueba.
7. En caso de error, abra Runtime Logs/Function Logs y compare timestamp, request ID, ruta y deployment ID. Redacte tokens/cuerpos antes de compartir logs.

Un **Redeploy** vuelve a construir un deployment existente desde su commit y configuración; no publica por sí mismo un commit posterior. Para incluir código nuevo, despliegue el commit nuevo o seleccione explícitamente el commit correcto. Un bundle web o APK es estático: cambiar la API no sustituye automáticamente un frontend ya compilado. Compruebe URL de API embebida, commit y deployment para evitar probar un artefacto anterior. Un 404 también puede ser prefijo `/api` ausente, ruta inexistente o deployment desactualizado.

## 10. APK Android con EAS

Desde `mobile/` y con EAS CLI autenticado:

```bash
npx eas-cli login
npx eas-cli build -p android --profile internal-production-api
```

`mobile/eas.json` declara CLI `>=16.0.0`, distribución `internal`, `android.buildType=apk`, environment `production`, auto incremento y URL API de producción. El perfil está diseñado para APK instalable interno. EAS puede pedir crear/configurar credenciales de firma Android; resguarde el keystore y no lo suba al repositorio. Después de finalizar, descargue el APK desde el build de EAS e instálelo en un dispositivo autorizado. `app.json` define el paquete `com.anonymous.petcare` y scheme `petcare`.

Este checkout no contiene `google-services.json` listado en la configuración ni el perfil usa un archivo de cuenta de servicio. No los confunda: `google-services.json` es configuración del cliente Firebase/Google Services para la app Android; una clave JSON de service account es una credencial privada de servidor. No agregue ninguna si el flujo/configuración actual no la requiere. Login Google implementado en código es OAuth servidor (cliente web/callback backend), no el SDK nativo Google Sign-In.

Problemas frecuentes: credenciales de firma faltantes, perfil/EAS environment incorrecto, dependencias nativas no reconstruidas, versión SDK/NDK incompatible o `EXPO_PUBLIC_API_URL` equivocada. Consulte logs del build y vuelva a generar el APK tras cambiar configuración nativa o variables compiladas.

## 11. Verificaciones posteriores

- [ ] `npm run dev` inicia API sin errores de configuración.
- [ ] `GET /api/health` responde correctamente.
- [ ] `GET /api/health/database` confirma acceso a la DB esperada.
- [ ] Frontend carga y la API apunta al entorno correcto con `/api`.
- [ ] Login y registro funcionan; email de prueba llega si SMTP está activado.
- [ ] Invitación nueva puede aceptarse y completar contraseña inicial.
- [ ] Roles, permisos y acceso a rutas se verifican con cuentas de prueba de cada rol.
- [ ] Mascotas, turnos, pacientes e historia clínica respetan ownership y permisos.
- [ ] Tienda consulta catálogo y carrito; no se interpreta el modo demo como pago real.
- [ ] Notificaciones internas aparecen; cron y correo se verifican por separado.
- [ ] Build web termina y deployment Vercel queda Ready.
- [ ] Perfil EAS Android genera APK y el backend configurado es el esperado.

## 12. Solución de problemas

| Error | Causa probable | Diagnóstico | Solución |
|---|---|---|---|
| 404 o `ROUTE_NOT_FOUND` | Falta `/api`, método HTTP incorrecto o ruta migrada | Revise `backend/src/routes/`, request URL y logs del deployment | Use URL base terminada en `/api` y método del inventario API; muchas lecturas privadas son POST con JSON. |
| Invitación abre dominio anterior | `PUBLIC_FRONTEND_URL` vieja en backend/Production | Inspeccione URL del enlace sin compartir su token y variables de Vercel | Configure origen frontend correcto y despliegue/reinicie configuración backend; reenvíe una invitación. |
| Frontend contacta API incorrecta | `EXPO_PUBLIC_API_URL` de entorno/build no coincide | Revise configuración del deployment o perfil EAS; valide el bundle publicado | Configure origen API HTTPS con `/api` y vuelva a publicar el frontend o crear APK. |
| Se ejecuta bundle antiguo | Se probó un deployment anterior o Redeploy del commit equivocado | Compare commit SHA, deployment ID y URL del artefacto | Cree deployment del commit deseado y confirme alias **Ready**. |
| `DB_UNAVAILABLE` / health DB falla | DNS, host, puerto, TLS, credencial, límites de conexión o DB fuera de servicio | `npm run db:check`, `/api/health/database`, logs sanitizados | Compare DB_* con Layerbase; use TLS y revise allowlist/límite pool sin imprimir credenciales. |
| 401 | Token ausente, vencido o inválido | Confirme `Authorization: Bearer`, sesión y flujo refresh/login | Inicie sesión de nuevo; confirme issuer/audience/secret consistentes sin revelar JWT. |
| 403 | Rol, permiso efectivo o ownership insuficiente | Compruebe cuenta/grants y recurso solicitado | Asigne sólo el permiso autorizado; no intente resolverlo cambiando el rol enviado por el cliente. |
| Error SMTP / código no llega | SMTP, TLS, `MAIL_FROM` o `EMAIL_CODE_SECRET` incorrectos | Pruebe entrega y consulte logs sanitizados | Configure par SMTP, TLS, remitente válido y secreto; compruebe reputación/consentimiento del proveedor. |
| OAuth no vuelve a app | Callback proveedor/`BACKEND_URL`/`OAUTH_RETURN_URLS` no coincide o se usa Expo Go | Compare callback HTTPS del proveedor y destino exacto allowlisted | Use Development Build con `petcare://oauth`, reconstruya si cambió scheme y ajuste allowlists autorizadas. |
| Metro muestra JS anterior | Caché de bundler | Detenga Metro y vuelva a iniciar | `npx expo start -c`; sólo limpia caché local de Metro. |
| EAS Build falla | Credenciales, entorno, native modules o versión incompatible | Abra detalle de build y localice primera falla | Corrija el requisito señalado, verifique perfil y vuelva a ejecutar el build. |
| Cron no se ejecuta | `CRON_SECRET` ausente, cron no provisionado o restricciones del plan | Revise `backend/vercel.json`, configuración del proyecto y logs de `/api/cron/notifications` | Configure secret; confirme en Vercel que los cron jobs están habilitados para el plan. No llame manualmente sin autorización. |
| CORS en navegador | Origen frontend no está autorizado exactamente | Inspeccione origen del navegador y `CORS_ALLOWED_ORIGINS` | Agregue el origen HTTPS exacto permitido al backend y redeploy. CORS no aplica del mismo modo a Android nativo. |
| `AUTH_UNAVAILABLE` | JWT secret/TTL/issuer/audience inválidos | Revise validación `getJwtConfiguration` sin mostrar valores | Use secreto aleatorio de 32+ bytes y valores coherentes; reinicie/redeploy backend. |
| Error de migración o tabla faltante | Esquema no preparado o SQL de migraciones ausente/desalineado | `db:check`, preflight de sólo lectura y revisión de carpetas SQL | Detenga cambios; consulte procedimiento de datos y aplique únicamente migración revisada y aprobada. No repetir SQL parcial. |

