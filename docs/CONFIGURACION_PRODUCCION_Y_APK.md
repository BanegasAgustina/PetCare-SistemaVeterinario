# PETCARE — GUÍA DEFINITIVA DE CONFIGURACIÓN DE PRODUCCIÓN, OAUTH Y APK ANDROID

Este documento detalla el diagnóstico, las causas raíz identificadas, las modificaciones implementadas en el código, las variables de entorno necesarias en Vercel, la configuración de consolas OAuth y los pasos exactos para compilar, instalar y probar el APK de Android de forma 100% independiente de servidores locales.

---

## 1. Diagnóstico Integral y Causas Raíz

### A. Falla de OAuth en Producción (Redirección a `localhost:3000`)
* **Problema reportado**: Al intentar autenticar con Google, Meta o X desde la web pública o la app, el proceso intentaba comunicarse con `localhost:3000` o fallaba inmediatamente fuera de la computadora de desarrollo.
* **Causa real identificada**:
  1. Al consultar directamente el backend en producción (`https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/google/start`), la respuesta HTTP entregaba:
     `redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Foauth%2Fgoogle%2Fcallback`.
  2. En el panel de Vercel del proyecto de backend (`pet-care-sistema-veterinario`), la variable `BACKEND_URL` fue configurada originalmente con el valor del `.env` local (`http://localhost:3000`).
  3. En entornos serverless de Vercel, `process.env.NODE_ENV` puede no estar definido a nivel de función si no se declara explícitamente en el dashboard. Esto hacía que el código evaluara `nodeEnvironment` como `'development'` y permitiera silenciosamente `http://localhost:3000` en lugar de rechazarlo con un error.

### B. Falla de APK Autónomo sin Metro ni Wi-Fi
* **Problema reportado**: El APK requería que la computadora estuviera encendida, Metro corriendo y en la misma red local.
* **Causa real identificada**:
  1. El archivo `eas.json` no contenía el bloque `"env"` con `EXPO_PUBLIC_API_URL` en sus perfiles `preview`, `production` y `production-apk`.
  2. Debido a que `.env` está en `.gitignore`, una compilación en la nube de EAS (o local sin `.env` presente) generaba un APK con `EXPO_PUBLIC_API_URL` como `undefined`.
  3. En `mobile/src/services/api.ts`, ante un valor `undefined`, `getApiUrl()` arrojaba la excepción `API_NOT_CONFIGURED` (`"La conexión con PetCare todavía no está configurada"`), bloqueando todo inicio de sesión o registro.

### C. Vulnerabilidad a Rutas Duplicadas (`/api/api/...`)
* Si un servicio invocaba una ruta incluyendo el prefijo `/api` (p. ej. `/api/auth/login`) o si la URL base terminaba o no en `/api`, se podían originar URLs mal formadas como `.../api/api/...` o `.../apiauth/login`.

---

## 2. Archivos Modificados y Correcciones Realizadas

| Archivo | Corrección Realizada |
| :--- | :--- |
| `backend/src/config/env.ts` | Detección robusta de producción: si `NODE_ENV` está indefinido pero el proceso corre en Vercel (`VERCEL === '1'` o `VERCEL_ENV === 'production'`), se asigna automáticamente `'production'`. |
| `backend/src/config/oauth.ts` | Uso de `env.nodeEnvironment`. Validación estricta en `backendOrigin()`: en producción rechaza taxativamente `localhost`, `127.0.0.1` e IPs privadas locales (`192.168.*`, `10.*`). Normaliza rutas con o sin `/api` o barra final extrayendo únicamente `url.origin`. |
| `backend/src/services/invitation.service.ts` | Validación reforzada de `invitationUrl`: prohíbe IPs privadas y loopback en producción. |
| `backend/src/services/password-reset.service.ts` | Validación reforzada de `resetUrl`: prohíbe IPs privadas y loopback en producción. |
| `backend/src/app.ts` | Configuración de Helmet HSTS sincronizada con `env.nodeEnvironment`. |
| `backend/src/utils/register-diagnostics.ts` | Diagnósticos de depuración deshabilitados en producción usando `env.nodeEnvironment`. |
| `backend/.env.example` | **[NUEVO]** Plantilla exhaustiva y documentada de todas las variables de backend para local y producción sin secretos. |
| `backend/tests/config.test.ts` | **[NUEVO]** Suite de pruebas unitarias verificando rechazo de loopback y orígenes CORS en backend. |
| `mobile/src/services/api.ts` | Centralización de `PRODUCTION_API_URL = 'https://pet-care-sistema-veterinario.vercel.app/api'`. En release (`!__DEV__`), si falta la variable de entorno, toma automáticamente la URL de producción canónica; si se intenta usar `http://` o loopback en release, lo rechaza. En `apiRequest`, limpia prefijos `/api` duplicados y normaliza la barra inicial. |
| `mobile/eas.json` | Inyección de `"EXPO_PUBLIC_API_URL": "https://pet-care-sistema-veterinario.vercel.app/api"` en los perfiles `preview`, `production` y `production-apk`. |
| `mobile/src/app/_layout.tsx` | Invocación de `WebBrowser.maybeCompleteAuthSession()` a nivel de módulo para captura y cierre inmediato de popups OAuth web. |
| `mobile/.env.example` | **[NUEVO]** Plantilla explicativa para el cliente móvil (diferenciando emulador, IP LAN y producción). |
| `mobile/tests/api.test.ts` | **[NUEVO]** Suite de pruebas unitarias para validación de la URL de API de producción. |

