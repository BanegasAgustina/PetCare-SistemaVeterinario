# Manual funcional de PetCare

PetCare reúne una app Expo para clientes y personal de una clínica veterinaria, con una API que aplica autenticación, permisos y pertenencia de los datos. El menú que ve cada usuario depende del rol y de los permisos efectivos recibidos por la API; una pantalla oculta no reemplaza el control del servidor.

## Acceso y navegación común

La entrada presenta acceso, registro y recuperación. El alta requiere verificación de email. El login social con Google, Facebook o X redirige al backend y usa un ticket de un solo uso; alta nueva pasa por verificación. Desde `Mi Perfil` el usuario edita sus datos y seguridad de cuenta según el rol. La sesión nativa se guarda de manera segura; en web se conserva en `sessionStorage`.

La aplicación usa Expo Router. El archivo de layout de cada área determina navegación y protección de rutas. Si un módulo no aparece, puede no corresponder al rol o faltar un permiso; solicitarlo a quien administra el sistema.

## Cliente

**Inicio:** resumen de mascotas, próximo turno, productos destacados y contador de notificaciones.

**Barra inferior:** Inicio, Mascotas, Turnos, Tienda y Perfil, según `mobile/src/utils/navigation-tabs.ts` y el layout cliente. La tienda tiene navegación interna a catálogo, producto, carrito, entrega/checkout. La barra puede resaltar pestaña activa y conservar navegación contextual; pantallas de detalle y formularios abren desde esas áreas.

**Mascotas:** consultar lista, crear/editar ficha, cargar fotografía, desactivar/reactivar y abrir el detalle. Los datos y fotos se limitan a las mascotas propias. Desde la ficha se accede a historial, vacunas, recetas y recomendaciones cuando hay registros.

**Turnos:** consultar servicios y disponibilidad, solicitar turno con mascota y horario, abrir detalles y consultar reservas relacionadas. La disponibilidad puede cambiar antes de confirmar; un conflicto requiere seleccionar otro horario.

**Tienda:** explorar categorías, productos, banners y promociones; consultar carrito; actualizar cantidades; mantener direcciones y realizar checkout disponible. El checkout de demostración está deshabilitado por defecto y no efectúa cobros reales. La transferencia bancaria usa un flujo separado y puede permitir adjuntar comprobante a una intención de pago.

**Notificaciones:** ver mensajes, abrir el elemento relacionado, marcar uno/todos como leídos, ocultarlos y editar preferencias. En Android se puede registrar push por dispositivo; el permiso se solicita al activarlo. La web no usa push del navegador.

**Mi Perfil:** perfil, apariencia, preferencias de notificación y seguridad. Permite editar datos propios, cambiar contraseña y gestionar foto si la capacidad está expuesta. `Mi Perfil` está disponible como sección compartida y no significa que todas las opciones sean idénticas para todos los roles.

## Veterinario

El veterinario entra a su inicio/panel y agenda, pacientes, clientes, productos o módulos habilitados. La disponibilidad de cada módulo depende de los permisos efectivos asociados a su cuenta.

Puede consultar turnos propios/asignados según permiso, ver datos del paciente dentro de su alcance y registrar información clínica para pacientes autorizados. Puede gestionar su perfil y contraseña. No se atribuye a este rol permiso general de administración de usuarios ni de configuración global, salvo que el código de autorización y la cuenta otorguen capacidad específica.

## Peluquero

El peluquero usa el área profesional/agenda compartida, consulta turnos propios y accede a ficha de peluquería. La API exige rol `GROOMER` y permisos de lectura/actualización correspondientes (`appointments.view_own`, `appointments.update_own`). La pantalla de pacientes puede limitarse a información necesaria para el servicio. No se documenta escritura de historia clínica veterinaria para peluquero.

## Secretario

El secretario usa agenda, turnos, pacientes/clientes y reservas que sus grants permitan. Puede buscar clientes y gestionar reservas cuando cuenta con `reservations.manage`. La API define accesos específicos a productos/turnos y puede requerir permiso adicional para consultar determinados catálogos. No se asume acceso a diagnóstico clínico ni a administración de pagos globales.

## Administrador

El área de administración presenta inicio y módulos según grants efectivos. Las pantallas incluyen agenda, clínica, pacientes, disponibilidad, profesionales, configuración general, productos, banners, pedidos, usuarios, roles, permisos, veterinarios, especialidades y catálogos. La lista visible depende de permisos como `users.manage`, `roles.manage`, `permissions.manage`, `products.*`, `schedule.manage`, `professionals.manage`, `store.banners.manage` y `orders.*`.

El middleware y repositorios vuelven a validar cada operación. Algunas acciones de privilegio elevado, como altas/gestión de roles, pueden requerir SUPER_ADMIN aunque la pantalla esté visible.

## Administrador principal

SUPER_ADMIN puede acceder a las áreas de administración permitidas y a acciones explícitamente reservadas al rol, como reenvío de ciertas invitaciones y revisión de pagos. Las acciones siguen requiriendo permisos efectivos cuando así lo establece la ruta. El rol no debe interpretarse como habilitación universal para cualquier acción si falta grant o el endpoint tiene alcance propio.

## Pantallas registradas

La navegación actual está bajo `mobile/src/app/`: rutas de autenticación y cuenta; `client/` (grupos de pestañas, mascotas, turnos, tienda, pedidos, pagos, notificaciones, historial clínico y perfil); `professional/`, `vet/`, `secretary/` y `admin/`. Hay layouts por área y pantallas de detalle/formulario. Los nombres de archivos no garantizan que cada pantalla sea visible para todo usuario: layouts, permisos y capacidades deciden el acceso efectivo.

## Restricciones funcionales y estado

- La autorización real está en backend y la pertenencia se deriva del JWT.
- Las lecturas migradas usan POST; un botón, pantalla o documentación antigua no garantiza que un GET siga funcionando.
- Checkout de demostración no representa pasarela de pago real. Transferencia y comprobantes forman un flujo de revisión, no una confirmación automática de pago.
- Push Android depende de development build/APK y credenciales de proveedor; Expo Go no basta para entrega remota.
- Email, OAuth, almacenamiento de imágenes y DB requieren sus servicios externos correctamente configurados.
- Configuración, credenciales, esquema remoto de Layerbase y estado de deploy deben validarse en las cuentas operativas; este manual describe capacidades presentes en el repositorio.

Para pasos de instalación consulte `docs/GUIA_INSTALACION_CONFIGURACION.md`; para rutas y contratos consulte `docs/DOCUMENTACION_API.md`.
