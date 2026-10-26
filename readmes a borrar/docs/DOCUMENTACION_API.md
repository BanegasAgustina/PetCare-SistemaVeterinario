# Documentación de la API de PetCare

Referencia de la API Express actual. Las rutas se contrastaron con `backend/src/app.ts`, `backend/src/routes/*.routes.ts`, controladores, servicios y middleware. La URL base local es `http://localhost:3000/api`; en producción se usa el host configurado para el backend seguido de `/api`.

## Convenciones

- Las respuestas exitosas usan `{ "success": true, "data": ... }`. Salvo donde se indica, las lecturas individuales y las operaciones de actualización responden `200`; las creaciones declaradas con estado explícito responden `201`.
- Los errores usan `{ "success": false, "error": { "code": "...", "message": "..." } }`. Errores de validación también pueden incluir `errors`; verificación puede incluir `verification`.
- Las rutas protegidas usan `Authorization: Bearer <accessToken>`. El access token es JWT de corta duración (por defecto 900 segundos); `/auth/refresh` trabaja con la sesión de refresh administrada por la capa de autenticación.
- Las lecturas internas usan `POST` y reciben filtros en JSON. Un POST de lectura no muta datos. Los IDs y discriminadores se envían en la ruta. Las rutas `*/query` separan lecturas de colecciones de POST de creación.
- JSON salvo `POST /client/payment-intents/:id/proof`, que recibe el archivo sin JSON: `image/jpeg`, `image/png`, `image/webp` o `application/pdf`; hasta 5 MB y el encabezado opcional `X-Payment-Reference`.
- La API no admite las antiguas variantes GET de lectura interna. El cliente debe actualizarse en conjunto.

## Resumen verificado de métodos

El inventario actual contiene **144 rutas accesibles**: **96 POST, 20 PUT, 18 PATCH, 4 DELETE y 6 GET**. El router de aceptación de invitaciones se monta en dos prefijos y por eso una declaración POST produce dos URLs accesibles. Las 6 rutas GET corresponden a health, health de DB, información pública, callback OAuth, cron y recurso de imagen privada. `request.get('authorization')` solo lee un encabezado, no registra una ruta.

La nota histórica `docs/api-read-post-migration.md` describe 68 lecturas GET antes de migrar, de las cuales 62 se movieron a POST. La aplicación actual conserva 6 rutas GET funcionales. No se encontraron rutas antiguas GET de lectura de cliente, clínica, administración, veterinaria o `auth/me` registradas en Express.

## Rutas públicas e infraestructura

| Método y ruta | Acceso y parámetros | Resultado / errores relevantes |
|---|---|---|
| `GET /api/health` | Público; sin parámetros. | Estado de proceso. `200`; no verifica MariaDB. |
| `GET /api/health/database` | Público; sin parámetros. | Comprueba conectividad SQL. Error de DB traducido por el middleware. |
| `GET /api/settings/general-information` | Público; caché pública 300 s. | Información general publicada; no expone datos de administración. |
| `GET /api/auth/oauth/:provider/callback` | Redirección del proveedor OAuth. `provider`: `google`, `facebook` o `x`; query de OAuth `code`, `state` y/o error. | Redirige al destino permitido de PetCare. Errores OAuth se expresan en el retorno; no es una lectura de API para clientes. |
| `GET /api/cron/notifications` | Header `Authorization` con `Bearer <CRON_SECRET>`; Vercel Cron. | Ejecuta procesamiento de notificaciones. `503 NOTIFICATION_JOB_UNAVAILABLE` si falta secreto de al menos 32 bytes; `401 AUTH_REQUIRED` si no coincide. |
| `GET /media/pets/:id` | JWT + acceso personal + límite de tasa; `id` numérico de mascota propia. | Devuelve URL autorizada `{url}` con `Cache-Control: no-store`; no acepta una clave de almacenamiento arbitraria. |

Ejemplo de health:

```http
GET /api/health
```

```json
{"success":true,"data":{"status":"ok","message":"PetCare API funcionando"}}
```

## Autenticación, registro y OAuth — `/api/auth`

Registro, login, reset, verificación, invitaciones y OAuth aplican límites de tasa. Las rutas públicas no aceptan `role` del cliente para conceder privilegios. `POST /me` exige JWT.

