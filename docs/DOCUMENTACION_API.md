# Documentación de la API REST PetCare

Inventario generado desde las rutas registradas en `backend/src/routes/` y las rutas transversales en `backend/src/app.ts`. Verificá los validadores y servicios enlazados antes de integrar: los métodos y nombres de campos reales prevalecen sobre cualquier ejemplo.

## Base, respuestas y autenticación

- Base: `https://pet-care-sistema-veterinario.vercel.app/api` en el build móvil de producción; host configurable con `BACKEND_URL` para el backend y `EXPO_PUBLIC_DEV_API_URL` para desarrollo móvil. No usar la URL de Metro como API.
- Las lecturas privadas usan principalmente `POST` con filtros JSON en el body. Las escrituras usan el método indicado en la tabla. No asumir alias GET para lecturas.
- Rutas autenticadas usan `Authorization: Bearer <accessToken>`, excepto health, configuración pública, callbacks OAuth, invitaciones por token, comienzo OAuth y cron con secreto Bearer.
- Éxito: `{ "success": true, "data": ... }`. Error: `{ "success": false, "error": { "code": ..., "message": ... } }`. Algunos errores de validación incluyen `errors`; la verificación de correo puede devolver `verification`.
- Estados habituales: 200 éxito, 201 creación, 400 validación, 401 sesión/token, 403 rol/permiso/ownership, 404 recurso/ruta, 409 conflicto, 413 cuerpo excedido, 429 rate limit, 500 error interno, 503 dependencia/configuración. El estado concreto depende de la ruta y de sus reglas.
- Cuerpos grandes de foto y comprobantes se procesan con límites nativos específicos (8 MB para imágenes, 5 MB para comprobantes) y middleware de autenticación/permiso antes del parser.
- La gestión de compras comerciales usa Tienda, `/api/clinic/store-orders` y `/api/client/orders`. El antiguo módulo `/api/clinic/reservations/**` fue retirado; las operaciones históricas permanecen como registros y no se convierten en compras.

## Ejemplos verificados contra los validadores

### Login tradicional

```http
POST /api/auth/login
Content-Type: application/json

{"email":"cliente@example.com","password":"<contraseña>"}
```

El login normaliza el email, no normaliza la contraseña y aplica rate limit. Responde con usuario autorizado y sesión; credenciales incorrectas producen `401 INVALID_CREDENTIALS`. Un usuario con email no verificado recibe el flujo de verificación, no una sesión utilizable.

### Lectura de notificaciones propias

```http
POST /api/client/notifications
Authorization: Bearer <accessToken>
Content-Type: application/json

{"limit":20}
```

La respuesta contiene `items`, `nextCursor` y `unreadCount`; ownership se deriva del JWT. Marcar leída usa `PATCH /api/client/notifications/:id/read`; leer todo usa `PATCH /api/client/notifications/read-all`.

### Registro

```http
POST /api/auth/register
Content-Type: application/json

{"firstName":"Ana","lastName":"Pérez","email":"ana@example.com","phone":null,"password":"<contraseña fuerte>"}
```

Los campos permitidos son exactamente esos; la contraseña requiere mínimo ocho caracteres, mayúscula, minúscula, dígito y carácter especial (máximo bcrypt 72 bytes). El alta crea CLIENT pendiente y exige código por correo antes de emitir sesión.

## Superficie de rutas

La protección común se aplica en los routers: `/client` autentica y limita acceso personal; `/clinic` autentica y sus rutas declaran roles/permisos efectivos; `/admin` autentica y cada operación declara su rol y permiso; panel veterinario y administradores de especialidades/profesionales tienen middleware de rol/grant en el router. La invitación se acepta con token de un solo uso. Revisá las líneas de ruta y el controlador/servicio al lado antes de usar operaciones de escritura.

