# Ampliación conectada de PetCare

El código implementa Profesional/Veterinario, Peluquería, Secretaría, administración central y Tienda por reserva sobre las tablas existentes. **Todavía no está habilitado en Railway:** falta ejecutar la migración nueva y verificar los flujos reales. No se aplicó SQL ni se crearon personas, servicios, turnos o productos en la base configurada.

## 1. Roles y modelo profesional

El código soporta CLIENT, VETERINARIAN, GROOMER, SECRETARY, ADMIN y SUPER_ADMIN. El SQL agrega únicamente los dos roles estructurales faltantes, GROOMER y SECRETARY; no crea cuentas. Todos los autenticables siguen en users, con password_hash bcrypt e invitaciones de un uso del sistema existente.

VETERINARIAN conserva veterinarians, matrícula y veterinarian_specialties. Cirujano es una especialidad de specialties; no hay nombre, email o persona que determine el acceso. GROOMER es el rol profesional no clínico. professional_types permite crear nuevos tipos basados en esos roles y asignarlos a cuentas reales sin modificar pantallas. roles.professional_type_id define explícitamente el tipo predeterminado; users.professional_type_id permite elegir otro. No se elige el tipo por orden de IDs.

professional_services asigna servicios a user_id. /auth/me incorpora el perfil profesional y servicios asignados, además de permisos efectivos y especialidades veterinarias. El rol selecciona la familia de navegación; los grants reales determinan cada acceso. El login sigue siendo único.

## 2. Secretaría y pantallas por rol

- Veterinario: Inicio, Agenda (hoy/próximos/anteriores), Detalle de turno, Mis pacientes, Ficha clínica, Registro de consulta/vacuna/receta/recomendación y Perfil. Formularios incluyen motivo, observaciones/contenido, diagnóstico y tratamiento sujetos a permiso, peso, próximo control/dosis y asociación a consulta/producto.
- Profesional no clínico: Inicio, Agenda, Detalle de turno, estados permitidos y Perfil. No puede entrar a historia clínica, diagnósticos ni recetas, aun manipulando la llamada o asignándose un grant clínico.
- Secretaría: Inicio con conteos consultados en MySQL, Turnos con filtros, Detalle/confirmación/reprogramación/asignación, Reservas, Detalle y preparación/retiro/cancelación, Clientes y ficha operativa, Perfil. No tiene administración de permisos ni historia clínica por defecto.
- Cliente: Solicitar turno por tipo/servicio/especialidad/profesional/horario; Tienda → Producto → Confirmar reserva → Mis reservas; lectura de registros clínicos escritos por el veterinario.
- Administración: menú obtenido del catálogo de permisos, usuarios/invitaciones (incluye secretarios y peluqueros), veterinarios/matrículas/especialidades, profesionales/tipos/servicios asignados, disponibilidad/bloqueos, turnos, productos/stock, categorías, promociones existentes, reservas, consulta clínica autorizada y RBAC. La ficha genérica de usuarios conserva identidad/estado/permisos; el módulo veterinario conserva su matrícula y especialidades.

Las pantallas reutilizan PetCareScreen, logo, huellas, ThemeContext, Safe Area, cards verdes, inputs, botones, ConfirmModal y toast. Se distinguen carga, error y consulta exitosa vacía. No hay datos funcionales de diseño ni respuestas de muestra. Los estados del dominio y metadatos de formulario son constantes técnicas, no registros de negocio.

## 3. Permisos

Reutilizados: appointments.view_own/view_all/update_own; pets.view_assigned/view_all/view_information; medical_records.view/create/diagnose/treat; vaccines.view/create; prescriptions.view/create; recommendations.create; users.view_basic/manage; roles.manage; permissions.manage; veterinarians.manage; specialties.manage; products.view/update/update_price/update_stock.

Nuevos: professionals.manage, services.manage, schedule.manage, appointments.manage, reservations.view_all, reservations.manage, products.create, categories.manage, promotions.manage, professional_types.manage.

