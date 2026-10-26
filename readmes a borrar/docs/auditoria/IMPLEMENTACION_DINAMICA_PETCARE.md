# Implementación dinámica de PetCare

Fecha: 2026-10-22.

## Cambios

- El tipo de rol en backend y móvil ahora representa códigos de catálogo como texto, manteniendo intactos los seis códigos existentes.
- `roleCodeFromName` genera códigos nuevos acotados al contrato actual de 32 caracteres. El backend comprueba colisiones y valida grants. La administración principal puede crear roles personalizados desde Roles y consultar cuántas cuentas están asociadas.
- Se agregó un espacio móvil para roles personalizados sin área dedicada. La lista de módulos usa un registro local cerrado y permisos efectivos. Las pantallas conocidas mantienen sus guards de rutas.
- Se habilitaron por permisos efectivos las operaciones genéricas de administración de clínica que ya contaban con autorización por permiso y alcance de dominio.
- Se quitaron los gates de rol canónico de las rutas genéricas de CRUD de catálogos; los repositories validan el permiso concreto y revalidan la identidad en operaciones de escritura.
- El inventario admite grants de roles personalizados para leer/editar productos, ajustar stock y revisar historial. Se revalida la identidad y el conjunto de permisos dentro de la transacción.
- Se agregó el endpoint acotado de categorías activas de producto para inventario y se actualizó el móvil para usarlo.
- La carga de foto de producto acepta autorización `products.update`; fotos de usuario y las demás operaciones administrativas mantienen sus límites originales.
- Se añadieron pruebas unitarias para generación de códigos de rol.

## Archivos principales

- Backend: `src/types/auth.ts`, `src/utils/role-code.ts`, `src/utils/admin-authorization.ts`, `src/repositories/admin.repository.ts`, `src/repositories/clinic-admin.repository.ts`, `src/routes/admin.routes.ts`, `src/app.ts`.
- Móvil: `src/types/auth.ts`, `src/types/admin.ts`, `src/utils/capability-modules.ts`, `src/utils/role-home.ts`, `src/app/_layout.tsx`, `src/app/workspace.tsx`, `src/app/admin/roles.tsx`, `src/app/admin/products.tsx`, `src/components/layout/GlobalNavigation.tsx`, `src/services/admin.service.ts`.
- Pruebas: `backend/tests/dynamic-role.test.ts`.
- Pruebas de límites de navegación: `backend/tests/authorization-boundaries.test.ts` y `mobile/tests/capability-modules.test.ts`.
- Documentación: `AUDITORIA_HARDCODING_PETCARE.md`, `ARQUITECTURA_DINAMICA_PETCARE.md`, `IMPLEMENTACION_DINAMICA_PETCARE.md`.

## Pendiente por esquema o desarrollo

- `roles.description` y `roles.is_active` no existen en la instantánea de esquema. La interfaz por ahora no promete editar descripción ni activar/desactivar roles. Requiere una migración diseñada y autorizada luego de verificar el esquema real.
- La configuración de rutas, iconos, descripciones y disponibilidad del catálogo de módulos no tiene columnas persistentes. Las rutas se mantienen como lista segura local; nuevos módulos requieren desarrollo.
- Métodos de pago habilitados y textos operativos que no tengan configuración persistente requieren inventario funcional específico y esquema fuente antes de ofrecer edición. No se inventó una persistencia.
- Las acciones de paciente/turno y configuración de tienda no se abrieron globalmente a roles personalizados cuando su ruta aún exige rol canónico o requiere un modelo de alcance más estricto.
- No se inspeccionó ni modificó contenido de producción, credenciales, configuración demo ni datos reales. No hubo SQL, migraciones, despliegue, APK, commit ni push.

## Validación

Resultados locales: backend 47/47 tests, ESLint sin hallazgos y TypeScript sin errores; móvil 30/30 tests, Expo lint sin hallazgos y TypeScript sin errores. `git diff --check` terminó sin errores de whitespace. Las verificaciones no prueban contra Layerbase ni sustituyen una prueba de autorización con datos de entorno controlado.
