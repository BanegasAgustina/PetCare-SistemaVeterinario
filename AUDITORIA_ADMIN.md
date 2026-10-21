# Auditoría de experiencia administrativa de PetCare

Fecha: 19/10/2026

## Alcance y método

Se inspeccionaron las rutas Expo Router bajo `mobile/src/app/admin`, los componentes administrativos y compartidos de clínica, la navegación global, los servicios móviles, las rutas REST de `backend/src/routes`, los repositorios de administración y clínica, los validadores y las comprobaciones de autorización. El panel de ADMIN y Administrador principal usa las rutas `/admin`; datos y cambios de clínica se consultan en `/clinic`, y cuentas, roles, permisos y productos en `/admin`. El backend vuelve a cargar rol y permisos efectivos desde MySQL en operaciones sensibles y aplica alcance de los registros en los repositorios.

Los nombres visibles de rol ya se traducen a «Administrador» y «Administrador principal». ADMIN y Administrador principal pueden tener grants diferentes; el rol por sí solo no concede permisos. La diferencia sensible comprobada en backend es que solo Administrador principal puede activar o desactivar cuentas de usuario y veterinario, y un ADMIN no puede modificar cuentas Administrador principal ni asignar ese rol. La interfaz oculta estas acciones según rol, y el backend también las rechaza.

## Mapa de experiencia y hallazgos