El SQL concede a SECRETARY únicamente agenda global/gestión de turnos, reservas globales/gestión y contacto básico. GROOMER recibe agenda propia, actualización propia e información básica de mascota. SUPER_ADMIN recibe los nuevos grants mediante role_permissions; no hay bypass en código. ADMIN mantiene sus grants actuales: deben configurarse desde Roles/Permisos. No se conceden grants a individuos por email o ID.

Cada request protegido reconsulta usuario, rol y permisos. Las escrituras vuelven a resolver permisos dentro de la transacción. Las funciones clínicas exigen rol veterinario, permiso específico y paciente asignado (o acceso global autorizado). Sin JWT se devuelve 401; falta de permiso, 403; recurso ajeno se oculta con 404. Secretaría consulta información operativa, sin registro clínico.

## 4. Tablas y migración

Se reutilizan users, roles, permisos, veterinarians, specialties, veterinarian_specialties, veterinarian_patients, veterinarian_invitations, pets, species, client_services, client_appointment_slots, client_appointments, client_clinical_records, client_products, client_product_categories, client_promotions, client_orders, client_order_items y client_notifications. No hay tablas paralelas para turnos o reservas por rol.

Tablas nuevas: professional_types, professional_services y professional_blocks. El runner opcional crea clinic_schema_migrations para checksum/progreso del DDL.

Columnas nuevas: roles.professional_type_id; users.professional_type_id; specialties.is_active; servicios: tipo profesional, duración, precio informativo, requisitos; slots: profesional user_id, tipo histórico y active_start generado; turnos: occupied_slot_id generado y estado IN_PROGRESS; categorías: is_active; productos: reserved_stock, requires_prescription, species_id; clínica: consulta/producto relacionado, vigencia explícita, peso, motivo, diagnóstico y tratamiento; items de reserva: mascota y receta. El enum de client_orders agrega CONFIRMED, conservando todos sus estados previos.

**SQL limpio para ejecutar manualmente:** backend/clinic-migrations/001_connected_clinic.sql. Es una migración nueva, no modifica archivos históricos, no elimina tablas ni registros y no recrea la base. Sustituye índices únicos para permitir conservar historial y reutilizar horarios cancelados/desactivados. Mantiene los índices necesarios para las claves foráneas.

La transformación de stock usa exclusivamente las unidades de reservas/pedidos activos reales: el checkout anterior las había restado del físico; la migración las devuelve al físico y las registra como reservadas. Esta operación debe ejecutarse **una sola vez** y requiere revisión/backup previo, con escrituras de turnos/tienda suspendidas durante el cambio. MySQL hace commit implícito de DDL; no hay rollback global del archivo.

Pasos Railway:

1. Guardar un backup y revisar el esquema auditado en backend/schema-audit.json contra el entorno elegido. No ejecutar en otro esquema incompatible.
2. Suspender escrituras durante el cambio. Abrir la conexión MySQL del entorno correcto y ejecutar el archivo SQL completo, una sola vez y en orden. No pegar Markdown.
3. Si una sentencia falla, revisar la última aplicada y el esquema; no repetir todo el archivo, especialmente la transformación de stock.
4. Desplegar backend y mobile juntos después del SQL. Antes de aplicarlo, los módulos que requieren nuevas tablas/columnas muestran SCHEMA_UPDATE_REQUIRED; no muestran un vacío falso.
5. No ejecutar db:migrate:clinic después de aplicar el SQL manual. Es una alternativa con checksum/progreso que detiene el proceso si detecta el esquema ya ampliado. No ejecutar ambos mecanismos.
6. Configurar grants de ADMIN si corresponden, crear usuarios reales mediante invitación y asignar tipos/especialidades/servicios desde administración.

La revisión automática rechazó aplicar esta migración en la base configurada por considerar que solicitaste ejecución manual. No se intentó eludir ese rechazo.

## 5. Disponibilidad y turnos

