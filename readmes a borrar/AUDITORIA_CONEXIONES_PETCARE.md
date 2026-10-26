# Auditoría de conexiones PetCare

Fecha: 25-10-2026  
Alcance: seguimiento estático de servicios móviles, rutas Express, middleware, servicios y repositorios. No se ejecutaron peticiones HTTP ni se consultó MariaDB.

## Arquitectura observada

`mobile/src/services/api.ts` centraliza URL, timeout, autenticación Bearer y traducción de errores. Los servicios de módulo se crean en `mobile/src/services/{client,clinic,admin,auth}.service.ts`; hooks/contextos inyectan el request autenticado. El backend registra routers en `backend/src/routes/index.ts`, usa middleware y deriva operaciones a `backend/src/controllers/` y `backend/src/services/`, que consultan `backend/src/repositories/`.

El contrato vigente conserva POST para lecturas internas y los métodos indicados en cada escritura. La revisión cotejó los wrappers activos con las rutas Express; no se propone cambiar métodos HTTP.

## Trazabilidad por flujo

| Flujo/pantalla | Servicio y método | Endpoint y middleware | Controlador/negocio/persistencia | Resultado observado |
|---|---|---|---|---|
| Registro, login, verificación, recuperación, sesión | `auth.service.ts`, `verification.service.ts`; POST | `/auth/register`, `/login`, `/verify-email`, `/resend-verification`, `/password-reset/{request,confirm}`, `/refresh`, `/logout`, `/me`; rate limiter y auth según operación | `auth.routes.ts` → auth/verification/OAuth controllers → services y user/session/verification repositories | Rutas y contratos coinciden con wrappers. Requieren correo, JWT y proveedor/configuración real para la prueba de extremo a extremo. |
| OAuth | `oauth.service.ts`; POST y callback GET | `/auth/oauth/:provider/{start,link,callback}`, `/exchange`, `/register`; callback permitido por GET | `oauth.routes.ts` → `oauth.controller.ts` → OAuth provider/policy/services y repositorios | Depende de proveedor y callback registrados; no se puede probar sin credenciales/configuración. |
| Perfil propio | `client.service.ts`, `AccountProfileScreen.tsx`; PATCH/PUT, perfil de veterinario PATCH/PUT, admin PUT | `/client/profile`, `/client/profile/password`, `/vet/profile`, `/vet/profile/password`, `/admin/account`, `/admin/account/password`; auth/ownership y rate limit en contraseñas | client/admin/veterinarian account services y user repositories | Núcleo visual compartido. La autorización personal está en middleware; escritura exitosa y refresco del perfil no se validaron contra DB. |
| Mascotas de cliente | `clientService`; POST consulta/catálogo/detalle, POST creación, PUT edición, PATCH activar/desactivar | `/client/pets/{catalog,query,:id}`, `/client/pets`, `/client/pets/:id`, `/deactivate`, `/reactivate`; authenticate + `requirePersonalAccess` | `client.controller.ts` → `client.service.ts` → `client.repository.ts`; fotos en servicio de almacenamiento | La identidad/owner procede del JWT; el formulario puede conservar foto, y desactivación conserva historial. Falta probar con DB de QA. |
| Reserva de turnos | `clientService`; POST catálogo/slots/listado/detalle/creación | `/client/appointments/{catalog,slots,query,:id}` y POST `/client/appointments`; acceso personal | `client.service.ts` → `client.repository.ts` valida y crea según slot | Slots leídos del backend; persistencia y concurrencia deben verificarse con dos reservas simultáneas en QA. |
| Agenda/atención clínica | `clinicService`; POST lecturas, PATCH cambios, PUT registro peluquería, POST ficha clínica | `/clinic/home`, `/catalog`, `/slots`, `/appointments`, `/appointments/:id`, `/patients`, `/patients/:id`, `/records/:kind`, `/grooming/...`; authenticate + roles/permisos | `clinic.routes.ts` → `clinic.controller.ts` → `clinic.service.ts` → repositories clinic/client | Los permisos se comprueban en middleware y repositorios en rutas administrativas/operativas. Acceso efectivo depende de grants DB vigentes. |
| Gestión de profesionales/horarios/catálogos | `clinicService`, `adminService`; POST/PUT/PATCH/DELETE | `/clinic/professionals`, `/professionals/:id/{type,services}`, `/availability...`, `/admin/:kind...`; auth, rol/permisos declarados o autorización interna | `clinic.service.ts` → `clinic-admin.repository.ts`/`admin.repository.ts` | Métodos y rutas coinciden. Archivar disponibilidad usa DELETE y desactivar usa PATCH; no se altera la semántica. |
| Tienda: catálogo, carrito, dirección, cotización | `clientService`; POST lecturas, PUT carrito, POST/PATCH dirección | `/client/store/{products,categories,fulfillment,promotions,banners,delivery-quote}`, `/client/cart`, `/client/cart/:id`, `/client/store/addresses...`; acceso personal | `client.service.ts` + `storefront`, `delivery-address`, `client` repositories | Precios/stock/costo final se vuelven a leer/calcular en backend durante checkout; catálogo dinámico proviene de endpoints. No se confirmó el estado remoto del esquema. |
| Checkout y transferencias | `clientService`; POST | `/client/orders`, `/orders/bank-transfer`, `/orders/:id/payment-intents`, `/payment-intents/:id/proof`; auth y rate limit | `client.service.ts` → `store-checkout.repository.ts`, `store-payment.repository.ts`, `store-orders.repository.ts` | El checkout de tarjeta está marcado como demo y requiere `STORE_DEMO_MODE`; la transferencia separa intención, comprobante y revisión. La UI no debe interpretarse como prueba de cobro sin confirmación externa. |
| Gestión administrativa y tienda | `adminService`, `clinicService`; POST/PUT/PATCH | `/admin/{home,catalog,users,roles,permissions,products...}`, `/clinic/store-*`, `/clinic/store-orders...`; auth, rol/permisos y autorización interna | `admin.routes.ts`, `clinic.routes.ts` → controllers/services/repositorios de admin/clinic/store | El detalle de pedido agrega `allowedOrderStatuses`, calculado por backend desde estado, pago, entrega y `orders.manage`; el mismo helper valida la transición de escritura. La conexión/respuesta real aún requiere QA. |
| Notificaciones | `clientService`/push services; POST/PATCH/DELETE | `/client/notifications...`, preferencias y tokens; auth, rate limit al registrar token | client controller/service → notification/client repositories; puente nativo/web | Canal y push requieren configuración externa; la persistencia de preferencias y notificaciones requiere DB. |
| Configuración pública y health | `clientService`; GET | `/settings/general-information`, `/health`, `/health/database` | settings router → `general-information.repository`; health controllers | El GET de información pública coincide con backend. Health DB solo comprueba conectividad, no toda la compatibilidad del esquema. |

