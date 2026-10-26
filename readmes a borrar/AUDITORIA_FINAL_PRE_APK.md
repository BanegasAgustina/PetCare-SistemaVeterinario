# PetCare — auditoría final pre-APK Android

**Fecha:** 25 de octubre de 2026
**Alcance:** se agregó un perfil EAS de APK interno conectado al endpoint de producción solicitado y se reforzó la validación del cliente. No se generó APK, no se hizo deploy, no se accedió a DB ni se hicieron escrituras. Se intentó `GET /api/health` (solo lectura) y falló por DNS (`Host desconocido`). No se modificaron credenciales ni el directorio Android ignorado.

## Veredicto ejecutivo

> **APTO PARA INTENTAR COMPILAR un APK interno configurado para producción; la conexión desde Android no está verificada.**

Se agregó el perfil EAS `internal-production-api`: APK interno, `environment=production`, `EXPO_PUBLIC_APP_ENV=production` y la URL Vercel solicitada. `preview` sigue separado y su guard permanece. El cliente solo acepta en producción el origen/path configurados; una variable EAS conflictiva hace fallar la configuración en runtime. El `.env` local coincide con el perfil. La consulta de solo lectura `eas env:list --environment production --json` no devolvió respuesta y se interrumpió; por eso no pude verificar los valores remotos ni cuál prevalecería en el job cloud.

La configuración del perfil resuelve estáticamente la URL esperada y el manejo de rutas evita duplicar `/api`. El GET de salud desde este entorno no llegó a Vercel porque no resolvió DNS. Eso no demuestra si EAS o un dispositivo Android resolverán el host. El acceso EAS, la firma cloud y el manifiesto final tampoco se verificaron.

| Etapa | Dictamen | Alcance de la conclusión |
|---|---|---|
| **1. Listo para intentar compilar APK** | **Sí, técnicamente; EAS/firma pendientes.** | Perfil interno con valores explícitos de producción. No se lanzó build ni se verificaron EAS/keystore. |
| **2. Listo para instalar y probar sin escrituras** | **Pendiente del APK y Android.** | No hay artefacto ni prueba en dispositivo; no puedo afirmar conexión HTTPS desde Android. |
| **3. Listo para pruebas funcionales con datos** | **Configuración de producción preparada; uso no verificado.** | El usuario eligió producción. Las operaciones podrían persistir datos reales; se requieren APK instalado y pruebas controladas. No se hicieron escrituras. |
| **4. Listo para producción** | **No.** | Pagos con tarjeta siguen siendo demo; OAuth, cron, FCM, firma, actualizaciones y flujos reales requieren configuración o validación externa. |

## Hallazgos

El nivel de verificación describe lo que se observó en este turno. **Estático** significa lectura de código/configuración; **unitario** significa test local sin DB/API; **pendiente** significa que no hay evidencia de runtime o entorno remoto.

