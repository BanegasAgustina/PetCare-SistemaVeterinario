# Auditoría UX/UI de PetCare

Fecha: 25-10-2026  
Alcance: revisión estática del checkout, sin iniciar la app ni conectarse a servicios remotos.  
Resultado: inventario de todas las rutas activas y diagnóstico inicial; todavía no es una validación visual o funcional en ejecución.

## Alcance e inventario

Expo Router contiene **89 pantallas activas y 10 layouts** bajo `mobile/src/app`. Se excluyeron `mobile/src-backups/` y dependencias. Web y Android comparten las pantallas React Native Web/React Native, con adaptaciones por plataforma y ancho en `mobile/src/components/layout/GlobalNavigation.tsx`, `mobile/src/components/layout/RoleBottomNavigation.tsx` y `mobile/src/constants/responsive.ts`.

Roles declarados por backend: `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN`, `SUPER_ADMIN`. Secretaría sigue siendo un rol atendido para cuentas existentes; el backend rechaza nuevas asignaciones de ese rol (`backend/src/utils/admin-authorization.ts`).

### Rutas compartidas — 10 pantallas

| Ruta | Archivo |
|---|---|
| `/` | `mobile/src/app/index.tsx` |
| `/login` | `mobile/src/app/login.tsx` |
| `/register` | `mobile/src/app/register.tsx` |
| `/oauth` | `mobile/src/app/oauth.tsx` |
| `/activate-account` | `mobile/src/app/activate-account.tsx` |
| `/activate-vet` | `mobile/src/app/activate-vet.tsx` |
| `/account` | `mobile/src/app/account.tsx` |
| `/reset-password` | `mobile/src/app/reset-password.tsx` |
| `/change-initial-password` | `mobile/src/app/change-initial-password.tsx` |
| `/workspace` | `mobile/src/app/workspace.tsx` |

### Cliente — 27 pantallas

`/client` (`client/(tabs)/index.tsx`), `/client/appointments`, `/client/pets`, `/client/profile`, `/client/store`, `/client/store/:id`, `/client/store/delivery`, `/client/store/checkout`, `/client/store/cart`, `/client/pets/new`, `/client/pets/:id`, `/client/pets/:id/edit`, `/client/appointments/request`, `/client/appointments/:id`, `/client/medical-history`, `/client/vaccines`, `/client/prescriptions`, `/client/recommendations`, `/client/notifications`, `/client/profile/edit`, `/client/profile/security`, `/client/profile/appearance`, `/client/profile/notifications`, `/client/orders`, `/client/orders/:id`, `/client/payment-intents/:id`.

Fuentes: `mobile/src/app/client/` y `mobile/src/app/client/(tabs)/`.

### Administración — 26 pantallas

`/admin`, `/admin/administration`, `/admin/agenda`, `/admin/appointment`, `/admin/availability`, `/admin/catalog/:kind`, `/admin/clinic`, `/admin/general-information`, `/admin/patient`, `/admin/patients`, `/admin/permissions`, `/admin/products`, `/admin/professionals`, `/admin/roles`, `/admin/specialties`, `/admin/store`, `/admin/store-banners`, `/admin/store-orders`, `/admin/store-settings`, `/admin/users`, `/admin/users/:id`, `/admin/veterinarians`, `/admin/veterinarians/:id`, `/admin/veterinarians/specialties`.

Fuentes: `mobile/src/app/admin/` y sus subdirectorios `users/`, `veterinarians/` y `catalog/`.

### Veterinario — 11 pantallas

`/vet`, `/vet/:module`, `/vet/record`, `/vet/profile`, `/vet/products`, `/vet/patients`, `/vet/patient`, `/vet/clients`, `/vet/client`, `/vet/appointment`, `/vet/agenda` (`mobile/src/app/vet/`).

### Peluquero — 6 pantallas

`/professional`, `/professional/agenda`, `/professional/appointment`, `/professional/patient`, `/professional/patients`, `/professional/services` (`mobile/src/app/professional/`).

### Secretaría — 9 pantallas