## Inventario de endpoints y método

Los prefijos siguientes se montan en `/api` (`backend/src/routes/index.ts`). Las lecturas de negocio usan POST con body, según convención vigente documentada en `README.md`.

- **Auth** (`backend/src/routes/auth.routes.ts`): POST `/auth/register`, `/login`, `/password-reset/request`, `/password-reset/confirm`, `/change-initial-password`, `/verify-email`, `/resend-verification`, `/me`, `/refresh`, `/logout`, `/oauth/exchange`, `/oauth/register`, `/oauth/:provider/start`, `/oauth/:provider/link`; GET `/auth/oauth/:provider/callback`.
- **Cliente** (`client.routes.ts`): POST `/client/home`, `/pets/catalog`, `/pets/query`, `/pets`, `/pets/:id`, `/appointments/catalog`, `/appointments/slots`, `/appointments/query`, `/appointments/:id`, `/appointments`, `/clinical/:kind`, `/store/categories`, `/store/fulfillment`, `/store/promotions`, `/store/banners`, `/store/delivery-quote`, `/store/addresses/query`, `/store/addresses`, `/store/products`, `/store/products/:id`, `/cart`, `/orders/query`, `/orders`, `/orders/bank-transfer`, `/orders/:id/payment-intents`, `/payment-intents/:id/proof`, `/orders/:id`, `/notifications`, `/notifications/preferences/query`, `/notifications/push-token`, `/notifications/push-token/revoke`; PUT `/pets/:id`, `/cart/:id`, `/profile/password`; PATCH `/pets/:id/deactivate`, `/pets/:id/reactivate`, `/store/addresses/:id`, `/notifications/preferences`, `/notifications/read-all`, `/notifications/:id/read`, `/profile`; DELETE `/notifications/:id`.
- **Clínica** (`clinic.routes.ts`): POST `/clinic/home`, `/catalog`, `/products/query`, `/slots`, `/appointments/:id`, `/appointments`, `/grooming/appointments/:id/record/query`, `/patients/query`, `/patients/:id`, `/patients/:id/records/:kind/query`, `/patients/:id/records/:kind`, `/clients/query`, `/clients/:id`, `/reservations/query`, `/reservations/:id`, `/professionals`, `/availability/query`, `/availability`, `/store-fulfillment`, `/store-banners/query`, `/store-banners`, `/store-orders`, `/store-orders/:id`, `/store-orders/:id/proof`, `/store-orders/:id/payment-review`, `/admin/:kind/query`, `/admin/:kind`; PUT `/grooming/appointments/:id/record`, `/professionals/:id/type`, `/professionals/:id/services`, `/store-fulfillment`, `/store-banners/order`; PATCH `/appointments/:id`, `/patients/:id`, `/patients/:id/deactivate`, `/reservations/:id`, `/availability/:kind/:id`, `/store-banners/:id`, `/store-orders/:id`, `/admin/:kind/:id`; DELETE `/availability/:kind/:id`, `/store-banners/:id`, `/admin/:kind/:id`.
- **Administración** (`admin.routes.ts`): POST `/admin/home`, `/general-information`, `/catalog`, `/users/query`, `/users/:id`, `/users`, `/users/:id/invitation`, `/roles/query`, `/permissions/query`, `/products/query`, `/products/catalog`, `/products/:id/stock-movements`; PUT `/general-information`, `/account`, `/account/password`, `/users/:id`, `/users/:id/photo`, `/users/:id/permissions`, `/roles/:id`; PATCH `/products/:id`; POST `/roles`.
- **Veterinarios** (`veterinarian.routes.ts`): POST `/admin/veterinarians/catalog`, `/query`, `/:id`, `/`, `/auth/invitations/accept`, `/admin/specialties/query`, `/admin/specialties`, `/vet/profile`, `/vet/home`, `/vet/modules/:module`; PUT `/admin/veterinarians/:id`, `/admin/veterinarians/:id/photo`, `/admin/specialties/:id`, `/vet/profile/password`, `/vet/profile/photo`; PATCH `/admin/veterinarians/:id/status`, `/vet/profile`; DELETE `/admin/specialties/:id`.
- **Públicos/operaciones** (`index.ts`, `settings.routes.ts`, `notification-jobs.routes.ts`, `backend/src/app.ts`): GET `/api/health`, `/api/health/database`, `/api/settings/general-information`, `/api/cron/notifications` y `/media/pets/:id` (autenticado, acceso personal y rate limited; URL de almacenamiento firmada).

