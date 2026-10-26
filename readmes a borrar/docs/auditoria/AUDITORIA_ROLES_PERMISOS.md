# Auditoría de roles y permisos

## Alcance y resultado

La autenticación del backend vuelve a leer usuario activo, rol y permisos desde MySQL; el JWT no congela los grants. La autorización está en middleware y se repite en servicios/repositorios en operaciones sensibles. Los menús móviles usan los permisos recibidos para presentar acciones. La matriz siguiente describe **guardas observadas en código**, no significa que el rol tenga concedido ese permiso en la base: el snapshot de Layerbase incluye metadatos y migraciones, no filas de `roles`, `permissions` o `role_permissions`.

Roles reales enumerados en `backend/src/types/auth.ts`: `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN`, `SUPER_ADMIN`. README, seeds y código corroboran las seis etiquetas, pero los seeds actuales solo incluyen un catálogo de referencia parcial; no se certifica la composición actual de usuarios.

## Roles operativos observables

| Rol | Experiencia/capacidades implementadas | Evidencia | Evaluación |
|---|---|---|---|
| CLIENT | Perfil y mascotas propias, turnos, datos clínicos autorizados, catálogo/carrito/pedidos, notificaciones. Rutas bajo `clientRouter` autentican y limitan a CLIENT. | `backend/src/routes/client.routes.ts`, `mobile/src/app/client/` | CUMPLE |
| VETERINARIAN | Agenda, pacientes asignados/autorizados, registros clínicos, productos/recomendaciones y perfil profesional. | `clinic.routes.ts`, `clinic.repository.ts`, `veterinarian.routes.ts`, `mobile/src/app/vet/` | CUMPLE |
| GROOMER | Turnos propios, pacientes según cita y ficha de peluquería propia; permisos propios de lectura/actualización. | `clinic.routes.ts`, `clinic.repository.ts`, `mobile/src/app/professional/` | CUMPLE |
| SECRETARY | Inicio, agenda, clientes/reservas y operaciones de coordinación según grants. | `clinic.routes.ts`, `mobile/src/app/secretary/` | CUMPLE PARCIALMENTE: la experiencia existe; grants/usuarios del entorno no auditados. |
| ADMIN | Panel administrativo, recursos de clínica/tienda/usuarios conforme a permisos efectivos. | `admin.routes.ts`, `clinic.routes.ts`, `mobile/src/app/admin/` | CUMPLE PARCIALMENTE |
| SUPER_ADMIN | Capacidades administrativas, gestión veterinaria y revisión de pagos que requiere rol superior más permiso explícito. | `admin.routes.ts`, `veterinarian.routes.ts`, rutas de pedidos clínicos | CUMPLE PARCIALMENTE |

El alta pública no acepta rol; los servicios administrativos crean roles restringidos y el flujo veterinario dedicado conserva perfil/especialidad. No se encontró una ruta pública de auto-promoción. Los cambios de grants del usuario se vuelven a consultar por solicitud; las operaciones de repositorio usan transacción y vuelven a validar grants.

## Matriz de autorización observable

“No se observó permiso” significa que la ruta usa autenticación/rol y que el controlador o repositorio puede agregar reglas; se debe leer el conjunto completo en el código para certificar cada transición. Los permisos entre paréntesis son códigos que aparecen en las guardas y repositorios. No son grants efectivos medidos.

