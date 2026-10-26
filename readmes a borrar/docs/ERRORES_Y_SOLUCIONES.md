# Errores y soluciones de PetCare

Este manual separa los comportamientos confirmados por el código de causas externas que deben diagnosticarse. El backend devuelve mensajes seguros y registra códigos de motor SQL saneados; no exponga credenciales, tokens, consultas ni datos personales al compartir logs.

## Cómo diagnosticar primero

1. Anote método HTTP, ruta, hora, código HTTP y `error.code` de la respuesta.
2. Confirme base URL `/api`, método actual y versión del cliente. Las lecturas internas son POST.
3. En rutas privadas confirme JWT, rol, permiso efectivo y propiedad del recurso.
4. Consulte logs del backend/Vercel y, para DB, `GET /api/health/database` y eventos `DATABASE_OPERATION_REQUEST` o `DATABASE_SCHEMA_REQUEST`.
5. Compare variables configuradas por nombre con `.env.example`; nunca copie valores secretos a un ticket.

## Errores HTTP y de API

### 400 — Solicitud inválida

**Mensaje que aparece:** depende de la validación; el middleware usa `El cuerpo de la solicitud no contiene JSON válido.` con `INVALID_JSON`.

**Qué significa:** JSON mal formado, tipo/campo incorrecto, identificador o valor fuera del contrato.

**Por qué ocurre en PetCare:** los controladores validan DTOs, tipos y enumeraciones; JSON inválido es detectado por Express.

**Cómo identificar:** mire `error.code` y, cuando exista, `error.errors` con errores por campo; revise body y `Content-Type`.

**Solución paso a paso:** enviar JSON válido; verificar comillas/campos obligatorios, tipos, límites y enum en el endpoint; para comprobante usar body binario y MIME correcto, no JSON.

**Archivos:** `backend/src/middlewares/error.middleware.ts`, `backend/src/validators/`, el controlador/servicio de la ruta.

**Comandos útiles:** `npm run typecheck`, `npm test` en `backend/`; `curl -i -X POST ... -H "Content-Type: application/json" -d '{...}'`.

**Comprobación:** la misma solicitud devuelve 2xx y el envelope `success/data`.

**Estado:** confirmado; campos específicos dependen de la ruta.

### 401 — Falta o invalidez de autenticación

**Mensaje:** usualmente `No autorizado.` / `AUTH_REQUIRED`.

**Qué significa:** no hay credencial aceptable o el JWT expiró/no valida firma, issuer o audience.

**Por qué ocurre en PetCare:** access token corto; configuración JWT inválida; ruta privada llamada sin `Bearer`; token de otro entorno.

**Cómo identificar:** inspeccione solo expiración/claims no sensibles localmente; compruebe header `Authorization` y `/api/auth/me`. No publique el JWT.

**Solución:** inicie sesión o use refresh según el flujo; compruebe que API móvil y secret JWT pertenecen al mismo backend; en Vercel compruebe `JWT_ACCESS_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`.

**Archivos:** `backend/src/config/env.ts`, `middlewares/auth.middleware.ts`, `services/token.service.ts`, `mobile/src/services/api.ts`.

**Comandos:** backend `npm run dev`; llamada `POST /api/auth/me` con Bearer.

**Comprobación:** `/auth/me` devuelve el usuario actual y la ruta autorizada responde.

**Estado:** confirmado.

### 403 — Rol o permiso insuficiente

**Mensaje:** `No tenés acceso a esta función.`, `No tenés permiso para esta acción.` o mensaje de módulo/paciente.

**Qué significa:** identidad válida, acceso denegado por rol, permiso efectivo, ownership o alcance de paciente.

**Causas confirmadas:** el backend aplica `requireRole`, `requirePermission`, `requireAnyPermission`, grants personales y validaciones de propiedad. La UI no otorga permiso.

**Identificación:** compare rol/grants vigentes de `/auth/me` con la tabla del endpoint; verifique que paciente/pedido/mascota pertenece al usuario o está asignado.

