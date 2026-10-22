# Reparación de Cliente y reutilización de módulos personales

## Hallazgo sobre el crash

La causa del bucle era un redirect de entrada incompatible con el guard del árbol raíz. `mobile/src/utils/role-home.ts` había cambiado el destino de respaldo a `/workspace` para admitir roles personalizados, pero no conservó una rama explícita para `CLIENT`. En consecuencia, `mobile/src/app/index.tsx` enviaba una sesión Cliente a `/workspace`. El guard `canEnterWorkspace` excluye expresamente CLIENT; Expo Router bloqueaba el destino y volvía a procesar la entrada, cuyo `<Redirect>` elegía `/workspace` otra vez. Esa secuencia provoca actualizaciones repetidas del árbol de navegación y concuerda con `Maximum update depth exceeded` en `useNavigationTreeReducer` y el reporte de eventos de navegación.

La causa está demostrada por la combinación de destino y guard en el código. La pila apunta al efecto que reporta el ciclo; no implica que `useLatestCallback` o Expo Router sean la causa primaria. Restaurar `Tabs` fue necesario para recuperar la experiencia original, pero no corregía este ciclo de redirects.

## Archivos y corrección

- `mobile/src/app/client/(tabs)/_layout.tsx`: restablece las cinco pestañas originales (Inicio, Mascotas, Turnos, Tienda y Perfil), estilos, iconos, safe area, ocultamiento con teclado y `StoreCheckoutProvider`.
- `mobile/src/utils/role-home.ts`: vuelve a enviar explícitamente CLIENT a `/client`; define los predicados de acceso al root Cliente y al workspace para que el redirect y los guards compartan las mismas reglas.
- `mobile/src/components/layout/EntryRedirect.tsx`: separa el redirect de entrada para probarlo montado con un mock de Expo Router, sin inicializar módulos nativos.
- `mobile/tests/role-home.test.ts`: cubre el destino de entrada, la compatibilidad con los guards y un render de regresión del redirect Cliente.
- `mobile/src/components/layout/GlobalNavigation.tsx`: omite la barra inferior compartida para Cliente para que no tape ni duplique las pestañas nativas. Los demás roles conservan la navegación inferior compartida.
- `mobile/src/app/_layout.tsx`: deja acceder al grupo reutilizable `/client` a cuentas con una capacidad personal efectiva; la capacidad administrativa sigue siendo una comprobación separada.
- `mobile/src/utils/capability-modules.ts`: agrega un registro local cerrado de módulos personales. Un código de permisos de la base de datos solo puede activar rutas enumeradas aquí; un path arbitrario nunca se convierte en pantalla.
- `backend/src/utils/personal-access.ts`, `backend/src/middlewares/permission.middleware.ts`, `backend/src/routes/client.routes.ts` y `backend/src/app.ts`: habilitan rutas personales con permisos personales explícitos y conservan el bypass existente del rol CLIENT. Las rutas desconocidas quedan denegadas a los demás roles.

## Cliente: antes y después

Antes del cambio regresivo, Cliente disponía de cinco pestañas nativas y un proveedor que mantenía el estado del carrito y checkout dentro de ese navegador. El cambio a `Stack` había retirado esa estructura. Ahora vuelve a usar el mismo navegador nativo y sus cinco nombres, iconos y opciones visuales originales. Las pantallas existentes de Inicio, slider de mascotas, mascotas, turnos, tienda, carrito, checkout y perfil no se duplicaron ni se rediseñaron.

El acceso de otros roles usa el mismo grupo de pantallas con un `Stack`; sus propias barras compartidas muestran solo los módulos personales concedidos. El checkout sigue bajo `StoreCheckoutProvider` durante la navegación del grupo.

## Módulos y autorización

La interfaz reconoce estos códigos personales:

| Módulo | Permisos de lectura/uso | Permiso de cambio |
| --- | --- | --- |
| Mis mascotas | `personal.pets.view` | `personal.pets.manage` |
| Mis turnos | `personal.appointments.view` | `personal.appointments.create` |
| Tienda | `personal.store.view` | `personal.store.purchase` |
| Mis pedidos | `personal.orders.view` | — |
| Perfil personal | `personal.profile.manage` en la API personal | — |