| Módulo | Ver | Crear | Editar/gestionar | Desactivar/eliminar | Aprobar/cancelar/atender | Exportar |
|---|---|---|---|---|---|---|
| Mascotas/pacientes | `pets.view_information`, `pets.view_all`/`pets.view_assigned`, o `appointments.view_own` para peluquería | Cliente: propias; clínica: sujeto a permiso y alcance | `pets.update`; ownership/asignación se valida en repo | Cliente y clínica tienen desactivación lógica condicionada; no borrado físico general | Turnos relacionados pasan por reglas de estado | No observado |
| Propietarios/clientes | `users.view_basic` y ámbito profesional/admin | No hay alta pública de propietario desde panel | Perfil cliente propio; gestión admin por `users.manage` | Desactivación de usuario en gestión administrativa | Sin flujo de aprobación específico | No observado |
| Turnos/agenda | `appointments.view_own` o `appointments.view_all` | Cliente solicita propio; personal usa operaciones/slots habilitados | `appointments.update_own`, `appointments.manage`; `schedule.manage` para disponibilidad | Desactivar horario lógico; turno se cancela por transición autorizada | Acciones validadas por estado/disponibilidad; repository chequea alcance | No observado |
| Servicios/categorías/tipos/especialidades | Catálogo común; admin usa permiso de recurso | `services.manage` / permisos de categoría según entidad | Permiso de entidad en configuración admin | Servicio puede archivarse/desactivarse; relaciones conservadas; categorías no presentan borrado universal | No observado | No observado |
| Profesionales | `professionals.manage` | Alta de vet por módulo especializado; tipo/servicios por gestión admin | `professionals.manage`; excepciones de activación requieren SUPER_ADMIN | Desactivación lógica | Invitación/activación explícita | No observado |
| Historia clínica/vacunas/recetas/recomendaciones | `clinical` por clase y scope; por ejemplo `prescriptions.view`, `pets.view_assigned` | `prescriptions.create`, `recommendations.create` o permisos clínicos por registro | No se observó edición general de registros clínicos tras creación | No se observó borrado/archivo general; conservación favorecida | Finalización de turno condicionada a registro guardado y estado | No observado |
| Estudios/archivos clínicos | No se identificó CRUD dedicado de estudios/adjuntos en esquema/endpoint actual | No observado | No observado | No observado | No observado | No observado |
| Productos/stock/precio | `products.view` o permiso de edición en panel admin | `products.create`; altas requieren campos de stock/tipo/precio | `products.update`, `products.update_stock`, `products.update_price` | `is_active` y cambios auditados en algunos flujos; no hard delete general | No hay aprobación de pedido en catálogo | Movimientos de stock consultables con `products.update_stock` |
| Promociones/banners | Tienda cliente lee activos; gestión `store.banners.manage` | `store.banners.manage` | `store.banners.manage`, incluye orden | Banners permiten borrar; promociones usan estado/ciclo según CRUD admin | No observado | No observado |
| Pedidos/pagos/envíos | `orders.view_all`; cliente solo su propio pedido | Cliente checkout | `orders.manage` / `orders.payment.manage` | Transiciones de estado, no borrado | Revisión de transferencia exige `SUPER_ADMIN` + `orders.payment.manage`; confirmación bancaria manual | No observado |
| Usuarios | `users.manage` | `users.manage` + `roles.manage`, protegido contra rol elevado | `users.manage` y permisos específicos | Desactivación/revocación, no borrado indiscriminado | Invitaciones y cambios de acceso | No observado |
| Roles/permisos | `roles.manage`, `permissions.manage` | Alta de códigos/roles no confirmada como operación dinámica | `roles.manage` / `permissions.manage`; overrides por usuario | No se observó borrado | Excepciones `allowed=1/0`; los críticos están restringidos | No observado |
| Configuración tienda/seguridad | `store.settings.view` | `store.settings.manage` actualiza singleton | `store.settings.manage` | No aplica | Modo demo es env backend, no editable desde la app | No observado |

## Riesgos y consideraciones

1. La interfaz no es la barrera de seguridad: backend aplica autenticación y permisos. Se observan validaciones de ámbito del paciente y turno en los repositorios, además de la relectura de permisos dentro de transacciones.
2. La unión de roles `RoleCode` y muchas ramas por string son contratos fijos del backend. Es apropiada para separar experiencias conocidas, pero agregar un nuevo rol requiere cambios y publicación; la administración existente no equivale a añadir roles arbitrarios.
3. Las rutas antiguas `/admin/:kind` están limitadas por rol y la autorización fina queda centralizada en `clinic-admin.repository.ts`; requiere verificar cada entidad cuando cambien los tipos de catálogo.
4. La utilidad `requirePatientScope` se documenta como preparada para rutas futuras; el scope efectivo actual aparece en `clinic.repository.ts`. No tratar la utilidad por sí sola como prueba de cobertura.
5. Falta revisar grants reales por rol, overrides y usuarios activos con una lectura autorizada actual. El snapshot disponible no los exporta.

## Recomendación

Conservar códigos canónicos para los roles conocidos, completar pruebas de autorización negativas por recurso y generar un reporte de grants efectivos desde la API/consulta de solo lectura en un entorno autorizado, sin volcar datos personales.
