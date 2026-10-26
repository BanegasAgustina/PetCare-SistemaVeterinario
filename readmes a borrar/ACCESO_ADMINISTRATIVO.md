# Acceso administrativo de PetCare

## Crear el primer SUPER_ADMIN

Desde una terminal interactiva, con las variables reales del backend configuradas en su `.env` o entorno:

```powershell
cd C:\Users\tomat\OneDrive\Documentos\GitHub\PetCare-SistemaVeterinario\backend
npm run create:super-admin
```

El script solicita nombre, apellido, email, teléfono opcional, contraseña oculta y repetición oculta. El historial de readline está deshabilitado. No acepta credenciales en argumentos ni imprime contraseña, hash, token, email o datos personales. Para operadores con una entrada protegida existe `npm run create:super-admin -- --stdin`: recibe un JSON por stdin con `firstName`, `lastName`, `email`, `phone` y `password`. No pongas credenciales en un comando guardado en el historial ni en el repositorio; la terminal interactiva es el flujo recomendado.

El bootstrap reutiliza `validateRegister` y el mismo `hashPassword` con bcrypt y `BCRYPT_SALT_ROUNDS` que utiliza el registro. Normaliza el email, valida contraseña y teléfono, consulta el ID real de `SUPER_ADMIN` en `roles`, rechaza emails existentes y rechaza la operación si ya existe cualquier usuario con ese rol, incluso inactivo. Un lock de base y la transacción serializan bootstraps concurrentes. Se inserta solamente la cuenta real que el operador indique; no se generan credenciales ni usuarios automáticamente.

La fila de `users` guarda `role_id` consultado, identidad validada, `password_hash` bcrypt, `is_active=1` y `email_verified_at=UTC_TIMESTAMP(3)`. La verificación administrativa se justifica exclusivamente por el operador local que ya posee acceso privilegiado a MySQL y establece la contraseña fuera del registro público. No existe un endpoint HTTP de bootstrap ni una opción de registro público administrativo. El comando anterior `admin:promote` permanece como operación explícita de consola sobre una cuenta existente; no es utilizado por este bootstrap ni por el registro público.

## Auditoría del esquema y sesión

Se inspeccionaron las tablas reales Railway `users`, `roles`, `permissions`, `permission_modules`, `role_permissions`, `user_permissions` y `veterinarian_invitations`. No se recrearon tablas, no se cambiaron migraciones aplicadas y no se ejecutaron INSERTs, seeds ni modificaciones de usuarios/grants durante esta implementación. No hace falta una migración para este acceso: la estructura existente lo soporta.

En la consulta real de esta auditoría, `SUPER_ADMIN` tenía 29 grants, `VETERINARIAN` 17 y `ADMIN`/`CLIENT` cero grants de `role_permissions`. Estos números son el resultado de la consulta, no defaults de código. No se le otorgó ningún permiso automáticamente a ADMIN. El primer Super Admin puede definir sus grants en el panel de Roles antes de crear otros administradores.

La aplicación existente no tiene refresh tokens ni un endpoint de renovación. Se conserva su JWT de acceso con vencimiento: lleva identidad en `sub` y `sessionVersion`, no grants ni rol como fuente de verdad. `authenticate` verifica firma/algoritmo/issuer/audience, vuelve a consultar el usuario y exige cuenta activa, email verificado y versión de sesión vigente. Luego consulta rol y permisos reales en MySQL. Cambiar rol/estado incrementa `session_version`; cambiar permisos afecta la autorización en la siguiente solicitud. No se implementó un sistema adicional de refresh tokens.

## Rol, permisos, /auth/me y navegación

`users.role_id → roles` entrega `role` y `roleName`. `readPermissions` consulta `permissions`, `role_permissions` y `user_permissions`: sin override hereda, `allowed=0` niega y `allowed=1` concede. Los permisos marcados administrativos (`is_critical`) no son efectivos para CLIENT/VETERINARIAN. ADMIN/SUPER_ADMIN sí pueden tenerlos mediante grants u overrides reales; ninguno recibe un bypass por rol. No se utiliza email, nombre ni un ID fijo para conceder autorización.

`GET /api/auth/me` conserva el contrato existente:

```text
{ success: true, data: { user: {
  id, firstName, lastName, email, phone,
  role, roleName, permissions: [códigos efectivos de MySQL], veterinarian
} } }
```

No contiene password_hash, versión interna, refresh tokens ni secretos. `AuthContext.signIn` ahora realiza Login → JWT → /auth/me antes de conservar la sesión. La restauración, el retorno desde segundo plano y la recuperación ante 403 también reconsultan el perfil. `hasRole`/`hasPermission` usan ese usuario; solamente controlan presentación. `roleHome` mantiene CLIENT → /client, VETERINARIAN → /vet, ADMIN/SUPER_ADMIN → /admin.

`GET /api/admin/home` arma los accesos con los permisos efectivos y etiquetas del catálogo MySQL. El mapa de rutas implementadas es configuración de navegación; no es un catálogo de usuarios ni una lista de grants personales. Se muestran Usuarios, Roles, Permisos, Veterinarios, Especialidades y Productos/Stock/Precios según permisos. No se agregaron módulos clínicos futuros a este trabajo.