| Sección o pantalla | Qué puede hacer el usuario actualmente | Problema de usabilidad detectado | Por qué genera confusión o errores | Mejora concreta propuesta | Archivos y componentes involucrados | Prioridad |
|---|---|---|---|---|---|---|
| Inicio y menú administrativo | Ver contadores reales, próximo turno y accesos por módulos habilitados; el menú carga módulos desde `/admin/home` usando permisos efectivos. | El conjunto inicial de accesos rápidos no mostraba toda la oferta disponible para la cuenta. | En móvil podía ser necesario abrir el menú y descubrir cada módulo por separado. | Mostrar tareas permitidas agrupadas por área y distinguir las tareas exclusivas del Administrador principal. | `mobile/src/app/admin/index.tsx`, `mobile/src/components/layout/GlobalNavigation.tsx`, `backend/src/repositories/admin.repository.ts` | Media |
| Encabezado y navegación compartida | Menú lateral por grupos; título fijo derivado de la sección; botón global para volver. | Varias pantallas repiten el título fijo dentro del contenido. En componentes compartidos, `PetCareHeader` ya oculta el botón local volver para roles ADMIN. | El título se repite en móvil y escritorio y compite visualmente con la barra fija que identifica la sección. | Mostrar el título fijo una sola vez para ADMIN y Administrador principal; conservar títulos locales en los demás roles y títulos propios de formularios/detalles. | `mobile/src/components/layout/GlobalNavigation.tsx`, `mobile/src/components/client/PetCareUI.tsx`, `mobile/src/components/admin/AdminPageHeading.tsx`, pantallas bajo `mobile/src/app/admin` y componentes compartidos | Alta |
| Pacientes y ficha clínica | Buscar y ordenar pacientes; filtrar especie para veterinarios; abrir ficha y editar campos permitidos. ADMIN requiere `pets.view_information` y `pets.view_all`; el servidor valida alcance y permisos. | La búsqueda inmediata generaba una consulta por cada carácter y no daba tiempo a terminar de escribir. | En móvil, el teclado podía competir con recargas sucesivas de resultados. | Aplicar una espera breve antes de consultar. | `mobile/src/components/clinic/PatientsScreen.tsx`, `mobile/src/app/admin/patients.tsx`, `backend/src/routes/clinic.routes.ts`, `backend/src/repositories/clinic.repository.ts` | Media |
| Agenda y turnos | Consultar y filtrar turnos; abrir detalle, actualizar estados, registrar cancelaciones y administrar disponibilidad según permisos. Datos y transiciones se procesan en `/clinic/appointments` y disponibilidad. | La búsqueda inmediata generaba consultas sucesivas mientras se escribía. | La carga de resultados podía distraer durante una búsqueda móvil. | Aplicar una espera breve; mantener etiquetas, permisos y confirmaciones existentes. | `mobile/src/components/clinic/AgendaScreen.tsx`, `AppointmentScreen.tsx`, `CatalogScreen.tsx`; `backend/src/routes/clinic.routes.ts`, `clinic.repository.ts`, `clinic-admin.repository.ts` | Alta |
| Reservas para retiro | Buscar y filtrar; consultar detalle; aceptar, rechazar con motivo, avanzar preparación, registrar retiro/pago o cancelar con motivo. | La búsqueda de personal ejecutaba una consulta por carácter; aceptar y actualizar estados dependen de confirmaciones y cambios reales de inventario. | La carga sucesiva dificulta escribir y distrae de acciones de operación. | Aplicar una espera breve en la búsqueda del personal; conservar búsqueda explícita del cliente, confirmaciones, motivos y mensajes ligados al resultado del servidor. | `mobile/src/components/clinic/ReservationsScreen.tsx`, `mobile/src/app/admin/{reservations,reservation}.tsx`, `backend/src/routes/clinic.routes.ts`, `backend/src/repositories/clinic.repository.ts` | Alta |
| Profesionales y asignaciones | Buscar y filtrar localmente profesionales; consultar estado, cambiar tipo, asignar servicios y, para Administrador principal, activar/desactivar. | Encabezado repetido; la búsqueda y paginación se ejecutan sobre el catálogo cargado en memoria. Crear cuenta redirige a usuarios y Veterinarios tiene otro módulo. | Puede confundirse un profesional genérico con un veterinario y no se explica en la pantalla que su cuenta se crea en Usuarios; el paginado puede aparentar páginas del servidor. | Consolidar encabezado y aclarar los recorridos existentes entre profesionales, usuarios y veterinarios, sin inventar operaciones. | `mobile/src/components/clinic/ProfessionalsScreen.tsx`, `mobile/src/app/admin/professionals.tsx`, `backend/src/routes/clinic.routes.ts`, `backend/src/repositories/clinic-admin.repository.ts` | Alta |
| Veterinarios | Buscar por nombre, matrícula o email; filtrar estado, orden y especialidad; crear cuenta con matrícula y especialidades; editar ficha, invitación y foto. | La creación se abre como modal sobre la lista; cuando no hay especialidades, el botón queda deshabilitado y el usuario solo ve una instrucción dentro del formulario. | La dependencia previa de crear especialidad no está visible antes de iniciar el alta. | Hacer explícito el requisito y ofrecer acceso directo al módulo de especialidades cuando el permiso lo permita. | `mobile/src/app/admin/veterinarians/index.tsx`, `[id].tsx`, `specialties.tsx`, `backend/src/routes/veterinarian.routes.ts`, `backend/src/repositories/veterinarian.repository.ts` | Alta |
| Servicios, productos y tipos | Catálogo compartido permite buscar, crear y editar según grants; el detalle de producto permite imagen, categoría, estado y datos comerciales. Otra pantalla administra precio y existencias. | Hay dos destinos de productos: `/admin/catalog/products` y `/admin/products`, cada uno con permisos distintos; los nombres del menú son «Productos» y «Productos y stock». | La separación está basada en grants y no se explica funcionalmente al usuario. La API sí divide administración general, precio y stock. | Mantener la separación impuesta por permisos y describir el alcance de cada entrada en su pantalla o menú. | `mobile/src/components/clinic/CatalogScreen.tsx`, `mobile/src/app/admin/catalog/[kind].tsx`, `products.tsx`, `GlobalNavigation.tsx`; `backend/src/routes/clinic.routes.ts`, `admin.routes.ts`, `clinic-admin.repository.ts`, `admin.repository.ts` | Alta |
| Especialidades y tipos | Mantener catálogos de especialidades y tipos profesionales; las pantallas y operaciones guardan datos MySQL, y el catálogo limita tipos por rol/clase clínica. | Ambos listados aparecían combinados sin separación clara y el nombre agrupado no indicaba qué se estaba manteniendo. | Es fácil confundir una clasificación profesional con una especialidad veterinaria. | Separar visualmente ambos grupos y explicitar que el alta de veterinarios necesita una especialidad. | `mobile/src/components/admin/SpecialtiesScreen.tsx`, `mobile/src/app/admin/specialties.tsx`, `admin/veterinarians/specialties.tsx`, `backend/src/routes/veterinarian.routes.ts`, `veterinarian.repository.ts` | Media |
| Usuarios y cuentas | Buscar y filtrar cuentas; consultar detalle; crear cuentas asignables; editar datos, rol, foto y excepciones individuales según grants. | El estado activo/inactivo no era visible en los listados y la búsqueda consultaba en cada carácter; cambiar el estado requiere abrir el detalle. | Para saber si una cuenta puede iniciar sesión había que entrar en cada registro; además, escribir generaba solicitudes sucesivas. | Mostrar el estado en cada fila y espaciar las consultas de búsqueda. El cambio de estado continúa en el detalle con confirmación y solo para Administrador principal. | `mobile/src/app/admin/users/index.tsx`, `[id].tsx`, `mobile/src/components/admin/AdminPersonRow.tsx`, `backend/src/routes/admin.routes.ts`, `admin.repository.ts`, `admin-authorization.ts` | Alta |
| Roles | Consultar roles y sus grants; editar nombre y permisos delegables con confirmación porque el cambio afecta a todas las cuentas que heredan el rol. | Catálogo de permisos y roles aparece como una lista larga sin agrupación visual en la edición. | Es difícil entender el alcance de un permiso antes de cambiar acceso a múltiples usuarios. | Agrupar permisos por módulo usando los datos `moduleName` que ya devuelve MySQL; no alterar grants ni reglas de delegación. | `mobile/src/app/admin/roles.tsx`, `mobile/src/types/admin.ts`, `backend/src/repositories/admin.repository.ts`, `catalog-presentation.ts` | Alta |
| Permisos | Ver catálogo real de permisos y sus descripciones; abrir gestión de grants por rol o excepciones por usuario. | La pantalla llamada «Permisos» es una explicación y catálogo, mientras que las ediciones ocurren en Roles y Usuarios. | El nombre puede hacer pensar que aquí se activa o asigna un permiso directamente. | Renombrar la acción principal como consulta de permisos y describir con precisión los enlaces a Roles y Usuarios. | `mobile/src/app/admin/permissions.tsx`, `roles.tsx`, `users/[id].tsx`, `backend/src/repositories/admin.repository.ts` | Media |
| Configuración general de clínica | No se encontró una sección general independiente en rutas admin inspeccionadas. La API actual sí expone catálogos, profesionales, horarios y reservas. | No hay una pantalla de configuración general identificada en el panel inspeccionado. | El rol principal no muestra una zona propia de configuración; presentar un botón nuevo sin soporte backend sería ficticio. | No agregar una configuración inexistente. Documentar como pendiente funcional si el producto requiere esa capacidad. | `mobile/src/app/admin`, `backend/src/routes/{admin,clinic,veterinarian}.routes.ts` | Baja |
| Cargas, errores, vacíos y confirmación | Hay estados compartidos `QueryState`, filtros, paginación, `FormNotice`, toasts y `ConfirmModal`; formularios validan antes de enviar y muestran errores de API comprensibles. | Los patrones no son uniformes en todas las pantallas: algunos listados dan texto vacío básico; el detalle de usuario/veterinario usa modal y varios flujos tienen páginas completas. | La persona debe reaprender dónde buscar errores, confirmar o reintentar según el módulo. | Uniformar navegación y mensajes de estado de los recorridos de mayor uso, manteniendo componentes existentes. | `mobile/src/components/ui/{ConfirmModal,FormNotice,FilterDisclosure}.tsx`, `useAsyncAction.ts`, pantallas citadas arriba | Media |