**Solución:** use la cuenta/rol correcto; admin con permisos apropiados debe otorgar el grant en la gestión de permisos; no cambie el ID para acceder a recursos ajenos.

**Archivos:** `middlewares/permission.middleware.ts`, `utils/personal-access.ts`, `utils/admin-authorization.ts`, repositorio de dominio.

**Comandos:** `npm test` desde backend ejecuta pruebas de límites de autorización.

**Comprobación:** `/auth/me` refleja grant efectivo y la operación permitida funciona.

**Estado:** confirmado.

### 404 — Ruta o recurso no encontrado

**Mensaje:** `Ruta no encontrada.` / `NOT_FOUND`; algunas rutas tienda muestran `ROUTE_NOT_FOUND`.

**Qué significa:** ruta/método no registrado o entidad no encontrada/autorizada.

**Causa confirmada:** la app registra las rutas documentadas bajo `/api`; lecturas GET antiguas ya no están registradas. Detalles propios pueden devolver 404 si no existen o no pertenecen.

**Identificación:** revise método, singular/plural, prefijo, ID y host/base URL; un GET a endpoint migrado no sirve.

**Solución:** use el método de `docs/DOCUMENTACION_API.md`; para lectura de colección emplee `/query` donde figura; confirme que backend desplegado corresponde al frontend.

**Archivos:** `backend/src/routes/index.ts`, rutas por módulo, `backend/src/middlewares/error.middleware.ts`.

**Comandos:** `rg "\.get\(|\.post\(" backend/src/routes`; `curl -i -X POST ...`.

**Comprobación:** la ruta/método vigente devuelve respuesta de negocio.

**Estado:** confirmado.

### 405 — Método no admitido / ruta GET antigua

**Mensaje:** Express puede devolver `404 NOT_FOUND` en vez de 405, según la ruta; no hay un manejador global que normalice 405.

**Qué significa:** el cliente llamó un método distinto del registrado.

**Por qué ocurre:** lecturas internas migradas de GET a POST; compatibilidad GET antigua no está implementada. GET permanece solo para callbacks/protocolo e infraestructura documentados.

**Solución:** cambie el consumidor a POST; envíe filtros por JSON body; no cambie el backend para acomodar documentación antigua.

**Archivos:** `backend/src/routes/*.routes.ts`, `docs/api-read-post-migration.md`, `mobile/src/services/`.

**Comandos:** `rg "\.get\(" backend/src/routes backend/src/app.ts`; `npm test -- --test-name-pattern=http-read-post` (si el runner instalado admite filtro).

**Comprobación:** llamada POST funciona; antiguos GET no aparecen en registros.

**Estado:** comportamiento confirmado; el estado HTTP exacto para un método incorrecto depende de Express/handler.

### 409 — Conflicto de estado

**Mensajes:** `STORE_DEMO_DISABLED`, `RECORD_IN_USE` u otros conflictos de negocio.

**Qué significa:** operación válida sintácticamente pero prohibida por estado/configuración actual.

**Causas confirmadas:** checkout de demostración apagado por defecto; especialidad relacionada no se elimina; transiciones de stock/pedido pueden tener restricciones.

**Solución:** revise estado/configuración y dependencias; para probar checkout configure conscientemente `STORE_DEMO_MODE=true` en entorno no productivo; desactive especialidad relacionada si esa es la operación indicada.

**Archivos:** `backend/src/config/env.ts`, `services/client.service.ts`, `routes/veterinarian.routes.ts`, repositorios de tienda.

**Comprobación:** repita una acción válida para el estado, con idempotencia del checkout.

**Estado:** los ejemplos citados están confirmados; demás conflictos dependen del dominio.

### 429 — Límite de solicitudes

**Mensaje:** puede variar por middleware/plataforma; `Retry-After` depende de configuración.

**Qué significa:** se excedió un límite de intentos, especialmente autenticación, subida, OAuth y pagos.

