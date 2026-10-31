# 12. Inventario de archivos y responsabilidades

El inventario de archivos fuente puede reproducirse con `rg --files backend/src mobile/src`; al contar esas dos carpetas en este checkout se hallaron 371 archivos. El repositorio completo tiene además manifests, lockfiles, configs, tests, assets y documentos. No enumeramos cada imagen binaria; sí agrupamos por carpeta y sus diferencias/patrones.

## Backend (`backend/src`)

| Carpeta | Archivos/patrón | Qué revisar y dependencias |
|---|---|---|
| Raíz | `server.ts`, `app.ts` | escucha/cron de reserva; Express y montaje de middleware/router |
| `config` | `database.ts`, `env.ts`, `mail.ts`, `oauth.ts`, `public-frontend.ts` | pool y validación de configuración; consumido por servicios |
| `routes` | `auth`, `client`, `clinic`, `admin`, `veterinarian`, `notification`, `notification-jobs`, `media`, `settings`, `index` | método, path, guards y handler |
| `controllers` | auth, client, clinic, oauth, verification, health, database-health | capa HTTP; controllers cliente/clínica resuelven acción y delegan |
| `middlewares` | auth, permission, error, rate-limit, proxy-trust | ejecutados antes/después del handler |
| `services` | auth/session/token/password/verification/reset/OAuth, clinic/client, mail/invitation/notifications, image, account | reglas y orquestación; no todos son llamados por todas las rutas |
| `repositories` | user/authz/session/client/clinic/admin/vet/notification/reservation/store/payment/etc. | consultas SQL y ownership; buscar funciones exportadas por módulo |
| `validators` | auth, client, clinic, checkout, verification, vet | parseo/normalización de entrada |
| `utils` | error, autorización personal/admin, reglas clínica, lifecycle, transición tienda, fechas | funciones puras/reglas reutilizadas |
| `database` | migraciones, auditorías readonly, locks, seed, bootstrap/admin scripts | tooling SQL; potencialmente mutante; no ejecutado para esta guía |
| `types` | api/auth/authorization/verification | contratos TypeScript |

## Móvil (`mobile/src`)

| Carpeta | Responsabilidad / ejemplos | Relaciones |
|---|---|---|
| `app` | rutas y layouts; áreas auth/client/admin/professional/vet | llama hooks/contextos/services; Expo Router descubre rutas |
| `components` | UI compartida por admin/client/clinic/forms/layout/notifications/profile/ui | acepta props y emite callbacks; layouts contienen menú/navegación |
| `contexts` | `AuthContext`, `ThemeContext`, `FeedbackContext`, `StoreCheckoutContext` | estado y acciones compartidas |
| `hooks` | useAuth, useClient, useClinic, useAdmin, async/debounce/navigation | consume context/services, simplifica pantallas |
| `services` | api, auth/client/clinic/admin, OAuth, sesiones, verificación, eventos | traduce intención frontend a endpoint |
| `types` | auth/client/clinic/admin/veterinarian | tipos de datos de UI/API |
| `utils` | permisos/navigation, validación, fechas, etiquetas, checkout, imágenes, single-flight | reglas reutilizables; seguridad crítica sigue en servidor |
| `constants` | tema/superficie/responsive | tokens visuales y medidas |
| `assets` | logos, fondos y fotos | usados en login, branding e iconos |

## Configuración raíz y docs

`README.md` raíz, `backend/README.md`, `mobile/README.md` explican setup. `package.json`/lockfiles fijan dependencias y scripts; `tsconfig*`, ESLint configs y `.env.example` configuran desarrollo. `mobile/app.json`, `eas.json`, `mobile/vercel.json` configuran Expo/build/web; `backend/vercel.json` está vacío. JSON de auditoría/seeds no es necesariamente esquema productivo vigente. Existe `mobile/cambios-expo.patch`, artefacto de cambios que no se trata como código ejecutable de aplicación.

## Funciones críticas para poder localizar

| Símbolo | Archivo | Cuándo/entrada/salida y conexiones |
|---|---|---|
| `authenticate` | `backend/src/middlewares/auth.middleware.ts` | Cada endpoint protegido; Bearer → identidad/permiso confiable en locals; error 401/403 |
| `loginUser` | `backend/src/services/auth.service.ts` | login; body → sesión; valida, consulta usuario, bcrypt, estado y verificación |
| `registerUser` | mismo | registro; datos → usuario/challenge; evita role client-supplied, hash y email |
| `verifyAccessToken` | `backend/src/services/token.service.ts` | middleware; token → subject o error |
| `apiRequest` | `mobile/src/services/api.ts` | llamada HTTP móvil; path/options → data o ApiError |
| `AuthProvider` | `mobile/src/contexts/AuthContext.tsx` | montaje de app; mantiene sesión/renovación y provee acciones |
| `acceptInvitation` | `backend/src/services/invitation.service.ts` | POST de aceptación; token+password → transacción que activa cuenta |
| `createDueAppointmentReminders` | `backend/src/services/notifications.service.ts` | cron; sin args → # de inbox rows creadas |
| `deactivateAdminUser` | admin repository | delete de usuario por superadmin → soft disable + audit |
| `shutdown` | `backend/src/server.ts` | SIGINT/SIGTERM → limpia timer, HTTP y pool |

El inventario agrupado busca que puedas navegar las áreas relevantes; no sustituye una referencia exhaustiva por cada función privada/helper. Para rastrear un comportamiento concreto, partir de ruta UI/backend y usar “Find references” o `rg -n "nombre"`.