| Método y ruta | Acceso / entrada principal | Validación y comportamiento |
|---|---|---|
| `POST /api/auth/register` | Público. JSON: nombre, apellido, email, teléfono opcional y contraseña según formulario. | Valida identidad y política de contraseña; inicia verificación de correo. No envíe confirmación de contraseña ni rol. |
| `POST /api/auth/login` | Público. `{email,password}`. | Credenciales válidas; una cuenta no verificada requiere completar verificación. |
| `POST /api/auth/password-reset/request` | Público. Email. | Respuesta deliberadamente segura para no revelar si la cuenta existe; envío depende de SMTP y `PASSWORD_RESET_URL`. |
| `POST /api/auth/password-reset/confirm` | Público. Token/código de recuperación y nueva contraseña. | El token debe estar vigente y ser válido; invalida la credencial anterior según servicio. |
| `POST /api/auth/change-initial-password` | Público con token de invitación/activación. | Cambia contraseña inicial; token inválido, expirado o consumido se rechaza. |
| `POST /api/auth/verify-email` | Público. Email y código de verificación. | Código con vigencia y límites; según origen de cuenta puede devolver sesión o confirmación. |
| `POST /api/auth/resend-verification` | Público. Email y contexto de verificación cuando corresponda. | El código anterior se renueva; sujeto a límite de tasa y envío SMTP. |
| `POST /api/auth/me` | JWT Bearer. Sin body requerido. | Devuelve usuario, rol y permisos efectivos vigentes; `401` ante JWT inválido/expirado. |
| `POST /api/auth/refresh` | Público con credencial de refresh en el contrato de sesión. | Renueva sesión si refresh sigue vigente; límites de tasa. |
| `POST /api/auth/logout` | Público con credencial de refresh para revocarla. | Limpia/revoca sesión de refresh. En cliente, además se elimina almacenamiento local. |
| `POST /api/auth/oauth/exchange` | Público. Ticket temporal de un solo uso. | Canjea ticket por sesión; ticket vencido, repetido o inválido se rechaza. |
| `POST /api/auth/oauth/register` | Público. Datos de alta y prueba de flujo social según proveedor. | Registra cuenta social pendiente de verificación; no vincula usuarios por coincidencia de email. |
| `POST /api/auth/oauth/:provider/start` | Público. `provider` en ruta; JSON de destino/retorno permitido. | Inicia autorización; Google/X utilizan PKCE; Facebook usa estado y cliente confidencial en backend. |
| `POST /api/auth/oauth/:provider/link` | JWT Bearer. `provider` en ruta. | Vincula identidad explícitamente con la cuenta activa; no permite apropiarse de otra cuenta por email coincidente. |

Las claves concretas de cada DTO se implementan en `backend/src/controllers/auth.controller.ts`, `verification.controller.ts`, `oauth.controller.ts` y los validadores asociados. La API no acepta credenciales OAuth privadas desde la app. Ejemplo de lectura autenticada:

```http
POST /api/auth/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{}
```

## Área personal — `/api/client`

Todas las rutas pasan por JWT y `requirePersonalAccess`. CLIENT usa su acceso personal; los otros roles requieren los grants personales correspondientes. El backend deriva el propietario del JWT, no de un `ownerId` enviado por el cliente.