**Causa confirmada:** `createAuthRateLimiter` protege rutas sensibles. No asumir un conteo universal; varía por ruta.

**Solución:** detener reintentos, esperar la ventana, evitar loops automáticos y corregir credencial/body antes de reintentar.

**Archivos:** `backend/src/middlewares/auth-rate-limit.middleware.ts` y definición de la ruta.

**Comprobación:** esperar la ventana y hacer una sola solicitud válida.

**Estado:** límites confirmados; respuesta exacta/ventana depende de middleware.

### 500 — Error interno

**Mensaje:** `Ocurrió un error inesperado. Intentá nuevamente.` / `INTERNAL_ERROR`.

**Qué significa:** excepción no clasificada por aplicación.

**Identificación:** correlacione hora/ruta con logs de Vercel/backend; no se revela stack/SQL al cliente. Error SQL loguea evento y código de motor sanitizado.

**Solución:** revise logs y variables/configuración; reproduzca con datos de prueba; clasifique si es SQL, storage, SMTP o error de programación; no reintente escrituras a ciegas.

**Archivos:** handler de la ruta, servicio/repository y `middlewares/error.middleware.ts`.

**Comprobación:** repetir la operación con el mismo caso de prueba devuelve 2xx y no duplica escrituras.

**Estado:** respuesta confirmada; causa debe demostrarse en logs.

### 503 — Servicio/configuración no disponible

**Mensajes:** `AUTH_UNAVAILABLE`, `NOTIFICATION_JOB_UNAVAILABLE` u error SQL de servicio.

**Qué significa:** configuración necesaria o dependencia no disponible.

**Causas confirmadas:** JWT secreto corto/missing; cron secret inválido; base de datos caída o esquema desactualizado.

**Solución:** reparar variable/servicio; comprobar DB health; confirmar TLS y conectividad; no imprimir secretos en logs.

**Archivos:** `config/env.ts`, `config/database.ts`, cron route, `utils/database-error.ts`.

**Comprobación:** health DB y ruta dependiente vuelven a responder.

**Estado:** clases confirmadas; causa específica depende del error code/log.

## Errores de configuración e infraestructura

### Layerbase/MariaDB: timeout, TLS o credenciales

**Mensaje visible:** respuesta DB convertida por handler o timeout; `GET /api/health/database` indica fallo.

**Qué significa:** backend no puede abrir conexión. Layerbase es externo al proceso local.

**Diagnóstico:** compare `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`; confirme allowlist/red, usuario y estado del servicio. En producción localhost/IP LAN/Railway y TLS desactivado son rechazados por configuración.

**Solución paso a paso:** obtener valores actuales en panel de Layerbase; usar TLS `required` o `verify_identity`; revisar máximo de conexiones/pool; probar health; escalar al proveedor si el host no responde.

**Archivos:** `backend/src/config/env.ts`, `config/database.ts`, `backend/.env.example`.

**Comandos:** `npm run db:check`, `npm run db:audit:readonly` (backend); `GET /api/health/database`.

**Comprobación:** conexión y consulta de health sin error. No correr migración como diagnóstico.

**Estado:** validaciones de host/TLS y health están confirmadas; una causa externa concreta se determina en el entorno.

### Instalación limpia: no están los SQL base

**Síntoma:** `npm run db:bootstrap` informa que no se completó el esquema inicial o `npm run db:migrate` no encuentra migraciones.

**Qué significa:** los comandos están declarados, pero el código resuelve sus fuentes a `backend/bootstrap/` y `backend/migrations/`. Esos directorios no están en este checkout. Los scripts de extensiones no son por sí solos un esquema base completo.

**Cómo identificar:** comprobar la ausencia de los directorios y leer `src/database/bootstrap.ts` y `src/database/migration-files.ts`; no conectar a producción para descubrirlo ejecutando comandos mutantes.

**Solución paso a paso:** solicitar al mantenedor los archivos SQL canónicos completos; verificar versiones/checksums y orden; crear una base descartable o respaldo; revisar efectos de cada DDL; solo entonces aprobar la aplicación. No improvisar tablas ni copiar una migración histórica aislada.