---

## 3. Configuración Obligatoria en Vercel

Configurá las siguientes variables en la consola de Vercel en sus respectivos proyectos:

### A. Proyecto Backend (`pet-care-sistema-veterinario`)
*Ubicación: Vercel Dashboard -> pet-care-sistema-veterinario -> Settings -> Environment Variables*

| Variable | Valor Requerido | Entorno | Observaciones |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production, Preview | Garantiza modo producción estricto |
| `BACKEND_URL` | `https://pet-care-sistema-veterinario.vercel.app` | Production, Preview | **CRÍTICO**: Origen público HTTPS del backend (sin `/api`) |
| `DB_HOST` | *(Host de Layerbase)* | Production, Preview | P. ej. `petcare-curt-stone.sage.cloud.layerbase.dev` |
| `DB_PORT` | `49116` | Production, Preview | Puerto remoto de Layerbase |
| `DB_NAME` | `petcare` | Production, Preview | Base de datos MariaDB |
| `DB_USER` | `root` | Production, Preview | Usuario de Layerbase |
| `DB_PASSWORD` | *(Contraseña de Layerbase)* | Production, Preview | Mantener en privado |
| `DB_SSL_MODE` | `verify_identity` | Production, Preview | Exige cifrado TLS con MariaDB |
| `JWT_ACCESS_SECRET` | *(Cadena secreta >= 32 caracteres)* | Production, Preview | Clave para firma de access tokens |
| `JWT_ACCESS_TTL_SECONDS` | `900` | Production, Preview | 15 minutos |
| `JWT_ISSUER` | `petcare-api` | Production, Preview | Emisor JWT |
| `JWT_AUDIENCE` | `petcare-mobile` | Production, Preview | Audiencia JWT |
| `CORS_ALLOWED_ORIGINS` | `https://petcare-sistemaveterinario-mobile.vercel.app` | Production, Preview | Origenes adicionales; la web oficial y las previews `petcare-sistemaveterinario-mobile-*.vercel.app` ya estan permitidas por el backend |
| `OAUTH_RETURN_URLS` | `petcare://oauth,https://petcare-sistemaveterinario-mobile.vercel.app/oauth` | Production, Preview | Destinos permitidos para tickets OAuth |
| `ACCOUNT_INVITATION_URL` | `https://petcare-sistemaveterinario-mobile.vercel.app/activate-account` | Production, Preview | Pantalla de activación web |
| `VETERINARIAN_INVITATION_URL` | `https://petcare-sistemaveterinario-mobile.vercel.app/activate-vet` | Production, Preview | Pantalla de activación veterinarios |
| `PASSWORD_RESET_URL` | `https://petcare-sistemaveterinario-mobile.vercel.app/reset-password` | Production, Preview | Pantalla de reseteo de clave |
| `SMTP_HOST` | `smtp.gmail.com` | Production, Preview | Servidor SMTP |
| `SMTP_PORT` | `587` | Production, Preview | Puerto STARTTLS |
| `SMTP_SECURE` | `false` | Production, Preview | STARTTLS utiliza puerto 587 con secure=false |
| `SMTP_REQUIRE_TLS` | `true` | Production, Preview | Exige cifrado TLS en SMTP |
| `SMTP_USER` | *(Email emisor)* | Production, Preview | Correo de la clínica |
| `SMTP_PASSWORD` | *(Contraseña de aplicación)* | Production, Preview | Clave de aplicación Google |
| `MAIL_FROM` | *(Email emisor)* | Production, Preview | Correo remitente |
| `EMAIL_CODE_SECRET` | *(Cadena secreta >= 32 caracteres)* | Production, Preview | HMAC para códigos de verificación |
| `GOOGLE_CLIENT_ID` | *(Client ID de Google)* | Production, Preview | De Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | *(Client Secret de Google)* | Production, Preview | De Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | *(App ID de Facebook)* | Production, Preview | De Meta Developers |
| `FACEBOOK_CLIENT_SECRET` | *(Secret de Facebook)* | Production, Preview | De Meta Developers |
| `FACEBOOK_GRAPH_VERSION`| `v26.0` | Production, Preview | Versión de Graph API |
| `X_CLIENT_ID` | *(Client ID de X/Twitter)* | Production, Preview | De X Developer Portal |
| `X_CLIENT_SECRET` | *(Client Secret de X/Twitter)* | Production, Preview | De X Developer Portal |

