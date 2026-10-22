# Arquitectura dinámica de roles y capacidades

Fecha: 2026-10-22.

## Modelo de autorización

1. `roles` identifica el rol por un `code` único y conserva los seis códigos canónicos existentes. Los nombres visibles salen del catálogo persistente.
2. `role_permissions` define grants del rol; `user_permissions` conserva overrides individuales. La identidad autenticada carga permisos efectivos desde MySQL. El backend vuelve a comprobar identidad activa/verificada y grants al operar recursos sensibles.
3. Los permisos críticos y las funciones que necesitan un tipo de actor concreto siguen protegidos por controles de servidor. Las rutas de historias clínicas, el alcance de veterinario, propiedad de mascotas, aprobaciones de pago y administración de cuentas no se derivan del nombre visible del rol.
4. Crear un rol personalizado no concede permisos implícitos. El endpoint exige SUPER_ADMIN, permisos de gestión, delegación válida y ausencia de permisos críticos. La asignación posterior sigue el flujo administrativo existente; no se puede cambiar el propio rol.

## Catálogo seguro de módulos

Los módulos se muestran a partir de permisos efectivos y un registro local de rutas conocidas (`mobile/src/utils/capability-modules.ts` y el mapa servidor de `adminHome`). Cada registro apunta a una pantalla ya incluida en Expo Router. Una fila de `permission_modules` o un dato enviado por un usuario nunca proporciona una ruta ejecutable. Las rutas protegidas internas conservan sus guards de pantalla y cada API comprueba su permiso.

Las rutas disponibles para roles personalizados en esta fase son productos/inventario, categorías, promociones y servicios. Sus APIs genéricas comprueban permisos efectivos dentro de los repositories. Pacientes, agenda, reservas, ajustes de tienda, pedidos, banners, profesionales y pagos mantienen gates de rol o alcance y no se anuncian a roles personalizados hasta completar su revisión. Un módulo sin pantalla o endpoint implementado requiere desarrollo.

## Configuración de negocio

Los catálogos y reglas que ya tienen persistencia se mantienen en las tablas/repositories de clínica y tienda: productos, categorías, servicios, tipos profesionales, disponibilidad, promociones, zonas/opciones de entrega y banners. Los permisos habilitan la interfaz y el backend valida cada mutación. Estados críticos y sus transiciones siguen siendo contratos del dominio.

## Dependencias de base de datos

El metadato local auditado confirma tablas para roles, grants y módulos; no confirma columnas de descripción/estado del rol ni una tabla de configuración de rutas de módulo. La implementación actual no necesita una nueva tabla para crear un rol básico y asignarle permisos.

Para completar descripción y activar/desactivar roles, preparar una migración revisada que agregue a `roles` una columna de descripción nullable y una de estado no nula con valor inicial activo, más reglas de integridad apropiadas. Debe incluir consulta previa de cuentas afectadas y política de último rol activo/asignable. No ejecutar esta migración hasta inspeccionar la base real y validar las migraciones históricas.

Para administrar orden, icono, descripción o disponibilidad de módulos en DB, hace falta un catálogo persistente con claves referenciales a un registro seguro de pantallas en la aplicación. Nunca debe guardar path libre ni código. Hasta entonces el registro local es la lista autorizada y los permisos/grants vienen de la base existente.

## Seguridad y compatibilidad

- No se renombra ningún código canónico.
- La presencia de `ADMIN` no representa todos los grants; la presencia de un grant en cliente tampoco autoriza API.
- `SUPER_ADMIN` y permisos críticos siguen restringidos.
- La autorización de pacientes conserva scope/ownership del backend.
- Pagos, historias clínicas y transiciones de turnos mantienen sus reglas específicas.
- No se aceptan rutas, consultas SQL ni expresiones desde el catálogo de base de datos.