| Método | Ruta | Registro |
|---|---|---|
| PUT | `/api/admin/account` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/account/password` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/catalog` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/general-information` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/general-information` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/home` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/permissions/query` | `backend/src/routes/admin.routes.ts` |
| PATCH | `/api/admin/products/:id` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/products/:id/stock-movements` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/products/catalog` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/products/query` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/roles` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/roles/:id` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/roles/query` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/specialties` | `backend/src/routes/veterinarian.routes.ts` |
| DELETE | `/api/admin/specialties/:id` | `backend/src/routes/veterinarian.routes.ts` |
| PUT | `/api/admin/specialties/:id` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/admin/specialties/query` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/admin/users` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/users/:id` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/users/:id` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/users/:id/invitation` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/users/:id/permissions` | `backend/src/routes/admin.routes.ts` |
| PUT | `/api/admin/users/:id/photo` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/users/query` | `backend/src/routes/admin.routes.ts` |
| POST | `/api/admin/veterinarians` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/admin/veterinarians/:id` | `backend/src/routes/veterinarian.routes.ts` |
| PUT | `/api/admin/veterinarians/:id` | `backend/src/routes/veterinarian.routes.ts` |
| PUT | `/api/admin/veterinarians/:id/photo` | `backend/src/routes/veterinarian.routes.ts` |
| PATCH | `/api/admin/veterinarians/:id/status` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/admin/veterinarians/catalog` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/admin/veterinarians/query` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/auth/change-initial-password` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/invitations/accept` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/auth/login` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/logout` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/me` | `backend/src/routes/auth.routes.ts` |
| GET | `/api/auth/oauth/:provider/callback` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/oauth/:provider/link` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/oauth/:provider/start` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/oauth/exchange` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/oauth/register` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/password-reset/confirm` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/password-reset/request` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/refresh` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/register` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/resend-verification` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/verify-email` | `backend/src/routes/auth.routes.ts` |
| POST | `/api/auth/veterinarian-invitations/accept` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/client/appointments` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/appointments/:id` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/appointments/catalog` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/appointments/query` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/appointments/slots` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/cart` | `backend/src/routes/client.routes.ts` |
| PUT | `/api/client/cart/:id` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/clinical/:kind` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/home` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/notifications` | `backend/src/routes/client.routes.ts` |
| DELETE | `/api/client/notifications/:id` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/notifications/:id/read` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/notifications/read-all` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/orders` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/orders/:id` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/orders/:id/payment-intents` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/orders/bank-transfer` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/orders/query` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/payment-intents/:id/proof` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/pets` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/pets/:id` | `backend/src/routes/client.routes.ts` |
| PUT | `/api/client/pets/:id` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/pets/:id/deactivate` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/pets/:id/reactivate` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/pets/catalog` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/pets/query` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/profile` | `backend/src/routes/client.routes.ts` |
| PUT | `/api/client/profile/password` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/addresses` | `backend/src/routes/client.routes.ts` |
| PATCH | `/api/client/store/addresses/:id` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/addresses/query` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/banners` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/categories` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/delivery-quote` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/fulfillment` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/products` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/products/:id` | `backend/src/routes/client.routes.ts` |
| POST | `/api/client/store/promotions` | `backend/src/routes/client.routes.ts` |
| POST | `/api/clinic/admin/:kind` | `backend/src/routes/clinic.routes.ts` |
| DELETE | `/api/clinic/admin/:kind/:id` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/admin/:kind/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/admin/:kind/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/appointments` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/appointments/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/appointments/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/availability` | `backend/src/routes/clinic.routes.ts` |
| DELETE | `/api/clinic/availability/:kind/:id` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/availability/:kind/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/availability/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/catalog` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/clients/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/clients/query` | `backend/src/routes/clinic.routes.ts` |
| PUT | `/api/clinic/grooming/appointments/:id/record` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/grooming/appointments/:id/record/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/home` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/patients/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/patients/:id` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/patients/:id/deactivate` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/patients/:id/reactivate` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/patients/:id/records/:kind` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/patients/:id/records/:kind/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/patients/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/products/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/professionals` | `backend/src/routes/clinic.routes.ts` |
| PUT | `/api/clinic/professionals/:id/services` | `backend/src/routes/clinic.routes.ts` |
| PUT | `/api/clinic/professionals/:id/type` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/slots` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-banners` | `backend/src/routes/clinic.routes.ts` |
| DELETE | `/api/clinic/store-banners/:id` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/store-banners/:id` | `backend/src/routes/clinic.routes.ts` |
| PUT | `/api/clinic/store-banners/order` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-banners/query` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-fulfillment` | `backend/src/routes/clinic.routes.ts` |
| PUT | `/api/clinic/store-fulfillment` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-orders` | `backend/src/routes/clinic.routes.ts` |
| PATCH | `/api/clinic/store-orders/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-orders/:id` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-orders/:id/payment-review` | `backend/src/routes/clinic.routes.ts` |
| POST | `/api/clinic/store-orders/:id/proof` | `backend/src/routes/clinic.routes.ts` |
| GET | `/api/cron/notifications` | `backend/src/app.ts (monta notificationJobsRouter)` |
| GET | `/api/health` | `backend/src/routes/index.ts` |
| GET | `/api/health/database` | `backend/src/routes/index.ts` |
| GET | `/api/settings/general-information` | `backend/src/routes/settings.routes.ts` |
| POST | `/api/vet/home` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/vet/modules/:module` | `backend/src/routes/veterinarian.routes.ts` |
| PATCH | `/api/vet/profile` | `backend/src/routes/veterinarian.routes.ts` |
| POST | `/api/vet/profile` | `backend/src/routes/veterinarian.routes.ts` |
| PUT | `/api/vet/profile/password` | `backend/src/routes/veterinarian.routes.ts` |
| PUT | `/api/vet/profile/photo` | `backend/src/routes/veterinarian.routes.ts` |
| GET | `/media/pets/:id` | `backend/src/app.ts` |

## Validación y contratos por dominio

| Dominio | Registro de rutas | Controlador/servicio | Validación principal |
|---|---|---|---|
| Autenticación y OAuth | `backend/src/routes/auth.routes.ts` | `backend/src/controllers/auth.controller.ts`, `oauth.controller.ts`, servicios auth/OAuth/verification | `backend/src/validators/auth.validator.ts`, `verification.validator.ts`; estado, PKCE y destinos OAuth permitidos |
| Cliente | `backend/src/routes/client.routes.ts` | `client.controller.ts` → `client.service.ts` → repositorios | validadores client/auth/checkout; ownership del JWT |
| Clínica | `backend/src/routes/clinic.routes.ts` | `clinic.controller.ts` → `clinic.service.ts` → repositorios | permisos/alcance en ruta, servicio y repositorio; validadores clinic/veterinarian |
| Administración | `backend/src/routes/admin.routes.ts`, `veterinarian.routes.ts` | repositorios admin/veterinarian y servicios de cuenta | rol, permiso, identificadores y validators |
| Health/configuración | `routes/index.ts`, `settings.routes.ts` | health/database/general-information | consulta de conexión/version o configuración pública |
| Cron | `notification-jobs.routes.ts` | `notifications.service.ts` | Bearer de `CRON_SECRET` (mínimo 32 bytes) |
| Foto privada | `backend/src/app.ts` | repositorio cliente + servicio storage | sesión, ownership, rate limit y URL firmada |

Los detalles de campos específicos cambian por operación y están en la función handler/validator enlazada; la tabla no convierte en garantizado un flujo que requiera proveedor, DB o credenciales externas. No hay OpenAPI generado en el repo.