## Plan de mejoras priorizado

1. Eliminar títulos duplicados en las rutas administrativas, manteniendo el botón global de volver y los títulos de formularios/detalles; conservar los encabezados de los otros roles.
2. Revisar los títulos de tareas que combinan conceptos o enlazan a módulos distintos y aclarar su acción sin sumar capacidades.
3. Mejorar la orientación de altas que dependen de una especialidad o ficha profesional existente.
4. Homogeneizar búsquedas y agrupación de permisos si se puede mantener el contrato actual de API.
5. Verificar lint y tipos; inspeccionar flujos reales con el entorno disponible. No se usará información de producción para operaciones destructivas.

## Cambios realizados

- El encabezado global queda como título fijo de las secciones administrativas. Se oculta el encabezado local duplicado en las pantallas administrativas compartidas y en las rutas donde el título ya coincide; otros roles y títulos específicos de formularios o detalles conservan su encabezado.
- Las listas de permisos de roles, catálogo y excepciones de usuario ahora se agrupan por el módulo funcional que ya devuelve la API. Los códigos de permisos, grants, controles de edición y llamadas al backend no cambian.
- El alta de veterinarios explica que se necesita una especialidad y ofrece el acceso existente para crearla cuando el usuario tiene ese permiso.
- La portada del panel organiza las tareas disponibles según los módulos reales devueltos por `/admin/home`, con grupos de Clínica, Tienda y Administración. Las tareas exclusivas del Administrador principal se identifican aparte; se espera a la respuesta de módulos antes de mostrar un estado vacío.
- Los listados de usuarios y veterinarios muestran «Activo»/«Inactivo». Las búsquedas en cuentas, veterinarios, catálogo, pacientes, agenda y reservas del personal esperan 300 ms antes de consultar. La búsqueda de reservas de CLIENT conserva su botón explícito.
- Los catálogos muestran por separado «Tipos profesionales» y «Especialidades veterinarias». En catálogo, las acciones nombran el tipo de registro, se oculta crear productos sin el permiso correspondiente y la ausencia de tipos profesionales explica el requisito y enlaza a su configuración solo con autorización.
- La generación de horarios informa cuántos espacios llegaron a guardarse si una solicitud posterior falla; la lista se vuelve a consultar porque la operación existente guarda en solicitudes independientes y no es transaccional.