| Método y ruta | Descripción y entrada | Validaciones / permisos relevantes |
|---|---|---|
| `POST /api/client/home` | Resumen, próximos turnos, mascotas, destacados y no leídas. `{}` | Solo lectura. |
| `POST /api/client/pets/catalog` | Catálogos para mascotas. `{}` | Solo lectura. |
| `POST /api/client/pets/query` | Mascotas propias; `{includeInactive?: boolean/string}`. | Booleano permitido; `personal.pets.view`. |
| `POST /api/client/pets` | Alta de mascota. | Valida `petInput`; foto opcional en base64; crea con `201`; `personal.pets.manage`. |
| `POST /api/client/pets/:id` | Detalle de mascota propia. `{}` | ID positivo; ownership; `personal.pets.view`. |
| `PUT /api/client/pets/:id` | Actualiza mascota propia. | Campos de `petInput`; foto propia autorizada; `personal.pets.manage`. |
| `PATCH /api/client/pets/:id/deactivate` | Baja lógica. `{}` | ID y ownership; `personal.pets.manage`. |
| `PATCH /api/client/pets/:id/reactivate` | Reactiva mascota. `{}` | ID y ownership; `personal.pets.manage`. |
| `POST /api/client/appointments/catalog` | Catálogo de turnos/servicios. `{}` | Lectura; `personal.appointments.view`. |
| `POST /api/client/appointments/slots` | Busca horarios. `{serviceId, veterinarianId?}` | IDs positivos; `personal.appointments.view`. |
| `POST /api/client/appointments/query` | Lista de turnos propios. `{}` | Solo lectura; propietario derivado del JWT. |
| `POST /api/client/appointments/:id` | Detalle de turno propio. `{}` | ID y ownership; `404` si no pertenece/encontrado. |
| `POST /api/client/appointments` | Solicita turno. `{petId,slotId}` | IDs válidos y disponibilidad de slot; `201`; `personal.appointments.create`. |
| `POST /api/client/clinical/:kind` | Historial clínico propio; `kind`: `medical-history`, `vaccines`, `prescriptions`, `recommendations`; `{petId?}`. | Kind permitido y mascota propia; solo lectura. |
| `POST /api/client/store/categories` | Categorías públicas. `{}` | Solo lectura. |
| `POST /api/client/store/fulfillment` | Opciones públicas de entrega/retiro. `{}` | Solo lectura. |
| `POST /api/client/store/promotions` | Promociones activas. `{}` | Solo lectura. |
| `POST /api/client/store/banners` | Banners públicos activos. `{}` | Solo lectura. |
| `POST /api/client/store/delivery-quote` | Cotiza entrega. `{province,city,postalCode,subtotalCents}` | Valida ubicación y monto según configuración de tienda. |
| `POST /api/client/store/addresses/query` | Lista direcciones propias. `{}` | Propietario del JWT. |
| `POST /api/client/store/addresses` | Guarda una dirección. JSON de dirección. | Validación en `delivery-address.repository`; `201`. |
| `PATCH /api/client/store/addresses/:id` | Actualiza dirección propia. JSON de dirección. | ID y ownership. |
| `POST /api/client/store/products` | Busca productos. `{search?,categoryId?,productType?}` | Tipo permitido: `MEDICINE` o `ACCESSORY`; filtros opcionales. |
| `POST /api/client/store/products/:id` | Detalle de producto. `{}` | ID positivo. |
| `POST /api/client/cart` | Carrito propio. `{}` | Lectura del carrito asociado a la cuenta. |
| `PUT /api/client/cart/:id` | Cambia cantidad. `{quantity}` | Cantidad validada; línea del carrito propia. |
| `POST /api/client/orders/query` | Historial de pedidos propios. `{}` | Solo lectura. |
| `POST /api/client/orders` | Checkout de demostración. Ver ejemplo abajo. | Solo si `STORE_DEMO_MODE=true`; de lo contrario `409 STORE_DEMO_DISABLED`. No es un cobro real. |
| `POST /api/client/orders/bank-transfer` | Crea pedido por transferencia. DTO validado por `storeTransferInput`; `201`. | Reglas de checkout, disponibilidad y método; límite de tasa. |
| `POST /api/client/orders/:id/payment-intents` | Renueva intención de pago. `{}` | Pedido propio, estado elegible; límite de tasa. |
| `POST /api/client/payment-intents/:id/proof` | Sube comprobante binario. `Content-Type` PDF/JPEG/PNG/WebP y opcional `X-Payment-Reference`. | Máximo 5 MB; intención propia; validación MIME, ownership y límite de tasa. |
| `POST /api/client/orders/:id` | Detalle de pedido propio. `{}` | ID y ownership. |
| `POST /api/client/notifications` | Bandeja de notificaciones. `{cursor?,limit?}` | Cursor/limit validados por repositorio. |
| `POST /api/client/notifications/preferences/query` | Preferencias propias. `{}` | Solo lectura. |
| `PATCH /api/client/notifications/preferences` | Actualiza preferencias. JSON de preferencias. | Se aceptan campos soportados por repositorio. |
| `PATCH /api/client/notifications/read-all` | Marca todas como leídas. `{}` | Solo notificaciones del usuario. |
| `PATCH /api/client/notifications/:id/read` | Marca una como leída. `{}` | ID y ownership. |
| `DELETE /api/client/notifications/:id` | Oculta una notificación. `{}` | ID y ownership. |
| `POST /api/client/notifications/push-token` | Registra token Expo del dispositivo. JSON de token/plataforma. | Límite de tasa; token se asocia al usuario autenticado. |
| `POST /api/client/notifications/push-token/revoke` | Revoca token. JSON del token/dispositivo. | Límite de tasa; solo identidad propia. |
| `PATCH /api/client/profile` | Actualiza perfil. `{firstName,lastName,phone}` | Nombre/apellido y teléfono validados. |
| `PUT /api/client/profile/password` | Cambia contraseña. `{currentPassword,password}` | Comprueba contraseña actual y política nueva; límite de tasa. |