## Hallazgos y pendientes

| ID | Prioridad | Hallazgo | Próxima acción | Estado |
|---|---|---|---|---|
| CON-01 | P1 | La ejecución inicial reportó 0 pruebas. Ahora existen 18 pruebas unitarias (14 backend y 4 mobile), ninguna de integración; no prueban persistencia. | Crear pruebas de integración para propiedad, slots, stock, transferencias y permisos en DB efímera. | En curso |
| CON-02 | P1 | Faltan `backend/bootstrap/` y `backend/migrations/`. Existe `backend/.env` con host no local y credenciales, pero no hay evidencia que permita confirmar si el destino es QA o producción; `db:check` no se ejecutó. | Recuperar SQL canónico y confirmar explícitamente un entorno QA aislado; entonces ejecutar auditoría de solo lectura. | Bloqueado por identidad del entorno/SQL canónico |
| CON-03 | P2 | La documentación citada por los README bajo `docs/` no está presente en este checkout. Este informe enumera contratos observados, pero no reemplaza una referencia mantenida de API. | Restaurar o crear docs versionados de API e instalación; verificar cada endpoint de lectura POST tras cambios futuros. | Pendiente |
| CON-04 | P2 | El nuevo campo `allowedOrderStatuses` se comprobó por código y prueba de la función pura; no se confirmó la forma de respuesta en servidor/despliegue ni el refresco visual tras acción. | Ejecutar detalle y actualización de pedidos en staging con registros sintéticos y comprobar respuesta/DB. | Pendiente |
| CON-05 | P2 | No se realizaron pruebas de 401/403 por ruta ni intentos cruzados de ownership. Cinco pruebas nuevas cubren helpers puros de autorización/delegación, no grants DB ni endpoints. | Verificar denegación tanto de UI como API con cuentas de QA por rol. | En curso |