## Límites de verificación

La inspección de código confirma los endpoints y controles descritos, pero no demuestra la ejecución de cada flujo en una clínica conectada. Las pruebas reales de creación, edición y cambios de estado requieren una base de datos de prueba y cuentas con permisos configurados. Los archivos de pruebas del repositorio ya figuran eliminados en el árbol de trabajo al iniciar esta tarea; no se restauraron ni se modificaron.

## Verificación de esta intervención

- `mobile`: `tsc --noEmit` terminó correctamente.
- ESLint terminó correctamente sobre todo `mobile/src` usando el binario local del proyecto.
- `git diff --check` no reportó errores de espacios o parches.
- Se revisaron las rutas `/api/admin` y `/api/clinic`, la comprobación de permisos en repositorios y las restricciones de asignación/estado de `backend/src/repositories/admin.repository.ts`, `veterinarian.repository.ts` y `backend/src/utils/admin-authorization.ts`.
- No se probaron inicios de sesión ni operaciones reales de crear, editar, cambiar estado o permisos desde la interfaz: este entorno no aporta una clínica de prueba conectada ni usuarios de prueba por rol. No se usaron datos de producción.

## Resultado y pendientes

ADMIN y Administrador principal conservan su navegación por permisos y ahora tienen menos repetición en los encabezados de las tareas compartidas. La lectura de roles y excepciones de permisos es más escaneable por módulo, y el alta de veterinarios explica y enlaza su requisito previo. La mejora se limita a los flujos inspeccionados; el resto del panel conserva su funcionamiento actual. Se recomienda completar una pasada manual con cuentas ADMIN y Administrador principal en base de prueba, particularmente creación y cambio de rol, asignación de permisos, cambios de estado, turnos y reservas. También se puede revisar en esa sesión si los nombres «Tipos y especialidades» y los dos módulos de productos comunican con claridad suficiente a usuarios nuevos.

## Segunda pasada

### Hallazgos y mejoras por impacto

| Impacto | Problema concreto | Resolución |
|---|---|---|
| Alto | La portada solo exponía cuatro destinos frecuentes, aunque la API entregaba los módulos permitidos para el usuario. | La portada muestra las tareas disponibles por área y separa las exclusivas del Administrador principal. El estado vacío espera la carga de permisos/módulos para no parpadear antes de tiempo. |
| Alto | En usuarios y veterinarios no se distinguía el estado de cuenta desde la fila. | Se muestra Activo/Inactivo. La activación/desactivación continúa en detalle, con confirmación y controles existentes del backend. |
| Medio | Las listas principales disparaban consultas mientras se escribía y el catálogo de especialidades/tipos no distinguía sus dos grupos. | Se agregó debounce reutilizable de 300 ms y encabezados de grupo para los dos catálogos. Las reservas de CLIENT mantienen búsqueda explícita. |
| Medio | El alta de servicios podía quedar bloqueada cuando faltaban tipos profesionales, y no siempre indicaba cómo resolver el requisito. | El catálogo muestra el requisito y ofrece el módulo existente solo si la cuenta tiene `professional_types.manage`; sin ese permiso explica que debe solicitar ayuda. |
| Medio | «Crear» y editar en el catálogo no siempre describían el elemento y faltaba una explicación útil ante errores parciales al generar horarios. | Etiquetas más precisas, formulario contextual, restricción visual de crear productos por permiso y mensaje con el número de horarios ya guardados tras un fallo parcial. |

### Archivos de la segunda pasada

- Inicio y carga de módulos: `mobile/src/app/admin/index.tsx`, `mobile/src/components/layout/GlobalNavigation.tsx`.
- Estado y búsqueda de personas: `mobile/src/app/admin/users/index.tsx`, `mobile/src/app/admin/veterinarians/index.tsx`, `mobile/src/components/admin/AdminPersonRow.tsx`, `mobile/src/hooks/useDebouncedValue.ts`.
- Catálogos y servicios: `mobile/src/components/admin/SpecialtiesScreen.tsx`, `mobile/src/components/clinic/CatalogScreen.tsx`.
- Búsquedas de pacientes, agenda y reservas: `mobile/src/components/clinic/PatientsScreen.tsx`, `AgendaScreen.tsx`, `ReservationsScreen.tsx`.
- Este informe: `AUDITORIA_ADMIN.md`.

