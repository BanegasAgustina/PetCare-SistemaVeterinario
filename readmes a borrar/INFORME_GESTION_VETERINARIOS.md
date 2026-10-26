# Gestión veterinaria y autorización de PetCare

Fecha: 1 de octubre de 2026. Implementación en el workspace; no se aplicaron cambios en una base real ni se publicaron servicios. Este informe responde los 19 puntos del pedido. Referencia del contrato: [backend/README.md](backend/README.md#autorización-y-permisos--gestión-veterinaria).

## 1. Modelo anterior de VETERINARIAN

Era un código en el catálogo `roles` (seed), referenciado mediante `users.role_id`. `users` guardaba identidad, hash bcrypt, estado y verificación. No existían perfil veterinario, especialidades, permisos, asignaciones ni panel profesional. El esquema versionado 001–003 fue inspeccionado antes de crear 004. La base configurada y MySQL loopback no respondieron; no se pudo introspectar un esquema desplegado ni confirmar si tiene deriva respecto del repositorio. Si existen cuentas VETERINARIAN antiguas sin perfil, no se inventan matrículas: deberán regularizarse con datos reales antes de utilizar funciones clínicas.

## 2. Tablas y componentes reutilizados

`roles`, `users`, `pets`, `email_verifications`, `schema_migrations`; pool MySQL/consultas parametrizadas, ejecutor de migraciones/seeds, JWT, bcrypt, SMTP, errores seguros y rate limiter. En mobile: Login, AuthContext, almacenamiento de sesión, ThemeContext, Safe Area, AppInput, ScreenContainer, AppButton, FormNotice, ConfirmModal/AppModal y toast. Registro/Login conservan VerificationCodeModal.

## 3. Migración

Se agregó únicamente `004_veterinarian_authorization.sql`, sin modificar 001–003. Asegura roles iniciales y SUPER_ADMIN, agrega `users.session_version` e índice de búsqueda, y crea `veterinarians`, `specialties`, `veterinarian_specialties`, `permission_modules`, `permissions`, `role_permissions`, `user_permissions`, `veterinarian_invitations` y `veterinarian_patients`. Carga catálogos y permisos base en MySQL; no carga cuentas. PK/FK/UNIQUE/CHECK/índices y 3FN se detallan en backend/README.md. Las FKs nuevas son restrictivas.

## 4. Creación

Super Admin → Gestión → Veterinarios → Crear veterinario. Pantalla con datos personales, matrícula, especialidades, cuenta, permisos y revisión. La API valida campos y catálogos y persiste usuario, perfil, relaciones, excepciones e invitación en una transacción. Buscador por nombre/apellido/email/matrícula, estado, especialidad, orden y páginas de 20 filas; no carga todo el listado.

## 5. Contraseña e invitación

SMTP envía un enlace con token aleatorio de 256 bits, hash SHA-256 en DB, duración de 24 horas, uso único y cooldown de 60 segundos para reenviar. No devuelve secreto al administrador. El profesional elige su contraseña en `/activate-vet`; backend guarda bcrypt y verifica email mediante posesión del enlace. Configurar SMTP y la URL HTTPS real de esa pantalla. El token va en fragmento, se limpia del navegador y no se persiste en el frontend. El hash inicial corresponde a una contraseña aleatoria desconocida. También sirve para restablecimiento iniciado por Super Admin. Si SMTP falla después del commit, la cuenta se conserva y el fallo se informa/almacena; no hay reintentos automáticos de outbox.

## 6. Rol automático

Crear busca el ID de rol por código `VETERINARIAN` en MySQL y lo asigna desde backend. Rechaza `role`, `password`, `password_hash` y otros campos inesperados. Registro público mantiene CLIENT. SUPER_ADMIN se prepara exclusivamente mediante consola confiable `npm run admin:promote -- <ID_REAL>` de una cuenta real activa/verificada; nunca mediante formulario ni por email/ID fijo. ADMIN no se promueve automáticamente.

## 7. Especialidades

MySQL contiene el catálogo; la app lo consulta y permite una o varias. PK compuesta en la relación N:M impide duplicados. La API exige al menos una y valida IDs existentes dentro de la transacción. Se pueden crear y renombrar especialidades manteniendo relaciones.

## 8. Almacenamiento de permisos

Catálogo `permissions` relacionado con `permission_modules`; grants de rol en `role_permissions`; excepciones booleanas en `user_permissions`. No se almacena un array por profesional en React Native ni JSON en MySQL. Solo contratos de rutas/códigos conocidos se utilizan en middleware; los grants reales salen de la DB.

## 9. Permisos efectivos

Sin excepción se hereda. `allowed=true` concede, `allowed=false` deniega, aun si el rol concede. Ausencia o `allowed=null` restaura herencia. PUT reemplaza las excepciones completas. Permisos críticos solo pueden ser efectivos para SUPER_ADMIN; la API de veterinarios rechaza modificarlos. La UI muestra origen, excepción y acción para restaurar herencia.

## 10. Protección backend

JWT válido → usuario activo/verificado y versión de sesión → permisos MySQL → requireRole → requirePermission → scope → controlador. Gestión requiere SUPER_ADMIN y permisos administrativos pertinentes. Una denegación responde 403. Autorización se recalcula en cada solicitud, sin grants dentro del JWT. `requirePatientScope` consulta asignaciones desde la identidad autenticada, no un ID de profesional enviado por cliente. No existen aún CRUD clínico/tienda: su futura implementación deberá usar esta cadena y validar autoría para acciones `update_own`. Los endpoints de metadatos del panel ya devuelven 403 ante entrada manual a módulos sin permiso.

## 11. Panel dinámico y Login

Un Login y layouts seleccionados por el rol de backend. `/auth/me` y Login incluyen `roleName`, `permissions` y `veterinarian`. Un solo `/vet` y una pantalla compartida de módulos. El backend calcula navegación con permisos efectivos y `opens_module`; conceder una acción no concede automáticamente visualización. La home refresca módulos también cuando cambia el perfil/permisos al retomar la app. Solo se conserva token/expiración en sesión. No se muestran estadísticas inventadas: agenda, pacientes del día y clínica completa figuran pendientes con métricas null.

## 12. Desactivación

ConfirmModal confirma que dejará de acceder y que se conservarán sus registros. PATCH de estado cambia `users.is_active`, aumenta `session_version` y elimina desafíos vigentes. Login/JWT quedan bloqueados. Reactivar no restaura JWT anteriores; exige Login nuevo y, si nunca configuró contraseña, una nueva invitación.

## 13. Historial

No hay DELETE HTTP de veterinarios. Se conserva el ID profesional, usuario, especialidades y asignaciones. FKs restrictivas evitan eliminar relaciones históricas. Las tablas clínicas todavía no existen: deberán apuntar al profesional que firmó cada registro con RESTRICT; no se fabricó historial para esta entrega.

## 14. Endpoints

Todos bajo `/api`:

- GET `/admin/veterinarians/catalog`, `/admin/veterinarians`, `/admin/veterinarians/:id`.
- POST `/admin/veterinarians`.
- PUT `/admin/veterinarians/:id`, `/admin/veterinarians/:id/permissions`.
- PATCH `/admin/veterinarians/:id/status`.
- POST `/admin/veterinarians/:id/invitation`.
- GET/POST `/admin/specialties`, PUT `/admin/specialties/:id`.
- POST `/auth/veterinarian-invitations/accept`.
- GET `/vet/home`, `/vet/modules/:module`.
- Login y `/auth/me` existentes amplían usuario; no hay Logins separados.

backend/README.md incluye accesos requeridos, payloads, respuestas y errores reales.

## 15. Archivos creados

Backend:

- `backend/migrations/004_veterinarian_authorization.sql`
- `backend/src/types/authorization.ts`
- `backend/src/repositories/authorization.repository.ts`
- `backend/src/repositories/veterinarian.repository.ts`
- `backend/src/middlewares/permission.middleware.ts`
- `backend/src/validators/veterinarian.validator.ts`
- `backend/src/services/invitation.service.ts`
- `backend/src/routes/veterinarian.routes.ts`
- `backend/src/database/promote-super-admin.ts`
- `backend/tests/permissions.test.ts`
- `backend/tests/integration/veterinarians.test.ts`

Mobile:

- `mobile/src/types/veterinarian.ts`
- `mobile/src/utils/role-home.ts`
- `mobile/src/components/ui/SelectionRow.tsx`
- `mobile/src/app/activate-vet.tsx`
- `mobile/src/app/admin/_layout.tsx`
- `mobile/src/app/admin/index.tsx`
- `mobile/src/app/admin/veterinarians/_layout.tsx`
- `mobile/src/app/admin/veterinarians/index.tsx`
- `mobile/src/app/admin/veterinarians/[id].tsx`
- `mobile/src/app/admin/veterinarians/specialties.tsx`
- `mobile/src/app/vet/_layout.tsx`
- `mobile/src/app/vet/index.tsx`
- `mobile/src/app/vet/[module].tsx`
- `mobile/tests/role-home.test.ts`

También este informe. El bundle de comprobación se generó en una carpeta temporal fuera del repositorio; el preview temporal se detuvo.

## 16. Archivos modificados

Backend:

- `backend/src/types/auth.ts`
- `backend/src/repositories/user.repository.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/services/token.service.ts`
- `backend/src/services/mail.service.ts`
- `backend/src/validators/auth.validator.ts`
- `backend/src/routes/index.ts`
- `backend/src/app.ts` (CORS admite PUT/PATCH)
- `backend/.env.example` (sin credenciales)
- `backend/package.json`
- `backend/tests/helpers/smtp.ts`
- `backend/tests/integration/auth.test.ts` (limpia recursos si falla setup DB)
- `backend/README.md`

Mobile y documentación:

- `mobile/src/types/auth.ts`
- `mobile/src/services/auth.service.ts`
- `mobile/src/services/api.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/utils/auth-validation.ts`
- `mobile/src/app/index.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/account.tsx`
- `mobile/tests/auth.test.ts`
- `README.md`

No se agregó ninguna dependencia. No se stagearon ni commitearon los cambios; el workspace ya contenía cambios y archivos sin seguimiento anteriores al pedido. No se modificó la imagen preexistente marcada por Git.

## 17. Pruebas y resultados

- Backend `npm test`: **12/12 pasan**. Herencia, deny/grant, barrera de rol crítico, inputs prohibidos, token/hash, versión JWT, auth/health/rate limit/verificación.
- Mobile `npm test`: **7/7 pasan**. Identidad/password, contratos de red, permisos de `/me` actualizados, navegación por rol, verificación existente.
- Backend `npm run build`: **pasa**.
- Expo `export --platform web`: **pasa**, bundle con todas las rutas. No equivale a una prueba visual ni a una integración clínica.
- `db:check`: **DB_UNAVAILABLE**, tanto configuración actual como MySQL loopback. No se encontró servicio MySQL registrado disponible.
- `test:db`: **no certificada**. Primer intento detectó host no loopback y se detuvo por la barrera de seguridad; reintento con host loopback/base `_test` falló al conectar, antes de ejecutar migraciones y subpruebas. No se omitió silenciosamente el fallo.
- Suite de integración agregada cubre creación/rol, catálogos/relaciones, escalamiento, overrides, cambios de permisos con JWT vigente, 403 manual, rollback, filtros, scope de paciente, expiración, consumo concurrente, rotación, SMTP fallido, revocación, activación/desactivación y cambio de email. Necesita MySQL real para comprobarse.
- Revisión visual intentada con navegador local: no ejecutada por fallo del kernel de la herramienta en ambos intentos. No se afirma aprobación visual de pantallas autenticadas ni funcionamiento SMTP real.

## 18. TypeScript y lint

Backend y mobile: `npm run typecheck` y `npm run lint` **pasan sin errores ni advertencias de lint**. La exportación mostró únicamente avisos de entorno NO_COLOR/FORCE_COLOR, ajenos al código de la app. Las pruebas de integración también fueron chequeadas por TypeScript.

## 19. Pendientes

1. Disponer de MySQL 8 accesible, inspeccionar su esquema desplegado y aplicar 004 mediante el runner. No se modificó una base real durante esta entrega.
2. Ejecutar `test:db` completo contra base loopback `_test` con credenciales locales adecuadas. No usar producción para estas pruebas.
3. Configurar SMTP y URL HTTPS de `/activate-vet`, publicar esa pantalla en el entorno elegido y verificar correo real. Si se desea apertura nativa, configurar asociaciones Universal/App Links del dominio.
4. Preparar la primera cuenta SUPER_ADMIN con ID real mediante operador autorizado y probar el flujo visual en celular claro/oscuro con datos de prueba.
5. Clínica completa y CRUD de otros módulos administrativos solicitados para futuras etapas: consultas, turnos, vacunas, recetas, pacientes, servicios, productos, medicamentos, categorías, pedidos, promociones y destacados. No se implementaron fuera del alcance de esta arquitectura.
6. Si se despliega en varias instancias, almacén compartido para rate limit por IP; si se requiere entrega automática fiable, outbox/cola SMTP. Cooldown/token/estado de invitación ya son persistentes en MySQL.

Nada depende de cuentas predeterminadas, comparación de email/ID fijo o archivos de permisos por veterinario. Catálogos y permisos efectivos dependen de MySQL/API; no se usa Alert/alert/confirm/prompt.