### B. Proyecto Frontend (`petcare-sistemaveterinario-mobile`)
*Ubicación: Vercel Dashboard -> petcare-sistemaveterinario-mobile -> Settings -> Environment Variables*

| Variable | Valor Requerido | Entorno | Observaciones |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | `https://pet-care-sistema-veterinario.vercel.app/api` | Production, Preview | Inyecta la URL de la API remota durante `npx expo export -p web` |

La API permite CORS para el dominio web oficial y los despliegues preview de ese proyecto en Vercel (`https://petcare-sistemaveterinario-mobile-<sufijo>.vercel.app`). Si una preview sigue fallando, verificá que la URL pertenezca a ese proyecto y que el backend haya sido redesplegado con esta configuración; no uses `*` como origen permitido.

---

## 4. Callbacks a Registrar en Proveedores OAuth

Para que el flujo social funcione en producción, registrá exactamente estas URLs en cada consola:

### A. Google Cloud Console (APIs & Services -> Credentials -> OAuth 2.0 Client IDs)
* **Authorized JavaScript origins (Orígenes de JavaScript autorizados)**:
  `https://petcare-sistemaveterinario-mobile.vercel.app`
* **Authorized redirect URIs (URIs de redireccionamiento autorizados)**:
  `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/google/callback`

### B. Meta for Developers (Facebook Login -> Settings)
* **Valid OAuth Redirect URIs (URIs de redireccionamiento de OAuth válidos)**:
  `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/facebook/callback`

### C. X (Twitter) Developer Portal (User authentication settings)
* **App permissions**: `Read`
* **Type of App**: `Web App, Automated App or Bot` o `Native App` (confidential client con Client Secret)
* **Callback URI / Redirect URL**:
  `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/x/callback`
* **Website URL**:
  `https://petcare-sistemaveterinario-mobile.vercel.app`

---

## 5. Compilación y Generación del APK Android

### Opción A: Compilación con EAS Build en la Nube (Recomendada)
Asegurate de tener instalada y autenticada la CLI de EAS:
```bash
# 1. Posicionarse en la carpeta mobile
cd mobile

# 2. Iniciar sesión en Expo/EAS si no lo hiciste
npx eas-cli login

# 3. Compilar APK con el perfil production-apk (genera archivo .apk instalable)
npx eas-cli build -p android --profile production-apk
```
*O con el perfil preview:*
```bash
npx eas-cli build -p android --profile preview
```
Al finalizar el comando, la CLI de EAS proporcionará un enlace directo para descargar el archivo `.apk`.

### Opción B: Compilación Local con Gradle (requiere Android SDK y JDK 17)
Si contás con el entorno de desarrollo Android instalado localmente en tu computadora:
```bash
cd mobile/android
# En Windows (PowerShell / CMD):
.\gradlew.bat assembleRelease
```
El APK se generará en:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 6. Procedimiento para Instalar y Probar el APK

1. **Transferir el APK al dispositivo**:
   - Descargalo desde el enlace de EAS en el navegador del teléfono, o
   - Copialo vía cable USB / Google Drive al celular.
