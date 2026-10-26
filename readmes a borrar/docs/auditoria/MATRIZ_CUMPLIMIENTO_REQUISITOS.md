# Matriz de cumplimiento de requisitos

Fecha de evaluación: 22/10/2026. Estados según el brief del usuario. “Evidencia” señala la fuente inspeccionada; no implica verificación de servicio externo.

| ID | Categoría / requisito | Estado | Evidencia / verificación | Hallazgo y acción |
|---|---|---|---|---|
| A01 | Registro de email | CUMPLE PARCIALMENTE | Auth routes/services y validadores; no se probó SMTP actual | Probar en staging |
| A02 | Hash seguro / no guardar contraseña | CUMPLE | bcrypt y campo `password_hash` en auth service/migration | Mantener |
| A03 | Rol inicial asignado server-side; no auto ADMIN/VET | CUMPLE | Auth register y rutas especiales administrativas | Prueba de seguridad integración |
| A04 | Login, cuenta inactiva, errores/carga, redirección por permiso | CUMPLE PARCIALMENTE | AuthContext, middleware, mobile routes | UI real y estados backend no verificados |
| A05 | Verificación de correo | CUMPLE PARCIALMENTE | verification service, token/code temporal | SMTP externo no verificado |
| A06 | Recuperación de contraseña con expiración/uso único | CUMPLE PARCIALMENTE | password-reset service/repository | Entrega y expiración reales no verificadas |
| A07 | MFA/2FA distinto de email reset | NO IMPLEMENTADO | No se encontró TOTP/WebAuthn/segundo factor | Alta prioridad: diseñar MFA |
| A08 | Google OAuth | CUMPLE PARCIALMENTE | oauth-provider/service y mobile README | Configuración y web/Android real no verificadas |
| A09 | Facebook OAuth | CUMPLE PARCIALMENTE | oauth-provider/service y config | Configuración y operación no verificadas |
| A10 | X OAuth | CUMPLE PARCIALMENTE | OAuth 2/PKCE y perfil X en backend | Credenciales/alcances externos no verificados |
| A11 | Tres proveedores operativos, incluyendo Google | NO VERIFICABLE | Código cubre tres; no se ejecutaron proveedores | Solo declarar completo tras prueba E2E |
| A12 | Access JWT firma/issuer/audience/expiry | CUMPLE PARCIALMENTE | token.service/env | Se verificó código; no se probó clave de despliegue |
| A13 | Refresh rotativo/revocación | CUMPLE PARCIALMENTE | session/oauth repositories, AuthContext | Sin test DB ni revocación en remoto |
| A14 | Persistencia sesión nativa/web | CUMPLE PARCIALMENTE | SecureStore native y sessionStorage web | No device/browser QA |
| R01 | Al menos 3 roles funcionales | CUMPLE | seis códigos, rutas y pantallas | Usuarios/grants reales no auditados |
| R02 | Roles administrables desde UI | CUMPLE PARCIALMENTE | admin roles/users/perms | Alta dinámica de rol arbitrario no observada; codes cerrados |
| R03 | Grants por rol/usuario con backend | CUMPLE PARCIALMENTE | authorization repository/middlewares/repos | No se leyó grant matrix del entorno |
| R04 | Reflejar cambios de permiso | CUMPLE PARCIALMENTE | /me y relectura backend cada solicitud | No prueba de sesión frente a DB real |
| R05 | Hardcoding coherente | CUMPLE PARCIALMENTE | RoleCode y condiciones conocidas fijas | Contratos por rol necesarios, no añadir roles sin cambios |
| R06 | Scope clínico por recurso | CUMPLE PARCIALMENTE | patientScope/appointments en clinic.repository | Pruebas unitarias limitadas, sin integración DB |
| C01 | Pacientes compartidos con filtrado por rol | CUMPLE PARCIALMENTE | repositorio clínico y pantallas role-routed | No end-to-end de scope |
| C02 | Productos catálogo central y usos por rol | CUMPLE | tablas/repos cliente, vet, admin | Permisos efectivos no observados |
| C03 | Turnos y reglas comunes | CUMPLE PARCIALMENTE | appointments/slots y clinic-rules | Disponibilidad/estado no probados contra DB |
| C04 | Reutilización UI | CUMPLE PARCIALMENTE | componentes clinic/client compartidos | No métricas de duplicación automatizadas |
| U01 | Identidad visual, verde, huellas | CUMPLE PARCIALMENTE | tokens/assets/ScreenContainer; test de decoración | QA visual pendiente |
| U02 | Decoraciones no bloquean interacción | CUMPLE | `pointerEvents=none`; test mobile “shared PetCare background…” | Test de componente, no e2e táctil |
| U03 | Validación y error de formularios | CUMPLE PARCIALMENTE | forms/validators/API | Inputs en dispositivo NO VERIFICABLE |
| U04 | Accesibilidad básica | CUMPLE PARCIALMENTE | labels/roles en controles | Sin auditoría de lector/contraste |
| U05 | Responsive Android/web/tablet/desktop | NO VERIFICABLE | breakpoints y react-native-web en código | Prueba visual manual pendiente |
| N01 | Expo Router, rutas protegidas y layouts por rol | CUMPLE PARCIALMENTE | `mobile/src/app`, AuthContext y global navigation | No test deep-link/recovery visual |
| N02 | Deep links y restauración | CUMPLE PARCIALMENTE | scheme `petcare`, route `/oauth`, session restore | Custom scheme requiere build propio; no probado |
| S01 | Context API para estado global | CUMPLE PARCIALMENTE | Auth/Theme/Checkout/Feedback providers | Sin profiling de rerenders |
| S02 | Limpieza sesión y permiso actualizado | CUMPLE PARCIALMENTE | AuthContext/session store; backend reconsulta | Revocación inmediata de access token limitada por TTL |
| API01 | Cliente HTTP central / base configurable | CUMPLE PARCIALMENTE | mobile services/api.ts y env/config | URL de producción hardcode fallback; documentada |
| API02 | Timeout/errores seguros | CUMPLE | 12s, errores públicos y logs acotados | No retries ni cancelación general |
| API03 | REST y contratos | CUMPLE PARCIALMENTE | routes y JSON envelope | No OpenAPI exhaustivo |
| API04 | Backend valida autorización en servidor | CUMPLE PARCIALMENTE | auth/permission middleware + repos | Cobertura vista estáticamente; grants remotos desconocidos |
| API05 | Middleware de seguridad, CORS, headers, rate limit | CUMPLE PARCIALMENTE | app.ts, helmet, cors, express-rate-limit | Store distribuido no verificado |
| CRUD01 | Mascotas con ciclo seguro | CUMPLE PARCIALMENTE | create/read/update/deactivate; no hard delete | No restore observado |
| CRUD02 | Turnos/reservas | CUMPLE PARCIALMENTE | create/read/update/status transitions | Eliminación física no aplica; integración pendiente |
| CRUD03 | Usuarios/profesionales | CUMPLE PARCIALMENTE | alta/edición/desactivación/invitación | Sin eliminación física intencional |
| CRUD04 | Productos/categorías/servicios | CUMPLE PARCIALMENTE | CRUD admin con is_active/archivado en repos | Lifecycle varía por entidad |
| CRUD05 | Historia clínica/vacunas/recetas/estudios | CUMPLE PARCIALMENTE | lectura y create; estudios adjuntos no observados | Falta edit/archive y estudios dedicados |
| CRUD06 | Pedidos/pagos | CUMPLE PARCIALMENTE | historial de estado y revisión manual | No borrado; estados reales dependen de DB/migraciones |
| DB01 | MySQL/MariaDB y relaciones | CUMPLE PARCIALMENTE | Snapshot 21/10: MariaDB 11.8.9, InnoDB/FK/indexes | No conexión actual; reconstrucción base incompleta |
| DB02 | SQL parametrizado | CUMPLE PARCIALMENTE | repositorios mysql2 usan placeholders; revisión estática | Inventario completo de 109 referencias en snapshot, no cada query auditada manualmente |
| DB03 | Migraciones fuente completas | NO CUMPLE | SQL base/histórico ausentes; README advierte | Recuperar archivos antes de cambios de DB |
| DB04 | Runners bootstrap/migrate apuntan a archivos presentes | NO CUMPLE | Rutas resuelven `backend/bootstrap` y `backend/migrations`, directorios ausentes | Restaurar/verificar fuente antes de operar cualquier DB |
| D01 | API documentada por endpoint/error/permisos | CUMPLE PARCIALMENTE | backend README extensa | Falta especificación OpenAPI completa y drift check |
| Q01 | TypeScript/lint mobile | CUMPLE | typecheck + expo lint ejecutados | 0 errores observados |
| Q02 | TypeScript/lint backend | CUMPLE | typecheck + eslint ejecutados | 0 errores observados |
| Q03 | Pruebas unitarias locales | CUMPLE | mobile 12/12; backend 28/28 | No integración DB ni E2E |
| EC01 | Modo demo controlado por backend | CUMPLE PARCIALMENTE | env.STORE_DEMO_MODE; demo card sin PAN y sin stock; tests de checkout | Configuración de entorno no leída ni activada |
| EC02 | Transferencia real | CUMPLE PARCIALMENTE | intents expirables, proof storage y revisión manual en código | Requiere migración 013 pendiente en snapshot, banco/storage remoto no verificados |
| EC03 | Proveedor tarjeta real | NO IMPLEMENTADO | checkout describe simulación; sin gateway integrado | Especificar proveedor antes de cobrar |
| APK01 | EAS config | CUMPLE PARCIALMENTE | `app.json`, `eas.json`, projectId | Perfil/credenciales externas no revisadas |
| APK02 | APK probado/distribuible | NO VERIFICABLE | No build ejecutado; package genérico | Configurar identificador, probar OAuth/push y generar build en autorización futura |
| DOC01 | README alineado con dependencias | CUMPLE PARCIALMENTE | README raíz dice Expo 57, manifest 58 | Corregir deriva en etapa de implementación autorizada |

