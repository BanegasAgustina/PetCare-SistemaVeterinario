# Migración de lecturas internas GET a POST

## Resumen

La auditoría del código encontró 68 rutas `GET`. Se migraron 62 lecturas internas a `POST`; permanecen seis rutas `GET` que dependen de protocolos, recursos o infraestructura. Las lecturas `POST` no escriben datos: conservan las mismas funciones de servicio, respuestas, autenticación, roles, permisos, ownership y validaciones. Los filtros que antes viajaban en query string ahora viajan como JSON en el cuerpo.

Las operaciones existentes de escritura no cambiaron de método. En colecciones donde ya existe un `POST` de creación, la lectura usa `/query` para evitar ambigüedad. No se agregó compatibilidad `GET` para las rutas migradas: frontend y backend deben actualizarse juntos.

Todas las respuestas conservan `{ "success": true, "data": ... }`; los errores conservan el formato actual. Las solicitudes autenticadas siguen enviando `Authorization: Bearer <accessToken>`.

## Rutas migradas

`{} `indica cuerpo JSON vacío. Los nombres entre `< >` son parámetros de ruta. Cuando se indica `filtros`, los campos previos de query string se envían en JSON sin cambiar sus nombres ni sus valores.

### Cliente — `/api/client`

Todas las rutas continúan bajo `authenticate` y `requirePersonalAccess`. CLIENT mantiene acceso a sus rutas personales; otros roles requieren los mismos permisos personales dedicados que antes. El backend deriva ownership del JWT.

| GET anterior | POST nuevo | Parámetros de consulta |
| --- | --- | --- |
| `/home` | `/home` | `{}` |
| `/pets/catalog` | `/pets/catalog` | `{}` |
| `/pets` | `/pets/query` | `includeInactive` opcional |
| `/pets/<id>` | `/pets/<id>` | `id` en ruta; `{}` |
| `/appointments/catalog` | `/appointments/catalog` | `{}` |
| `/appointments/slots` | `/appointments/slots` | `serviceId`, `veterinarianId` opcional |
| `/appointments` | `/appointments/query` | `{}` |
| `/appointments/<id>` | `/appointments/<id>` | `id` en ruta; `{}` |
| `/clinical/<kind>` | `/clinical/<kind>` | `petId` opcional |
| `/store/categories` | `/store/categories` | `{}` |
| `/store/fulfillment` | `/store/fulfillment` | `{}` |
| `/store/promotions` | `/store/promotions` | `{}` |
| `/store/banners` | `/store/banners` | `{}` |
| `/store/delivery-quote` | `/store/delivery-quote` | `province`, `city`, `postalCode`, `subtotalCents` |
| `/store/addresses` | `/store/addresses/query` | `{}` |
| `/store/products` | `/store/products` | `search`, `categoryId`, `productType` opcionales |
| `/store/products/<id>` | `/store/products/<id>` | `id` en ruta; `{}` |
| `/cart` | `/cart` | `{}` |
| `/orders` | `/orders/query` | `{}` |
| `/orders/<id>` | `/orders/<id>` | `id` en ruta; `{}` |
| `/notifications` | `/notifications` | `cursor`, `limit` opcionales |
| `/notifications/preferences` | `/notifications/preferences/query` | `{}` |

El catálogo, checkout y filtros mantienen los permisos personales actuales: mascotas (`personal.pets.view` / `personal.pets.manage`), turnos (`personal.appointments.view` / `personal.appointments.create`), tienda (`personal.store.view` / `personal.store.purchase`), pedidos (`personal.orders.view`) y perfil (`personal.profile.manage`). CLIENT sigue autenticándose mediante JWT y la comprobación de permisos de los demás roles se actualizó para los nuevos métodos/rutas.

### Clínica — `/api/clinic`

Las rutas mantienen autenticación y los `requireRole`, `requirePermission` y `requireAnyPermission` que ya tenían.

