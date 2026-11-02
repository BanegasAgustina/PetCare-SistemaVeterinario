# Guía de arquitectura PetCare

Frontend Expo web/Android: Expo Router, pantallas y componentes, contextos/hooks y servicios. Backend: Express, rutas, middleware de auth/permisos/errores, controladores, servicios de dominio y repositories MySQL. `server.ts` inicia listener local; `app.ts` construye la aplicación para servidor o plataforma serverless.

`token.service.ts` valida JWT; middleware consulta cuenta/versión vigentes y los permisos provienen del servidor. OAuth no define roles PetCare. El ownership de mascotas, pedidos y notificaciones se verifica en backend.

Servicios coordinan casos de uso; repositories concentran SQL. Checkout recalcula stock y totales en transacción. Migraciones versionadas y seeds se ejecutan desde herramientas de `backend/src/database/`, no por cada request. Auditorías `readonly` observan estado sin probar que producción haya cambiado.

Imágenes y correo se aíslan en servicios; OAuth provider normaliza perfiles externos y la cuenta PetCare conserva la sesión final.


### Solicitud de turno del cliente

El asistente `client/appointments/request.tsx` carga mascotas activas y catálogo, filtra profesionales/servicios y consulta slots reales al avanzar. Cambiar tipo, especialidad, servicio o profesional invalida selecciones dependientes. El cliente solo envía mascota y slot; `clinic.repository.ts` vuelve a comprobar disponibilidad y titular.


### Administración: agenda, información, permisos y tablero

La disponibilidad reexporta el editor compartido de clínica. `general-information.tsx` mantiene un borrador de contacto, identidad y horarios, normaliza campos opcionales y guarda mediante endpoint administrativo. `admin/index.tsx` consulta métricas/turnos/banners según permiso. `permissions.tsx` agrupa el catálogo visible, mientras las mutaciones de roles y excepciones pasan por endpoints y validación backend.


### Catálogo de productos y roles

`admin/products.tsx` filtra y edita productos, stock e imágenes; el servidor registra cambios y es la fuente del precio disponible. `admin/roles.tsx` administra roles/permisos, y el backend restringe permisos delegables y protege roles del sistema.

La administración de la tienda se divide en banners (`store-banners.tsx`), pedidos y revisión de pagos (`store-orders.tsx`) y configuración de retiro, envíos, zonas y transferencia (`store-settings.tsx`). La interfaz valida y prepara los cambios; el servidor vuelve a aplicar permisos y reglas de dominio.

La consola administrativa separa el listado y edición de usuarios de la gestión del directorio veterinario. Los perfiles profesionales conectan identidad, matrícula, especialidades y servicios; el catálogo de especialidades tiene una ruta dedicada. La interfaz envía cambios mediante servicios autenticados y el backend conserva la autorización definitiva.

### Catálogo clínico y pacientes

`CatalogScreen.tsx` usa esquemas por tipo de catálogo y permisos para construir el editor; transforma importes y fechas antes de enviar y mantiene asignaciones de servicio. El modal de agenda calcula fechas a partir de días elegidos, publica bloques completos y registra bloqueos; los cambios se consultan nuevamente desde la API. `PatientsScreen.tsx` distingue datos de mascota, relación con el propietario y registros clínicos; las operaciones usan claves idempotentes donde una repetición podría duplicar el alta.