### Verificación adicional y límites

- TypeScript: `mobile/tsc --noEmit` terminó correctamente después de estos cambios.
- ESLint: terminó correctamente sobre todo `mobile/src`, sin errores ni advertencias.
- `git diff --check`: terminó correctamente sin errores; Git solo informó conversiones de fin de línea LF/CRLF en archivos modificados.
- No se añadieron ni ejecutaron pruebas automatizadas, de acuerdo con el alcance solicitado; tampoco se probaron pantallas con cuentas o datos de prueba conectados. La UX del debounce, los permisos por rol, los mensajes de error, el guardado parcial de horarios y los estados vacíos requieren revisión manual en una instancia de prueba.
- No se cambiaron backend, permisos, autenticación ni reglas de negocio. Las eliminaciones preexistentes de ocho archivos de pruebas se conservaron y no se restauraron.

### Pendientes

- En base de prueba, recorrer portada con ADMIN y Administrador principal que tengan distintos grants; confirmar que solo aparecen tareas permitidas y que la sección exclusiva queda restringida.
- Revisar creación/edición de servicios, alta de veterinario sin especialidades, búsqueda, activación/desactivación, turnos y reservas. Confirmar también el mensaje cuando la generación de horarios falla después de guardar algunos.
- Revisar en móvil y escritorio el equilibrio visual de la portada agrupada y las listas largas; esta pasada valida tipos y lint, no interacción real.

## Tercera pasada: calendario y publicación de horarios

### Cambios

- Se agregó un selector de fecha reutilizable: calendario nativo en iOS/Android y calendario visual en web. También se agregó selección de hora nativa y selector horario del navegador web. Los formularios ya no piden escribir a mano fechas ni horas.
- Se aplicó a fechas de pacientes y registros clínicos, filtros de turnos y reservas, publicación de disponibilidad y bloqueos. La fecha de nacimiento ya tenía calendario y se alineó en la edición de la ficha.
- Se agregó la pantalla «Horarios» al inicio y a la navegación cuando la cuenta tiene `schedule.manage`. Presenta servicios activos en una lista única y permite comenzar la publicación desde cualquiera de ellos.
- La publicación ahora se divide en «Publicar turnos», «Turnos publicados» y «Bloqueos». El flujo ordena la tarea en profesional asignado, días recurrentes, período y horario; muestra cuántos turnos resultarán antes de confirmar y usa el nombre «Publicar» en la acción.
- Se informa la duración real del servicio y se valida que el horario cierre en bloques completos de esa duración, sin exceder el máximo de 100 turnos diarios que exige el servidor. El límite existente de 63 días se mantiene.
- Los permisos y endpoints de disponibilidad no cambiaron. La ruta nueva está protegida por `schedule.manage`, y la API conserva las validaciones de autorización, asignación, conflictos, reservas y bloqueos.

### Archivos

- `mobile/src/components/forms/CalendarDateField.tsx` y `.web.tsx`.
- `mobile/src/components/forms/ClinicTimeField.tsx` y `.web.tsx`.
- `mobile/src/components/forms/ClinicDateTimeField.tsx`.
- `mobile/src/components/clinic/AvailabilityScreen.tsx`, `CatalogScreen.tsx`, `AgendaScreen.tsx`, `ReservationsScreen.tsx` y `PatientsScreen.tsx`.
- `mobile/src/app/admin/availability.tsx`, `mobile/src/app/admin/_layout.tsx`, `mobile/src/app/admin/index.tsx` y `mobile/src/components/layout/GlobalNavigation.tsx`.

### Verificación y pendientes

- TypeScript (`mobile/tsc --noEmit`) y ESLint sobre `mobile/src` terminaron correctamente.
- `git diff --check` terminó sin errores; los avisos de Git se limitan a posibles conversiones de fin de línea LF/CRLF.
- No se verificó visualmente el picker en iOS, Android y navegador ni se publicaron horarios reales. Hace falta recorrer calendario, selección de hora, resumen, confirmación, conflictos con turnos existentes y bloqueos en una instancia de prueba.
- La publicación sigue creando disponibilidad por fecha mediante solicitudes independientes al endpoint actual. Si una fecha posterior falla, la interfaz informa cuántos días alcanzaron a publicarse y conduce a la lista para revisarlos; convertirlo en una operación atómica requeriría un cambio de API/backend fuera de esta mejora de interfaz.
