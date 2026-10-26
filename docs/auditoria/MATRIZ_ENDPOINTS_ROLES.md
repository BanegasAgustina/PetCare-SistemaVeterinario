# Matriz de endpoints y roles

Derivada de los routers activos en `backend/src/routes/` y sus guardas declaradas. Los permisos se resuelven con los grants cargados por autenticación desde Layerbase. Esta tabla describe la política del router, no certifica persistencia ni acceso a cada fila de negocio. Las pruebas unitarias verifican las funciones de guarda; no se usaron cuentas reales.

**Roles:** C = CLIENT, V = VETERINARIAN, G = GROOMER, S = SECRETARY, A = ADMIN, SA = SUPER_ADMIN. ✓ indica que la familia admite el rol a nivel de rol; `perm` indica que además debe tener el grant nombrado; — significa que la guarda de rol lo excluye. Los endpoints públicos no requieren rol.

| Endpoint(s) / operación | C | V | G | S | A | SA | Guardas / alcance |
|---|---:|---:|---:|---:|---:|---:|---|
| `POST /api/auth/register`, `/login`, `/password-reset/request`, `/password-reset/confirm`, `/verify-email`, `/resend-verification` | Público | Público | Público | Público | Público | Público | Validación, límites de tasa y lógica de servicio; registro crea CLIENT, no acepta rol. |
| `POST /api/auth/me` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | JWT válido, cuenta/email activos, versión de sesión y familia vigente; vuelve a consultar identidad/permisos. |
| `POST /api/auth/refresh`, `/logout` | Token de refresh | Token de refresh | Token de refresh | Token de refresh | Token de refresh | Token de refresh | No es guard de rol; requiere refresh token válido y revoca/rota familia. |
| `POST /api/auth/oauth/{google,facebook,x}/start`, `GET .../callback`, `POST /api/auth/oauth/exchange`, `/register` | Público | Público | Público | Público | Público | Público | State, PKCE/ticket de un uso; el alta queda pendiente de verificación. Configuración externa no verificada. |
| `POST /api/auth/oauth/{provider}/link` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | JWT vigente; vínculo sujeto a identidad/familia y transacción. |
| `POST /api/client/**` (área personal; mascotas, turnos, tienda, pedidos, perfil, notificaciones) | ✓ | perm | perm | perm | perm | perm | Toda la familia exige `authenticate` y `requirePersonalAccess`; CLIENT usa su identidad, personal requiere grants `personal.*`. La capa de servicio/repositorio debe aplicar ownership. |
| `GET /api/media/pets/:id` | ✓ | perm | perm | perm | perm | perm | JWT, acceso personal y propietario consultado desde la identidad autenticada. |
| `POST /api/clinic/home` | — | ✓ | ✓ | ✓ | ✓ | ✓ | `requireRole(VETERINARIAN,GROOMER,SECRETARY,ADMIN,SUPER_ADMIN)`; el handler usa permisos actuales. |
| `POST /api/clinic/catalog` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Cualquier identidad autenticada. |
| `POST /api/clinic/products/query` | — | ✓ | — | ✓ | ✓ | ✓ | Rol permitido; operación requiere permiso efectivo en controller/servicio. |
| `POST /api/clinic/slots`, `/appointments`, `/appointments/:id`; `PATCH /appointments/:id` | — | perm | perm | perm | perm | perm | Lista de roles laborales; permisos alternativos `appointments.*` o `schedule.manage` conforme a operación; ownership final en repositorio. |
| `POST /api/clinic/grooming/appointments/:id/record/query`, `PUT .../record` | — | — | `appointments.view_own` / `appointments.update_own` | — | — | — | Solo GROOMER y grant explícito. |
| `POST /api/clinic/patients/query`, `/patients/:id` | — | perm | perm | — | perm | perm | Roles indicados por router; handler valida alcance/permisos y ownership de pacientes. |
| `PATCH /api/clinic/patients/:id`, `.../deactivate` | — | `pets.update` | — | — | `pets.update` | `pets.update` | Rol y permiso; repositorio repite alcance en operación. |
| `POST /api/clinic/patients/:id/records/:kind/query` | — | ✓ | — | — | ✓ | ✓ | Solo lectura de registros clínicos para estos roles; el servicio controla alcance. |
| `POST /api/clinic/patients/:id/records/:kind` | — | ✓ | — | — | — | — | Creación solo VETERINARIAN; valida tipo/relación en handler/repositorio. |
| `POST /api/clinic/clients/**` | — | ✓ | — | ✓ | ✓ | ✓ | Rol; el handler valida grants/alcance. |
| `POST /api/clinic/reservations/query`, `.../:id` | ✓ | — | — | ✓ | ✓ | ✓ | Lectura limitada por servicio y ownership. |
| `PATCH /api/clinic/reservations/:id` | — | — | — | `reservations.manage` | `reservations.manage` | `reservations.manage` | Modificación con permiso efectivo. |
| `POST /api/clinic/professionals`, `PUT /professionals/:id/{type,services}` | — | — | — | — | `professionals.manage` | `professionals.manage` | Administración explícita. |
| `POST/PATCH/DELETE /api/clinic/availability/**` | — | — | — | — | `schedule.manage` | `schedule.manage` | Administración explícita y método por operación. |
| `POST/PUT/PATCH/DELETE /api/clinic/store-*` (fulfillment, banners, pedidos) | — | — | — | — | permiso | permiso | Grants separados de configuración, banners, pedidos y pago; endpoints de revisión financiera son SUPER_ADMIN. |
| `POST/PUT/PATCH /api/admin/users/**`, `/roles/**`, `/permissions/**` | — | — | — | — | permiso | permiso / solo SA en crear rol | ADMIN/SUPER_ADMIN más `users.manage`, `roles.manage`, `permissions.manage`; invitación de usuario solo SUPER_ADMIN. |
| `POST/PATCH /api/admin/products/**` | permiso | permiso | permiso | permiso | permiso | permiso | Cualquier rol autenticado que tenga `products.update`, `products.update_stock` o `products.update_price`; historial de stock requiere `products.update_stock`. |
| `/api/admin/veterinarians/**`, `/api/admin/specialties/**` | — | — | — | — | ✓ | ✓ | Autenticación + ADMIN/SUPER_ADMIN + grant `veterinarians.manage` o `specialties.manage`. |
| `/api/vet/**` | — | ✓ | — | — | — | — | Autenticación + VETERINARIAN; panel/módulos filtrados por grants efectivos. Perfil propio está limitado al usuario autenticado. |
| `POST /api/settings/**`, `GET /api/health` | Público | Público | Público | Público | Público | Público | Configuración pública/salud no concede acceso a datos personales. |
| `GET /api/cron/notifications` | Secreto cron | Secreto cron | Secreto cron | Secreto cron | Secreto cron | Secreto cron | Bearer de CRON_SECRET; no es sesión de usuario y procesa recordatorios/correo interno. |