**Archivos:** `backend/src/database/bootstrap.ts`, `backend/src/database/migration-files.ts`, `backend/src/database/migration-runner.ts`, `backend/package.json`.

**Comprobación:** los directorios restaurados tienen las migraciones esperadas y `npm run db:check` confirma conexión; la instalación se valida en una base de prueba limpia antes de usarla.

**Estado:** falta de los directorios confirmada estáticamente; el contenido canónico debe proporcionarlo el mantenedor.

### SQL o esquema requerido

**Mensaje visible:** errores de DB normalizados; en logs `[DATABASE_SCHEMA_REQUEST]` o `[DATABASE_OPERATION_REQUEST]` más código de motor.

**Qué significa:** consulta falló, posiblemente por tabla/columna requerida, constraint, datos o conexión.

**Cómo identificar:** código de motor y ruta en logs sanitizados; `backend/src/utils/database-error.ts` clasifica `SCHEMA_UPDATE_REQUIRED`; informe de auditoría es solo referencia, no prueba del estado remoto actual.

**Solución:** identificar SQL/entidad, comparar esquema Layerbase con migración relevante, realizar backup y revisión por operador; aplicar únicamente migración autorizada. No ejecutar scripts `db:migrate:*` a ciegas.

**Archivos:** `backend/src/database/`, `backend/src/repositories/`, `backend/INFORME_AUDITORIA_SQL_MIGRACIONES.md`.

**Comprobación:** consulta repetida en entorno controlado y health funcional.

**Estado:** mecanismos y logs confirmados; no se afirma que el esquema remoto tenga un problema presente.

### Variables de entorno

**Síntoma:** el servidor no inicia o ruta devuelve 503.

**Causa confirmada:** validadores de configuración rechazan puerto, DB, TLS, CORS, JWT, SMTP/secretos según servicio. Variables `EXPO_PUBLIC_*` se insertan en el cliente.

**Solución:** copie nombres de `backend/.env.example`; revise nombres y tipos, no pegue secretos en issues; mantenga secretos fuera de mobile; reinicie el proceso/redeploy.

**Archivos:** `backend/.env.example`, `mobile/.env.example`, `backend/src/config/`.

**Comprobación:** backend arranca, health API/DB responde y frontend apunta a API adecuada.

**Estado:** confirmado.

### CORS

**Síntoma:** navegador informa bloqueo CORS; una app nativa puede conectar aunque el navegador no.

**Qué significa:** origen web no está autorizado por backend.

**Causa confirmada:** allowlist de orígenes exactos; en producción solo HTTPS, sin path ni credenciales. El cliente nativo no depende de CORS.

**Solución:** copie el `Origin` del navegador; agréguelo exactamente a `CORS_ALLOWED_ORIGINS`; confirme dominio de preview permitido; reinicie/redeploy.

**Archivos:** `backend/src/config/env.ts`, `backend/src/app.ts`, `backend/.env.example`.

**Comprobación:** preflight OPTIONS y request web pasan; backend recibe la ruta.

**Estado:** confirmado.

### OAuth / callback o redirección fallida

**Síntoma:** proveedor muestra error, vuelta a pantalla incorrecta o no se canjea ticket.

**Qué significa:** proveedor, backend o destino final no completan la cadena de retorno.

**Diagnóstico confirmado:** callback HTTPS generado por `npm run oauth:callbacks`; `BACKEND_URL` debe ser origen; `OAUTH_RETURN_URLS` controla destinos finales; estado/PKCE/ticket tienen vigencia. Configuración en portal del proveedor solo puede confirmarse por su operador.

**Solución:** comparar callback carácter por carácter; comprobar CLIENT_ID/SECRET en backend, tipo de app y publicación; confirmar `petcare://oauth` en build nativo o `/oauth` en web como destino final, no como callback del proveedor; reconstruir app tras cambios nativos.