`/secretary`, `/secretary/patients`, `/secretary/patient`, `/secretary/clients`, `/secretary/client`, `/secretary/appointment`, `/secretary/agenda` (`mobile/src/app/secretary/`).

### Layouts de navegación — 10

`mobile/src/app/_layout.tsx`, `admin/_layout.tsx`, `admin/users/_layout.tsx`, `admin/veterinarians/_layout.tsx`, `client/_layout.tsx`, `client/(tabs)/_layout.tsx`, `client/(tabs)/store/_layout.tsx`, `professional/_layout.tsx`, `secretary/_layout.tsx`, `vet/_layout.tsx`.

## Hallazgos

| ID | Prioridad | Evidencia y causa | Recomendación | Estado |
|---|---|---|---|---|
| UX-01 | P2 | El perfil no enfocaba el primer error en sus formularios de datos/contraseña. | Se reutiliza `firstInvalidField` y las refs de `AppInput` para enfocar nombre/apellido/teléfono o el primer campo de contraseña con error; al editar, se limpia el error del campo. | Corregido en perfil; otros formularios aún requieren recorrido |
| UX-03 | P2 | No se ejecutaron recorridos con teclado/lector de pantalla, capturas por breakpoints ni pruebas de Android; esta auditoría es estática. Los componentes compartidos muestran etiquetas, avisos live y botones táctiles, pero eso no prueba todos los flujos. | Verificar rutas clave en 320, 768, 1024 y 1440 px, además de Android físico/emulador, incluyendo teclado, modales y navegación. | Bloqueado por falta de sesión/runtime de app y backend de prueba en este diagnóstico |
| UX-04 | P2 | La raíz solo expone cliente/vet/peluquero/secretaría/admin bajo guards de rol/capacidad (`mobile/src/app/_layout.tsx`). Los layouts comparten piezas visuales, pero cada flujo tiene estructuras distintas. La lista exhaustiva arriba documenta dónde debe validarse la navegación. | Ejecutar una matriz de recorrido por rol; comprobar que destinos de accesos rápidos coincidan con permisos reales y que los enlaces de detalle tengan fallback. | Pendiente |
| UX-05 | P2 | La versión web adapta navegación lateral y contenido por breakpoints, pero no es una experiencia separada con rutas web propias (`GlobalNavigation.tsx`, `responsive.ts`). No se confirmó visualmente si todos los formularios/tablas aprovechan escritorio. | Revisar las pantallas administrativas y checkout en desktop con datos reales de QA; corregir por componentes compartidos o estilos web acotados. | Pendiente |

## Observaciones positivas verificadas en código

- `GlobalNavigation` resuelve navegación principal y accesos secundarios según permisos; las rutas tienen guards en `mobile/src/app/_layout.tsx`.
- `useBackNavigation` usa historial cuando existe y vuelve al inicio del rol como fallback (`mobile/src/hooks/useBackNavigation.ts`). `BackButton` es un control compartido.
- La barra inferior se oculta en desktop y al abrir teclado nativo (`RoleBottomNavigation.tsx`).
- En web, los indicadores se ocultan solo en áreas de scroll marcadas por ID (`WebScrollStyles.web.tsx`); el archivo base mantiene el comportamiento de plataformas nativas.
- `AppInput` conecta etiqueta, hint/error, foco visual y error anunciado; `FormNotice` anuncia feedback (`mobile/src/components/forms/AppInput.tsx`, `mobile/src/components/ui/FormNotice.tsx`).
- Los formularios de reserva usan datos de catálogo y disponibilidad del backend; checkout presenta explícitamente cuándo es demostrativo (`mobile/src/app/client/appointments/request.tsx`, `mobile/src/app/client/(tabs)/store/checkout.tsx`).
- El perfil reutiliza `AccountProfileScreen` para cliente, veterinario y administración; secciones de descripción/foto veterinaria dependen del rol (`mobile/src/components/profile/AccountProfileScreen.tsx`).

## Límites y siguiente etapa