## Verificación disponible

| Ejecución | Mobile | Backend |
|---|---|---|
| Antes de agregar cobertura | typecheck OK; lint OK; `npm test` exit 0 con 0 tests. | typecheck OK; lint FALLÓ porque ESLint no encontró `tests`; `npm test` exit 0 con 0 tests. |
| Después de la segunda etapa | typecheck OK; lint OK; 4 tests pasan: 2 de checkout y 2 del helper de foco. | typecheck OK; lint OK; 14 tests pasan: 4 checkout, 5 autorización y 5 transiciones de pedido. |

Las 18 pruebas son unitarias: 2 validaciones mobile de checkout, 2 del helper de foco, 4 validaciones backend de checkout, 5 reglas de autorización/delegación y 5 transiciones de pedido. No comprueban peticiones HTTP, grants efectivos, ownership contra DB ni persistencia. `backend/.env` apunta a un host no local cuyo entorno no se pudo identificar con certeza; por esa razón no se ejecutaron operaciones DB ni llamadas de red. No hubo despliegues.

Archivos de prueba: `backend/tests/admin-authorization.test.ts`, `backend/tests/client-checkout.validator.test.ts`, `backend/tests/store-order-transitions.test.ts`, `mobile/tests/checkout-validation.test.ts`, `mobile/tests/form-validation.test.ts`.


## Actualización de tercer lote visual (25-10-2026)

Los cambios de este lote afectan únicamente presentación del frontend móvil/web (`PetCareUI`, inicios por rol y distribución visual ya existente). No modifican servicios, endpoints, permisos ni persistencia. Mobile typecheck y lint pasan; las 4 pruebas unitarias mobile existentes pasan. La comprobación no incluyó API o DB, y tampoco se abrió una sesión de QA para renderizar los inicios con registros reales.


## Actualización — cuarto lote interno (25-10-2026)

Las correcciones de mascotas/turnos son de presentación y navegación sobre contratos ya existentes. Se conserva `client.home`, `client.pets`, `client.appointments` y el detalle de turno; no hubo cambios backend ni DB. Typecheck, lint y 4 pruebas mobile pasan. La conexión real, ownership, persistencia y recorrido visual no se verificaron en este lote.


## Actualización — quinto lote (25-10-2026)

Cambios limitados a frontend: presentación de tienda/detalle/carrito; instrucciones bancarias consumen `fulfillment` existente y filtros de pedidos usan el selector de fecha compartido. No se cambiaron endpoints, payloads, persistencia ni permisos. El contrato y datos remotos no se validaron en esta ejecución. Mobile typecheck/lint pasan y pasan las 4 pruebas unitarias existentes.

## Actualización — sexto lote, productos y categorías

