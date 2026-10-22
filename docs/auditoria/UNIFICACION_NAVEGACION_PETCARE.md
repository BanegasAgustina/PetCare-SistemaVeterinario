# Unificación de navegación de PetCare

Fecha: 2026-10-22.

## Navegación anterior

| Rol | Antes |
|---|---|
| CLIENT | Cinco pestañas inferiores nativas de Expo: Inicio, Mascotas, Turnos, Tienda y Perfil. |
| VETERINARIAN | Una barra inferior propia con Inicio, Agenda, Pacientes y Productos; el resto de accesos eran botones dentro de pantallas. |
| GROOMER | Drawer lateral móvil con Inicio, Agenda, Mascotas atendidas y Perfil; no existía una pantalla separada de servicios asignados. |
| SECRETARY | Drawer lateral móvil con accesos que dependían de permisos; no había límite/overflow común ni barra inferior. |
| ADMIN / SUPER_ADMIN | Barra inferior propia de cuatro secciones: Inicio, Clínica, Tienda y Administración. |
| Roles personalizados | Drawer móvil con Inicio, módulos del registro seguro y Perfil. |

## Navegación nueva

`mobile/src/components/layout/RoleBottomNavigation.tsx` es el único componente de pestañas inferiores y se usa para cliente, personal, roles personalizados, veterinario y administración. Conserva colores PetCare, iconografía Ionicons, estado seleccionado y área segura inferior. En Android oculta la barra mientras el teclado está abierto.

La barra muestra hasta cuatro rutas y reserva la quinta para “Más” cuando el usuario tiene más de cinco accesos. El panel de “Más” conserva todas las rutas restantes, por lo que los permisos no desaparecen cuando una cuenta tiene muchos módulos. No se crean pestañas para módulos sin permiso.

Los elementos de navegación existentes siguen siendo la fuente de rutas: cliente mantiene las cinco secciones; veterinario conserva agenda, pacientes, clientes, productos y perfil según permisos; peluquería conserva inicio, agenda, mascotas atendidas y perfil, y suma una vista de sus servicios asignados usando el catálogo existente; secretaría conserva inicio y todos los módulos que habiliten sus permisos, además del perfil; administración mantiene Inicio, Clínica, Tienda y Administración; roles personalizados usan el registro de rutas local seguro y su pantalla de inicio.

En pantallas de detalle (turno, paciente, cliente, reserva, ficha clínica, producto de tienda, carrito y checkout) se oculta la barra cuando corresponde. Las rutas se conservan y el botón Volver de cada pantalla continúa dentro del flujo existente. En escritorio web, Secretaría, Peluquería y roles personalizados conservan un drawer colapsable construido desde los mismos elementos calculados; cliente y las áreas de administración/veterinario muestran la barra compartida.

## Archivos modificados

- `mobile/src/components/layout/RoleBottomNavigation.tsx`: componente inferior común, overflow “Más”, safe area y ocultación por teclado Android.
- `mobile/src/components/layout/GlobalNavigation.tsx`: composición común por permisos, eliminación del drawer móvil, integración del componente en Admin, Veterinario, Cliente y los demás roles; conserva navegación lateral de escritorio derivada de los mismos accesos.
- `mobile/src/app/client/(tabs)/_layout.tsx`: reemplaza Tabs nativas por Stack manteniendo `StoreCheckoutProvider`; el componente común presenta las pestañas.
- `mobile/src/app/professional/services.tsx` y `mobile/src/app/professional/_layout.tsx`: pantalla de solo lectura para los servicios ya asignados al peluquero, con autorización de ruta existente.
- `mobile/src/utils/navigation-tabs.ts`: distribución acotada y sin pérdida de rutas.
- `mobile/tests/navigation-tabs.test.ts`: prueba de límite, overflow y preservación de rutas.

El rol personalizado sigue usando `mobile/src/utils/capability-modules.ts`; no se aceptan paths arbitrarios de la base de datos. Los guards de Expo y la autorización backend siguen vigentes. No se cambiaron roles, permisos, endpoints ni reglas de negocio.

## Verificación

Verificación local después de los cambios: móvil **32/32** pruebas, Expo lint y TypeScript sin errores; backend **47/47** pruebas, ESLint y TypeScript sin errores. La suite móvil cubre el límite de pestañas y que las rutas sobrantes sigan disponibles en “Más”. No se ejecutó una compilación o prueba manual en dispositivo Android ni una sesión visual web responsive; por ello no se afirma validación en dispositivo.

## Pendientes

- Validar visualmente en un Android pequeño y un navegador web móvil; el entorno local no se usó como dispositivo físico.
- El overflow conserva las rutas configuradas, pero la autorización final de datos y acciones continúa en cada API; el menú por sí solo no es un control de seguridad.