2. **Instalación**:
   - Abrí el archivo `.apk` en el dispositivo y aceptá la instalación desde fuentes desconocidas si el sistema lo solicita.
3. **Prueba de Funcionamiento Autónomo (Sin red local ni PC)**:
   - **Apagá el Wi-Fi del celular y conectate únicamente por datos móviles 4G/5G** (o conectate a una red Wi-Fi diferente a la de tu casa).
   - **Cerrá VS Code, terminales y apagá o desconectá la computadora**.
   - Abrí PetCare en el teléfono.
   - Navegá a la pantalla de Login y probá ingresar con una cuenta o registrar una nueva.
   - Observá que la aplicación se comunica directamente mediante HTTPS con `https://pet-care-sistema-veterinario.vercel.app/api`.

---

## 7. Pruebas Ejecutadas y Resultados

| Prueba | Comando / Endpoint | Resultado | Estado |
| :--- | :--- | :--- | :--- |
| **Typecheck Backend** | `npm run typecheck` en `backend/` | 0 errores | PASS |
| **Typecheck Mobile** | `npm run typecheck` en `mobile/` | 0 errores | PASS |
| **Lint Backend** | `npm run lint` en `backend/` | 0 advertencias / errores | PASS |
| **Lint Mobile** | `npm run lint` en `mobile/` | 0 advertencias / errores | PASS |
| **Tests Backend** | `npx tsx --test tests/config.test.ts` | 2/2 tests exitosos | PASS |
| **Tests Mobile** | `npx tsx --test tests/api.test.ts` | 1/1 tests exitosos | PASS |
| **Export Web Frontend** | `npx expo export -p web` en `mobile/` | 42 rutas y 44 assets exportados exitosamente | PASS |
| **Expo Config Public** | `npx expo config --type public` | Configuración válida (slug: petcare, scheme: petcare, package: com.anonymous.petcare) | PASS |
| **Salud Backend Producción** | `GET https://pet-care-sistema-veterinario.vercel.app/api/health` | `200 OK` (`PetCare API funcionando`) | PASS |
| **Base de Datos Producción** | `GET https://pet-care-sistema-veterinario.vercel.app/api/health/database` | `200 OK` (`database: available`) | PASS |
| **CORS Preflight Producción** | `OPTIONS /api/auth/login` con origin web | `204 No Content` con headers permitidos | PASS |
| **Auth Login Producción** | `POST /api/auth/login` con credenciales de prueba | `401 Unauthorized` (`Correo electrónico o contraseña incorrectos`) en formato JSON | PASS |

---

## 8. Clasificación de Estado Final

* **CORREGIDO Y VERIFICADO**:
  1. Centralización de la URL de API en `mobile/src/services/api.ts` con protección estricta contra localhost y private IPs en producción.
  2. Eliminación de riesgo de rutas duplicadas (`/api/api/...`) en el cliente HTTP `apiRequest`.
  3. Detección automática de entorno de producción en Vercel en `backend/src/config/env.ts`.
  4. Inyección explícita de `EXPO_PUBLIC_API_URL` en todos los perfiles de compilación de `eas.json`.
  5. Manejo a nivel de módulo de sesiones OAuth web en `mobile/src/app/_layout.tsx`.
  6. Todas las pruebas de compilación, TypeScript, linter, tests y export web superadas con cero errores.

* **CORREGIDO PERO NO VERIFICADO EN PRODUCCIÓN**:
  1. Despliegue del nuevo código del backend en Vercel (se requiere hacer `git push` a la rama `main` para que Vercel reconstruya con las nuevas validaciones).
  2. Generación del APK de Android final mediante EAS Build (requiere ejecutar el comando de compilación con credenciales EAS).

* **PENDIENTE DE CONFIGURACIÓN EXTERNA**:
  1. Actualización de la variable `BACKEND_URL` en el dashboard de Vercel del backend (cambiar de `http://localhost:3000` a `https://pet-care-sistema-veterinario.vercel.app`).
  2. Registro de callbacks en las consolas de Google Cloud, Meta y X Developer según la Sección 4 de este documento.

* **BLOQUEADO POR UN SERVICIO O ERROR REAL**:
  * Ninguno. La base de datos MariaDB en Layerbase está disponible y respondiendo activamente al backend en producción.