## Gestión de cuentas y permisos

Usuarios permite listar/buscar datos reales, crear por invitación, editar identidad básica, cambiar rol/estado y gestionar overrides. Cambios de estado y privilegios se confirman con ConfirmModal; inputs muestran errores inline y éxito usa el toast existente. No se borran usuarios. El backend revalida al actor dentro de transacciones serializadas antes de mutaciones de usuarios/roles/permisos/productos.

Un ADMIN no puede modificar cuentas/roles SUPER_ADMIN ni asignar ese rol. Nadie puede delegar o cambiar permisos que no posee. No se puede cambiar el propio rol/estado ni los propios overrides; no se desactiva el último Super Admin activo y verificado. Los cambios de grants del rol no pueden quitar al operador su acceso efectivo a roles/permissions.manage. CLIENT/VETERINARIAN no pueden acceder a estos endpoints aunque envíen un role_id o intenten abrir una ruta directamente.

Los usuarios nuevos no reciben una contraseña permanente elegida por el administrador: se guarda un hash provisional aleatorio y el destinatario establece su contraseña mediante una invitación con 256 bits, hash SHA-256 en DB, vencimiento de 24 h y un solo uso. Se reutiliza la tabla existente `veterinarian_invitations`, cuya FK real apunta a `users`, y el SMTP existente. El nombre histórico de la tabla se conserva para evitar duplicación/migración innecesaria. El token viaja en el fragmento del enlace; la pantalla lo mantiene en memoria y lo quita de la URL web.

Configurar `ACCOUNT_INVITATION_URL` con la URL HTTPS real publicada de `/activate-account`. Si está ausente/vacía se admite la URL veterinaria ya configurada: esa pantalla conserva la compatibilidad con las invitaciones existentes. SMTP sigue usando las variables actuales. El bootstrap no requiere SMTP; la creación por panel sí requiere la configuración de invitaciones. Si falla el envío, la cuenta creada es real pero sigue sin verificar; se informa el fallo y se permite reenviar con cooldown.

Veterinarios sigue creando `users` + `veterinarians` + `veterinarian_specialties` y la invitación en transacción. ADMIN/SUPER_ADMIN con `veterinarians.manage` pueden gestionar perfiles e invitar; modificar overrides exige además `permissions.manage` y no permite grants no poseídos ni permisos administrativos para veterinarios. El módulo Usuarios no convierte cuentas hacia/desde VETERINARIAN para no destruir perfiles/relaciones; esa creación se realiza en Veterinarios.

Productos edita los registros reales de `client_products`. `products.update` controla nombre/descripción/estado, `products.update_stock` controla stock y `products.update_price` controla precio; un permiso no implica los otros. No se implementó creación de productos sin un permiso específico.

## Endpoints protegidos

Todos los recursos administrativos exigen JWT vigente y rol ADMIN/SUPER_ADMIN. Además:

| Endpoint bajo /api | Permisos requeridos |
| --- | --- |
| GET /admin/home | Rol administrativo; solo retorna accesos autorizados |
| GET /admin/catalog | Alguno de users.manage, roles.manage, permissions.manage |
| GET /admin/users, GET /admin/users/:id, PUT /admin/users/:id | users.manage; cambiar rol exige roles.manage y límites de delegación |
| POST /admin/users | users.manage + roles.manage; invitación y rol validados en backend |
| PUT /admin/users/:id/permissions | users.manage + permissions.manage; límites de delegación/scope |
| POST /admin/users/:id/invitation | users.manage; target/estado/cooldown revalidados |
| GET /admin/roles | roles.manage |
| PUT /admin/roles/:id | roles.manage + permissions.manage; límites de delegación |
| GET /admin/permissions | permissions.manage |
| /admin/veterinarians y sus recursos | veterinarians.manage; cambios de overrides exigen además permissions.manage |
| /admin/specialties | specialties.manage |
| GET /admin/products | Alguno de products.update, products.update_stock, products.update_price |
| PATCH /admin/products/:id | Cada permiso correspondiente a los campos enviados |
| GET /auth/me | JWT, usuario activo/verificado y session_version válido |

Sin rol/permiso se responde 403; sin sesión válida 401. `POST /auth/register` permanece público pero acepta únicamente identidad/password y crea CLIENT por el ID resuelto en DB. `POST /auth/invitations/accept` y la ruta veterinaria anterior son públicos solamente para aceptar un token restringido, válido y de un solo uso; no aceptan rol ni permisos. Registro/login/invitaciones conservan rate limiting. Las consultas parametrizan los valores y los identificadores de usuario se obtienen del JWT o son targets validados, nunca una identidad libre de frontend.

## Archivos del trabajo

Backend creados: `src/database/create-super-admin.ts`, `src/services/bootstrap-super-admin.service.ts`, `src/services/password.service.ts`, `src/repositories/admin.repository.ts`, `src/routes/admin.routes.ts`, `src/utils/admin-authorization.ts`, `tests/admin-access.test.ts`.