La pantalla `mobile/src/app/admin/products.tsx` mantiene `/admin/products/query`, `/admin/products/catalog`, PATCH de producto y movimientos de stock. Los accesos a alta de producto y gestión de categorías respetan `products.update`, `products.create`, `products.update_price`, `products.update_stock` y `categories.manage`; no cambió el contrato ni se agregaron llamadas o escrituras a DB. El formulario genérico conserva `api.adminList`/`api.adminSave` y las verificaciones de permiso de API/backend. No se probó una API conectada ni la base de datos en esta ejecución; se evitó todo acceso al host configurado.

Las promociones conservan `promotions.manage`; si existe `products.view`, la asociación de producto usa `/clinic/products/query`. La fecha/hora se serializa con el helper de fecha de clínica antes de usar `/clinic/admin/promotions`. Sin permiso de lectura de productos no se ejecuta esa consulta; permanece el campo de identificador y el backend valida el producto referenciado.

## Trazabilidad verificada estáticamente — séptimo lote

1. Administración lista servicios por `POST /clinic/admin/services/query` y obtiene tipos, especialidades y asignaciones de `POST /clinic/catalog`.
2. Guardado y cambios de imagen conservan `services.manage` y el flujo existente `/clinic/admin/services`; las asignaciones usan `/clinic/professionals/:id/services` con `professionals.manage`.
3. Días/horarios se guardan como slots por profesional y servicio mediante `/clinic/availability`, bajo `schedule.manage`; la consulta administrativa de disponibilidad se hace por `/clinic/availability/query`.
4. El cliente consulta `/client/appointments/catalog`; ya recibía servicios activos con precio, duración, tipo y descripción. Ahora también puede presentar la imagen persistida.
5. El cliente consulta slots por `/client/appointments/slots`. El backend filtra horarios activos por servicio activo, profesional activo/verificado, tipo compatible, asignación vigente, especialidad activa, bloqueos y reservas que se solapan.
6. Desactivar un servicio lo excluye del catálogo y de la consulta de slots; los registros de turnos existentes se conservan y sus consultas no filtran por `is_active` del servicio.

Esto es trazabilidad estática, no verificación de respuesta desplegada ni persistencia. Typecheck/lint y unitarias pasan; API/DB y QA visual autenticado permanecen pendientes.

La disponibilidad no introduce horarios por defecto: el formulario requiere días/fechas/horas seleccionados y toma la duración del servicio administrativo consultado. Si ese dato falta o está fuera del rango admitido por el backend, no se envía una publicación.

## Actualización — octavo lote (trazabilidad estática)

1. `ProfessionalsScreen` mantiene `/clinic/professionals` y `/clinic/catalog`; los links `professionalId`/`serviceId` alimentan únicamente el filtro de catálogo para el acceso contextual a disponibilidad.
2. La asignación persiste por `PUT /clinic/professionals/:id/services` bajo `professionals.manage`, después de confirmación. El backend valida compatibilidad de tipo y especialidad; la UI conserva asignaciones inactivas ya existentes, las identifica y no ofrece agregarlas como nuevas.
3. Los tipos continúan por la ruta `/clinic/professionals/:id/type`; servicios/tipos/especialidades se cargan desde catálogo, y los cambios incompatibles siguen requiriendo confirmación.
4. La ficha veterinaria conserva `/admin/veterinarians` y su contrato existente. El acceso a administración de especialidades se ofrece solo con `specialties.manage`.
5. La disponibilidad se abre bajo `schedule.manage`; su listado presenta solo servicios activos actualmente asignados al profesional. Publicar slots valida nuevamente servicio/profesional/especialidad en backend.

Revisión estática solamente: no se consultó API/DB remota ni se validó persistencia desplegada.

El acceso contextual a disponibilidad filtra por asignación activa y especialidad requerida; la ficha veterinaria usa la ruta de edición bajo `veterinarians.manage`, mientras los otros perfiles siguen bajo `users.manage`. No se cambiaron guards ni API.