Ejemplo de lectura filtrada de productos (POST de solo lectura):

```http
POST /api/client/store/products
Authorization: Bearer <accessToken>
Content-Type: application/json

{"search":"alimento","categoryId":"2","productType":"ACCESSORY"}
```

Ejemplo de checkout de demostración, que solo está habilitado por configuración explícita:

```json
{"key":"idempotency-key","paymentMethod":"...","fulfillmentMethod":"...","address":{},"paymentReference":""}
```

El contrato exacto y los campos obligatorios se definen en `backend/src/validators/store-checkout.validator.ts`; consultar esa fuente al integrar un cliente nuevo. La demostración no procesa dinero.

## Clínica compartida — `/api/clinic`

Todas las rutas requieren JWT. La tabla da el `requireRole`/permiso explícito en Express; las operaciones y alcances también se verifican en el servicio/repositorio. Roles: `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN`, `SUPER_ADMIN`.

| Método y ruta | Roles y permisos explícitos | Uso y parámetros |
|---|---|---|
| `POST /api/clinic/home` | VETERINARIAN, GROOMER, SECRETARY, ADMIN, SUPER_ADMIN | Panel operativo; `{}`. |
| `POST /api/clinic/catalog` | CLIENT, VETERINARIAN, GROOMER, SECRETARY, ADMIN, SUPER_ADMIN | Catálogo; `{}`. |
| `POST /api/clinic/products/query` | VETERINARIAN, SECRETARY, ADMIN, SUPER_ADMIN | Catálogo interno; filtros de producto JSON. Servicio valida permiso efectivo `products.view`. |
| `POST /api/clinic/slots` | VETERINARIAN, GROOMER, SECRETARY, ADMIN, SUPER_ADMIN + `appointments.manage` o `schedule.manage` | Slots por servicio/profesional; filtros JSON. |
| `POST /api/clinic/appointments/:id` | Roles operativos + `appointments.view_own` o `appointments.view_all` | Detalle por ID. |
| `POST /api/clinic/appointments` | Roles operativos + `appointments.view_own` o `appointments.view_all` | Lista/filtros de turnos JSON. |
| `PATCH /api/clinic/appointments/:id` | Roles operativos + `appointments.update_own` o `appointments.manage` | Actualiza estado/datos admitidos por la operación; ID en ruta. |
| `POST /api/clinic/grooming/appointments/:id/record/query` | GROOMER + `appointments.view_own` | Lee ficha de peluquería. |
| `PUT /api/clinic/grooming/appointments/:id/record` | GROOMER + `appointments.update_own` | Guarda ficha de peluquería. |
| `POST /api/clinic/patients/query` | VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN + `pets.view_information` o `appointments.view_own` | Búsqueda de pacientes; filtros JSON. |
| `POST /api/clinic/patients/:id` | Mismos roles y permisos de pacientes | Detalle de paciente. |
| `PATCH /api/clinic/patients/:id` | VETERINARIAN, ADMIN, SUPER_ADMIN + `pets.update` | Actualiza campos clínicos/personales admitidos. |
| `PATCH /api/clinic/patients/:id/deactivate` | VETERINARIAN, ADMIN, SUPER_ADMIN + `pets.update` | Desactiva registro. |
| `POST /api/clinic/patients/:id/records/:kind/query` | VETERINARIAN, ADMIN, SUPER_ADMIN | Lee tipo de registro clínico. Validación de `kind` en servicio. |
| `POST /api/clinic/patients/:id/records/:kind` | VETERINARIAN | Crea registro clínico (`201`); límite de tasa; servicio valida tipo, paciente y campos. |
| `POST /api/clinic/clients/query` | VETERINARIAN, SECRETARY, ADMIN, SUPER_ADMIN | Busca clientes; filtros JSON. |
| `POST /api/clinic/clients/:id` | Mismos roles | Detalle de cliente. |
| `POST /api/clinic/reservations/query` | CLIENT, SECRETARY, ADMIN, SUPER_ADMIN | Lee reservas; cliente ve su alcance. Filtros JSON. |
| `POST /api/clinic/reservations/:id` | Mismos roles | Detalle de reserva y ownership. |
| `PATCH /api/clinic/reservations/:id` | SECRETARY, ADMIN, SUPER_ADMIN + `reservations.manage` | Actualiza reserva según transición permitida. |
| `POST /api/clinic/professionals` | ADMIN, SUPER_ADMIN + `professionals.manage` | Lista profesionales. `{}`/filtros admitidos por el handler. |
| `PUT /api/clinic/professionals/:id/type` | ADMIN, SUPER_ADMIN + `professionals.manage` | Cambia tipo profesional; body validado por operación. |
| `PUT /api/clinic/professionals/:id/services` | ADMIN, SUPER_ADMIN + `professionals.manage` | Asigna servicios; body con IDs permitidos. |
| `POST /api/clinic/availability/query` | ADMIN, SUPER_ADMIN + `schedule.manage` | Consulta disponibilidad; filtros JSON. |
| `POST /api/clinic/availability` | ADMIN, SUPER_ADMIN + `schedule.manage` | Crea disponibilidad (`201`). |
| `PATCH /api/clinic/availability/:kind/:id` | ADMIN, SUPER_ADMIN + `schedule.manage` | Desactiva entidad de disponibilidad según `kind` e ID. |
| `POST /api/clinic/store-fulfillment` | ADMIN, SUPER_ADMIN + `store.settings.view` | Lee configuración de entrega/retiro. `{}`. |
| `PUT /api/clinic/store-fulfillment` | ADMIN, SUPER_ADMIN + `store.settings.manage` | Guarda esa configuración. |
| `POST /api/clinic/store-banners/query` | ADMIN, SUPER_ADMIN + `store.banners.manage` | Lista banners. `{}`. |
| `PUT /api/clinic/store-banners/order` | ADMIN, SUPER_ADMIN + `store.banners.manage` | Cambia orden; body con IDs/orden. |
| `POST /api/clinic/store-banners` | ADMIN, SUPER_ADMIN + `store.banners.manage` | Crea banner (`201`). |
| `PATCH /api/clinic/store-banners/:id` | ADMIN, SUPER_ADMIN + `store.banners.manage` | Edita banner. |
| `DELETE /api/clinic/store-banners/:id` | ADMIN, SUPER_ADMIN + `store.banners.manage` | Elimina banner. |
| `POST /api/clinic/store-orders` | ADMIN, SUPER_ADMIN + `orders.view_all` | Lista pedidos; filtros JSON. |
| `POST /api/clinic/store-orders/:id` | ADMIN, SUPER_ADMIN + `orders.view_all` | Detalle de pedido. |
| `PATCH /api/clinic/store-orders/:id` | ADMIN, SUPER_ADMIN + `orders.manage` o `orders.payment.manage` | Actualiza pedido según transición y permiso. |
| `POST /api/clinic/store-orders/:id/proof` | SUPER_ADMIN + `orders.payment.manage` | Lee comprobante asociado al pedido. |
| `POST /api/clinic/store-orders/:id/payment-review` | SUPER_ADMIN + `orders.payment.manage` | Revisa/aprueba/rechaza pago; body de decisión validado por operación. |
| `POST /api/clinic/admin/:kind/query` | JWT; permiso/grant depende de catálogo `kind` | Lista catálogo de administración; filtros JSON. El repositorio valida rol, permiso y entidad. |
| `POST /api/clinic/admin/:kind` | JWT; permiso/grant depende de `kind` | Crea elemento (`201`); límite de tasa y validación del tipo. |
| `PATCH /api/clinic/admin/:kind/:id` | JWT; permiso/grant depende de `kind` | Actualiza elemento. |
| `DELETE /api/clinic/admin/:kind/:id` | JWT; permiso/grant depende de `kind` | Elimina/desactiva según catálogo; restricciones relacionales. |