Backend modificados: `package.json`, `.env.example`, `src/services/auth.service.ts`, `src/services/invitation.service.ts`, `src/services/mail.service.ts`, `src/repositories/authorization.repository.ts`, `src/repositories/veterinarian.repository.ts`, `src/middlewares/permission.middleware.ts`, `src/routes/index.ts`, `src/routes/veterinarian.routes.ts`, `src/types/authorization.ts`.

Mobile creados: `src/types/admin.ts`, `src/services/admin.service.ts`, `src/hooks/useAdmin.ts`, `src/utils/authorization.ts`, `src/components/forms/ActivationForm.tsx`, `src/components/admin/SpecialtiesScreen.tsx`, `src/app/activate-account.tsx`, `src/app/admin/users/_layout.tsx`, `src/app/admin/users/index.tsx`, `src/app/admin/users/[id].tsx`, `src/app/admin/roles.tsx`, `src/app/admin/permissions.tsx`, `src/app/admin/products.tsx`, `src/app/admin/specialties.tsx`, `tests/admin-authorization.test.ts`.

Mobile modificados: `src/contexts/AuthContext.tsx`, `src/services/api.ts`, `src/app/_layout.tsx`, `src/app/activate-vet.tsx`, `src/app/admin/index.tsx`, `src/app/admin/_layout.tsx`, las pantallas/layout de `src/app/admin/veterinarians`. Se conservaron los cambios anteriores de mascotas y los respaldos/test/migraciones previamente eliminados por el usuario. No se agregaron dependencias en este trabajo.

## Verificaciones y prueba manual

Pasaron TypeScript y lint en ambos proyectos, los 9 tests de backend y los 4 tests móviles disponibles, el build del backend y el export de bundles Android/web. `git diff --check` no detectó errores. Las pruebas aisladas de bootstrap usan una conexión fixture exclusiva de tests para comprobar resolución de ID real, bcrypt, duplicados, bootstrap repetido y rollback sin insertar usuarios de demostración. Las pruebas HTTP cubren falta de sesión, registro con escalación, CLIENT/ADMIN/SUPER_ADMIN sin grants, ADMIN con grant real de la fixture, /me sin hash, revocación de grants, usuario inactivo, email sin verificar y session_version cambiado. Los tests móviles comprueban navegación independiente de email/ID y ausencia de bypass por Super Admin.

La búsqueda global en producción y respaldos de admin@/isAdmin/isSuperAdmin/mock/fake/sample/demo/dummy/placeholderData/testData solo encontró el dummyHash de seguridad existente, que se conserva para reducir diferencias de tiempo en Login. Se revisaron los usos de ADMIN/SUPER_ADMIN/role_id/user.id/user.email: las comparaciones de identidad protegen el propio usuario o relacionan registros, no conceden privilegios por una identidad fija. No se encontraron alerts y no se agregaron registros funcionales ficticios.

Pasos para la prueba con personas reales:

1. Desplegar el backend/frontend modificados conservando la DB y las variables existentes. No ejecutar seeds ni recrear roles/tablas.
2. Ejecutar `npm run create:super-admin` en una terminal del backend conectado a esa DB. Ingresar tus datos reales y una contraseña propia que cumpla las reglas. Si ya hay Super Admin, el comando rechaza la creación; entrar con la cuenta existente.
3. Abrir el Login habitual y usar esas credenciales. Confirmar en la ficha de cuenta o `/auth/me` el role/roleName/permissions sin secretos, y la navegación automática a Gestión.
4. En Roles seleccionar ADMIN y conceder solamente los permisos que querés que tenga. Guardar tras revisar el modal. Los grants vienen de MySQL y no requieren recompilar.
5. Configurar SMTP/ACCOUNT_INVITATION_URL reales. En Usuarios crear la cuenta administrativa con datos de una persona real y el rol ADMIN. El destinatario abre el correo, establece su contraseña y vuelve al Login único.
6. Verificar que ADMIN solo vea sus módulos y que las llamadas directas a endpoints sin grant respondan 403. Retirar un grant u establecer un override Negar; comprobar que deja de ser efectivo en la siguiente solicitud y tras refrescar /me.
7. En Veterinarios, con veterinarians.manage, registrar un profesional real con matrícula/especialidades existentes y enviar su invitación. No se debe conceder un override que el operador no posea.
8. Comprobar que un CLIENT/VETERINARIAN no pueda asignarse rol/permisos, que role/role_id/permissions en registro público se rechacen y que desactivar/cambiar rol revoque el JWT anterior.
9. Verificar interacción en Android/Expo Go y presentación claro/oscuro con las cuentas reales. El build de bundles no sustituye esa prueba física.

No se creó un administrador real durante el desarrollo porque no se recibieron sus datos y no se inventaron credenciales. No se enviaron invitaciones reales de prueba. La prueba completa con cuentas, SMTP y MySQL queda para el operador usando sus datos; no se presenta como ya realizada.