**Archivos:** `backend/src/config/oauth.ts`, `backend/src/controllers/oauth.controller.ts`, `backend/src/database/oauth-callbacks.ts`, `mobile/src/services/oauth.service.ts`, `mobile/src/app/oauth.tsx`, `mobile/app.json`.

**Comprobación:** probar proveedor en web y development build; completar alta/verificación y vinculación desde cuenta.

**Estado:** arquitectura confirmada; fallos de portal/proveedor son potenciales hasta ver logs.

### Recuperación de contraseña

**Síntoma:** email no llega, enlace inválido o token vencido.

**Causas confirmadas posibles:** `PASSWORD_RESET_URL`, SMTP y expiración/consumo del token son parte del flujo; respuesta no debe revelar existencia de cuenta.

**Solución:** revisar URL frontend, SMTP/remitente/entrega, usar enlace reciente una vez, revisar reloj y solicitar otro si expiró. No compartir enlace/token.

**Archivos:** `backend/src/services/password-reset.service.ts`, `backend/src/controllers/auth.controller.ts`, `mobile/src/app/reset-password.tsx`.

**Comprobación:** solicitar de nuevo en cuenta controlada y confirmar login con contraseña recién elegida.

**Estado:** flujo implementado; problema concreto requiere evidencia SMTP/token.

### SMTP / email de verificación

**Síntoma:** correo ausente o entrega demorada; verificación no llega.

**Diagnóstico:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` y `EMAIL_CODE_SECRET`; revisar eventos del relay y spam.

**Solución:** confirmar TLS y autorización del remitente con proveedor, probar envío en entorno controlado, configurar DNS si proveedor lo exige. No loguear códigos ni credenciales.

**Archivos:** `backend/src/config/mail.ts`, `services/mail.service.ts`, `services/verification.service.ts`.

**Comprobación:** código recibido puede verificarse una vez dentro de ventana vigente.

**Estado:** configuración confirmada; proveedor es externo.

### Vercel: despliegue/cron

**Síntoma:** rutas 404/500, cron sin resultados o notificaciones no se procesan.

**Diagnóstico confirmado:** proyecto backend debe usar Root Directory `backend` para incluir `backend/vercel.json`; cron GET `/api/cron/notifications` diario 03:00 UTC; requiere `CRON_SECRET` de longitud adecuada. Revisa logs de función y variables del entorno desplegado.

**Solución:** corregir Root Directory/build; definir variables en el entorno correcto; comparar dominio y API móvil; volver a desplegar mediante proceso del equipo.

**Archivos:** `backend/vercel.json`, `backend/src/server.ts`, `backend/src/app.ts`, `mobile/vercel.json`.

**Comprobación:** health, health DB y ejecución autorizada del cron. Una llamada manual puede enviar notificaciones reales.

**Estado:** archivos config confirmados; estado de cuenta/producción no comprobado por este manual.

## Errores de aplicación móvil

### Expo Go: módulos nativos, OAuth o push

**Síntoma:** enlace social no retorna con esquema `petcare://`, notificación remota no llega o módulo nativo no disponible.

**Qué significa:** el cliente genérico Expo Go no lleva la configuración nativa específica del proyecto.

**Solución:** usar development build EAS; confirmar plugins de `mobile/app.json`, FCM/credenciales EAS, registrar scheme y reconstruir después de cambios nativos. Para Expo Go limitarse a capacidades compatibles.

**Archivos:** `mobile/app.json`, `mobile/eas.json`, `mobile/src/services/oauth.service.ts`, `push-notifications.native.ts`.

**Comandos:** `npx eas-cli@latest build --platform android --profile development`; `npx expo start --dev-client`.

**Comprobación:** prueba en APK instalado; permitir notificaciones y validar callback.

**Estado:** distinciones confirmadas en configuración/código.

### EAS Build falla o APK usa API incorrecta

**Diagnóstico:** revise perfil elegido, conexión EAS Project ID, entorno EAS y `EXPO_PUBLIC_API_URL`; verifique credenciales nativas para push y logs completos de build.

