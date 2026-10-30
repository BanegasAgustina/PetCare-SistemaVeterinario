# Auditoría integral de PetCare — actualización 2026-10-30

## Estado

La conexión a la base y su esquema se verificaron en vivo en modo de solo lectura. La auditoría **no queda totalmente cerrada**: hay dos configuraciones incompletas en producción, faltan fuentes de migración versionadas en este checkout y no se hicieron flujos interactivos con cuentas de prueba en navegador/emulador.

No se modificaron filas, no se ejecutaron migraciones ni DDL, y no se leyeron filas individuales de usuarios, pacientes, turnos o pedidos. Los conteos de negocio que aparecen abajo son agregados.

## Alcance

Se revisaron las rutas/componentes Expo de `mobile/src/`, servicios API, formularios y navegación; los permisos y roles del backend; repositorios/rutas/middleware; configuración; los scripts de catálogo/migraciones; documentación; y el inventario de SQL del backend. Se hizo búsqueda estática amplia y revisión dirigida, no lectura manual línea por línea de todos los aproximadamente 394 archivos de proyecto del inventario inicial.

La base se inspeccionó con `backend/src/database/sql-audit-readonly.ts` y consultas `SELECT` adicionales en una transacción configurada `READ ONLY` y terminada con `ROLLBACK`. El archivo actualizado de metadatos es [`backend/layerbase-sql-audit.json`](../backend/layerbase-sql-audit.json); no contiene credenciales ni filas de negocio.

## Conectividad DNS

El error inicial `ENOTFOUND` se produjo al ejecutar desde el entorno de herramientas aislado. Allí la resolución local devolvió `HostNotFound` (11001). El archivo `backend/.env` sí contiene `DB_HOST`, puerto, nombre de base, usuario, contraseña, TLS y timeout configurados; no se imprimieron sus valores. Con la misma configuración y acceso de red aprobado para esta auditoría, el host resolvió y la conexión completó tanto el inventario de esquema como los `SELECT` de solo lectura.

**Conclusión:** no hay evidencia de un `DB_HOST` mal formado, contraseña incorrecta ni caída de Layerbase. La causa demostrada del primer fallo fue la restricción de DNS/red del entorno de ejecución normal. La conexión directa quedó verificada desde el entorno con acceso de red.

## Base de datos verificada en vivo

- Servidor: MariaDB `11.8.9`.
- Esquema: 55 tablas, 450 columnas, 207 constraints, 31 CHECK y 210 índices.
- Auditoría de metadatos: completa, sin errores ni advertencias.
- Historial encontrado en 5 ledgers por dominio: 20 entradas en total, todas con estado `applied` (1 auth, 16 client, 1 clinic, 1 employee-password, 1 password-reset).
- Roles: 6 códigos (`ADMIN`, `CLIENT`, `GROOMER`, `SECRETARY`, `SUPER_ADMIN`, `VETERINARIAN`); 54 permisos en 11 módulos.
- Permisos individuales: la consulta agregada no encontró overrides en `user_permissions`.

Conteos agregados leídos en vivo:

| Área | Filas |
|---|---:|
| Usuarios | 9 |
| Pacientes | 8 |
| Productos | 8 |
| Categorías de producto | 4 |
| Servicios clínicos | 3 |
| Tipos profesionales | 2 |
| Especialidades | 5 |
| Turnos | 11 |
| Banners | 1 |
| Pedidos | 5 |
| Zonas de entrega | 0 |
| Información general de la clínica | 0 |

Estos conteos prueban que existen registros persistidos en los módulos principales; no prueban la procedencia de cada registro. No se inspeccionó contenido que pudiera identificar clientes o pacientes.

### Permisos efectivos: ADMIN y SUPER_ADMIN

La tabla real de permisos asigna a `ADMIN` 30 grants y a `SUPER_ADMIN` 54. Comparten los 30 grants de ADMIN; SUPER_ADMIN suma 24 grants privilegiados y ADMIN no tiene grants exclusivos. Entre esas diferencias están administración de usuarios/roles/permisos y otras operaciones reservadas al Admin Principal.