Las rutas POST de catálogo/consulta no escriben. Para nombres de campos concretos, la fuente ejecutable es `backend/src/controllers/clinic.controller.ts` y `backend/src/repositories/clinic.repository.ts`; los cuerpos no deben ampliarse suponiendo que el repositorio acepte campos arbitrarios.

## Administración — `/api/admin`

Todas las rutas de este router requieren JWT. Las operaciones restringidas requieren además el rol indicado y permisos efectivos cargados del catálogo MySQL.

| Método y ruta | Roles/permisos | Entrada y resultado |
|---|---|---|
| `POST /api/admin/home` | ADMIN, SUPER_ADMIN | Dashboard. `{}`. |
| `POST /api/admin/general-information` | ADMIN, SUPER_ADMIN + `settings.general.manage` | Consulta configuración general. |
| `PUT /api/admin/general-information` | Mismos | Guarda configuración; body según campos de información general. |
| `PUT /api/admin/account` | ADMIN, SUPER_ADMIN | Actualiza perfil propio. |
| `PUT /api/admin/account/password` | ADMIN, SUPER_ADMIN | `{currentPassword,password}`; límite de tasa. |
| `POST /api/admin/catalog` | ADMIN, SUPER_ADMIN + uno de `users.manage`, `roles.manage`, `permissions.manage` | Catálogos administrativos. |
| `POST /api/admin/users/query` | ADMIN, SUPER_ADMIN + `users.manage` | Filtros JSON: búsqueda, página y estado soportados. |
| `POST /api/admin/users/:id` | Mismos | Detalle por ID. |
| `POST /api/admin/users` | ADMIN, SUPER_ADMIN + `users.manage` y `roles.manage` (middleware exige ambos) | Alta de usuario (`201`); límite de tasa. |
| `POST /api/admin/users/:id/invitation` | SUPER_ADMIN | Reenvía invitación; límite de tasa. |
| `PUT /api/admin/users/:id` | ADMIN, SUPER_ADMIN + `users.manage` | Edita usuario. |
| `PUT /api/admin/users/:id/photo` | ADMIN, SUPER_ADMIN + `users.manage` | `{photoBase64}` o `{removePhoto:true}`; máximo de cuerpo de imagen configurado en app. |
| `PUT /api/admin/users/:id/permissions` | ADMIN, SUPER_ADMIN + `users.manage` y `permissions.manage` | Asigna overrides/grants según catálogo. |
| `POST /api/admin/roles/query` | ADMIN, SUPER_ADMIN + `roles.manage` | Lista roles. |
| `POST /api/admin/roles` | SUPER_ADMIN + `roles.manage` y `permissions.manage` | Crea rol (`201`). |
| `PUT /api/admin/roles/:id` | ADMIN, SUPER_ADMIN + `roles.manage` y `permissions.manage` | Actualiza rol. |
| `POST /api/admin/permissions/query` | ADMIN, SUPER_ADMIN + `permissions.manage` | Lista permisos/catálogos. |
| `POST /api/admin/products/query` | JWT + uno de `products.update`, `products.update_stock`, `products.update_price` | Filtros de productos en JSON. |
| `POST /api/admin/products/catalog` | JWT + uno de los permisos de producto anteriores | Catálogo de categorías de producto. |
| `POST /api/admin/products/:id/stock-movements` | JWT + `products.update_stock` | Historial de movimientos de stock. |
| `PATCH /api/admin/products/:id` | JWT + uno de permisos de producto anteriores | Actualiza campos permitidos; `photoBase64` opcional y requiere además `products.update`. |

