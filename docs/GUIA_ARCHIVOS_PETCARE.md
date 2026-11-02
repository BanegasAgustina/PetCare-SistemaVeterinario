# Guía de archivos PetCare

## Capas

`mobile/src/app/` define rutas Expo Router; las pantallas usan componentes, contextos, hooks y servicios HTTP. El backend Express organiza `routes/` → `middlewares/` → `controllers/` → `services/` → `repositories/` → MySQL. Los validadores convierten entradas desconocidas en datos aceptables y los repositories mapean resultados SQL.

## Recorridos

- Login: `mobile/src/app/login.tsx` → AuthContext/auth service → rutas/controlador → `auth.service.ts` → repositorios de usuario/sesión.
- Mascota: `PetEditor` → client service → `client.service.ts` → `client.repository.ts`; el propietario se deriva de la sesión.
- Turno: asistente de solicitud → endpoint → `clinic.service.ts`/`clinic.repository.ts`, con comprobación de slot y alcance.
- Tienda: catálogo → carrito → checkout → `store-checkout.repository.ts`, que relee stock/precio y crea pedido de forma transaccional.
- OAuth: state/PKCE → proveedor → identidad externa → política de vinculación → sesión interna PetCare.
- Notificación: evento/job → notification repository → bandeja/email; el worker usa claves idempotentes y leases.

Guards de la UI ordenan la navegación; la API vuelve a verificar rol, permisos, propiedad y estado. Ver [cobertura](COBERTURA_DOCUMENTACION_PETCARE.md) para ver cada archivo pendiente.


### Solicitud de turno del cliente

El asistente `client/appointments/request.tsx` carga mascotas activas y catálogo, filtra profesionales/servicios y consulta slots reales al avanzar. Cambiar tipo, especialidad, servicio o profesional invalida selecciones dependientes. El cliente solo envía mascota y slot; `clinic.repository.ts` vuelve a comprobar disponibilidad y titular.


### Administración: agenda, información, permisos y tablero

La disponibilidad reexporta el editor compartido de clínica. `general-information.tsx` mantiene un borrador de contacto, identidad y horarios, normaliza campos opcionales y guarda mediante endpoint administrativo. `admin/index.tsx` consulta métricas/turnos/banners según permiso. `permissions.tsx` agrupa el catálogo visible, mientras las mutaciones de roles y excepciones pasan por endpoints y validación backend.


### Catálogo de productos y roles

`admin/products.tsx` filtra y edita productos, stock e imágenes; el servidor registra cambios y es la fuente del precio disponible. `admin/roles.tsx` administra roles/permisos, y el backend restringe permisos delegables y protege roles del sistema.

La administración de la tienda se divide en banners (`store-banners.tsx`), pedidos y revisión de pagos (`store-orders.tsx`) y configuración de retiro, envíos, zonas y transferencia (`store-settings.tsx`). La interfaz valida y prepara los cambios; el servidor vuelve a aplicar permisos y reglas de dominio.

La consola administrativa separa el listado y edición de usuarios de la gestión del directorio veterinario. Los perfiles profesionales conectan identidad, matrícula, especialidades y servicios; el catálogo de especialidades tiene una ruta dedicada. La interfaz envía cambios mediante servicios autenticados y el backend conserva la autorización definitiva.

En clínica, `CatalogScreen.tsx` concentra formularios de productos, servicios, categorías y promociones, y el modal de agenda publica slots o registra bloqueos. `PatientsScreen.tsx` cubre búsqueda, ficha, alta de mascota/propietario, edición e historial clínico; el backend valida permisos, relación de propiedad e idempotencia. El perfil de cliente y los accesos veterinarios/profesionales reutilizan pantallas compartidas o filtran el catálogo con la identidad autenticada.