Admin elige profesional, servicio asignado, día e intervalo horario argentino. El backend divide el intervalo en slots completos según duration_minutes (hasta 100 por bloque); pueden configurarse distintos días y registrar ausencias por intervalo. No se implementó una agenda recurrente futura ni se inventaron horarios.

La oferta al Cliente exige servicio y profesional activos, email verificado, tipo compatible, asignación de servicio, especialidad activa cuando corresponde, slot activo/futuro y ausencia de bloqueos/ocupación. Peluquería aparece como un tipo de DB cuando tiene servicios activos. Si no hay servicio u horarios reales se muestra el empty state correspondiente.

Reservar bloquea usuario profesional y mascota dentro de MySQL y vuelve a comprobar compatibilidad/ocupación. Las disponibilidades se escriben con el mismo lock del profesional. Se rechazan todos los solapamientos; el índice ocupado también impide dos turnos activos para el mismo slot. Cancelar libera el slot sin eliminar el turno histórico. active_start permite desactivar/reconfigurar un horario sin modificar los slots históricos. El tipo del slot se conserva para que cambiar el tipo/rol de un profesional no haga desaparecer la agenda pasada.

Secretaría reprograma/asigna seleccionando otro slot compatible del mismo servicio. Confirmación, inicio, finalización y cancelación usan transiciones explícitas. Profesional solo modifica turnos propios con appointments.update_own; gestión global necesita appointments.manage. Los cambios notifican al cliente en la misma transacción. Un turno veterinario asigna el paciente a veterinarian_patients; peluquería no crea esa relación clínica.

## 6. Tienda, recetas y stock

**PETCARE NO PROCESA PAGOS.** La tienda permite reservar para retiro/gestión en la veterinaria. Carrito y checkout dejan de ser flujo visible; los enlaces anteriores llevan a Mis reservas y la API de compra anterior devuelve 410/RESERVATION_ONLY. No hay tarjeta, Mercado Pago, envío ni pedido paralelo.

client_orders representa las mismas reservas para todos los módulos. Se conservan códigos históricos: PLACED = solicitada; CONFIRMED = confirmada; PROCESSING = en preparación; READY = lista para retirar; COMPLETED = retirada/finalizada; CANCELLED = cancelada. No se implementa EXPIRED ni una duración de vencimiento inventada.

Físico = client_products.stock. Reservado = reserved_stock. Disponible = físico - reservado. El producto se bloquea con FOR UPDATE antes de reservar; se comprueba actividad/categoría, stock, cantidad, especie aplicable y receta si corresponde. La solicitud lleva una clave de idempotencia que el backend proporciona en el detalle del producto.

La receta debe ser del propietario autenticado, de la mascota elegida, del producto exacto, tipo prescriptions, emitida y con valid_until futuro establecido por el veterinario. No se asigna una duración médica automática. No se crea una reserva al emitir una receta.

La reserva incrementa reservado. Cancelar libera reservado. Retirar descuenta físico y reservado, una sola vez. El estado y stock se actualizan en una transacción; terminales no admiten nuevas transiciones. DB y backend impiden reservado mayor a físico; tampoco se admite que Admin reduzca el físico por debajo del reservado.

Secretaría recibe la fila real de client_orders y sus items, cliente/contacto, mascota y receta relacionada. Confirmar/preparar/READY/retirar/cancelar persisten sobre esa misma fila. Cliente vuelve a consultar y ve el cambio. Las notificaciones se crean únicamente por cambios reales.

## 7. Endpoints

Se mantienen los endpoints existentes de Cliente para catálogo/slots/turnos y clínica; delegan al modelo compartido. Las rutas de identidad, fotos privadas S3, galería, raza y calendario de mascotas se conservaron. /auth/me añade el perfil profesional.

