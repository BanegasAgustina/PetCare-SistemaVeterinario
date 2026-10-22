# Permisos personales y retiro compatible de Secretaría

Fecha de revisión: 22 de octubre de 2026.

## Estado y alcance

Se implementó en la aplicación el soporte para mostrar y proteger funciones personales por permiso, y se retiró `SECRETARY` de nuevas asignaciones. No se ejecutó SQL ni se modificó Layerbase. Tampoco se asignaron permisos, se cambiaron usuarios, se borró información o se alteraron credenciales.

La base configurada no fue alcanzable durante las consultas de solo lectura. La configuración efectiva tiene `DB_HOST=petcare-curt-stone.sage.cloud.layerbase.dev`, `DB_PORT=49116` y `DB_SSL_MODE=verify_identity`; se comprobó que usuario y contraseña están configurados, sin imprimirlos. Node devuelve `getaddrinfo ENOTFOUND` para el host y la resolución de Windows responde “Acceso denegado”. En esta ejecución también falló la resolución de `sage.cloud.layerbase.dev`, `cloud.layerbase.dev` y `layerbase.dev`, así que no se puede concluir si el endpoint individual está vencido o si el entorno está bloqueando DNS/salida. La prueba TCP no obtuvo IP y no llegó a abrir conexión.

La guía vigente de Layerbase indica que el panel de conexión de cada base muestra el host y puerto asignados, y que el puerto MySQL es propio de cada base; no debe cambiarse a 3306 por suposición. También indica que `VERIFY_IDENTITY` corresponde al endpoint directo y que el modo del pooler se debe copiar del panel. La revisión pendiente es comparar host, puerto y tipo de endpoint con el Connect panel de la base correcta, sin actualizar `.env` desde este trabajo. [Guía MySQL de Layerbase](https://cloud.layerbase.com/docs/cloud/connecting/mysql)

Hay un snapshot local de metadatos generado el 21/10/2026 16:45 UTC (`backend/layerbase-sql-audit.json`): reporta auditoría completa de estructura sin errores, pero explícitamente no consultó filas de negocio. Confirma tipos/columnas, PK, unique, FK y checks del esquema en ese momento; no prueba el estado actual. `backend/schema-audit.json` es otra instantánea sin fecha y enumera 29 permisos, ninguno `personal.*`, y cuatro códigos de rol sin `SECRETARY`; no se usa para afirmar ausencia actual ni conteo vigente.

**Resultado live:** ninguna consulta SQL pudo ejecutarse. Quedan sin confirmar existencia/metadata de `personal.*`, grants efectivos del Administrador principal, cantidad actual de usuarios `SECRETARY` y diferencias reales de grants entre Secretaría y Administrador.

## Etapa 1 — Permisos personales

### Catálogo preparado y validación contra el último snapshot

El snapshot de metadatos del 21/10 confirma `permission_modules(code varchar(40) ascii_bin PK, name varchar(100), sort_order smallint unsigned DEFAULT 0)` y `permissions(id int unsigned AUTO_INCREMENT PK, code varchar(80) ascii_bin UNIQUE, name varchar(100), description varchar(255), module_code varchar(40) FK a permission_modules.code, is_critical tinyint(1) DEFAULT 0, opens_module tinyint(1) DEFAULT 0)`. Confirma checks `(0,1)` de ambos flags. En ese snapshot la FK de módulo es `ON DELETE RESTRICT`; códigos y columnas tienen longitudes compatibles con el SQL. También constan PK compuestas y FK restrictivas para `role_permissions` y `user_permissions`, FK `users.role_id → roles.id` y check `user_permissions.allowed IN (0,1)`. Esto refuerza que una retirada física de roles/permisos requiere analizar referencias y no borrarlas. El snapshot de datos local de fecha desconocida enumera 29 permisos y ninguno personal, pero la comprobación live de hoy quedó bloqueada por DNS. El SQL es compatible con el esquema documentado más reciente, sujeto a validar el esquema live al recuperar la conexión.

El SQL aditivo está en [SQL_PERMISOS_PERSONALES_PREPARADO.sql](SQL_PERMISOS_PERSONALES_PREPARADO.sql); no fue ejecutado y queda pendiente de aprobación. El índice único de `permissions.code` evita duplicados. La autoasignación en conflicto deja la fila igual; no escribe en `role_permissions`, `user_permissions` ni `users`. El preflight muestra metadata existente para detenerse si hay alguna definición incompatible.

| Código | Función | Crítico | Abre módulo operativo |
| --- | --- | --- | --- |
| `personal.pets.view` | Ver mascotas propias | No | No |
| `personal.pets.manage` | Gestionar mascotas propias | No | No |
| `personal.appointments.view` | Ver turnos propios | No | No |
| `personal.appointments.create` | Solicitar turnos | No | No |
| `personal.store.view` | Ver tienda | No | No |
| `personal.store.purchase` | Realizar compras | No | No |
| `personal.orders.view` | Ver pedidos propios | No | No |
| `personal.profile.manage` | Gestionar perfil personal | No | No |

`opens_module=0` porque los módulos personales se abren por rutas permitidas del espacio `/client`; no son módulos clínicos que se exponen por `/vet/modules/:module`. `is_critical=0` porque no son privilegios administrativos ni permiten administrar roles, usuarios o permisos. La inserción conserva definiciones existentes ante repetición y no otorga grants.

### Integración y seguridad

- El catálogo dinámico ya alimenta creación/edición de roles y overrides por usuario. Se normaliza el grupo del catálogo a “Funciones personales”; las opciones solo se habilitan según `canDelegate`, la autorización existente del actor.
- Se agregó una pantalla de acceso denegado en el layout `/client`, antes de montar la pantalla protegida. Para `CLIENT` se mantienen las rutas personales originales y las cinco pestañas nativas.
- La navegación personal de roles existentes consume los nuevos códigos. Cuando el permiso es solo `personal.appointments.create`, el acceso va directo al formulario de solicitud.
- Se ajustaron lecturas necesarias para `personal.pets.manage` y `personal.store.purchase`, de forma que puedan leer los recursos propios que necesitan administrar/comprar. `personal.appointments.create` permite únicamente la lista de mascotas propias necesaria para el selector de turno; no permite leer una ficha de mascota ni editarla. El backend conserva denegación por defecto y las validaciones de pertenencia.
- El propietario continúa derivándose de la identidad autenticada. Los permisos personales no reutilizan `pets.view_all`, `users.manage` ni otros privilegios laborales; la UI no decide autorización final.
- Una vez que el SQL de catálogo esté aprobado y ejecutado por separado, la pantalla mostrará los ocho permisos. La regla actual habilita el selector solo si el actor tiene el grant efectivo del código (`canDelegate`), y el backend vuelve a comprobarlo al guardar. Por tanto, registrar el catálogo por sí solo **no garantiza** que el Administrador principal pueda delegar los códigos nuevos. Primero se deben auditar sus grants efectivos; si faltan códigos, detenerse y aprobar una habilitación mínima separada. El SQL deliberadamente no concede grants implícitos.

Después del alta de catálogo, ejecutar en modo de solo lectura esta comprobación agregada para ver cuántos administradores principales tienen cada permiso efectivo, sin exponer sus identidades:

```sql
SELECT p.code,
       COUNT(DISTINCT u.id) AS super_admins_total,
       COUNT(DISTINCT CASE
         WHEN COALESCE(up.allowed, rp.role_id IS NOT NULL) = 1 THEN u.id
       END) AS super_admins_with_effective_permission
FROM roles r
JOIN users u ON u.role_id = r.id
CROSS JOIN permissions p
LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission_id = p.id
WHERE r.code = 'SUPER_ADMIN' AND p.code LIKE 'personal.%'
GROUP BY p.code ORDER BY p.code;
```

Las ocho filas deben tener al menos una cuenta de Administrador principal con permiso efectivo para delegar. Luego, con una cuenta de prueba en staging, confirmar que los selectores aparecen habilitados y probar asignar/leer un permiso de rol personalizado. No aplicar grants de producción como parte de esta comprobación.

### Prueba planificada con Veterinario

En staging y después de habilitar delegación, conceder mediante override individual `personal.pets.view` y `personal.store.view` a un usuario de prueba `VETERINARIAN`, sin cambiar sus grants de rol. Verificar que use Mis mascotas y Tienda con datos exclusivamente propios, que otra ficha quede denegada, y que continúe accediendo a agenda, pacientes y funciones clínicas que ya tenía. Comparar grants profesionales antes/después: deben quedar iguales. Retirar los dos overrides de prueba al finalizar. Esta prueba no se ejecutó contra producción ni contra Layerbase.

### Validaciones ejecutadas

Se agregaron pruebas unitarias para: el permiso personal separado de permisos laborales, guardas visuales de rutas, flujo de solicitud de turno con permiso de creación, acceso de gestión a lecturas necesarias y denegación de contenido no autorizado. Resultado detallado de las suites en la sección “Verificación” al final.

## Etapa 2 — Secretaría frente a Administrador

### Diferencias comprobadas en el código

`SECRETARY` es un rol operativo de clínica. Sus rutas legacy viven bajo `/secretary` y consumen `/api/clinic`; el backend admite Secretaría, con permisos efectivos, en agenda/turnos, clientes, productos y reservas. Algunas operaciones son específicas: listar/actualizar reservas y consultar clientes. El frontend conserva perfil laboral, agenda y accesos de Secretaría.

`ADMIN` y `SUPER_ADMIN` tienen panel `/admin` y rutas administrativas distintas. El acceso a usuarios, permisos, roles, catálogo, inventario, pedidos, pagos y configuración se restringe por código de rol y permisos críticos. La cuenta `ADMIN` no equivale a `SUPER_ADMIN`; por ejemplo, las operaciones de revisión de pagos y algunas acciones de cuenta son exclusivas de `SUPER_ADMIN`.

No es seguro convertir automáticamente usuarios de Secretaría a `ADMIN`: su set de grants no es equivalente, y hacerlo podría otorgar acceso administrativo o quitar funciones operativas. Tampoco es seguro copiar permisos entre ambos roles.

### Retiro compatible aplicado

- El catálogo conserva el rol y sus grants para no romper sesiones ni historial de cuentas existentes.
- `SECRETARY` ya no se muestra como opción asignable (`canAssign=false`) y el backend rechaza asignaciones nuevas. Las ediciones de datos de un usuario Secretaría siguen permitidas si no cambia su rol.
- El rol aparece como retirado y de solo lectura en la pantalla de administración de roles. El backend también rechaza modificar sus grants desde el panel.
- No se alteró `role-home.ts`, los usuarios actuales, el rol persistido, los registros históricos ni los endpoints legacy que estos pueden necesitar.

### Dependencias y revisión pendiente

El conteo actual de cuentas `SECRETARY`, activas/inactivas, y sus grants/overrides no se pudo obtener porque Layerbase no resolvió por DNS. Antes de decidir una migración, repetir las consultas de solo lectura indicadas más abajo y revisar, cuenta por cuenta, el rol destino y la matriz de permisos. La instantánea local menciona roles distintos y no debe usarse para afirmar que no existen secretarios en la base vigente.

Estas consultas agregadas permiten completar la revisión sin recuperar datos personales. Las salidas de usuario se limitan a conteos por estado/permisos:

```sql
SELECT r.code, COUNT(u.id) AS total_users,
       SUM(u.is_active = 1) AS active_users,
       SUM(u.is_active = 0) AS inactive_users
FROM roles r LEFT JOIN users u ON u.role_id = r.id
WHERE r.code IN ('SECRETARY', 'ADMIN', 'SUPER_ADMIN')
GROUP BY r.code ORDER BY r.code;

SELECT r.code, p.module_code, p.code AS permission_code,
       p.is_critical, p.opens_module
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code IN ('SECRETARY', 'ADMIN', 'SUPER_ADMIN')
ORDER BY r.code, p.module_code, p.code;

SELECT r.code, p.code AS permission_code, up.allowed, COUNT(*) AS override_count
FROM roles r
JOIN users u ON u.role_id = r.id
JOIN user_permissions up ON up.user_id = u.id
JOIN permissions p ON p.id = up.permission_id
WHERE r.code IN ('SECRETARY', 'ADMIN', 'SUPER_ADMIN')
GROUP BY r.code, p.code, up.allowed
ORDER BY r.code, p.code, up.allowed;

SELECT r.code, p.code AS permission_code,
       MAX(rp.permission_id IS NOT NULL) AS role_grants_permission,
       COUNT(DISTINCT u.id) AS role_users,
       COUNT(DISTINCT CASE
         WHEN COALESCE(up.allowed, rp.permission_id IS NOT NULL) = 1 THEN u.id
       END) AS users_with_effective_permission
FROM roles r
JOIN users u ON u.role_id = r.id
CROSS JOIN permissions p
LEFT JOIN role_permissions rp ON rp.role_id = r.id AND rp.permission_id = p.id
LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission_id = p.id
WHERE r.code IN ('SECRETARY', 'ADMIN', 'SUPER_ADMIN')
GROUP BY r.code, p.code
HAVING role_grants_permission = 1 OR COUNT(up.permission_id) > 0
ORDER BY r.code, p.code;

SELECT table_name, column_name, constraint_name
FROM information_schema.key_column_usage
WHERE referenced_table_schema = DATABASE()
  AND referenced_table_name = 'roles'
ORDER BY table_name, column_name;
```

En el esquema local inspeccionado, `users.role_id` y `role_permissions.role_id` referencian `roles`. La política de retiro propuesta no elimina estas filas ni cambia usuarios, por lo que esas referencias e historial se conservan. Confirmar referencias de producción con la última consulta antes de cualquier migración.

## Plan de operación seguro

1. Recuperar conectividad de solo lectura a Layerbase y guardar conteos agregados, catálogo, grants y overrides de Secretaría, sin consultar datos personales innecesarios.
2. Acordar con el responsable las cuentas afectadas y mapear cada una a un rol destino. Revisar que no se amplíen privilegios y conservar una copia de `users.role_id`, `role_permissions` y `user_permissions` antes de cualquier cambio.
3. Revisar el preflight del SQL y confirmar si `personal` o algún código ya existe con metadata diferente. Si hay colisión, detener la ejecución y preparar una corrección específica.
4. Ejecutar primero el SQL de catálogo en una ventana aprobada. Confirmar las ocho filas, los flags y las FK. Revisar el grant efectivo de `SUPER_ADMIN`; si falta algún permiso, detener la activación de asignaciones y aprobar por separado la mínima delegación necesaria. Nunca incluir grants en este script.
5. Validar con cuentas de prueba cada combinación de permiso y el límite de propiedad; confirmar que los roles sin permisos sigan recibiendo denegación.
6. Para retirar definitivamente el rol Secretaría, hacerlo solo con un plan de migración aprobado, conteo vigente, respaldo y mapeo validado. Conservar trazabilidad de la asignación anterior y no eliminar rol ni historial.

### Reversión

El cambio de aplicación se revierte revirtiendo los archivos de código incluidos en el cambio. La capa de catálogo SQL es aditiva; no tiene rollback destructivo porque los grants u overrides que se agreguen después podrían ser legítimos y una eliminación cascada/no revisada revocaría accesos. Si se decide retirar físicamente una fila más adelante, primero se debe demostrar que no tiene referencias y aprobar por separado el plan de reversión.

## Verificación

- Pruebas backend: 53/53 pasaron usando `node ./node_modules/tsx/dist/cli.mjs --test tests/*.test.ts`.
- Pruebas mobile: 40/40 pasaron usando `node ./node_modules/tsx/dist/cli.mjs --test tests/*.test.ts`.
- Typecheck backend y mobile: ambos pasaron.
- `npm` no pudo iniciar desde el shell administrado por una denegación de acceso; se ejecutó el runtime local de Node y los binarios del proyecto directamente.
- Auditoría de Layerbase de solo lectura: no conectó (`ENOTFOUND`); no hubo consultas exitosas ni escrituras.

La implementación de aplicación puede revisarse sin esperar la migración. El catálogo de base de datos y cualquier transición de cuentas Secretaría siguen pendientes de conectividad y aprobación del responsable.