Ambos roles tienen concedido `pets.view_all` en `role_permissions`. El cálculo del backend combina grant de rol y override individual; no concede capacidades por el nombre de rol. La ruta/listado común admite `ADMIN` con `pets.view_all`, y la UI consulta la lista de permisos efectivos. Las comprobaciones de rol que quedan están acotadas a acciones de sistema, como administrar roles protegidos o reenviar invitaciones.

Se agregaron pruebas backend para grants heredados, overrides que permiten/deniegan, permisos críticos y el acceso compartido a `pets.view_all`; las pruebas móviles cubren las rutas compartidas de ADMIN/SUPER_ADMIN.

### Rol reservado `SECRETARY`

La base conserva un rol `SECRETARY` con 5 permisos, protegido contra eliminación y oculto en la asignación desde el catálogo. El seed y las etiquetas de presentación del checkout no lo incluían. Se agregó como rol reservado heredado al catálogo versionado, se fijó su etiqueta en backend y móvil, y se actualizó la guía. No se cambió el registro real ni sus permisos.

## Datos y hardcodes por módulo

En la revisión dirigida, los módulos operativos consumen datos de la API:

- **Clínica:** pacientes, fichas, turnos, servicios, disponibilidad, profesionales, tipos y especialidades salen de `useClinic`/servicios API y repositorios del backend.
- **Tienda:** productos, categorías, promociones, banners, pedidos, tarifas y modalidades usan endpoints de cliente/admin; los precios/stock no tienen listas de producto de prueba en el frontend.
- **Administración:** usuarios, veterinarios, roles, permisos, módulos e información general se consultan por API. Los módulos de navegación se construyen desde permisos efectivos y respuesta admin.
- **Mi Perfil:** identidad y permisos vienen de `/me`; especialidades/servicios profesionales usan el catálogo API; los cambios se guardan por API.

No se encontraron colecciones de pacientes, productos, turnos o servicios simulados en los archivos fuente revisados. Los literales encontrados son enums/códigos de contrato (estados, modalidades, tipos), permisos, rutas, etiquetas o defaults de formulario; no son datos de negocio que suplanten la base. `CARD_DEMO` está rotulado como demostración, protegido por `STORE_DEMO_MODE` y deshabilitado en la configuración local inspeccionada; no se realizó ninguna compra. No se puede afirmar el valor de variables del despliegue Vercel/EAS a partir del `.env` local.

Hay dos condiciones actuales de configuración:

1. `client_store_fulfillment_settings` tiene una fila con retiro y envío habilitados, pero `client_store_delivery_zones` no tiene zonas. `quoteDelivery` responde `outside_zone` cuando no encuentra zona; por lo tanto, **el checkout no puede ofrecer envío a ninguna dirección actualmente**. El panel de Envíos permite crear zonas. No se modificó la base; una persona con permiso debe cargar zonas o desactivar envíos si así corresponde.
2. `client_general_information` no tiene fila. El API devuelve valores iniciales de marca (`PetCare`) y la pantalla de información permite crearla mediante `INSERT ... ON DUPLICATE KEY UPDATE`. Mientras no se complete, el sitio público no muestra información real de la clínica. Es una configuración pendiente, no una fila ficticia.

El script de inventario SQL usa heurística textual y marca algunos identificadores/columnas y tablas de tooling como `possibleMissingTables`; no es una prueba automática de que falten tablas de negocio. La inspección del esquema actual cerró todas las etapas de metadata. Los SQL completos de migración no están versionados aquí; el historial real por dominios sí está presente en la base. `backend/migrations/` y el ledger genérico `schema_migrations` que espera el seed legacy no aparecen en el esquema actual. Por eso no debe ejecutarse el seed/migration runner legacy contra producción sin reconciliar antes las fuentes externas. Esto no afectó la conexión ni la auditoría de esquema y no se inventaron scripts.