| Ruta /api/clinic | Función |
| --- | --- |
| GET /home, /catalog | Datos reales y configuración |
| GET /appointments, /appointments/:id | Agenda con filtros/scope |
| PATCH /appointments/:id | Estados y reprogramación |
| GET /slots | Disponibilidad para gestión autorizada |
| GET /patients, /patients/:id | Pacientes y ficha autorizada |
| GET/POST /patients/:id/records/:kind | Registros clínicos compartidos |
| GET /products | Catálogo de productos para profesional autorizado |
| GET /clients, /clients/:id | Contacto/ficha operativa sin clínica |
| GET/POST /reservations | Consulta/solicitud de reserva |
| GET/PATCH /reservations/:id | Detalle/gestión |
| GET /professionals | Profesionales reales |
| PUT /professionals/:id/services, /professionals/:id/type | Servicios y tipo |
| GET/POST /availability | Horarios y bloqueos |
| PATCH /availability/:kind/:id | Desactivar slot/levantar bloqueo |
| GET/POST /admin/:kind, PATCH /admin/:kind/:id | CRUD de catálogos |

Los kinds administrables son services, categories, products, promotions, specialties y types. Los IDs enviados son referencias de entidades a administrar, nunca la identidad usada para autorización.

## 8. Archivos

Backend nuevos: clinic-migrations/001_connected_clinic.sql; schema-audit.json (solo metadatos); src/database/clinic-migrate.ts; repositories/clinic.repository.ts, clinic-admin.repository.ts, reservation.repository.ts; services/clinic.service.ts; controllers/clinic.controller.ts; routes/clinic.routes.ts; validators/clinic.validator.ts; utils/clinic-rules.ts; tests/clinic-rules.test.ts; tests/integration/clinic.test.ts.

Backend modificados: app.ts (Helmet); routes/index.ts y veterinarian.routes.ts; repositories/client.repository.ts, admin.repository.ts y authorization.repository.ts; services/auth.service.ts; middlewares/auth.middleware.ts; types/auth.ts; utils/database-error.ts; package.json y package-lock.json.