El resumen, límites y prioridades están en [auditoría general](AUDITORIA_GENERAL_PETCARE.md); no se proponen cambios aplicados en esta etapa.

## Índice de evidencia (archivo y línea)

Los IDs de cada fila anterior se corresponden con las fuentes centrales siguientes. Para evitar atribuir cada detalle a una sola línea, se listan los puntos de entrada/guardas principales; las reglas de dominio también continúan en servicios y repositorios enlazados.

| IDs | Evidencia central |
|---|---|
| A01–A07 | `backend/src/routes/auth.routes.ts:11-18`; `backend/src/services/auth.service.ts`; `verification.service.ts`; `password-reset.service.ts`; `middlewares/auth-rate-limit.middleware.ts`. |
| A08–A11 | `backend/src/routes/auth.routes.ts:21-25`; `backend/src/services/oauth.service.ts`; `oauth-provider.service.ts`; `config/oauth.ts`; `mobile/src/app/oauth.tsx`; `mobile/README.md:90-160`. |
| A12–A14 | `backend/src/services/token.service.ts:7-10`; `session.service.ts`; `middlewares/auth.middleware.ts:1-20`; `mobile/src/contexts/AuthContext.tsx:59-125`; `mobile/src/services/session-store.ts:1-40`; `web-session-store.ts:1-56`. |
| R01–R06 | `backend/src/types/auth.ts:3`; `repositories/authorization.repository.ts:9-40`; `middlewares/permission.middleware.ts:12-40`; `routes/admin.routes.ts:34-50`; `utils/admin-authorization.ts`; `repositories/clinic.repository.ts:22,82-100,153-195,261-278`. |
| C01–C04 | `backend/src/repositories/clinic.repository.ts`; `client.repository.ts`; `backend/src/services/clinic.service.ts`; `mobile/src/components/clinic/`; `mobile/src/components/client/`; `mobile/src/app/{client,vet,professional,secretary,admin}/`. |
| U01–U05 | `mobile/src/components/layout/ScreenContainer.tsx:14`; `mobile/src/components/layout/GlobalNavigation.tsx`; `mobile/src/components/forms/`; `mobile/app.json:9-12`; `mobile/tests/store-api-and-routes.test.ts`. |
| N01–N02 | `mobile/src/app/_layout.tsx`; layouts under `mobile/src/app/{client,vet,professional,secretary,admin}/`; `mobile/app.json:12,21`; `mobile/src/app/oauth.tsx`. |
| S01–S02 | `mobile/src/contexts/{AuthContext,ThemeContext,StoreCheckoutContext,FeedbackContext}.tsx`; `backend/src/repositories/authorization.repository.ts:9-40`; `middlewares/auth.middleware.ts`. |
| API01–API05 | `mobile/src/services/api.ts:72-152`; `backend/src/app.ts:20-53`; `backend/src/routes/{auth,client,clinic,admin}.routes.ts`; `backend/src/middlewares/{auth,permission,error}.middleware.ts`. |
| CRUD01–CRUD06 | `backend/src/routes/client.routes.ts:12-49`; `clinic.routes.ts:10-53`; `admin.routes.ts:35-50`; repos `client`, `clinic`, `clinic-admin`, `store-orders`. |
| DB01–DB04 | `backend/layerbase-sql-audit.json` (`generatedAt`, `sections`, `migrationHistory`); `backend/src/database/migration-files.ts:8-12`; `bootstrap.ts:9`; SQL files under `backend/*-migrations/`; `backend/README.md:599-601`. |
| D01 / Q01–Q03 | `backend/README.md`; `mobile/README.md`; package scripts in `backend/package.json` and `mobile/package.json`; ejecución local de typecheck, lint y tests registrada en auditoría general. |
| EC01–EC03 | `backend/src/config/env.ts:107`; `backend/src/services/client.service.ts` (checkout); `backend/src/repositories/store-checkout.repository.ts`; `mobile/src/app/client/(tabs)/store/checkout.tsx`; `backend/tests/store-checkout.test.ts`. |
| APK01–APK02 / DOC01 | `mobile/app.json:9-21`; `mobile/eas.json`; `mobile/package.json`; `README.md`; `mobile/README.md:160`. |