| ID | Severidad / módulo | Archivo y línea | Problema, impacto y evidencia | Corrección recomendada | Estado / verificación |
|---|---|---|---|---|---|
| APK-01 | **P0 — API / configuración de producción** | [`mobile/eas.json:38-47`](mobile/eas.json), [`mobile/src/services/api.ts:90-145`](mobile/src/services/api.ts) | `internal-production-api` declara APK interno, entorno `production`, `EXPO_PUBLIC_APP_ENV=production` y el endpoint Vercel solicitado. Una aserción local confirma los valores; el `.env` local coincide. `preview` conserva su app env y no tiene URL de producción. El cliente rechaza orígenes/paths productivos distintos al configurado; así un override EAS incompatible falla cerrado. La lectura remota `eas env:list` no respondió, por lo que no se conocen variables cloud ni precedencia efectiva. | Antes del build, comprobar que las variables efectivas del job sean las declaradas en el perfil. Tras instalar, verificar el GET HTTPS en Android antes de cualquier escritura. | **Perfil y guard corregidos estáticamente; EAS remoto y APK pendientes.** GET salud local falló por DNS. |
| APK-02 | **P1 — Integración / DB / recorridos esenciales** | [`MATRIZ_PRUEBAS_PETCARE.md:22-43`](MATRIZ_PRUEBAS_PETCARE.md) | Registro, ownership, concurrencia, checkout y permisos efectivos siguen pendientes de integración. Los 11 tests mobile y 14 backend actuales son unitarios; no prueban persistencia, endpoints desplegados ni ownership efectivo. | Ejecutar la matriz por rol en QA confirmado; cubrir ownership cruzado, doble reserva y stock/precios concurrentes. | **Pendiente de QA integrado.** Unit tests pasan; sin escrituras remotas. |
| APK-03 | **P1 — Tienda / pagos** | [`mobile/src/app/client/(tabs)/store/checkout.tsx:44-80`](<mobile/src/app/client/(tabs)/store/checkout.tsx>), [`backend/src/repositories/store-checkout.repository.ts:57`](backend/src/repositories/store-checkout.repository.ts) | La tarjeta sigue identificada como demo y no solicita datos de pago. El backend guarda esa operación como `DEMO_PURCHASE` / `DEMO_NOT_PAID`, sin venta ni descuento de stock. La transición `PAID` requiere revisión de pago, no la selección de tarjeta. | Conservar el texto demo. Integrar proveedor solo cuando se decida cuál y se configure sandbox; no simular cobros. | **Seguro estáticamente y no bloquea compilar.** Sin integración real de pagos. |
| APK-04 | **P2 — Android / cámara** | [`mobile/app.json:36-42`](mobile/app.json), [`mobile/src/components/forms/ProfilePhotoInput.tsx:18,26`](mobile/src/components/forms/ProfilePhotoInput.tsx), [`mobile/android/app/src/main/AndroidManifest.xml:2`](mobile/android/app/src/main/AndroidManifest.xml) | La configuración versionada del plugin ya tiene `cameraPermission` con texto y `microphonePermission: false`. La documentación de ImagePicker SDK 58 indica que `cameraPermission` distinto de `false` conserva permiso CAMERA y `false` lo bloquea. El snapshot local ignorado elimina CAMERA, pero no representa necesariamente CNG/EAS. | No tocar el directorio Android ignorado. Revisar el manifiesto fusionado del APK y probar captura en Android después de compilar. | **Configuración fuente correcta; prueba en APK pendiente.** La discrepancia solo existe en snapshot local ignorado. |
| APK-05 | **P2 — Android / firma** | [`mobile/android/app/build.gradle:100-118`](mobile/android/app/build.gradle) | El snapshot ignorado firma `release` con debug. No representa necesariamente la compilación CNG cloud y no se consultaron credenciales EAS. | Antes del build, confirmar en EAS la firma para `internal-production-api`; conservar la misma clave para actualizar instalaciones. No se alteraron credenciales. | **Pendiente de configuración externa.** La firma cloud no verificada. |
| APK-06 | **P2 — Android / actualización APK** | [`mobile/eas.json:2-47`](mobile/eas.json), [`mobile/app.json:6-23`](mobile/app.json) | `android.versionCode=1`, `appVersionSource=local` y `autoIncrement=true` incluyen ahora el perfil nuevo. `versionName` sigue en `0.1.0`; package ID no se cambió. EAS incrementará `versionCode` en el proyecto de trabajo durante el build; no se ejecutó ni mutó el código ahora. | Al construir, revisar el diff del `versionCode` y confirmar que sube respecto de cualquier APK ya instalada. | **Configuración lista; resultado del build pendiente.** |
| APK-07 | **P2 — Notificaciones / cron** | [`backend/src/routes/notification-jobs.routes.ts:11-20`](backend/src/routes/notification-jobs.routes.ts), [`backend/vercel.json`](backend/vercel.json) | El endpoint responde 503 si falta un `CRON_SECRET` de al menos 32 bytes y 401 si el header no autoriza. La variable no existe en el `.env` local; esto no informa sobre Vercel. | Configurar la misma credencial robusta en Vercel y en el mecanismo que llama al cron; validar la ejecución remota sin exponerla. | **Pendiente de configuración externa.** No bloquea compilar; recordatorios no verificados. |
| APK-08 | **P2 — OAuth Android** | [`mobile/src/services/oauth.service.ts:14-17`](mobile/src/services/oauth.service.ts), [`mobile/app.json:13-22`](mobile/app.json), [`backend/src/config/oauth.ts:49-78`](backend/src/config/oauth.ts) | `petcare://oauth` coincide con el scheme de la app y el allowlist local. No acredita callbacks/credenciales del ambiente desplegado ni el retorno de un APK instalado. | En QA, comprobar callback permitido y configuración de cada proveedor y probar retorno desde browser a APK standalone. | **Pendiente de configuración externa y prueba en APK.** |
| APK-09 | **P2 — Identidad Android / publicación** | [`mobile/app.json:11-23`](mobile/app.json) | Se mantuvo `com.anonymous.petcare` según la instrucción de no cambiar package ID sin aprobación. Sirve para build interno; la identidad definitiva para Play sigue sin definirse. | Decidir un package ID de marca antes de publicar; no cambiarlo para este primer build. | **No bloqueante para compilar APK interno.** Pendiente de aprobación antes de publicación. |
| APK-10 | **P2 — Notificaciones / Android** | [`mobile/app.json:25-42`](mobile/app.json), [`mobile/src/services/push-notifications.native.ts:66-83`](mobile/src/services/push-notifications.native.ts) | Plugin, canal, solicitud de permiso, token y Firebase client config están definidos. El cliente Firebase coincide con package ID y no es cuenta de servicio. No hay ejecución comprobada de FCM/Expo Push ni recepción con app cerrada. | Validar permisos, token y recepción en APK standalone; verificar configuración EAS/backend sin mostrar secretos. | **Pendiente de prueba en APK y configuración externa.** No bloquea compilación. |
| APK-11 | **P2 — Calidad / lint backend** | [`backend/eslint.config.mjs`](backend/eslint.config.mjs), [`backend/package.json`](backend/package.json) | La configuración flat ESLint existía. El fallo anterior se debió a ejecutar ESLint desde la raíz en vez de `backend/`. Reejecutado desde el directorio correcto: pasa sin errores. No requirió cambios de lint. | Mantener los scripts ejecutándose desde la raíz correcta o usar el workspace backend en CI. | **Resuelto: verificación corregida; no necesitó modificación.** |
| APK-12 | **P2 — Calidad / Expo Doctor** | [`mobile/package.json`](mobile/package.json), entorno local | Se intentó el comando oficial `npx --yes expo-doctor` desde `mobile/`. npm no pudo resolver `registry.npmjs.org` (`ENOTFOUND`); Doctor no se instaló ni se ejecutó. | Repetir `npx expo-doctor` cuando haya conectividad con npm y resolver sus hallazgos. | **Pendiente por conectividad.** No se declara Doctor aprobado. |
| APK-13 | **P2 — UX/UI / compatibilidad real** | [`AUDITORIA_UX_UI_PETCARE.md`](AUDITORIA_UX_UI_PETCARE.md), [`MATRIZ_PRUEBAS_PETCARE.md:59-61`](MATRIZ_PRUEBAS_PETCARE.md) | No se abrió la app en dispositivo/emulador ni se verificaron safe areas, teclado, navegación, accesibilidad, tema, tamaños o flujos por rol. Las decoraciones no se modificaron. | Recorrer pantallas por rol en Android y web con QA aislado; registrar fallos visuales y funcionales reproducibles. | **Pendiente de prueba en APK.** |
| APK-14 | **P3 — Seguridad / gestión de secretos** | [`mobile/google-services.json`](mobile/google-services.json), [`.gitignore`](.gitignore) | La configuración cliente Firebase está versionada y coincide con package ID; no es una cuenta de servicio. `.env` no está versionado. Esto no equivale a escaneo de secretos ni CVE. | Mantener secretos solo en stores de entorno/firma y completar escaneo de secretos/dependencias en CI. | Estático; **pendiente de análisis automatizado completo.** |