Mobile nuevos: components/clinic/{StaffHome,AgendaScreen,AppointmentScreen,PatientsScreen,ClientsScreen,ReservationsScreen,CatalogScreen,ProfessionalsScreen,AvailabilityScreen}.tsx; hooks/useClinic.ts; services/clinic.service.ts; types/clinic.ts; utils/clinic-date.ts; tests/clinic.test.ts; rutas professional/*, secretary/*, vet/{agenda,appointment,patients,patient,record}, admin/{agenda,appointment,patients,patient,professionals,availability,reservations,reservation,catalog/[kind]}, client/reservation.

Mobile modificados: navegación raíz/admin/vet; inicio admin/vet; antigua ruta vet/[module]; solicitud de turno; tienda/detalle/carrito/orders; services/auth.service.ts y api.ts; types/auth.ts y client.ts; utils/role-home.ts; componentes PetCareUI y RecordCards. No se modificó PetEditor, galería, calendario, raza ni pet-photo.service.

Dependencia nueva: Helmet, ausente antes. No se agregaron librerías móviles. Se consultó documentación de [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) y [Helmet](https://helmet.js.org/).

## 9. Pruebas y pendientes reales

Las verificaciones locales de tipos/lint/tests y exportación no sustituyen el SQL ni una prueba con usuarios reales. La integración tests/integration/clinic.test.ts está preparada para los flujos A–F contra MySQL real, en una transacción exterior que hace rollback de todos los fixtures. Solo se habilita con CLINIC_DB_TESTS=true y DB_NAME terminado en _test. No se ejecuta sobre la base de producción. Requiere que esa base de pruebas tenga el esquema completo y catálogos RBAC, incluyendo la migración nueva.

Pendientes: aplicación manual de la migración; ejecución de integración en una base aislada; pruebas con cuentas reales en Expo Go; revisión visual en claro/oscuro a 360×640, 360×800, 390×844 y 412×915. No se crearon cuentas para simular esos resultados. El proyecto previo no tenía refresh token renovable: se conservan Access JWT, session_version, /auth/me y restauración mediante SecureStore; esta ampliación no inventa un mecanismo de refresh.

## 10. Checklist exacto Expo Go

1. Aplicar SQL, desplegar backend y conservar las referencias del bucket/SMTP. En mobile verificar EXPO_PUBLIC_API_URL real con /api; ejecutar npx expo start --clear y abrir Expo Go SDK 57.
2. Administrador real autorizado: crear/invitar veterinario, peluquero y secretario. Cada persona establece contraseña con el enlace. Asignar especialidades desde DB; servicios reales, tipos y permisos. No usar nombres ni cuentas de ejemplo.
3. Crear un servicio real para cada tipo que efectivamente ofrezca la clínica; asignarlo al profesional compatible. Crear disponibilidad futura y un bloqueo; comprobar que este no aparece al solicitar turno. Desactivar servicio y verificar que desaparece para nuevas solicitudes.
4. CLIENT real con mascota propia: Turnos → Solicitar → tipo → servicio → profesional → horario. Secretaría ve la solicitud; confirma/reprograma; Cliente y profesional ven el mismo cambio. Intentar reservar dos veces el mismo slot: la segunda llamada debe fallar.
5. Profesional no clínico: iniciar/completar turno propio. Intentar acceder manualmente a registros/recetas: 403. Veterinario: atender paciente asignado, registrar consulta/diagnóstico/tratamiento, vacuna, receta con producto y vigencia, recomendación. Cliente consulta esas mismas filas.
6. Admin: crear categoría/producto reales, precio informativo, físico, destacado, especie/receta cuando corresponda; activar. Tienda debe reflejar cambios. Reservar unidades desde Producto; Secretaría debe recibirlas. Probar cantidad superior al disponible y bajar físico por debajo del reservado: ambas operaciones deben fallar.
7. Secretaría: confirmar → preparar → READY. Cliente ve “Lista para retirar”. Marcar retirada: físico y reservado cambian correctamente. En otra reserva real, cancelar: reservado se libera, físico permanece. Repetir cancelación: rechazada.
8. Producto con receta: sin receta debe fallar; con receta ajena, de otro producto o vencida debe fallar; una vigente/aplicable debe permitir la reserva. Emitir receta sola no crea reserva.
9. Cerrar/reabrir app y comprobar persistencia; revisar notificaciones reales. Cambiar permisos y comprobar revocación en backend y navegación. Verificar propiedad de mascotas/fotos y que el flujo de fotos S3 continúa funcionando.
10. En los cuatro tamaños indicados, claro y oscuro: revisar Safe Area/notch, botones al final del scroll, teclado, inputs, cards, no scroll horizontal y empty states. Las tablas vacías deben verse vacías; un error de API debe mostrar error, nunca contadores inventados.

## Resultados locales ejecutados

- Backend: TypeScript y ESLint sin errores; build correcto; 20 tests aprobados.
- Mobile: TypeScript y Expo lint sin errores; 7 tests aprobados.
- Expo: exportaciones web y Android correctas en .expo/clinic-final-web y .expo/clinic-final-android. Esto valida compilación, no interacción física ni revisión visual.
- Integración MySQL A–F: 1 test omitido por diseño; no se habilitó CLINIC_DB_TESTS ni se usó una base *_test preparada. No afirmar integración Railway comprobada.
- Revisión global mock/fake/sample/demo/dummy/placeholderData/testData: fixtures exclusivos de tests y referencia al hash de seguridad existente; sin contenido funcional de muestra nuevo. Sin alert/confirm/prompt nativos. git diff --check correcto.
- npm audit tras agregar Helmet 8.3.0: cero vulnerabilidades reportadas.
- SQL de ampliación no ejecutado. No hubo inserts de negocio ni cambios de esquema/stock en la base configurada durante este trabajo.

Para ejecutar posteriormente la prueba MySQL: preparar una base aislada con nombre terminado en _test, esquema y catálogos RBAC completos; configurar DB_NAME/credenciales de esa base; establecer CLINIC_DB_TESTS=true; ejecutar npm run test:clinic:db desde backend. Los fixtures se eliminan mediante rollback; la prueba no se habilita en una base de producción.