Middleware `requirePermission` exige todos los permisos indicados; `requireAnyPermission` exige al menos uno. Ejemplo de consulta:

```http
POST /api/admin/users/query
Authorization: Bearer <accessToken>
Content-Type: application/json

{"search":"ana","page":1,"status":"active"}
```

## Administración veterinaria — `/api/admin/veterinarians`, `/api/admin/specialties`

Estas rutas requieren JWT + rol `ADMIN` o `SUPER_ADMIN` + permiso `veterinarians.manage` o `specialties.manage`, respectivamente.

| Método y ruta | Descripción / validaciones |
|---|---|
| `POST /api/admin/veterinarians/catalog` | Catálogos de veterinaria; lectura. |
| `POST /api/admin/veterinarians/query` | Lista; JSON admite filtros de búsqueda, estado, orden, página y especialidad. |
| `POST /api/admin/veterinarians/:id` | Detalle; ID numérico positivo. |
| `POST /api/admin/veterinarians` | Alta (`201`); DTO validado por `validateVet`; límite de tasa. |
| `PUT /api/admin/veterinarians/:id` | Actualización; DTO `validateVet` y autorización del actor. |
| `PUT /api/admin/veterinarians/:id/photo` | `{photoBase64}` o `{removePhoto:true}`; ID y validación de almacenamiento. |
| `PATCH /api/admin/veterinarians/:id/status` | `{isActive:boolean}` requerido. |
| `POST /api/admin/specialties/query` | Lista especialidades. |
| `POST /api/admin/specialties` | `{name}` requerido, texto máximo 100; `201`. |
| `PUT /api/admin/specialties/:id` | `{name? ,isActive?}`; se requiere al menos un campo; nombre hasta 100. |
| `DELETE /api/admin/specialties/:id` | Elimina solo si no está asociada; `409 RECORD_IN_USE` si tiene servicios o veterinarios relacionados. |