## Navegación móvil «Secciones»

El componente fue localizado en el historial (`AdminMobileSections` de `GlobalNavigation`) y aparece en el bundle ignorado `mobile/dist` existente. El cambio local actual lo quitó del árbol de navegación móvil; el `dist` viejo aún guarda la compilación anterior. Una exportación web fresca y un bundle Android fresco desde el checkout actual compilaron sin el componente `AdminMobileSections`/`mobileSections`. El texto genérico “secciones” aún aparece en el bundle web por la etiqueta accesible de los grupos de la barra lateral de escritorio.

Conclusión: la captura corresponde a un bundle/build anterior, no a otro componente activo en el código fuente actual. Para ver el cambio en una URL publicada hay que desplegar el frontend desde el source actual; en un teléfono Android hay que generar e instalar una build nueva. No se publicó ni instaló ningún artefacto.

## Pruebas y verificación

- `mobile`: typecheck — correcto.
- `mobile`: lint — correcto.
- `mobile`: pruebas — 9 correctas.
- `backend`: typecheck — correcto.
- `backend`: lint — correcto.
- `backend`: pruebas — 7 correctas.
- Exportación Expo Web — correcta; el componente móvil «Secciones» no aparece en el bundle nuevo.
- Exportación Expo Android — correcta; el componente móvil «Secciones» no aparece en el bundle Hermes nuevo.
- `backend db:audit:readonly` — completo: 55 tablas, 450 columnas, 207 constraints, 31 CHECK, 210 índices, 5 ledgers y 0 errores.
- `backend npm run test:db` — 1 prueba de integración correcta; ejecuta SELECT de permisos reales dentro de transacción `READ ONLY` y rollback.
- No se ejecutó navegador con sesión autenticada ni emulador Android. Las exportaciones prueban compilación/agrupamiento por plataforma, no un recorrido visual con datos ni login real.

## Hallazgos clasificados y estado

| Prioridad | Hallazgo | Estado |
|---|---|---|
| P1 | Envíos habilitados sin zonas de cobertura: el quote rechaza todas las direcciones. | Checkout corregido para informar y bloquear delivery sin zonas; falta configurar cobertura o deshabilitar envíos en Administración. No se tocaron datos. |
| P2 | Información general sin fila: el público recibe los valores iniciales `PetCare`. | Pendiente de completar desde el panel de Información de PetCare. |
| P2 | SQL de migración no versionado y runner legacy con carpeta/ledger genérico ausentes. | Pendiente de obtener/reconciliar la fuente externa; no se ejecutaron scripts. |
| P2 | No hay suite de integración autenticada para los recorridos completos de Clínica/Tienda/Administración/Perfil, ni recorrido Web/Android con cuenta de prueba. | Hay una prueba DB de solo lectura para roles y `pets.view_all`; faltan flujos completos y cuentas de prueba. |
| P3 | `mobile/dist` ignorado conserva el bundle viejo con «Secciones». | Source y exportaciones nuevas correctos; falta publicar/instalar build nueva. |
| P3 | Proveniencia de cada fila real vs. dato de prueba no se puede afirmar a partir de conteos. | No se leyeron datos identificables; no se observaron fixtures en el código revisado. |

## Archivos cambiados y artefactos

Además de las correcciones de permisos/navegación y formularios ya listadas en la revisión previa:

- Se actualizó `backend/layerbase-sql-audit.json` con metadata de base actual, sin filas de negocio.
- Se agregó `SECRETARY` al seed de referencia y se fijaron sus etiquetas en `backend/src/utils/catalog-presentation.ts` y `mobile/src/utils/role-label.ts`.
- Se agregaron pruebas en `backend/tests/effective-permissions.test.ts` y `backend/tests/integration/authorization-readonly.test.ts`; se ampliaron `backend/tests/reference-catalogs.test.ts` y `mobile/tests/admin-route-access.test.ts`.
- Se actualizó `docs/GUIA_INSTALACION_CONFIGURACION.md` para documentar el rol reservado heredado.