## Evidencia de prueba automatizada

`backend/tests/http/auth-http.integration.test.ts` ejecuta peticiones HTTP a Express y verifica validación de login/registro, rechazo sin sesión, token malformado y expirado. Fija la base en `127.0.0.1:1` y no toca Layerbase. Ejecutar explícitamente con `npm run test:http` (requiere loopback local); queda fuera de la suite unitaria predeterminada para que esta no necesite abrir puertos. `backend/tests/authorization-middleware.test.ts` verifica guards de rol, grants `all`/`any`, acceso personal y restricciones del scope clínico sin permiso. `backend/tests/admin-authorization.test.ts` cubre delegación, roles protegidos y escalamiento de privilegios.

## Pendientes que requieren entorno aislado

- Un ciclo de sesión válido (login/refresh/logout/replay) con usuarios sintéticos y MariaDB de QA.
- Cada operación CRUD relevante con fixtures por rol y asserts de persistencia/transacción.
- Prueba BOLA/IDOR con dos usuarios, profesional asignado/no asignado y roles administrativos. No se debe simular esto con una identidad local sobre datos reales.
- `clinic/admin/:kind` aplica políticas en handlers/repositorios en vez de toda regla en router; auditar todos sus códigos/permisos por dominio requiere la matriz de grants efectiva del entorno QA.
- Los permisos configurados en Layerbase no se leyeron ni se alteraron en esta etapa.
