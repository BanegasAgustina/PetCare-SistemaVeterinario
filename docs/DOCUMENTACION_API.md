# Documentación de la API de PetCare

> Referencia generada contrastando las rutas registradas en `backend/src/routes/`, los montajes de `backend/src/routes/index.ts` y `backend/src/app.ts`, validadores, middleware y servicios. En esta versión, las rutas privadas de lectura usan con frecuencia `POST` para recibir filtros. No se agregan endpoints REST convencionales que no estén registrados.

## Índice

1. [Introducción y convenciones](#1-introducción-y-convenciones)
2. [Autenticación](#2-autenticación)
3. [Usuarios, roles y permisos](#3-usuarios-roles-y-permisos)
4. [Módulos funcionales](#4-módulos-funcionales)
5. [Contratos y validaciones](#5-contratos-y-validaciones)
6. [Respuestas y errores](#6-respuestas-y-errores)
7. [Seguridad](#7-seguridad)
8. [Integraciones](#8-integraciones)
9. [Ejemplos prácticos](#9-ejemplos-prácticos)
10. [Inventario completo de rutas registradas](#10-inventario-completo-de-rutas-registradas)

## 1. Introducción y convenciones

API JSON servida con Express 5 y TypeScript. En producción la URL base prevista es `https://pet-care-sistema-veterinario.vercel.app/api`; local, `http://localhost:3000/api`. El prefijo `/api` se monta en `backend/src/app.ts`. La ruta de foto privada `/media/pets/:id` es una excepción y no lleva `/api`.

Solicitudes JSON deben enviar `Content-Type: application/json`. Las rutas protegidas aceptan `Authorization: Bearer <accessToken>`. Las lecturas autenticadas acostumbran aceptar `{}` o filtros en el body, en lugar de query string. Las operaciones binarias de comprobantes reciben bytes y un `Content-Type` permitido (PDF/JPEG/PNG/WebP).

Respuesta común:

```json
{"success":true,"data":{}}
```

Error común:

```json
{"success":false,"error":{"code":"VALIDATION_ERROR","message":"Revisá los datos ingresados."}}
```

El error también puede incluir `errors: [{field,message}]` o `verification` para desafíos de verificación. No todas las rutas tienen exactamente el mismo payload exitoso; por ejemplo, algunas devuelven `{user,session}`, otras `{user,verification}` y el endpoint cron informa contadores.

## 2. Autenticación

| Método y ruta | Autenticación/permisos | Función y entrada principal |
|---|---|---|
| `POST /api/auth/register` | Pública, limitada por rate limiter | `firstName`, `lastName`, `email`, `phone`, `password`. Registra cliente y dispara verificación. |
| `POST /api/auth/login` | Pública, limitada | `email`, `password`; devuelve access token, refresh token, vencimiento y usuario. |
| `POST /api/auth/me` | Bearer | Body `{}`; identidad, permisos actuales y perfil. |
| `POST /api/auth/refresh` | Pública al portador de refresh token; limitada | `refreshToken`; rota/renueva sesión según estado almacenado. |
| `POST /api/auth/logout` | Pública al portador del refresh token; limitada | `refreshToken`; revoca la familia de sesión. |
| `POST /api/auth/verify-email` | Pública, limitada | Desafío/código de verificación; puede responder con sesión. Véase `verification.validator.ts` y servicio. |
| `POST /api/auth/resend-verification` | Pública, limitada | Solicita reenviar verificación; la respuesta no revela credenciales. |
| `POST /api/auth/password-reset/request` | Pública, máximo configurado de 5/minuto por limiter | `email`; la respuesta es `{accepted:true}`. |
| `POST /api/auth/password-reset/confirm` | Pública, máximo configurado de 10/minuto | `token`, `password`; completa recuperación y revoca sesiones previas. |
| `POST /api/auth/change-initial-password` | Pública, limitada | `email`, `currentPassword`, `newPassword`; usada en activación inicial. |
| `GET /api/auth/oauth/providers` | Pública, límite 30 | Disponibilidad/configuración pública de `google`, `facebook`, `x`. No devuelve secretos. |
| `POST /api/auth/oauth/:provider/start` | Pública, limitada | Inicia autorización con destino de retorno exacto autorizado. |
| `GET /api/auth/oauth/:provider/callback` | Proveedor redirige al backend | Callback del proveedor; produce el flujo de retorno web/nativo configurado. |
| `POST /api/auth/oauth/exchange` | Pública al portador de ticket de un solo uso | Cambia ticket OAuth por sesión de API. |
| `POST /api/auth/oauth/register` | Pública, limitada | Completa registro de identidad OAuth; esquema detallado se valida en el controlador/servicio. |
| `POST /api/auth/oauth/:provider/link` | Bearer, limitada | Vincula proveedor a una cuenta autenticada. |
| `POST /api/auth/invitations/accept` | Pública, token de invitación, limitada | `token` hex de 64 caracteres y `password` fuerte. Alias de veterinarios. |
| `POST /api/auth/veterinarian-invitations/accept` | Pública, token de invitación, limitada | Mismo handler de aceptación; alias legado montado en `routes/index.ts`. |

OAuth admite únicamente proveedores incluidos en `providers` (`google`, `facebook`, `x`). Requiere credenciales del proveedor, `BACKEND_URL`, `OAUTH_RETURN_URLS` y, en Facebook, `FACEBOOK_GRAPH_VERSION`. Los detalles mutables de OAuth deben revisarse en la consola de cada proveedor.

### Respuestas y errores particulares de autenticación

Todas estas respuestas exitosas están dentro de `{success:true,data:...}`. Los códigos de validación y auth se describen en [Respuestas y errores](#6-respuestas-y-errores); la tabla registra los resultados particulares y no es una lista exhaustiva de errores de infraestructura.

| Ruta | Respuesta exitosa observada | Errores/condiciones particulares |
|---|---|---|
| `POST /api/auth/register` | 201; `data.user` y `data.verification` | `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `AUTH_UNAVAILABLE`, `EMAIL_UNAVAILABLE` |
| `POST /api/auth/login` | 200; sesión con `accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `user` | `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `AUTH_UNAVAILABLE` |
| `POST /api/auth/me` | 200; `data.user` | `AUTH_REQUIRED`, `INVALID_TOKEN`, `EMAIL_NOT_VERIFIED`, `PASSWORD_CHANGE_REQUIRED` |
| `POST /api/auth/refresh` | 200; sesión renovada | Refresh ausente, inválido, vencido o revocado; `VALIDATION_ERROR` |
| `POST /api/auth/logout` | 200; `{revoked:true}` | `VALIDATION_ERROR`; token refresh inválido |
| `POST /api/auth/password-reset/request` | 200; `{accepted:true}` | `VALIDATION_ERROR`, `EMAIL_UNAVAILABLE`, rate limit |
| `POST /api/auth/password-reset/confirm` | 200; `{reset:true}` | Token inválido/vencido/usado, clave débil, `VALIDATION_ERROR` |
| `POST /api/auth/change-initial-password` | 200; `{changed:true}` | Credencial actual/estado inicial inválido, `VALIDATION_ERROR` |
| `POST /api/auth/verify-email` | 200; `{verified:true}` y sesión opcional | Código/token inválido o vencido, ya verificado, límite de intentos |
| `POST /api/auth/resend-verification` | 200; `{verification:{verificationToken,maskedEmail,retryAfterSeconds,expiresAt,delivery}}` | `VERIFICATION_COOLDOWN`, `VERIFICATION_SEND_LIMIT`, sesión de verificación vencida |
| `GET /api/auth/oauth/providers` | 200; `data.providers` con booleanos por proveedor | `VALIDATION_ERROR` si `returnUrl` falta/no es string o supera 2048 bytes |
| `POST /api/auth/oauth/:provider/start` | 200; `{configured:true,url}` o disponibilidad `{configured:false,reason}` | Proveedor/destino/prueba PKCE inválidos; configuración opcional ausente |
| `GET /api/auth/oauth/:provider/callback` | Redirección 303 al retorno allowlisted con `ticket` o error público | Proveedor, state, code o intercambio externo inválido |
| `POST /api/auth/oauth/exchange` | 200; sesión, `registrationRequired` o `{linked:true}` según el ticket | Ticket/proof incorrectos, cuenta conflicto, email sin verificar |
| `POST /api/auth/oauth/register` | 201; `data.verification` | Registro no válido, identidad/email existente, correo no disponible |
| `POST /api/auth/oauth/:provider/link` | 200; resultado `configured`/URL de autorización | Sesión revocada, provider/destino inválido, proveedor no configurado |
| `POST /api/auth/invitations/accept` y alias | 200; `{accepted:true}` | `INVALID_INVITATION`, `VALIDATION_ERROR`, DB no disponible |

Los cuerpos conocidos se muestran en los ejemplos cURL de la sección 9. En OAuth el cliente calcula `challenge`, `proof`, `ticket`, `state` y `returnUrl` dentro del flujo PKCE; no reutilice valores de ejemplo ni construya manualmente un ticket. Los detalles completos están en [`oauth.controller.ts`](../backend/src/controllers/oauth.controller.ts), [`oauth.service.ts`](../backend/src/services/oauth.service.ts) y los validadores enlazados desde las rutas.

## 3. Usuarios, roles y permisos

Roles que reconoce el frontend/backend: `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN`, `SUPER_ADMIN`. La autorización toma permisos efectivos cargados desde la DB en cada autenticación; `requirePermission` exige todos los códigos indicados y `requireAnyPermission` al menos uno. Las rutas de administración también aplican roles.

El alta administrativa mediante `POST /api/admin/users` genera invitación y envío de correo, no una contraseña conocida por el operador. Alta veterinaria pasa por `POST /api/admin/veterinarians`. Invitaciones caducan en 24 h, se consumen una vez y almacenan hash SHA-256 del token. Activar/eliminar usuario es baja lógica según el repositorio; no equivale a borrar historial. Roles personalizados pueden borrarse sólo bajo las restricciones de asociación; roles de sistema no se eliminan.

Las operaciones sensibles del administrador y cambios de estado/permisos aplican controles de rol/grants en los repositorios además de la ruta. Auditoría de operaciones administrativas depende del esquema compatible presente en la base; el estado de Layerbase no se puede verificar sólo leyendo el repo. El cliente nunca debe usarse para elevar permisos.

## 4. Módulos funcionales

### Mascotas y multimedia

Las rutas `/api/client/*` requieren identidad y el guard de acceso personal; el propietario se deriva del JWT, no de un `ownerId` enviado por app. Mascotas tienen catálogo, consulta, detalle, alta, edición y ciclo activo/inactivo. La foto privada se obtiene por `GET /media/pets/:id`, que verifica autenticación, acceso personal y pertenencia antes de resolver la referencia de almacenamiento. Los cuerpos de foto se procesan después de autenticación, permiso y limitador.

### Turnos, clínica y profesional

Cliente consulta catálogo/slots/turnos y puede solicitar/cancelar turnos. Clínica administra citas y agenda conforme al rol y grants. Veterinarios tienen rutas administrativas de alta, detalle, actualización, estado y foto. La historia clínica se consulta y pagina por `kind`; registro clínico lo crea veterinario. Groomer tiene rutas para su registro de atención, restringidas a `GROOMER` y permisos `appointments.view_own`/`appointments.update_own`.

### Tienda, pedidos y pagos

Catálogo, categorías, banners y promociones tienen lectura cliente. Carrito y pedidos son personales. Checkout de tarjeta sólo es demostración cuando `STORE_DEMO_MODE=true`; no procesa cobro. Transferencias son un flujo distinto con datos de comprador, comprobantes y revisión privilegiada. La consulta de comprobantes puede recibir PDF o imagen binaria hasta el límite de 5 MB de Express. Administración de órdenes está bajo `/api/clinic/store-orders`.

### Banners

Lectura pública autenticada de tienda: `POST /api/client/store/banners`. Gestión administrativa: consulta `POST /api/clinic/store-banners/query`, orden `PUT /api/clinic/store-banners/order`, alta `POST /api/clinic/store-banners`, edición/estado `PATCH /api/clinic/store-banners/:id`, baja `DELETE /api/clinic/store-banners/:id`. La ruta GET `/api/clinic/store-banners` **no está registrada** en el código inspeccionado. Las imágenes se reciben según el validador/servicio del banner; el listado no se debe asumir como ruta GET.

### Notificaciones

Las cuatro operaciones están montadas bajo `/api/notifications` para roles autorizados al centro, y como alias bajo `/api/client/notifications` sujetos además al guard personal. No son notificaciones push del sistema. El cron está en `/api/cron/notifications`, fuera de la tabla de router `/api`, con Bearer `CRON_SECRET`.

### Configuración general y catálogos

`GET /api/settings/general-information` es lectura pública con caché de 300 s. Administración de información general requiere permiso `settings.general.manage`. Catálogos genéricos administrativos aceptan parámetro `:kind`; la lista de entidades y grants es validada por el repositorio, por tanto no cualquier valor de `:kind` crea una entidad arbitraria.

## 5. Contratos y validaciones

### Identificadores, texto y fechas

- IDs de SQL se serializan como texto decimal positivo (BIGINT no se convierte a `Number` con riesgo de pérdida). Validadores suelen aceptar de 1 a 20 dígitos, dentro del rango de `BIGINT UNSIGNED`.
- Cuerpos suelen ser objetos JSON y listas blancas: campos adicionales producen `400 VALIDATION_ERROR`.
- Nombres de usuario permiten letras Unicode, espacios, apóstrofes y guiones, hasta 100 caracteres; email se recorta, normaliza NFC/minúsculas y requiere dominio válido.
- Teléfono es opcional en algunos flujos; cuando se ingresa se conserva prefijo y se valida 7–15 dígitos.
- Contraseña: hasta 72 bytes UTF-8. Para registro/activación se exige al menos 8 caracteres, mayúscula, minúscula, número y símbolo.
- Fechas-hora clínicas deben incluir zona horaria (`Z` o `±HH:MM`) y se convierten a UTC. Persistencia/pool usa zona UTC. No se debe enviar hora local sin zona.
- `clientId`, `queryPage`, catálogos y enumeraciones rechazan formato y valores fuera de lista.

### Mascota

Body aceptado por `petInput`: `name`, `sex` (`FEMALE|MALE|UNKNOWN`), `speciesId`, `breedId?`, `breedName?`, `birthDate?` (`YYYY-MM-DD`, no futura), `microchipNumber?` (máximo 32), `photoUrl?` (HTTPS, máximo 2048), `photoBase64?` (flujo sujeto a límite de imagen backend), `weightKg?` positivo, máximo 9999.99 con dos decimales. La propiedad/ownership se asigna en backend.

### Turnos

Solicitud cliente: `POST /api/client/appointments` con `{ "petId":"...", "slotId":"..." }`. Slots/catálogos filtran horarios y profesional según disponibilidad actual; no reutilice un slot expirado. La creación valida nuevamente la disponibilidad en la DB. Cancelación usa `PATCH /api/client/appointments/:id/cancel` y objeto de razón, según reglas de negocio vigentes.

### Checkout

`storeCheckoutInput` permite `requestKey` UUID v4, `paymentMethod` (`BANK_TRANSFER|CARD_DEMO`), `paymentReference?` de hasta 120, `fulfillmentMethod` (`PICKUP|DELIVERY`) y `address` sólo al enviar. Dirección requiere `recipientName`, `phone`, `street`, `streetNumber`, `city`, `province`, `postalCode`, opcionales `unit` y `reference`. Transferencia usa `/orders/bank-transfer` con comprador (nombre, email, DNI) y método/entrega. DNI se valida en memoria y no se guarda en la intención en claro. Card demo rechaza referencias de pago y sólo funciona si la bandera de entorno lo permite.

### Paginación, filtros y orden

Las consultas reciben filtros específicos en JSON, como `search`, `status`, `categoryId`, `page`, `from`, `to`, entre otros. `queryPage` exige número positivo hasta cinco dígitos; algunos repositorios usan límite fijo de 100 o respuestas capadas, otros listan un límite definido por el dominio. No hay un contrato global de paginación uniforme ni un parámetro universal `sort`; consultar el servicio/repository vinculado a cada ruta antes de asumirlo. Fechas de filtros comerciales se interpretan según la función del módulo; las fechas-hora de entrada clínica sí requieren zona.

## 6. Respuestas y errores

| HTTP | Códigos internos observados | Significado |
|---|---|---|
| 200 | éxito | Lectura o actualización completada. |
| 201 | éxito | Recurso creado (p. ej., registro, mascota, turno u orden). |
| 400 | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_INVITATION` | Cuerpo/campo inválido, JSON roto o token de invitación no válido. |
| 401 | `AUTH_REQUIRED`, `INVALID_TOKEN`, `TOKEN_EXPIRED` (según flujo) | Sesión ausente, revocada o no válida. |
| 403 | `FORBIDDEN`, `EMAIL_NOT_VERIFIED`, `PASSWORD_CHANGE_REQUIRED` | Falta permiso/rol, correo por verificar o falta cambiar clave inicial. |
| 404 | `NOT_FOUND`, `ROUTE_NOT_FOUND` | Recurso/ruta no existente. La tienda puede usar `ROUTE_NOT_FOUND`. |
| 409 | `DB_CONFLICT`, `INVALID_TRANSITION`, `STOCK_CONFLICT`, `STORE_DEMO_DISABLED`, `PAYMENT_METHOD_UNAVAILABLE`, `RECORD_IN_USE` | Conflicto de negocio/esquema o transición no permitida. |
| 422 | No se encontró un handler general 422 en el código inspeccionado | No asumir que se usa. Validadores actuales suelen usar 400. |
| 429 | Rate limit, `INVITATION_COOLDOWN`, límites de intentos | Esperar antes de repetir. |
| 413 | `PAYLOAD_TOO_LARGE` | Express rechazó cuerpo mayor al límite aplicable. En Vercel también puede rechazar el request/response antes del handler. |
| 500 | `INTERNAL_ERROR` | Error no controlado, con mensaje público sanitizado. |
| 503 | `DB_UNAVAILABLE`, `AUTH_UNAVAILABLE`, `EMAIL_UNAVAILABLE`, `SERVICE_UNAVAILABLE` y códigos específicos | DB o integración/configuración temporal no disponible. |

El handler de error convierte JSON inválido en 400 y `entity.too.large` en 413. `AppError` conserva status/código/mensaje y opcionalmente errores por campo. `DatabaseError` se registra con ruta/código sanitizados, sin SQL ni parámetros. Las respuestas pueden variar en endpoints OAuth o controladores directos; consulte sus schemas.

## 7. Seguridad

- JWT access se firma con secreto de backend, issuer/audience y TTL; el middleware consulta usuario/estado, versión de sesión, familia activa, verificación de email y obligación de cambio inicial en cada endpoint protegido.
- Refresh tokens son opacos y persistidos/rotados; logout revoca familia. Cambios sensibles incrementan versión de sesión.
- Password hashing usa bcrypt; el backend valida el texto antes de guardar.
- Autorización combina roles, permisos efectivos de DB y ownership. La app puede ocultar acciones, nunca conceder acceso.
- Invitaciones tienen 256 bits aleatorios, se almacena SHA-256, vencen a 24 h y son de un solo uso. El token no es JWT ni reemplaza una sesión.
- Operaciones sensibles como baja, permisos, revisión de transferencia y administración de usuarios requieren rol/grants adicionales y controles de negocio.
- Rate limit se aplica especialmente a login, registro, cambios de contraseña, OAuth, pagos, fotos e invitaciones.
- CORS permite la web oficial y previews configuradas; en producción las entradas explícitas son orígenes HTTPS exactos.
- Logs sanitizan errores SQL/HTTP y no deben incluir authorization, cuerpo de pago, secretos o tokens.

## 8. Integraciones

| Servicio | Uso en código | Configuración/estado |
|---|---|---|
| Layerbase / MySQL | persistencia y autorización efectiva | `DB_*`, TLS; esta lectura del repo no verifica credenciales, disponibilidad ni schema remoto. |
| Vercel | hosting de frontend/API y cron definido | dominios previstos documentados en README/config; confirmar aliases, variables y deployment en consola. |
| SMTP | verificación, invitaciones, reset y emails de eventos | `SMTP_*`, `MAIL_FROM`, `EMAIL_CODE_SECRET`; proveedor operativo no comprobado desde checkout. |
| Google, Facebook, X | OAuth backend | Opcionales; falta verificar credenciales, callback allowlists y estado real externo. X permite variables `TWITTER_*` antiguas. |
| Cloudinary | almacenamiento de imágenes optimizadas y URLs públicas en flujos soportados | `CLOUDINARY_*`; la disponibilidad depende de credenciales. |
| S3 compatible | almacenamiento y URLs firmadas para referencias privadas | `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `REGION`, `BUCKET`, `ENDPOINT`, `PET_PHOTO_S3_URL_STYLE`. |
| Pagos | transferencia y checkout demo | No se observa procesador de tarjetas integrado. `CARD_DEMO` explícitamente simula; transferencias requieren revisión manual/configurada. |
| Cron | recordatorios y entrega por lote de correo | Ruta protegida por `CRON_SECRET`. `backend/vercel.json` está vacío en este checkout, así que no hay schedule de Vercel declarado en el repo; la programación debe configurarse y verificarse en el proyecto. |

## 9. Ejemplos prácticos

Defina variables locales ficticias antes de usar los ejemplos:

```bash
API='http://localhost:3000/api'
TOKEN='<access-token-de-prueba>'
```

### Iniciar sesión

```bash
curl -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"ana.ejemplo@example.test","password":"ClaveSegura9!"}'
```

### Consultar usuario autenticado

```bash
curl -X POST "$API/auth/me" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'
```

### Crear y consultar mascota

IDs de catálogo de ejemplo deben existir en la DB de prueba; el endpoint nunca toma propietario del body.

```bash
curl -X POST "$API/client/pets" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Luna","sex":"FEMALE","speciesId":"1","breedId":null,"birthDate":"2022-04-10","microchipNumber":null,"photoUrl":null,"weightKg":8.4}'

curl -X POST "$API/client/pets/query" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'
```

### Crear y consultar turno

`petId` y `slotId` son IDs existentes obtenidos de catálogo/slots. La disponibilidad se valida de nuevo al guardar.

```bash
curl -X POST "$API/client/appointments" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"petId":"12","slotId":"845"}'

curl -X POST "$API/client/appointments/query" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'
```

### Crear una invitación y aceptarla

El primer ejemplo requiere rol y grants de administración; usa un email ficticio. El segundo se ejecuta con el token real recibido por el destinatario, nunca con un valor público de producción.

```bash
curl -X POST "$API/admin/users" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Rocío","lastName":"Ejemplo","email":"rocio.ejemplo@example.test","phone":null,"roleId":"<id-de-rol-autorizado>"}'

curl -X POST "$API/auth/invitations/accept" -H 'Content-Type: application/json' \
  -d '{"token":"<token-hex-de-64-caracteres>","password":"NuevaClaveFuerte9!"}'
```

Los campos de alta administrativa son validados estrictamente por `admin.repository.ts`; si se actualiza ese contrato, prevalecen el validador y la implementación actualizados. `GROOMER` sólo puede asignarlo un administrador conforme a permisos y roles permitidos.

### Consultar productos y crear pedido de transferencia

```bash
curl -X POST "$API/client/store/products" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"search":"alimento","categoryId":"2"}'

curl -X POST "$API/client/orders/bank-transfer" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"requestKey":"c089bf5d-2d4a-4c25-8f6a-12fac70fd801","fulfillmentMethod":"PICKUP","buyerName":"Ana Ejemplo","buyerEmail":"ana.ejemplo@example.test","buyerDni":"12345678"}'
```

Para entrega (`DELIVERY`), agregue `address` con `recipientName`, `phone`, `street`, `streetNumber`, `city`, `province`, `postalCode`; `unit` y `reference` son opcionales. El endpoint de banco crea una orden/intención para revisión, no confirma el pago. El endpoint genérico `/client/orders` con tarjeta demo necesita `STORE_DEMO_MODE=true` y no cobra.

## 10. Inventario completo de rutas registradas

El inventario siguiente reúne métodos y paths literales de route declarations, los prefijos de `routes/index.ts`, aliases de notificación/invitación y las dos rutas montadas fuera del router API. Hay **148 registros externos de método/ruta** en este checkout, contando aliases como rutas distintas. `:id`, `:kind`, `:provider` y `:module` son parámetros de path. El guard indicado aplica junto con las reglas de acceso/validación del repositorio.

| Método | Endpoint | Módulo | Autenticación | Permiso/condición | Archivo fuente |
|---|---|---|---|---|---|
| GET | `/api/health` | Salud | Pública | Ninguno | [`routes/index.ts`](../backend/src/routes/index.ts) |
| GET | `/api/health/database` | Salud/DB | Pública | Consulta SQL de salud | [`routes/index.ts`](../backend/src/routes/index.ts) |
| GET | `/api/settings/general-information` | Configuración pública | Pública | Caché 300 s | [`routes/settings.routes.ts`](../backend/src/routes/settings.routes.ts) |
| POST | `/api/auth/register` | Autenticación | Pública | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/login` | Autenticación | Pública | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/password-reset/request` | Autenticación | Pública | Rate limit 5 | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/password-reset/confirm` | Autenticación | Pública | Rate limit 10 | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/change-initial-password` | Activación | Pública | Rate limit 10 | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/verify-email` | Verificación | Pública | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/resend-verification` | Verificación | Pública | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/me` | Sesión | Bearer | Usuario activo/verificado | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/refresh` | Sesión | Refresh token | Rate limit; rotación | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/logout` | Sesión | Refresh token | Rate limit; revocación | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/oauth/exchange` | OAuth | Ticket de un uso | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/oauth/register` | OAuth | Pública | Rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| GET | `/api/auth/oauth/providers` | OAuth | Pública | Rate limit 30 | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/oauth/:provider/start` | OAuth | Pública | Allowlist de retorno; rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/oauth/:provider/link` | Bearer | Cuenta autenticada; rate limit | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| GET | `/api/auth/oauth/:provider/callback` | OAuth | Callback externo | Provider válido/configurado | [`routes/auth.routes.ts`](../backend/src/routes/auth.routes.ts) |
| POST | `/api/auth/invitations/accept` | Invitaciones | Token | Un uso, vence 24 h; rate limit | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/auth/veterinarian-invitations/accept` | Invitaciones, alias | Token | Mismo handler de aceptación | [`routes/index.ts`](../backend/src/routes/index.ts) |
| POST | `/api/client/home` | Inicio cliente | Bearer + personal | `CLIENT`/acceso personal según guard | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/pets/catalog` | Mascotas | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/pets/query` | Mascotas | Bearer + personal | Ownership por JWT | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/pets` | Mascotas | Bearer + personal | Alta propia; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/pets/:id` | Mascotas | Bearer + personal | Sólo mascota propia | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PUT | `/api/client/pets/:id` | Mascotas | Bearer + personal | Sólo mascota propia | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PATCH | `/api/client/pets/:id/deactivate` | Mascotas | Bearer + personal | Ciclo de estado propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PATCH | `/api/client/pets/:id/reactivate` | Mascotas | Bearer + personal | Ciclo de estado propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/appointments/catalog` | Turnos | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/appointments/slots` | Turnos | Bearer + personal | Slot disponible | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/appointments/query` | Turnos | Bearer + personal | Turnos propios | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/appointments/:id` | Turnos | Bearer + personal | Turno propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PATCH | `/api/client/appointments/:id/cancel` | Turnos | Bearer + personal | Regla de cancelación | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/appointments` | Turnos | Bearer + personal | Pet/slot propio y libre; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/clinical/:kind` | Historial clínico | Bearer + personal | Acceso personal concedido por guard | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/categories` | Tienda | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/fulfillment` | Tienda | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/promotions` | Tienda | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/banners` | Banners públicos de tienda | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/delivery-quote` | Envíos | Bearer + personal | Cotización según configuración | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/addresses/query` | Direcciones | Bearer + personal | Direcciones propias | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/addresses` | Direcciones | Bearer + personal | Guarda dirección propia; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PATCH | `/api/client/store/addresses/:id` | Direcciones | Bearer + personal | Sólo dirección propia | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/products` | Productos públicos | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/store/products/:id` | Producto | Bearer + personal | Guard personal | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/cart` | Carrito | Bearer + personal | Carrito propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PUT | `/api/client/cart/:id` | Carrito | Bearer + personal | Carrito propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/orders/query` | Pedidos cliente | Bearer + personal | Órdenes propias | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/orders` | Checkout demo | Bearer + personal | `STORE_DEMO_MODE`; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/orders/bank-transfer` | Transferencias | Bearer + personal | Rate limit 8; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/orders/:id/payment-intents` | Pagos | Bearer + personal | Renueva intento; rate limit 8; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/payment-intents/:id/proof` | Comprobantes | Bearer + personal | PDF/JPEG/PNG/WebP hasta 5 MB; rate limit 8; 201 | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/orders/:id` | Pedido | Bearer + personal | Sólo pedido propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PATCH | `/api/client/profile` | Perfil cliente | Bearer + personal | Perfil propio | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| PUT | `/api/client/profile/password` | Perfil cliente | Bearer + personal | Contraseña propia; rate limit | [`routes/client.routes.ts`](../backend/src/routes/client.routes.ts) |
| POST | `/api/client/notifications` | Notificaciones cliente, alias | Bearer + personal | Rol con acceso al centro | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| PATCH | `/api/client/notifications/read-all` | Notificaciones cliente, alias | Bearer + personal | Rol con acceso al centro | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| PATCH | `/api/client/notifications/:id/read` | Notificaciones cliente, alias | Bearer + personal | Sólo notificación propia | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| DELETE | `/api/client/notifications/:id` | Notificaciones cliente, alias | Bearer + personal | Sólo notificación propia | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| POST | `/api/notifications` | Notificaciones | Bearer | `requireNotificationAccess` | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| PATCH | `/api/notifications/read-all` | Notificaciones | Bearer | `requireNotificationAccess` | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| PATCH | `/api/notifications/:id/read` | Notificaciones | Bearer | `requireNotificationAccess`; ownership | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| DELETE | `/api/notifications/:id` | Notificaciones | Bearer | `requireNotificationAccess`; ownership | [`routes/notification.routes.ts`](../backend/src/routes/notification.routes.ts) |
| POST | `/api/clinic/home` | Inicio clínica | Bearer | `VETERINARIAN`, `GROOMER`, `ADMIN` o `SUPER_ADMIN` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/catalog` | Catálogos clínicos | Bearer | `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN` o `SUPER_ADMIN` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/products/query` | Productos clínicos | Bearer | `VETERINARIAN`, `ADMIN` o `SUPER_ADMIN` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/slots` | Agenda | Bearer | Roles clínicos/admin; `appointments.manage` **o** `schedule.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/appointments/:id` | Turno clínica | Bearer | Roles clínicos/admin; `appointments.view_own` **o** `appointments.view_all` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/appointments` | Turnos clínica | Bearer | Roles clínicos/admin; `appointments.view_own` **o** `appointments.view_all` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/appointments/:id` | Turnos clínica | Bearer | Roles clínicos/admin; `appointments.update_own` **o** `appointments.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/grooming/appointments/:id/record/query` | Peluquería | Bearer `GROOMER` | `appointments.view_own` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PUT | `/api/clinic/grooming/appointments/:id/record` | Peluquería | Bearer `GROOMER` | `appointments.update_own` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/patients/query` | Pacientes | Bearer | Roles clínicos/admin; `pets.view_information` **o** `appointments.view_own` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/patients/:id` | Pacientes | Bearer | Roles clínicos/admin; `pets.view_information` **o** `appointments.view_own` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/patients/:id` | Pacientes | Bearer | VET/admin; `pets.update` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/patients/:id/deactivate` | Pacientes | Bearer | Roles clínicos/admin; `pets.update` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/patients/:id/reactivate` | Pacientes | Bearer | Roles clínicos/admin; `pets.update` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/patients/:id/records/:kind/query` | Historia clínica | Bearer | VET/admin; permiso de acceso en lógica clínica | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/patients/:id/records/:kind/page` | Historia clínica | Bearer | VET/admin; permiso de acceso en lógica clínica | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/patients/:id/records/:kind` | Historia clínica | Bearer `VETERINARIAN` | Rate limit; validación clínica | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/clients/query` | Clientes | Bearer | VET/admin; validación de permisos en repositorio | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/clients/:id` | Cliente | Bearer | VET/admin; validación de permisos en repositorio | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/professionals` | Profesionales | Bearer ADMIN | `professionals.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PUT | `/api/clinic/professionals/:id/type` | Profesionales | Bearer ADMIN | `professionals.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PUT | `/api/clinic/professionals/:id/services` | Profesionales | Bearer ADMIN | `professionals.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/availability/query` | Disponibilidad | Bearer ADMIN | `schedule.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/availability` | Disponibilidad | Bearer ADMIN | `schedule.manage`; 201 | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/availability/:kind/:id` | Disponibilidad | Bearer ADMIN | `schedule.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| DELETE | `/api/clinic/availability/:kind/:id` | Disponibilidad | Bearer ADMIN | `schedule.manage`; archiva | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-fulfillment` | Tienda admin | Bearer ADMIN | `store.settings.view` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PUT | `/api/clinic/store-fulfillment` | Tienda admin | Bearer ADMIN | `store.settings.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-banners/query` | Banners admin | Bearer ADMIN | `store.banners.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PUT | `/api/clinic/store-banners/order` | Banners admin | Bearer ADMIN | `store.banners.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-banners` | Banners admin | Bearer ADMIN | `store.banners.manage`; 201 | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/store-banners/:id` | Banners admin | Bearer ADMIN | `store.banners.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| DELETE | `/api/clinic/store-banners/:id` | Banners admin | Bearer ADMIN | `store.banners.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-orders` | Órdenes admin | Bearer ADMIN | `orders.view_all` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-orders/:id` | Orden admin | Bearer ADMIN | `orders.view_all` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/store-orders/:id` | Órdenes admin | Bearer ADMIN | `orders.manage` **o** `orders.payment.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-orders/:id/proof` | Comprobante admin | Bearer SUPER_ADMIN | `orders.payment.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/store-orders/:id/payment-review` | Revisión de pago | Bearer SUPER_ADMIN | `orders.payment.manage` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/admin/:kind/query` | Catálogos admin | Bearer | Permiso específico validado por repositorio para `:kind` | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/clinic/admin/:kind` | Catálogos admin | Bearer | Permiso específico validado por repositorio; rate limit; 201 | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| PATCH | `/api/clinic/admin/:kind/:id` | Catálogos admin | Bearer | Permiso específico validado por repositorio | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| DELETE | `/api/clinic/admin/:kind/:id` | Catálogos admin | Bearer | Permiso específico y reglas de relaciones del repositorio | [`routes/clinic.routes.ts`](../backend/src/routes/clinic.routes.ts) |
| POST | `/api/admin/home` | Inicio admin | Bearer ADMIN/SUPER_ADMIN | Rol | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/general-information` | Configuración general | Bearer ADMIN | `settings.general.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/general-information` | Configuración general | Bearer ADMIN | `settings.general.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/account` | Perfil admin propio | Bearer ADMIN | Sólo cuenta actual | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/account/password` | Clave admin propia | Bearer ADMIN | Rate limit | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/catalog` | Catálogo admin | Bearer ADMIN | Al menos uno: `users.manage`, `roles.manage`, `permissions.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/users/query` | Usuarios admin | Bearer ADMIN | `users.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/users/:id` | Usuario admin | Bearer ADMIN | `users.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| DELETE | `/api/admin/users/:id` | Baja usuario | Bearer SUPER_ADMIN | `users.manage`; baja lógica y guardas de último admin | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/users` | Crear cuenta/invitar | Bearer ADMIN | `users.manage` y `roles.manage`; rate limit; 201 | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/users/:id/invitation` | Reenvío invitación | Bearer SUPER_ADMIN | Rate limit 4, además reglas de servicio | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/users/:id` | Actualizar usuario | Bearer ADMIN | `users.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/users/:id/photo` | Foto de usuario | Bearer ADMIN | `users.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/users/:id/permissions` | Permisos de usuario | Bearer ADMIN | `users.manage` y `permissions.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/roles/query` | Roles | Bearer ADMIN | `roles.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/roles` | Crear rol | Bearer SUPER_ADMIN | `roles.manage` y `permissions.manage`; 201 | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PUT | `/api/admin/roles/:id` | Actualizar rol | Bearer ADMIN | `roles.manage` y `permissions.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| DELETE | `/api/admin/roles/:id` | Eliminar rol personalizado | Bearer ADMIN | `roles.manage` y `permissions.manage`; restricciones de rol/uso | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/permissions/query` | Permisos | Bearer ADMIN | `permissions.manage` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/products/query` | Productos admin | Bearer | Uno de `products.update`, `products.update_stock`, `products.update_price` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/products/catalog` | Catálogo productos | Bearer | Uno de `products.update`, `products.update_stock`, `products.update_price` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/products/:id/stock-movements` | Inventario | Bearer | `products.update_stock` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| PATCH | `/api/admin/products/:id` | Producto | Bearer | Uno de `products.update`, `products.update_stock`, `products.update_price` | [`routes/admin.routes.ts`](../backend/src/routes/admin.routes.ts) |
| POST | `/api/admin/veterinarians/catalog` | Veterinarios | Bearer ADMIN | `veterinarians.manage` (guard de router) | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/admin/veterinarians/query` | Veterinarios | Bearer ADMIN | `veterinarians.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/admin/veterinarians/:id` | Veterinario | Bearer ADMIN | `veterinarians.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/admin/veterinarians` | Crear veterinario/invitar | Bearer ADMIN | `veterinarians.manage`; rate limit; 201 | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PUT | `/api/admin/veterinarians/:id` | Actualizar veterinario | Bearer ADMIN | `veterinarians.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PUT | `/api/admin/veterinarians/:id/photo` | Foto veterinario | Bearer ADMIN | `veterinarians.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PATCH | `/api/admin/veterinarians/:id/status` | Estado veterinario | Bearer ADMIN | `veterinarians.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/admin/specialties/query` | Especialidades | Bearer ADMIN | `specialties.manage` (guard de router) | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/admin/specialties` | Crear especialidad | Bearer ADMIN | `specialties.manage`; 201 | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PUT | `/api/admin/specialties/:id` | Actualizar especialidad | Bearer ADMIN | `specialties.manage` | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| DELETE | `/api/admin/specialties/:id` | Eliminar especialidad | Bearer ADMIN | `specialties.manage`; 409 si tiene relaciones | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/vet/profile` | Perfil profesional | Bearer VETERINARIAN | Sólo usuario actual | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PATCH | `/api/vet/profile` | Actualizar perfil profesional | Bearer VETERINARIAN | Sólo usuario actual | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PUT | `/api/vet/profile/password` | Cambiar clave profesional | Bearer VETERINARIAN | Rate limit 5 | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| PUT | `/api/vet/profile/photo` | Foto profesional | Bearer VETERINARIAN/GROOMER | Rate limit | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/vet/home` | Inicio profesional | Bearer VETERINARIAN | Módulos dependen de grants | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| POST | `/api/vet/modules/:module` | Módulo profesional | Bearer VETERINARIAN | Código del módulo debe estar habilitado | [`routes/veterinarian.routes.ts`](../backend/src/routes/veterinarian.routes.ts) |
| GET | `/api/cron/notifications` | Cron | Bearer `CRON_SECRET` | Secret mínimo 32 bytes | [`routes/notification-jobs.routes.ts`](../backend/src/routes/notification-jobs.routes.ts) |
| GET | `/media/pets/:id` | Imagen privada mascota | Bearer + acceso personal | El ID debe ser propio; rate limit 120 | [`app.ts`](../backend/src/app.ts) |

### Notas sobre el inventario

- Las rutas indicadas con guards heredados deben autenticar antes de llegar al handler. Los grants/ownership pueden comprobarse también dentro de servicio/repositorio.
- `POST /api/auth/veterinarian-invitations/accept` es alias de una ruta montada en `routes/index.ts`; su handler fuente es `invitationRouter.post('/accept')` en `routes/veterinarian.routes.ts`.
- Las notificaciones tienen cuatro declaraciones en un helper que se monta dos veces; por eso figuran ambos prefijos y se cuentan dos veces.
- `/api/clinic/store-banners` con método `GET` no figura porque no está implementado en esta versión. Para listarlos use `POST /api/clinic/store-banners/query`.
- Las rutas dinámicas `:kind`/`:module` no implican recursos ilimitados: el código valida entidades, permisos y catálogo permitido.