## Cierre de seguimiento: 30/10/2026

### 403 de `/clinic/patients/query` en Android

- El endpoint local exige un rol clínico/administrativo reconocido y cualquiera de estos grants efectivos: `pets.view_information`, `pets.view_all` o `appointments.view_own`. La consulta del repositorio permite a ADMIN/SUPER_ADMIN listar todos los pacientes solo cuando su permiso efectivo contiene `pets.view_all`; el nombre del rol por sí solo no concede ese alcance.
- `authenticate` vuelve a consultar usuario, estado y permisos efectivos en la base en cada request. Login y `/auth/me` también obtienen permisos actuales; no se confía en permisos guardados en el JWT ni en el cliente. `ADMIN` y `SUPER_ADMIN` tienen `pets.view_all` activo en la base inspeccionada en modo lectura.
- Se agregaron pruebas de regresión del middleware: ADMIN con `pets.view_all` pasa; un ADMIN sin permisos y un rol SECRETARY quedan rechazados. **No se pudo identificar el rol efectivo de la sesión Android que vio el 403** porque no hay una sesión autenticada de prueba proporcionada/disponible, y no se accedió al almacén de tokens del dispositivo. Un permiso revocado, otro rol, falta de `pets.view_information`/`appointments.view_own` en ADMIN, o diferencias entre la versión local y producción siguen siendo causas posibles que solo se resuelven con el contexto no secreto de esa request.
- En las solicitudes 403, el cliente móvil refrescaba `/auth/me` por cada fallo concurrente. Se agregó single-flight para compartir esa revalidación concurrente y una prueba de regresión. El 403 original continúa propagándose; no se suprimió ninguna autorización ni se agregaron permisos falsos.
- Verificación pública de solo lectura: `GET /api/health` y `GET /api/health/database` de Vercel respondieron status `ok` y database `available`. Esto comprueba disponibilidad actual, no el rol de una sesión ni la igualdad del commit desplegado con el checkout; el endpoint público no expone metadatos de versión suficientes para demostrar esa igualdad. No se hicieron requests autenticadas ni cambios en producción.

### Android: fallo de descarga de `Ionicons.ttf`

- El `createIconSet` instalado delega la carga a `expo-font`; expo-font comparte una promesa en curso por familia y elimina la entrada para permitir reintento después de un fallo. La descarga solo puede completarse si el dispositivo alcanza el host que Metro anuncia. La URL reportada usa una IP privada LAN y el puerto de desarrollo `8081`, así que el fallo observado pertenece al camino Expo Go/Metro en esa red (host inaccesible/firewall/red distinta o Metro detenido), no es evidencia de un problema de API.
- Una exportación Android previa del source actual agrupó `Ionicons.ttf`. Un APK EAS instalado usa sus assets empaquetados y no debería descargar la fuente desde Metro. La exportación es evidencia de empaquetado; **no se probó en un Android físico ni en un emulador**, por lo que la experiencia del APK no queda validada visualmente. Para reproducir en Expo Go, iniciar Metro con `npx expo start --lan` en una red accesible al teléfono, permitir el puerto 8081 en el firewall, y reconectar/reiniciar Metro; para APK, reinstalar una build EAS nueva. No se codificó una IP ni se cambió el proveedor de íconos.
- `npx expo install --check` concluyó “Dependencies are up to date” usando el mapa local de paquetes Expo y avisó que la validación era poco fiable por estar sin acceso al endpoint de versiones. No había actualización compatible necesaria demostrada; no se modificó package.json/lock ni se inició una actualización mayor.

### Repetición de requests y checkout de tienda

