# Auditoría de hardcoding funcional en PetCare

Fecha: 2026-10-22. Alcance: código backend y móvil revisado para roles, permisos, navegación y configuración comercial. El inventario destaca decisiones que afectan a la administración; no cataloga literales técnicos de toda la aplicación.

## Hallazgos

| Clasificación | Ubicación | Comportamiento actual | Tratamiento |
|---|---|---|---|
| Hardcoding funcional | `backend/src/repositories/admin.repository.ts` (`adminHome`) | Un mapa de permisos a rutas de administración está escrito en código. | Se conserva como registro seguro de pantallas implementadas; no se acepta una ruta de base de datos. Se habilita el área de trabajo de roles personalizados en móvil con una lista local cerrada. Una pantalla nueva sí requiere desarrollo. |
| Hardcoding funcional | `mobile/src/app/_layout.tsx`, `mobile/src/utils/role-home.ts`, `mobile/src/components/layout/GlobalNavigation.tsx` | Las áreas principales y la navegación contemplaban seis roles concretos; un código nuevo terminaba en el inicio de cliente o carecía de entrada. | Los roles personalizados reciben un espacio genérico y las pantallas existentes que correspondan a sus permisos. Los seis flujos especiales se mantienen. |
| Hardcoding funcional, límite de seguridad | `backend/src/routes/admin.routes.ts`, `backend/src/routes/clinic.routes.ts`, `backend/src/routes/veterinarian.routes.ts` | Varias rutas comprobaban tanto el rol canónico como el permiso; esto excluía roles personalizados incluso con grants. | Se relajó únicamente inventario/productos y las operaciones genéricas de configuración de clínica que ya verifican permisos efectivos. Acciones clínicas y de administración sensible retienen sus límites. |
| Hardcoding funcional | `backend/src/repositories/admin.repository.ts`, actualización de producto | La edición de inventario usaba `freshAdmin`, que restringe por nombre de rol. | Las operaciones de producto comprueban nuevamente en la transacción que el usuario esté activo, verificado y tenga todos los permisos concretos requeridos. |
| Hardcoding funcional | `mobile/src/app/admin/products.tsx` | El módulo de inventario solicitaba el catálogo general de clínica solo para leer categorías. | Se consulta `/admin/products/catalog`, limitado a categorías activas y a permisos de producto. |
| Configuración ya dinámica | `backend/src/repositories/clinic-admin.repository.ts` y repositorios de tienda | Servicios, tipos profesionales, horarios y disponibilidad; productos/categorías/promociones; zonas y opciones de cumplimiento; banners se leen o persisten en tablas existentes. | Se mantienen en sus fuentes persistentes actuales. No se sustituyen por listas locales. |
| Configuración parcialmente dinámica | `backend/src/repositories/admin.repository.ts` (`adminCatalog`) | Roles y permisos proceden de MySQL, pero solo la edición de roles existentes estaba expuesta. | Se incorpora creación de roles con permisos existentes; el esquema y las limitaciones se documentan abajo. |
| Configuración técnica legítima | Rutas registradas, códigos de permiso, estados de pago/turno, códigos canónicos, límites de entrada y listas de transiciones | Son contratos de API, invariantes de seguridad o estado del dominio. | Permanecen en código y con pruebas. No se convierten en código/rutas arbitrarias configurables. |
| Seguridad necesaria | `backend/src/utils/admin-authorization.ts`, `permission.middleware.ts` y controles de dominio | Protección de permisos críticos, alcance clínico, propiedad de mascotas, cuentas SUPER_ADMIN y revisiones de pago. | Se conserva. Un permiso en la interfaz no sustituye autorización ni ownership del servidor. |
| Demostración | Configuración de modo demo y datos semilla/locales (incluido `storeDemo` por entorno) | Hay mecanismos de demostración separados de los datos persistentes. | No se modifican ni se borran. No se verificó la base productiva ni se alteraron datos. |

## Soporte de esquema observado

La instantánea de metadatos `backend/layerbase-sql-audit.json` describe `roles` con `id`, `code`, `name` y `professional_type_id`; `code` es único y se normaliza en mayúsculas. No aparecen `description` ni `is_active`. También aparecen `permissions`, `role_permissions`, `user_permissions` y `permission_modules`. Los módulos guardan nombre y orden, pero no ruta, icono, descripción ni estado disponible.

Por lo tanto, el esquema admite insertar un rol con un código nuevo y asociar permisos existentes. No admite almacenar descripción ni desactivar un rol. La instantánea es metadato de solo lectura; no demuestra el estado vivo ni la consistencia de migraciones históricas. No se ejecutó SQL.

## Límites del alcance implementado

- Los seis roles canónicos mantienen sus identificadores.
- El rol nuevo solo puede crearlo SUPER_ADMIN. Los grants se validan contra el catálogo y la autoridad de delegación; se rechazan permisos críticos.
- No hay desactivación de roles ni descripción persistente mientras el esquema no las soporte.
- El registro de navegación solo referencia rutas internas ya compiladas. Crear un módulo de software que aún no exista requiere desarrollo.
- No se cambiaron métodos de pago, secretos, demo, transiciones críticas ni datos reales.