## Revisiones y evidencia local

### Comprobaciones ejecutadas

| Comprobación | Resultado | Alcance |
|---|---|---|
| `mobile/node_modules/.bin/tsc.cmd --noEmit` desde `mobile/` | **Aprobado** | Typecheck mobile, exit code 0. |
| `mobile/node_modules/.bin/expo.cmd lint` desde `mobile/` | **Aprobado** | Exit code 0 con la configuración local existente. |
| `mobile/node_modules/.bin/tsx.cmd --test tests/*.test.ts` desde `mobile/` | **Aprobado: 11/11** | Incluye siete regresiones de entorno/API y normalización de rutas; son unit tests, no API/DB. |
| `backend/node_modules/.bin/tsc.cmd --noEmit -p backend/tsconfig.check.json` | **Aprobado** | Typecheck backend, exit code 0. |
| `backend/node_modules/.bin/eslint.cmd src tests` desde `backend/` | **Aprobado** | Exit code 0. La configuración flat ESLint del backend ya existía; el fallo anterior fue por ejecutar desde la raíz. |
| `backend/node_modules/.bin/tsx.cmd --test backend/tests/*.test.ts` | **Aprobado: 14/14** | Autorización pura y reglas de checkout/estados; no prueban endpoints ni DB. |
| Validación de JSON de `app.json` y `eas.json`; consistencia Firebase/package | **Aprobado estáticamente** | JSON válido; package coincide con el cliente Android de Firebase; perfil `preview` declara `android.buildType = apk`. |
| Versiones nativas contra `expo/bundledNativeModules.json` local | **Coinciden** | React, RN, Router, Notifications, Secure Store, Image Picker, Web Browser, Crypto y DateTimePicker coinciden con el mapa local instalado. No reemplaza Expo Doctor ni una resolución en línea. |
| Validación de EAS/app config | **Aprobado estáticamente; remoto no verificado** | Aserciones locales confirman `internal-production-api`, APK interno, entorno `production`, URL Vercel y `EXPO_PUBLIC_APP_ENV=production`; el `.env` local tiene la misma URL. También preservan `preview` y su guard. `eas env:list --environment production --json` quedó sin respuesta y se interrumpió; no se revelaron valores remotos. |
| GET `https://pet-care-sistema-veterinario.vercel.app/api/health` | **No verificado** | Petición GET de salud, sin autenticación y sin DB, falló antes de conectar por DNS: host desconocido en este entorno. No se intentaron endpoints de escritura. |
| `expo config --type public` desde `mobile/` | **Aprobado** | Expo CLI resolvió nombre, scheme, package, versionCode y plugins desde `app.json`; no ejecuta Expo Doctor ni compila Android. |
| `git diff --check` | **Aprobado** | Sin errores de whitespace en los cambios actuales. |
| Estado Git | **Cambios locales esperados** | `mobile/app.json`, `mobile/eas.json`, `mobile/src/services/api.ts`, tests, el informe anterior y este informe. |