- `useClientQuery` dispara una consulta al enfocar/montar cada pantalla y nuevamente al volver a ella. Ese patrón es intencional para refrescar datos vivos y no tiene un retry automático. `/auth/me` al 403 sí podía duplicarse en paralelo y ahora se comparte.
- Checkout tenía dos cotizaciones para la misma dirección: un efecto automático al completar los campos y el botón explícito “Consultar cobertura y tarifa”. Se quitó la llamada automática; el botón hace una cotización por acción. Los cambios de dirección ya invalidaban la cotización anterior.
- La API pública de fulfillment incluye las zonas activas reales. Ahora el checkout solo ofrece delivery si `deliveryEnabled` y la respuesta incluye al menos una zona; avisa que Administración debe configurar cobertura, oculta el formulario de envío y bloquea el envío del pedido si el estado local anterior conservaba delivery. Pickup sigue habilitado de forma independiente. Se agregaron pruebas con cero zonas y con cobertura configurada. No se creó ninguna zona ni se alteraron settings en DB.

### Permisos, datos y publicación

- La auditoría previa encontró grants de `pets.view_all` para ADMIN y SUPER_ADMIN en la base real. Las pruebas añadidas verifican rol + middleware y las pruebas DB de solo lectura anteriores verifican los grants efectivos reales. El móvil no replica una lista autorizadora separada; controla navegación para UX y el backend decide acceso.
- La tabla de información general sin fila continúa siendo una configuración pendiente: la ruta de guardado usa upsert y el formulario solo aparece cuando consulta la API; no se confirmó una escritura mediante API porque eso alteraría producción. El checkout de administración no inyecta detalles de clínica inventados.
- Sin zonas y sin información general se mantienen estados de configuración corregibles desde Administración; los datos no se completaron en nombre de la clínica.
- «Secciones» no está en el source móvil actual; los bundles viejos mencionados arriba son artefactos locales ignorados. No se publicó frontend ni se generó/instaló un APK en este seguimiento. Por eso una pantalla que siga mostrándolo necesita actualizarse con exportación/despliegue o build nueva; no se vació caché de usuario ni se tocó una publicación.
- Para el hueco de migraciones: conservar los ledgers existentes, obtener los SQL/checksums y respaldos de la fuente externa/canonical Layerbase, comparar esquema/ledger actual en staging y producción en modo lectura, reconstruir únicamente la historia demostrable, y crear cambios futuros como migraciones nuevas, forward-only, probadas en staging. No inventar scripts históricos ni ejecutar runner/seed legacy en producción. Requiere custodio del esquema y no se hizo modificación de DB.

### Verificación de este cierre

- Mobile: 12/12 pruebas, `tsc --noEmit` y `expo lint` terminaron con exit 0 después de los cambios. Se corrigió el único warning de estilo de una prueba móvil.
- Backend: 9/9 pruebas, typecheck y lint pasaron.
- `backend npm run test:db`: con DNS restringido falla por `ENOTFOUND`; con acceso de red aprobado pasa 1/1 bajo `SET TRANSACTION READ ONLY`, con rollback. No hubo escritura.
- Expo Web fresco: exportación correcta, 1.151 módulos; búsqueda en el bundle no encontró `AdminMobileSections` ni `mobileSections`.
- Expo Android fresco: exportación correcta, bundle Hermes 4,1 MB y 50 assets; la salida incluye `Ionicons.ttf`. No se instaló build ni se probó en dispositivo/emulador.
- Expo `install --check`: sin diferencias según mapa local; la validación remota no pudo realizarse por falta de red y no se actualizaron dependencias.
- No hay sesión de Android autenticada disponible. Quedan pendientes la identificación del rol/permisos efectivos del 403 concreto, probar flujos visuales y requests contra sesión real en Web/Android, contrastar el commit desplegado de Vercel (los health públicos no exponen versión), actualizar la publicación/build para que usuarios reciban el source actual, y completar configuraciones administrativas de zonas e información general. Por estos límites la auditoría permanece **abierta**.

## Validación final de producción y 403 — 30/10/2026