La auditoría de rutas estática cubrió todos los archivos activos, pero no equivale a una prueba de cada pantalla. No se accedió a datos personales, producción ni base remota. Próximo paso: comenzar por los flujos críticos cliente (mascota/turno y checkout), administración (servicios/disponibilidad y pedidos) y profesional (agenda/atención), usando entorno de prueba; registrar capturas y resultado por ruta en la matriz.

## Actualización de implementación posterior a la auditoría

En el segundo lote se modificó el perfil y su validador compartido. UX-01 queda corregido para perfil; UX-03, UX-04 y UX-05 siguen pendientes de recorridos visuales, teclado/lector y responsive. La prueba unitaria verifica el orden del primer error, no interacción visual en dispositivo.


## Actualización — tercer lote visual (25-10-2026)

Se eliminó de `PetCareScreen` la superposición global de huellas, hojas, corazones y emojis que decoraba todas las páginas. Se creó `PetCareHero` en `mobile/src/components/client/PetCareUI.tsx`, con formas orgánicas sutiles, icono temático, colores del tema activo y adaptación de altura/padding en escritorio. Se aplicó a los inicios de cliente, veterinario, peluquería, personal/secretaría y administración, incluido SUPER_ADMIN. En estos inicios el saludo usa el nombre de `/auth/me` cuando está disponible y un texto neutral como fallback. Se redujo el radio común de tarjeta de 22 a 19 px.

El inicio de cliente conserva tarjetas de mascotas/turnos en carrusel en móvil y organiza mascotas en una grilla junto a turnos en escritorio; los paneles administrativos conservan sus métricas reales y ajustan la grilla en desktop. La barra inferior conserva rutas y permisos, y ahora da feedback de presión además del indicador de pestaña activa accesible. No se cambiaron operaciones ni fuentes de datos. Typecheck y lint mobile pasan; pasan 4 pruebas unitarias existentes. No se obtuvo captura comparativa ni se pudo abrir una sesión autenticada de QA, por lo que el resultado visual en navegador y Android sigue sin verificación en ejecución. UX-03/04/05 continúan pendientes para recorridos integrales, teclado/lector y QA responsive.


## Actualización — cuarto lote, mascotas, turnos y formulario compartido

En `mobile/src/app/client/(tabs)/pets.tsx` el vacío ahora solo aparece cuando la consulta ya devolvió datos; durante carga/error no se presenta como si la cuenta no tuviera mascotas. El vacío confirmado ofrece acceso directo a alta. En `mobile/src/app/client/(tabs)/appointments.tsx` las tarjetas permiten abrir el detalle del turno por su ruta existente y el vacío de próximos turnos ofrece solicitar uno. `AppointmentCard` añade feedback al presionar y etiqueta accesible.

En `PetEditor` nombre, especie y sexo se identifican como obligatorios; los errores de especie y sexo quedan debajo de sus opciones y el primer campo de texto inválido recibe foco. El calendario compartido ya permite selección directa de año/mes en web y nativo; se conserva y no cambia el formato civil ni el contrato API. No se alteraron permisos ni persistencia. Typecheck, lint y 4 pruebas mobile pasan. No hubo ejecución visual autenticada en QA ni recorrido Android; los flujos integrales siguen pendientes.


## Actualización — quinto lote, tienda, checkout y pedidos administrativos

El catálogo mantiene dos columnas en anchos mobile suficientes y grilla responsive en escritorio. Se añadió acción contextual para limpiar búsqueda/filtros cuando el catálogo filtrado queda vacío; los datos de producto continúan viniendo de API. El detalle por ruta ahora presenta promoción/precio regular cuando existen, cantidad con pasos +/- y validación previa según stock menos lo ya agregado; muestra estado de carga/error del carrito. Se impide iniciar otra adición mientras una petición de carrito está activa.

En el resumen del carrito, un envío no cotizado ya no se suma como costo cero al total: el monto queda “A confirmar” hasta que exista una cotización vigente para el subtotal actual. Checkout muestra banco, titular, CBU/CVU y alias solo al elegir transferencia y solo desde la configuración cargada de la tienda, e informa que el pago sigue pendiente hasta revisión. En pedidos administrativos, los filtros de fecha usan el calendario compartido y rechazan rangos invertidos. No se modificaron rutas ni reglas de negocio. Typecheck, lint y 4 tests mobile pasan; no se verificó la integración en API/DB ni se realizó QA visual autenticado.