## Panel veterinario — `/api/vet`

JWT + rol `VETERINARIAN`. Los módulos se calculan según permisos efectivos y catálogo de permisos.

| Método y ruta | Uso |
|---|---|
| `POST /api/vet/profile` | Perfil autenticado y perfil profesional/veterinario. `{}`. |
| `PATCH /api/vet/profile` | Actualiza perfil personal; campos permitidos por servicio. |
| `PUT /api/vet/profile/password` | Cambia clave propia; límite de tasa. |
| `PUT /api/vet/profile/photo` | `{photoBase64}` o `{removePhoto:true}`; límite de tasa. |
| `POST /api/vet/home` | Inicio con módulos accesibles y datos clínicos compartidos. |
| `POST /api/vet/modules/:module` | Verifica acceso al módulo del código indicado; `403` si no está habilitado. |

## Invitaciones

| Método y ruta | Acceso / entrada |
|---|---|
| `POST /api/auth/veterinarian-invitations/accept` | Público con token de invitación en body; aplica tasa y consume la invitación. |
| `POST /api/auth/invitations/accept` | Mismo handler compartido para invitaciones generales. |

## Códigos de error comunes

| HTTP | Código frecuente | Significado / acción |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON`, `CURRENT_PASSWORD_INVALID` | Revisar JSON, campos, formato, IDs y valores admitidos. |
| 401 | `AUTH_REQUIRED` | Falta JWT válido o credencial cron incorrecta; renovar/iniciar sesión. |
| 403 | `FORBIDDEN` | Rol, permiso, ownership o acceso al módulo no habilitado. |
| 404 | `NOT_FOUND`, `ROUTE_NOT_FOUND` | Recurso o método/ruta no existe; verificar base URL y usar método vigente. |
| 409 | `STORE_DEMO_DISABLED`, `RECORD_IN_USE` y conflictos de negocio | Revisar estado del recurso/configuración; no reintentar a ciegas. |
| 413 | `PAYLOAD_TOO_LARGE` | Reducir imagen/comprobante; límites de carga de fotos y comprobantes son 8 MB y 5 MB respectivamente. |
| 429 | límite de autenticación | Esperar la ventana indicada por el servicio y evitar reintentos automáticos. |
| 500 | `INTERNAL_ERROR` | Error no expuesto; revisar logs depurados del backend. |
| 503 | `AUTH_UNAVAILABLE`, `NOTIFICATION_JOB_UNAVAILABLE` | Secreto/configuración o infraestructura no lista; revisar variables y servicio externo. |

## Qué se verificó y qué debe consultarse antes de integrar

Se verificaron las rutas registradas, método, prefijo, middleware visible, operación/handler, los contratos explícitos de `client.service.ts`, validadores dedicados de autenticación, mascotas, veterinaria y checkout, y errores normalizados. Algunos cuerpos de clínica y administración son contratos de operación/repositorio; se describieron por campo solo cuando el código lo hace explícito. Para esos formularios, inspeccione el tipo y la validación en el handler/repository de la misma operación antes de enviar campos adicionales. Los ejemplos de respuesta compactos representan el envelope, no una promesa de que las listas estarán vacías.

Fuentes ejecutables principales: `backend/src/routes/`, `backend/src/app.ts`, `backend/src/controllers/`, `backend/src/services/client.service.ts`, `backend/src/repositories/clinic.repository.ts`, `backend/src/validators/` y `backend/src/middlewares/error.middleware.ts`.