### Corregido localmente

- `/clinic/patients/query` contempla `pets.view_all` como grant efectivo en el guard de ruta. El repositorio de pacientes permite el alcance global a ADMIN/SUPER_ADMIN únicamente si esa capacidad efectiva está presente; ADMIN sin ese grant necesita los permisos/alcance alternativo. El detalle de paciente aplica la misma excepción controlada.
- Se incorporó diagnóstico de autorización acotado a la consulta de pacientes. Solo se registra ante 403 y contiene etapa del guard (`role`, `permission` o `repository`), ID/código del rol, indicador de cuenta activa y booleanos para `pets.view_all`, `pets.view_information` y `appointments.view_own`. No registra ID de usuario, email, token, contraseña, cuerpo de request ni datos clínicos. La instrumentación está **solo local** y no aporta evidencia de una request real hasta que llegue a un deployment y haya acceso a sus logs.
- La validación de login ya exige usuario activo, email verificado y contraseña inicial actualizada antes de ejecutar esta ruta; la instrumentación refleja el estado activo comprobado durante esa autenticación. El `roleId` se obtiene de la fila autenticada y no se agrega al objeto público de sesión.

### Probado automáticamente

- Git: checkout `HEAD` y `origin/main` apuntan a `d126df884192899a4f83e82689af3bc29c1c6b08`; `git ls-remote origin refs/heads/main` confirmó ese mismo SHA en GitHub. Los cambios de autorización y diagnóstico están sin commit. La versión de `origin/main` todavía no incluye `pets.view_all` en el guard `/patients/query` y exige `pets.view_information` en el repositorio antes de evaluar el alcance global.
- Backend, luego de agregar el diagnóstico: 10/10 pruebas, typecheck y lint con exit 0. Una prueba verifica que el evento contiene solo facts de autorización y omite el ID/email simulado del usuario.
- La verificación anterior contra la base real en `READ ONLY` comprobó el grant de `pets.view_all` para ADMIN y SUPER_ADMIN. Eso identifica grants por rol, no la identidad de la sesión que tuvo el 403.
- Build/export Android anterior: Expo terminó el bundle Hermes de 4,1 MB y reportó `Ionicons.ttf` entre 50 assets incluidos. Export Web terminó y el bundle nuevo no contiene `AdminMobileSections` ni `mobileSections`.
- ADB no pudo iniciar su daemon local; no reportó un emulador ni dispositivo disponible. No se ejecutó un recorrido de interfaz.

### Publicado en Vercel

- **Commit activo del frontend: no verificado. Commit activo del backend: no verificado.** No hay Vercel CLI instalado, vínculo `.vercel/project.json`, proyecto en `.openai/hosting.json`, variables de acceso Vercel en el entorno ni metadata del deployment activo accesible mediante las herramientas conectadas. `backend/vercel.json` no identifica un proyecto. El repo contiene `mobile/vercel.json` con URL de API, pero no la asociación al proyecto/deployment.
- El SHA publicado no puede deducirse de `/api/health`, estado HTTP, ni del SHA de GitHub. Lo que sí queda probado es que el commit común de `HEAD`/`origin/main` carece de la corrección, y que los cambios locales no están en GitHub. Por tanto, no se puede afirmar que Vercel contenga la corrección; si producción construye desde `main`, esa fuente aún es anterior. No se publicó, guardó una versión ni inició despliegue.
- Acceso que falta para cerrar esta comparación: metadata de solo lectura del deployment de producción frontend y backend (proyecto, deployment ID/alias y `gitSource.sha`), desde el dashboard o una conexión/token Vercel read-only, junto con sus ramas/directorios configurados.

### Verificado con sesión real