| GET anterior | POST nuevo | Acceso y cuerpo |
| --- | --- | --- |
| `/home` | `/home` | VETERINARIAN, GROOMER, SECRETARY, ADMIN o SUPER_ADMIN; `{}` |
| `/catalog` | `/catalog` | CLIENT, VETERINARIAN, GROOMER, SECRETARY, ADMIN o SUPER_ADMIN; `{}` |
| `/products` | `/products/query` | VETERINARIAN, SECRETARY, ADMIN o SUPER_ADMIN; `search`, `categoryId`, `productType` |
| `/slots` | `/slots` | Roles operativos actuales y `appointments.manage` o `schedule.manage`; `serviceId`, `professionalId` |
| `/appointments` | `/appointments` | Roles operativos actuales y `appointments.view_own` o `appointments.view_all`; filtros actuales en JSON |
| `/appointments/<id>` | `/appointments/<id>` | Roles operativos actuales y `appointments.view_own` o `appointments.view_all`; `id` en ruta |
| `/grooming/appointments/<id>/record` | `/grooming/appointments/<id>/record/query` | GROOMER + `appointments.view_own`; `id` en ruta |
| `/patients` | `/patients/query` | Roles clínicos actuales; `search`, `sort`, `speciesId` |
| `/patients/<id>` | `/patients/<id>` | Roles clínicos actuales; `id` en ruta |
| `/patients/<id>/records/<kind>` | `/patients/<id>/records/<kind>/query` | VETERINARIAN, ADMIN o SUPER_ADMIN; IDs y tipo en ruta |
| `/clients` | `/clients/query` | VETERINARIAN, SECRETARY, ADMIN o SUPER_ADMIN; `search` |
| `/clients/<id>` | `/clients/<id>` | VETERINARIAN, SECRETARY, ADMIN o SUPER_ADMIN; `id` en ruta |
| `/reservations` | `/reservations/query` | CLIENT, SECRETARY, ADMIN o SUPER_ADMIN; filtros actuales en JSON |
| `/reservations/<id>` | `/reservations/<id>` | CLIENT, SECRETARY, ADMIN o SUPER_ADMIN; `id` en ruta |
| `/professionals` | `/professionals` | ADMIN o SUPER_ADMIN + `professionals.manage`; `{}` |
| `/availability` | `/availability/query` | ADMIN o SUPER_ADMIN + `schedule.manage`; `professionalId` |
| `/store-fulfillment` | `/store-fulfillment` | ADMIN o SUPER_ADMIN + `store.settings.view`; `{}` |
| `/store-banners` | `/store-banners/query` | ADMIN o SUPER_ADMIN + `store.banners.manage`; `{}` |
| `/store-orders` | `/store-orders` | ADMIN o SUPER_ADMIN + `orders.view_all`; filtros actuales en JSON |
| `/store-orders/<id>` | `/store-orders/<id>` | ADMIN o SUPER_ADMIN + `orders.view_all`; `id` en ruta |
| `/store-orders/<id>/proof` | `/store-orders/<id>/proof` | SUPER_ADMIN + `orders.payment.manage`; `id` en ruta |
| `/admin/<kind>` | `/admin/<kind>/query` | Misma validación de entidad y grants del catálogo; filtros actuales en JSON |

Los `POST` existentes de creación o escritura siguen en sus rutas originales, por ejemplo `/reservations`, `/availability`, `/store-banners`, `/store-orders/<id>/payment-review` y `/patients/<id>/records/<kind>`.

### Administración — `/api/admin`

Se conserva la autenticación ADMIN/SUPER_ADMIN y cada permiso de ruta existente.