**Solución:** arregle variable en ambiente `preview`/`production` según perfil, vuelva a construir (la variable queda embebida), no cambie `android.package` sin actualizar integraciones externas.

**Archivos:** `mobile/eas.json`, `mobile/app.json`, `mobile/.env.example`.

**Comprobación:** instalar artefacto y confirmar host de API en tráfico. Build exitoso no acredita OAuth ni push.

**Estado:** configuración confirmada; causa de fallos remotos es potencial.

### Formulario rechazado

**Síntoma:** errores inline o respuesta 400.

**Diagnóstico:** identificar si lo rechaza validación local `mobile/src/utils/*validation.ts` o API; revisar `error.errors` y DTO del backend. Contraseñas de confirmación se comparan en frontend y no se envían.

**Solución:** corregir campo indicado; comprobar tipos, longitud, formatos, selección de catálogo y no enviar rol en registro.

**Archivos:** `mobile/src/utils/auth-validation.ts`, `checkout-validation.ts`, validadores backend.

**Comprobación:** enviar formulario válido y confirmar resultado de backend.

**Estado:** validación dual y estructuras confirmadas.

### Tienda / carrito / checkout

**Síntoma:** carrito inconsistente, checkout bloqueado o pedido no aparece.

**Diagnóstico confirmado:** el checkout de demostración requiere `STORE_DEMO_MODE=true` y no es pago real; checkout por transferencia tiene validación/estado de intento distinto; pedidos pertenecen al propietario del JWT. Conflictos se devuelven en error de negocio.

**Solución:** revisar cantidad, stock, fulfillment, dirección, método de pago, estado del pedido y feature flag; confirmar endpoint actual POST y clave idempotente; evitar doble envío.

**Archivos:** `backend/src/services/client.service.ts`, `validators/store-checkout.validator.ts`, `repositories/store-checkout.repository.ts`, `mobile/src/utils/checkout-validation.ts`.

**Comprobación:** pedido aparece en lista/detalle y no se duplicó.

**Estado:** reglas generales confirmadas; códigos concretos según operación.

### Carga de imágenes/comprobantes

**Síntoma:** `PAYMENT_PROOF_INVALID`, `PAYLOAD_TOO_LARGE` o carga no visible.

**Qué significa:** formato, tamaño, storage o referencia de archivo no válida.

**Límites confirmados:** fotos en rutas configuradas hasta 8 MB JSON; comprobantes binarios hasta 5 MB y PDF/JPEG/PNG/WebP. Storage requiere Cloudinary o configuración S3 compatible.

**Solución:** reducir/re-encode imagen, usar MIME real, configurar storage backend, revisar conectividad y no enviar una URL pública arbitraria para sustituir archivo.

**Archivos:** `backend/src/app.ts`, `services/pet-photo.service.ts`, controlador de cliente, `mobile/src/utils/profile-photo.ts`.

**Comprobación:** subir con cuenta propia y abrir recurso autorizado.

**Estado:** límites/formatos confirmados; fallo del proveedor es potencial hasta comprobar logs.

### Notificaciones push

**Síntoma:** aparece notificación interna pero no push o viceversa.

**Diagnóstico:** el centro consulta API; push requiere Android build específico, permiso, token Expo vigente, configuración Expo/FCM y credencial push server. Cron procesa jobs; web no usa browser push.

**Solución:** development build/APK, habilitar permiso en dispositivo, revocar y registrar token nuevo, comprobar credenciales y cron en Vercel. No invocar cron de producción casualmente: puede enviar mensajes reales.

**Archivos:** `backend/src/services/notifications.service.ts`, `routes/notification-jobs.routes.ts`, `mobile/src/services/push-notifications.*`, `mobile/src/app/client/notifications.tsx`.

**Comprobación:** prueba con cuenta/dispositivo controlado y registro backend de token aceptado.

**Estado:** limitaciones y configuración confirmadas; entrega del proveedor no se garantiza por las pruebas unitarias.