### Inspección estática adicional

- Expo declara SDK `~58.0.16`, React Native `0.88.0`, Router `~58.0.24`, `petcare` como scheme y `com.anonymous.petcare` como paquete.
- Perfil `internal-production-api`: `distribution=internal`, `android.buildType=apk`, `environment=production`, `autoIncrement=true`, `EXPO_PUBLIC_APP_ENV=production`, y `EXPO_PUBLIC_API_URL=https://pet-care-sistema-veterinario.vercel.app/api`. La aserción local valida el valor configurado en el perfil. Los valores remotos del entorno production en EAS no se pudieron consultar.
- `preview` conserva `EXPO_PUBLIC_APP_ENV=preview`, no incluye API URL y el guard rechaza el origen productivo. En el perfil nuevo, el guard permite solo el endpoint productivo canónico; un override distinto de URL o entorno falla cerrado.
- `apiRequest` conserva un único `/api`: el base termina en `/api` y la función elimina un `/api` inicial de las rutas. Tests cubren rutas con y sin prefijo.
- `app.json` fija `versionCode: 1`; EAS usa version source `local` y `autoIncrement` también para el perfil nuevo. El build real debe confirmar el código y la actualización instalada.
- El plugin ImagePicker SDK 58 declara permiso de cámara y bloquea micrófono. La documentación indica que `cameraPermission` distinto de `false` agrega CAMERA; el manifiesto local ignorado no fue editado. CNG/EAS vuelve a generar nativos desde la configuración fuente.
- El flujo OAuth usa `petcare://oauth`; el manifiesto nativo local incluye el scheme. La configuración local no autentica ni valida los proveedores remotos.
- La app y backend tienen separación por módulos y servicios. Las auditorías previas documentan coincidencia estática de wrappers/rutas y middleware de autorización. En este turno no se hizo fuzzing ni prueba directa de endpoints, SQL o IDOR contra servidor.
- Los tests backend cubren reglas unitarias de permisos y transiciones, pero no demuestran que una cuenta real, grant de DB o endpoint desplegado las aplique correctamente.
- No se hizo auditoría CVE: `npm audit` requeriría acceso al registro/base de advisories, y no hay evidencia suficiente de un análisis de vulnerabilidades actual.

## Limitaciones: no ejecutado