| GET anterior | POST nuevo | Permiso |
| --- | --- | --- |
| `/home` | `/home` | ADMIN o SUPER_ADMIN |
| `/general-information` | `/general-information` | ADMIN o SUPER_ADMIN + `settings.general.manage` |
| `/catalog` | `/catalog` | ADMIN o SUPER_ADMIN + `users.manage`, `roles.manage` o `permissions.manage` |
| `/users` | `/users/query` | ADMIN o SUPER_ADMIN + `users.manage`; `search`, `page`, `status` |
| `/users/<id>` | `/users/<id>` | ADMIN o SUPER_ADMIN + `users.manage`; `id` en ruta |
| `/roles` | `/roles/query` | ADMIN o SUPER_ADMIN + `roles.manage` |
| `/permissions` | `/permissions/query` | ADMIN o SUPER_ADMIN + `permissions.manage` |
| `/products` | `/products/query` | `products.update`, `products.update_stock` o `products.update_price`; filtros actuales en JSON |
| `/products/catalog` | `/products/catalog` | Uno de los permisos de catálogo anteriores |
| `/products/<id>/stock-movements` | `/products/<id>/stock-movements` | `products.update_stock`; `id` en ruta |

`POST /users` y `POST /roles` siguen creando registros. Las lecturas de sus colecciones usan `/query`, sin sobrescribir ni mezclar permisos.

### Autenticación y veterinaria

| GET anterior | POST nuevo | Acceso |
| --- | --- | --- |
| `/api/auth/me` | `/api/auth/me` | JWT Bearer válido |
| `/api/admin/veterinarians/catalog` | `/api/admin/veterinarians/catalog` | ADMIN/SUPER_ADMIN + `veterinarians.manage` |
| `/api/admin/veterinarians` | `/api/admin/veterinarians/query` | ADMIN/SUPER_ADMIN + `veterinarians.manage`; `search`, `status`, `sort`, `page`, `specialtyId` en JSON |
| `/api/admin/veterinarians/<id>` | `/api/admin/veterinarians/<id>` | ADMIN/SUPER_ADMIN + `veterinarians.manage`; `id` en ruta |
| `/api/admin/specialties` | `/api/admin/specialties/query` | ADMIN/SUPER_ADMIN + `specialties.manage` |
| `/api/vet/profile` | `/api/vet/profile` | VETERINARIAN autenticado |
| `/api/vet/home` | `/api/vet/home` | VETERINARIAN autenticado |
| `/api/vet/modules/<module>` | `/api/vet/modules/<module>` | VETERINARIAN + permiso vigente del módulo |

## Ejemplos

Lectura filtrada de productos administrativos:

```http
POST /api/admin/products/query
Authorization: Bearer <accessToken>
Content-Type: application/json

{"search":"alimento","stock":"low","page":"1","status":"active"}
```

Respuesta: conserva exactamente el envelope y los datos actuales de la ruta:

```json
{"success":true,"data":{"items":[],"page":1,"total":0,"hasMore":false}}
```

Lectura de turnos propios por ID:

```http
POST /api/client/appointments/42
Authorization: Bearer <accessToken>
Content-Type: application/json

{}
```

La respuesta sigue siendo `{ "success": true, "data": <turno autorizado> }`; el cliente se deriva de JWT y la validación de ID/ownership se conserva.

## GET que permanecen

| GET | Motivo |
| --- | --- |
| `/api/auth/oauth/:provider/callback` | El proveedor OAuth devuelve al usuario al callback mediante navegación HTTP GET; el código y `state` llegan en query conforme al protocolo del proveedor. |
| `/api/health` y `/api/health/database` | Health checks de Vercel y herramientas de monitoreo realizan GET. |
| `/api/settings/general-information` | Recurso público cacheable que puede consultarse directamente sin sesión y consumirse como recurso HTTP. |
| `/api/cron/notifications` | Vercel Cron invoca esta ruta como GET y envía su header de autorización. |
| `/media/pets/:id` | Resolver de recurso de imagen privado: mantiene GET para compatibilidad con consumidores de recursos de media y navegación de URLs. Exige JWT, permiso personal, ownership y rate limit. |

El callback OAuth conserva el flujo de redirección/estado existente; las verificaciones por código e invitaciones siguen siendo POST. No se cambiaron CORS, JWT, cookies/sesiones, roles, permisos, endpoints de escritura, DB, migraciones, ni configuración Vercel. No se modificaron datos de producción.