El backend deriva propietario del usuario autenticado en cada operación. Consultas y actualizaciones personales de mascotas, turnos, carrito, domicilios, pedidos, pagos y perfil reciben el ID del JWT; no toman un owner del body. El módulo de mascotas personales consulta por `owner_id` y los turnos personales siguen el flujo de cliente. Las rutas de tienda autorizan navegación/lectura y compra por separado. Los permisos laborales actuales como `pets.view_all`, `appointments.view_own`, `products.update` y `orders.view_all` no conceden acceso personal.

El rol CLIENT conserva los accesos actuales sin requerir grants nuevos. Para los demás roles, las verificaciones se hacen por operación y permiso efectivo revalidado por `authenticate`; quitar el permiso bloquea la siguiente llamada. La aplicación oculta del menú los módulos que no tengan permiso. La UI es una ayuda de navegación; el backend es el límite de seguridad.

Los roles personalizados pueden combinar las capacidades que estén en el catálogo de permisos. El registro de rutas en `capability-modules.ts` limita las pantallas que puede abrir una concesión. No se agregó una regla por nombre de rol.

## Base de datos requerida para activar las concesiones

La auditoría de esquema del repositorio contiene las tablas existentes `permissions`, `permission_modules`, `role_permissions` y `user_permissions`, y no contiene los códigos `personal.*`. Como la petición prohíbe ejecutar migraciones o escribir en una base real, no se cambió Layerbase ni se creó/aplicó un cambio de esquema.

Para que el Administrador principal pueda asignar estos módulos a roles personalizados, un cambio de esquema aprobado deberá insertar un módulo `personal` en `permission_modules` y los códigos de la tabla anterior en `permissions`, con descripciones claras, `is_critical=0` y `opens_module=1` en los códigos que habilitan una pantalla. La tabla `role_permissions` permitirá los grants por rol; `user_permissions` seguirá pudiendo revocarlos o concederlos individualmente según la semántica actual. El catálogo administrativo existente carga los permisos desde estas tablas, así que no requiere convertir paths de base de datos en rutas. No se agrega una migración en esta entrega.

Hasta que esos registros existan en una base preparada, veterinarios, peluqueros, administradores y roles personalizados no tendrán las capacidades personales activadas. CLIENT continúa funcionando como antes. Esta limitación evita reinterpretar permisos laborales como permisos de comprador o propietario.

## Pruebas y alcance

La prueba de regresión de entrada monta `EntryRedirect` con un componente mock de navegación y confirma que CLIENT produce `/client`, que ese destino pasa el guard y que CLIENT no pasa el guard de `/workspace`. Las pruebas cubren también rutas de rol personalizado. Las suites actuales se ejecutaron en la sesión que incorporó el arreglo: móvil 38/38 y backend 51/51; TypeScript y lint de ambos paquetes pasaron.

No fue posible ejecutar una prueba Android: `adb start-server` falló con `could not read ok from ADB Server` y no había un terminal Metro activo. Por lo tanto se confirma la corrección del ciclo por el flujo de redirects y la regresión montada, pero no una navegación visual en dispositivo. No se ejecutó ninguna migración, escritura de base de datos, commit, push, despliegue ni generación de APK.

Para confirmar el recorrido cuando haya un emulador conectado, abrir dos terminales de PowerShell:

1. En `mobile`: `node .\node_modules\expo\bin\cli start --android` y conservar toda la salida de Metro desde el inicio de sesión hasta abrir Inicio.
2. En otra terminal: `adb logcat -c` y luego `adb logcat -v time ReactNativeJS:V ReactNative:V Expo:V AndroidRuntime:E '*:S'`.
3. Repetir login, cambiar entre las cinco pestañas, abrir Mascotas y Tienda, volver al inicio y cerrar/reabrir sesión. Si falla, guardar la primera excepción completa de Metro junto con el primer bloque `ReactNativeJS` de logcat que la preceda; no solo las últimas repeticiones del stack.

## Riesgos pendientes

- La confirmación final del crash necesita arrancar la app en un dispositivo/emulador y capturar desde el primer error del logcat/Metro.
- Las capacidades personales para roles distintos de CLIENT requieren que el catálogo de permisos se actualice en una futura migración aprobada.
- Las rutas que usan componentes personales fueron construidas originalmente para el grupo Cliente; el backend limita los datos por propietario, pero la navegación manual a un módulo sin permiso puede mostrar su pantalla antes de recibir un `403`. Las entradas no concedidas no aparecen en el menú y la API deniega el acceso.