- Se intentó Expo Doctor con `npx --yes expo-doctor`; npm respondió `ENOTFOUND registry.npmjs.org`. Doctor no se ejecutó ni se declara aprobado.
- El CLI EAS está instalado, pero `eas env:list --environment production --json` no respondió y se interrumpió; no se pudieron verificar variables remotas, autenticación ni firma cloud. No se inició un build.
- No se generó APK ni AAB; no se ejecutó Gradle ni se validó el manifiesto fusionado, firma, tamaño, instalación, apertura o actualización.
- No hubo emulador/dispositivo Android, cuenta QA ni sesión de usuario.
- Solo se intentó `GET /api/health`; no se llamaron rutas de autenticación, escritura, Vercel config, OAuth, Firebase/Expo Push, SMTP, Cloudinary ni DB; no se ejecutaron pruebas de integración.
- No se ejecutaron migraciones, seeds ni scripts de DB. No se modificaron `.env` ni credenciales.
- No se verificaron roles/ownership mediante cuentas reales, concurrencia de turnos, stock, precio, transferencias, comprobantes, entrega de correo ni recepción de push.
- El estado remoto de `CRON_SECRET`, FCM/Expo Push, credenciales EAS, proveedores OAuth, base destino, esquema y despliegue es desconocido.

## Correcciones y criterios prioritarios

1. Antes del build, revisar en el dashboard EAS las variables `EXPO_PUBLIC_API_URL` y `EXPO_PUBLIC_APP_ENV` del entorno `production`; deben coincidir con el perfil. La app rechazará en runtime una combinación que no resuelva al endpoint canónico.
2. Confirmar credencial EAS y luego instalar el APK. Validar en Android el GET de salud HTTPS y OAuth/deep link; la conectividad desde este entorno no pudo comprobarse por DNS.
3. Tratar toda operación autenticada como producción: no crear datos de prueba. Usar cuentas y acciones reales autorizadas. Las lecturas pueden exponer datos clínicos/personales a quien tenga sesión válida.
4. Probar notificaciones solo tras confirmar consentimiento/dispositivo destino; registro de token cambia estado y el cron puede crear recordatorios y enviar push/correos.
5. Antes de publicación, confirmar package ID con aprobación, firma estable, versionCode, pagos reales y requisitos de Play.
6. Expo Doctor queda pendiente por conectividad de npm. Lint backend pasó desde su directorio correcto.

## Operaciones con efecto sobre producción

- **Registro, sesión y recuperación:** crean cuentas/sesiones, guardan eventos/códigos de verificación o recuperación y pueden enviar correos.
- **Mascotas y fotos:** crear/editar/desactivar mascota actualiza el perfil y almacenamiento de imágenes.
- **Turnos:** solicitar/cancelar/actualizar reservas modifica agenda, disponibilidad y notificaciones asociadas.
- **Tienda/checkout:** crea pedidos e intentos de transferencia y puede reservar/modificar stock según el flujo activo; enviar comprobantes deja datos persistentes para revisión. Tarjeta sigue siendo demo y no cobra.
- **Administración/roles:** editar usuarios, permisos, servicios, profesionales, disponibilidad, productos, pedidos o configuración clínica cambia datos operativos reales.
- **Notificaciones:** actualizar preferencias/token modifica el registro del dispositivo; el cron puede persistir recordatorios, estados de entrega y correos/push.

No se ejecutó ninguna de estas operaciones.

## Comando para generar el APK — no ejecutado

El perfil `internal-production-api` estático en `mobile/eas.json` declara APK interno con la API de producción. Cuando se decida el build y se revisen credenciales/variables cloud, ejecutar desde `mobile/`:

```powershell
npx eas-cli@latest build --platform android --profile internal-production-api
```

Este comando **no se ejecutó**. El perfil y el `.env` local declaran la URL esperada; los valores efectivos del entorno EAS cloud no fueron inspeccionados porque la consulta quedó sin respuesta. El cliente aceptará solo el endpoint productivo configurado. No se afirma que la conexión Android funcione hasta probar un APK instalado.

## Documentación oficial consultada

- [Expo Doctor: ejecución oficial](https://docs.expo.dev/develop/tools/)
- [Expo SDK 58 ImagePicker: permisos y config plugin](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/)
- [EAS: gestión de versiones y versionCode](https://docs.expo.dev/build-reference/app-versions/)
- [EAS: perfiles y autoIncrement](https://docs.expo.dev/eas/json/)
- [EAS: variables por entorno y build profile](https://docs.expo.dev/eas/environment-variables/usage/)

## Antecedentes consultados

Se contrastó el estado actual con `AUDITORIA_CONEXIONES_PETCARE.md`, `AUDITORIA_HARDCODEO_PETCARE.md`, `AUDITORIA_UX_UI_PETCARE.md`, `MATRIZ_PRUEBAS_PETCARE.md` y `PLAN_MEJORAS_PETCARE.md`. Se usaron como contexto y no como prueba de ejecución remota; las limitaciones de API/DB y Android físico siguen vigentes.