- **Nada de esta sección pudo verificarse con una sesión real.** No se encontró sesión de prueba autorizada en Web/Android, no se recibió una cuenta de pruebas y no hay dispositivo/emulador Android disponible. No se examinó SecureStore, cookies, tokens ni usuarios de producción.
- Para el 403 quedan desconocidos el ID interno del rol de esa sesión, su rol/cuenta y permisos efectivos, qué guard rechazó en producción y si la versión desplegada difiere de local. El guard local puede rechazar por rol, por falta de los tres permisos aceptados en la ruta, o el repositorio puede rechazar por permiso/alcance. La prueba unitaria cubre casos sintéticos; no identifica cuál ocurrió en la request reportada.
- La traza local hará esa causa distinguible en logs después de publicarse mediante el flujo aprobado y de repetir la acción con cuenta de prueba. Hasta entonces no hay request ID/log Vercel disponible para correlacionar el 403 ya ocurrido.
- No se verificaron visualmente módulos de Clínica, Pacientes, Turnos, Tienda, Administración o Mi Perfil con ADMIN ni SUPER_ADMIN; tampoco navegación autorizada, persistencia de sesión ni render real de iconos en Android. El bundle prueba inclusión del archivo de fuente, no que un dispositivo lo haya renderizado sin Metro.

Matriz de recorridos preparada para sesiones de prueba autorizadas (pendiente de ejecutar):

| Área | ADMIN | SUPER_ADMIN |
|---|---|---|
| Clínica / Pacientes | Abrir lista; verificar alcance completo si `pets.view_all` está efectivo; abrir ficha solo con permiso. | Igual; el rol no saltea los grants efectivos. |
| Turnos | Abrir agenda/lista, detalle y permisos de lectura/gestión efectivos. | Igual, incluyendo solo las acciones concedidas. |
| Tienda | Leer catálogo y pantallas administrativas que indiquen sus permisos. | Igual; comprobar los módulos exclusivos si la sesión recibe esos grants. |
| Administración | Abrir cada destino permitido por permisos y confirmar rutas denegadas sin grant. | Verificar destinos privilegiados del rol y confirmar que los guards efectivos siguen siendo requeridos. |
| Mi Perfil / sesión | Consultar perfil, reanudar app y reiniciar sesión; comprobar que `/auth/me` devuelve permisos vigentes. | Mismo recorrido. |
| Android | Comprobar iconos en las pantallas recorridas, navegación y que el APK usa fuentes incluidas. | Mismo recorrido. |

Estos recorridos deben usar staging o una cuenta de prueba sin hacer cambios de configuración ni operaciones de escritura; cualquier validación de guardado de zonas/info general necesita fixtures comerciales aprobados en staging.

### Pendiente de intervención manual

- Proveer acceso de lectura al metadata del deployment Vercel o asociar el proyecto Vercel al entorno, sin publicar cambios.
- Abrir una sesión de prueba autorizada para ADMIN y otra para SUPER_ADMIN, de preferencia en staging. Para identificar el 403 de producción, reproducir la petición y compartir el timestamp/request ID o logs filtrados por la traza segura cuando esta versión esté publicada.
- Conectar un dispositivo/emulador Android con build de prueba autorizada. No generar APK de distribución. Ejecutar los recorridos autenticados de los módulos indicados y verificar iconos, navegación y restauración de sesión.
- Las pantallas de zonas e información general y sus rutas API están implementadas; la zona se guarda en `PUT /clinic/store-fulfillment` y la información general usa upsert del formulario administrativo. No se comprobó una escritura de punta a punta porque cambiaría configuración productiva. Una sesión de staging con autorización permitirá probar guardado/lectura con datos de prueba aprobados; no se deben inventar tarifas o datos de clínica.
- El ajuste de delivery sin zonas ya se describe como corregido en checkout, pero activar cobertura continúa pendiente de que una persona autorizada ingrese las zonas comerciales reales o desactive delivery.

**Estado de auditoría: abierta.** El 403 de Pacientes no tiene explicación definitiva hasta correlacionar una sesión de prueba con el backend y deployment reales; ninguno de esos dos accesos está disponible en este entorno.