## Actualización — sexto lote, productos y categorías

En `mobile/src/app/admin/products.tsx`, el precio ahora se identifica como precio de venta; los errores locales y los errores de campo devueltos por API se presentan junto al campo y se limpian al corregirlo. Se agregaron accesos rápidos condicionados a los permisos efectivos para crear productos y gestionar categorías, y un estado vacío que permite limpiar búsqueda/filtros. El listado conserva filtros y paginación provenientes de consultas reales. En `mobile/src/components/clinic/CatalogScreen.tsx` se agregaron validaciones específicas para nombre, tipo, precio, stock, URL de imagen y compatibilidad receta/tipo, y mapeo de errores API a campos del formulario. El estado de categoría se sigue editando mediante `categories.manage` y su endpoint actual. No se cambiaron endpoints ni reglas de negocio. QA visual autenticado y conexión API/DB quedan pendientes; los resultados automatizados se registran en la matriz de esta ejecución.

## Sexto lote — productos y categorías

Implementado: inventario con alta por ruta existente y permisos completos, acceso contextual a categorías, manejo de vacíos/filtros, etiqueta de precio corregida, limpieza de errores al editar y presentación de errores específicos devueltos por API. En catálogo genérico se añadió validación detallada de producto/categoría y mapeo de errores de servidor. No se introdujeron datos simulados, enums de negocio nuevos, endpoints, cambios backend, permisos ni reglas de negocio. Typecheck, lint y 4 pruebas mobile pasan; `git diff --check` pasa. Pendiente: QA visual web/mobile y recorrido autenticado contra API y DB de QA. El siguiente grupo por el orden solicitado es servicios.

Las promociones también tienen validación por campo para producto asociado, precio, vigencia (inicio y fin ordenados) e imagen/textos del banner. Cuando la sesión cuenta con `products.view`, el producto se selecciona de la consulta real del catálogo; si ese permiso falta, se conserva el ingreso del ID existente y se explica la validación contra el backend. Las fechas usan el selector compartido de fecha y hora.

## Actualización — séptimo lote, servicios

El catálogo administrativo muestra servicios en grilla responsive en escritorio y tarjetas compactas en mobile con precio, duración, tipo, estado, imagen y profesionales asignados cuando `professionals.manage` está presente. Se agregó el flujo de imagen que ya admitía el backend, validaciones inline para nombre/tipo/especialidad/duración/precio y acciones contextuales de disponibilidad. El selector de servicios del cliente puede mostrar la imagen guardada junto con descripción, precio y duración; no reemplaza ni simula información de la API. La configuración visual se verificó por código; no hubo sesión autenticada para QA visual.

Además, se retiraron los valores preseleccionados 09:00–17:00 y el fallback de 30 minutos del formulario de publicación: los días, fechas y horas deben elegirse explícitamente, y la duración se toma del servicio cargado. Si no se puede confirmar, no permite publicar.

## Actualización — octavo lote (profesionales y asignaciones)

El listado de `ProfessionalsScreen` conserva búsqueda, filtros y permisos existentes; sus tarjetas ahora resumen hasta dos servicios asignados desde el catálogo real y señalan si alguno está inactivo. El detalle muestra servicio, tipo y estado, y ofrece disponibilidad contextual: al volver del perfil, el catálogo de horarios se filtra a servicios asignados a ese profesional y abre el servicio con ese profesional preseleccionado. La asignación exige confirmación explícita. La pantalla de edición veterinaria explica por qué la especialidad es necesaria y ofrece su administración bajo `specialties.manage` cuando el catálogo activo está vacío.

En mobile, typecheck, lint y 4 pruebas unitarias pasan. La revisión visual fue estática; queda QA autenticado en web/mobile. No se llamó a API/DB ni se cambiaron turnos.

La edición contextual también distingue veterinarios de otros perfiles y deriva cada uno a su ficha bajo `veterinarians.manage` o `users.manage`; el control de estado de veterinarios queda en su flujo autorizado existente.
