# Auditoría de componentes compartidos

## Arquitectura encontrada

La reutilización principal se realiza por servicios/repositories compartidos y pantallas/componentes reutilizables dentro de cada experiencia. Las rutas diferentes por rol funcionan como contenedores y llevan a componentes comunes cuando las tareas coinciden. Los datos sensibles se filtran en backend por usuario, rol, permisos y estado.

| Dominio | Reutilización observada | Diferencia justificada | Estado |
|---|---|---|---|
| Pacientes/mascotas | Un modelo `pets` y métodos compartidos en `clinic.repository.ts`; pantallas `PatientsScreen` y `PetEditor` comparten UI; vet/admin/professional/secretary enrutan a módulos clínicos. | Cliente ve sus mascotas; veterinario usa paciente asignado/autorizado; peluquería accede desde cita; administración requiere grants. Cliente y ficha profesional son superficies distintas. | CUMPLE PARCIALMENTE; límite de lectura real se valida en backend. |
| Productos | Catálogo central `client_products`/categorías y queries cliente/clínica/admin; el veterinario consulta/recomienda productos que el cliente luego compra. | `Storefront` es compra, admin es inventario/edición, vet es consulta/recomendación; no son catálogos independientes en datos. | CUMPLE |
| Turnos/agenda | `client_appointments` y slots compartidos; repositorio de clínica maneja reglas, disponibilidad y transiciones; se comparten pantallas Agenda/Appointment en rutas. | Cada rol ofrece acciones distintas y alcance propio. | CUMPLE PARCIALMENTE; no se certificó equivalencia visual en todos los dispositivos. |
| Servicios y perfiles | Catálogos de servicios en backend, profesionales conectados a tipos/servicios. Perfil de rol específico comparte componentes de identidad y diseño. | Campos de perfil profesional, clínico y cliente son diferentes por necesidades de rol. | CUMPLE PARCIALMENTE |
| Historia, vacunas, recetas | Backend de registros y funciones de presentación compartidos; cliente consulta sus propios datos, veterinario crea y consulta con permiso. | Cliente es lectura del expediente propio; personal tiene escrituras clínicas autorizadas. | CUMPLE PARCIALMENTE; faltan gestión posterior/estudios adjuntos observables. |
| Notificaciones | Persistencia y servicio de notificación del backend; bridges web/native por plataforma. | Push nativo y notificación web/centro no son el mismo mecanismo. | CUMPLE PARCIALMENTE; push real no verificado. |
| Pedidos | Modelo y repositorios de tienda compartidos; el cliente consulta lo propio y administración gestiona órdenes/pagos. | Control de pago separado y restringido a SUPER_ADMIN. | CUMPLE |

## Duplicaciones o límites detectados

- Expo Router tiene un archivo/pantalla por rol y módulo. Esto aporta navegación específica y no demuestra por sí mismo duplicación de reglas de negocio.
- Los componentes de agenda/paciente pueden estar compartidos por importación en rutas, mientras cliente usa su propia experiencia; el brief pide evitar duplicación de modelo y reglas, objetivo que parece seguir la arquitectura backend.
- El frontend conserva algunas constantes de rol/permisos para navegación. Los permisos efectivos vienen del backend; los códigos de rol para escoger layout son contratos cerrados y deben actualizarse junto con backend al añadir roles.
- No se comparó automáticamente el número de líneas/código ni se atribuyen duplicaciones por tamaño de archivo. Se clasifican por responsabilidades.
- Reutilización comprobada por lectura estática; no se ejecutó prueba end-to-end que demuestre las mismas filas o reglas para todos los roles.

## Evidencia central

- Rutas: `mobile/src/app/{client,vet,professional,secretary,admin}`.
- Componentes clínicos: `mobile/src/components/clinic/`.
- Componentes de cliente: `mobile/src/components/client/`.
- Datos y reglas compartidas: `backend/src/repositories/clinic.repository.ts`, `client.repository.ts`.
- Servicios: `backend/src/services/clinic.service.ts`, `client.service.ts`.
- Rutas protegidas: `backend/src/routes/client.routes.ts`, `clinic.routes.ts`, `admin.routes.ts`.

## Mejoras recomendadas

1. Mantener una matriz de capacidades en backend como contrato documentado para cada pantalla y endpoint.
2. Añadir pruebas de integración por rol y ownership antes de cambios en repositorios compartidos.
3. Extraer una interfaz común de paciente/appointment solo cuando la forma de datos sea realmente igual; mantener presentadores específicos cuando la diferencia sea de permisos o contexto clínico.
4. Centralizar el chequeo de autorizaciones para evitar que nuevas rutas administrativas dependan solo de ocultar botones.
