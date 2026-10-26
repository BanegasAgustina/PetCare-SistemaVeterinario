# Guía de instalación y configuración de PetCare

Esta guía permite levantar PetCare localmente y preparar integraciones de desarrollo. El sistema tiene un cliente Expo/React Native en `mobile/` y un API Express/TypeScript en `backend/`; el backend necesita MariaDB/MySQL accesible (Layerbase en los despliegues descritos por el repositorio). El desarrollo local puede usar una base propia, pero no se ejecutan migraciones automáticamente al iniciar la app.

## 1. Requisitos previos

- Git.
- Node.js 22.x recomendado por la configuración actual de Expo; npm viene incluido.
- Una base MariaDB/MySQL accesible y un usuario con los permisos necesarios para las tablas requeridas.
- Android Studio y Android SDK si se desea emulador/build local Android; un navegador moderno es suficiente para web.
- Cuenta Expo/EAS solo para builds distribuidos; cuenta Vercel si se despliega allí.
- Acceso a las consolas Google Cloud, Meta y X solo si se configura login social.
- SMTP y proveedor de imágenes (Cloudinary o almacenamiento S3 compatible) solo para esas capacidades.

Revisar versiones/compatibilidad en `backend/package.json`, `mobile/package.json`, `mobile/app.json` y `mobile/eas.json`. `mobile` utiliza Expo Router, React Native y SDK configurado por las dependencias actuales; no sustituir versiones a partir de esta guía sin revisar compatibilidad.

## 2. Clonar e instalar

```bash
git clone <URL_DEL_REPOSITORIO>
cd PetCare-SistemaVeterinario

cd backend
npm ci
cp .env.example .env
cd ../mobile
npm ci
cp .env.example .env
```

En PowerShell, la copia equivalente es `Copy-Item .env.example .env`. No versionar archivos `.env` ni compartirlos. No se reproducen valores secretos de archivos locales.

## 3. Configuración del backend

Editar `backend/.env` local. Variables de configuración principales:

| Grupo | Variables | Uso |
|---|---|---|
| Proceso | `NODE_ENV`, `PORT` | `development` y puerto 3000 como valores locales habituales. |
| Base de datos | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`, `DB_CONNECTION_LIMIT`, `DB_CONNECT_TIMEOUT_MS` | Host/credenciales MariaDB/MySQL. En producción el host, usuario y contraseña son obligatorios; TLS debe estar activo. Host local solo en desarrollo. |
| JWT | `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_ISSUER`, `JWT_AUDIENCE`, `BCRYPT_SALT_ROUNDS` | Claves y duración de autenticación. El secreto debe ser aleatorio y tener 32 bytes como mínimo; TTL entre 1 y 3600 segundos. |
| Web | `CORS_ALLOWED_ORIGINS` | Orígenes web separados por coma, sin rutas. Producción acepta únicamente orígenes HTTPS exactos. |
| Correo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `EMAIL_CODE_SECRET` | SMTP y firma de códigos de email. `EMAIL_CODE_SECRET` debe ser un secreto aleatorio independiente. |
| Flujos por email | `PASSWORD_RESET_URL`, `ACCOUNT_INVITATION_URL`, `VETERINARIAN_INVITATION_URL` | URLs frontend de recuperación y activación. |
| OAuth | `BACKEND_URL`, `OAUTH_RETURN_URLS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_GRAPH_VERSION`, `X_CLIENT_ID`, `X_CLIENT_SECRET` | Callbacks y secretos de proveedores, solo en backend. El código también admite nombres legacy `TWITTER_CLIENT_ID`/`TWITTER_CLIENT_SECRET`. |
| Notificaciones | `CRON_SECRET`, `EXPO_PUSH_ACCESS_TOKEN` | Proteger cron y enviar push desde backend. CRON_SECRET debe ser secreto aleatorio de 32 bytes o más. |
| Fotos | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` o `BUCKET`, `REGION`, `ENDPOINT`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `PET_PHOTO_S3_URL_STYLE` | Almacenamiento de imágenes. Configure un proveedor compatible; nunca en `mobile` ni `EXPO_PUBLIC_*`. |
| Tienda | `STORE_DEMO_MODE` | Por defecto falso. `true` habilita el checkout de demostración; no procesa cobros reales. |

Las variables se validan en `backend/src/config/env.ts`, `config/mail.ts`, `config/oauth.ts` y servicios. `backend/.env.example` es el inventario base actualizado. Los nombres opcionales `PETCARE_EXPECTED_DB_HOST` y `PETCARE_EXPECTED_DB_NAME` son específicos de preflight de migraciones y no se necesitan para arrancar la app.

### Layerbase/MariaDB

Obtenga host, puerto, nombre de base, usuario, contraseña y requisitos TLS desde el panel de Layerbase. No suponga que `localhost` apunta a una base remota. Use `DB_SSL_MODE=required` (o `verify_identity` cuando el host/certificado lo permite). Producción rechaza loopback, IP privada LAN y hosts Railway heredados.

Con `backend/.env` completo, confirme conectividad con:

```bash
cd backend
npm run db:check
npm run db:audit:readonly
```

`db:check` y `db:audit:readonly` son operaciones de comprobación/lectura. No ejecute `db:migrate`, `db:bootstrap`, `db:seed` ni scripts `db:migrate:*` sin revisar el SQL, el estado del esquema y contar con autorización del operador de la base. La app no corrige automáticamente el esquema al iniciar. En producción, la conexión de health check puede probarse con `GET /api/health/database`.

**Bloqueo confirmado para una instalación desde cero:** en este checkout faltan los directorios `backend/bootstrap/` y `backend/migrations/`, que los runners `src/database/bootstrap.ts` y `src/database/migration-files.ts` intentan leer. Por eso los scripts `db:bootstrap` y `db:migrate` aparecen en `package.json`, pero no tienen el SQL base necesario para completar una instalación limpia. Los migradores de extensiones no sustituyen una secuencia base completa. Antes de crear una base nueva, solicite y revise al mantenedor los archivos canónicos faltantes y el orden soportado; no ejecute un bootstrap parcial ni restaure solo una parte de las migraciones.

## 4. Arrancar backend local

```bash
cd backend
npm run dev
```

Servidor por defecto: `http://localhost:3000`; API base: `http://localhost:3000/api`. `GET /api/health` comprueba que Express responde y `GET /api/health/database` comprueba conexión SQL. Los logs del backend están sanitizados para no mostrar SQL completo, parámetros ni tokens.

Comandos disponibles en `backend/package.json`:

| Comando | Resultado |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga. |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm start` | Ejecuta `dist/server.js`. |
| `npm run typecheck`, `npm run lint`, `npm test` | Tipos, ESLint y pruebas unitarias. |
| `npm run oauth:callbacks` | Muestra callbacks de proveedores según `BACKEND_URL`. |
| `npm run db:check`, `npm run db:audit:readonly` | Verificaciones de base/SQL de solo lectura. |

El paquete además define varios comandos de migración, bootstrap, semillas, creación/promoción de administradores y pruebas con DB. Revisar `backend/package.json` antes de invocarlos; algunos modifican datos/esquema.

## 5. Arrancar frontend

Configurar `mobile/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

Para Android Emulator usar normalmente `http://10.0.2.2:3000/api`; para teléfono físico use la IP LAN de la computadora y asegúrese de que el firewall permita el puerto. En producción, `mobile/eas.json` define la API pública HTTPS. `EXPO_PUBLIC_*` queda incorporada al bundle y nunca debe contener secretos.

```bash
cd mobile
npm start
npm run web
npm run android
```

`npm run android` usa el flujo nativo local y requiere Android Studio/SDK. El backend debe aceptar el origen web local y el teléfono/emulador debe poder alcanzar su host.

## 6. Login y OAuth externo

El login JWT tradicional usa `POST /api/auth/login`; el frontend conserva la sesión en almacenamiento seguro nativo y `sessionStorage` web. La expiración requiere renovar o volver a autenticarse. La app no guarda contraseña.

Para Google, Facebook y X:

1. Configure la app OAuth web en la consola del proveedor y habilite el flujo solicitado por su producto.
2. En backend, ponga los client ID/secret privados y `BACKEND_URL` (origen sin `/api`).
3. Configure `OAUTH_RETURN_URLS` con los destinos finales permitidos, como la página web `/oauth` y el esquema nativo `petcare://oauth` según el entorno.
4. Ejecute `npm run oauth:callbacks` desde `backend/` y copie el callback HTTPS exacto mostrado al portal del proveedor: `/api/auth/oauth/{provider}/callback`.
5. Verifique dominio, URI de retorno, modo de publicación y permisos en la cuenta de desarrollador externa.

Google y X usan PKCE; Facebook usa el flujo configurado en backend. PetCare no vincula automáticamente identidades porque compartan email y exige verificar correo para altas que lo requieran. X no entrega email en el flujo descrito por el código. No coloque secretos OAuth en Expo, `mobile/.env`, `EXPO_PUBLIC_*` o el repositorio.

## 7. SMTP y notificaciones

El correo de verificación, invitación y recuperación depende de un relay SMTP alcanzable, credenciales activas, remitente autorizado y URLs frontend válidas. `SMTP_SECURE` y `SMTP_REQUIRE_TLS` deben coincidir con el proveedor SMTP. Revise los logs del proveedor y la carpeta de spam; el endpoint público no debe usarse para inferir si una cuenta existe.

Las push Android requieren configuración nativa Expo/FCM y credenciales en EAS, permiso del dispositivo, token registrado y API alcanzable. Expo Go no admite push remoto en Android. El centro de notificaciones web consulta la API, pero no usa Web Push. `GET /api/cron/notifications` está programado diariamente a las 03:00 UTC por `backend/vercel.json`; Vercel debe usar `backend` como Root Directory y tener `CRON_SECRET`. Las pruebas locales no confirman entrega real.

## 8. Despliegue Vercel

El repositorio contiene `backend/vercel.json` con el cron de notificaciones y `mobile/vercel.json` para cabeceras web. En Vercel, configure dos proyectos con Root Directory apropiado (`backend` y `mobile`) si se despliegan por separado. Revise los comandos de build y dependencias antes de cada deploy.

En backend configure variables de DB, JWT, CORS, SMTP, URLs, OAuth, almacenamiento y cron según las funciones habilitadas. Use URL HTTPS pública y CORS con orígenes web exactos. Nunca configure las credenciales privadas en el proyecto frontend. En mobile defina únicamente `EXPO_PUBLIC_API_URL` para la API correspondiente.

No despliegue desde esta guía sin comprobar credenciales y entorno Vercel reales. Las credenciales de proveedor, dominios y publicación se administran en sus consolas externas.

## 9. Expo y APK con EAS

`mobile/app.json` configura Expo Router, esquema `petcare`, notificaciones, SecureStore, selector de imágenes, paquete Android `com.anonymous.petcare` y Project ID EAS. `mobile/eas.json` define perfiles `development` (development client APK), `preview` (APK interno), `production` (distribución de producción habitual) y `production-apk` (APK instalable).

Desde `mobile/`:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production-apk
```

Development build requiere `npx expo start --dev-client` para servir el bundle. Preview y production-apk usan API HTTPS declarada en el perfil; compruebe que sea la API deseada. Para tienda Google Play use el perfil que genera el formato configurado para distribución de producción. Instalar EAS CLI mediante `npx` no añade dependencia al proyecto.

Expo Go sirve para desarrollo compatible de pantallas y login tradicional, pero no reproduce el esquema nativo OAuth de PetCare ni push remoto Android. Para esas capacidades use development build/APK propio.

## 10. Verificación integral

1. `GET /api/health` devuelve `success: true`.
2. `GET /api/health/database` devuelve resultado saludable.
3. Abra frontend y confirme URL de API en Network/logs sin exponer secretos.
4. Registre una cuenta de prueba, verifique el correo con SMTP y haga login.
5. Compruebe `/auth/me`, permisos, perfil y rutas del rol correspondiente.
6. Pruebe una operación de lectura `POST` con JSON y una escritura permitida; confirme ownership.
7. Si está configurado, pruebe OAuth, fotos, correo, cron y push con cuentas/dispositivos controlados.
8. Desde `backend/` y `mobile/`, los comandos de verificación disponibles son `npm run typecheck`, `npm run lint` y `npm test`.

## 11. Problemas frecuentes

- **API no responde desde móvil:** localhost del teléfono no es la computadora; use IP LAN, emulador `10.0.2.2`, puerto abierto y misma red.
- **DB timeout/TLS:** confirme host/puerto allowlist, TLS, usuario, contraseña y `DB_SSL_MODE`; pruebe `/api/health/database`.
- **Login 503:** `JWT_ACCESS_SECRET` ausente/corto o configuración de token inválida; use secreto aleatorio de 32 bytes mínimo.
- **CORS web:** agregue el origen HTTPS exacto, sin ruta ni slash final, a `CORS_ALLOWED_ORIGINS` y reinicie/redeploy.
- **404 al hacer GET de una consulta:** las lecturas internas migradas son POST; use la ruta y body que figuran en `docs/DOCUMENTACION_API.md`.
- **OAuth vuelve a error:** verifique callback del proveedor carácter por carácter, `BACKEND_URL`, retorno permitido y variables privadas de ese proveedor.
- **SMTP sin correo:** revise host/puerto/TLS, autenticación, remitente y logs de entrega del proveedor.
- **Expo Go no abre login social/push:** es una limitación del cliente genérico; genere development build con EAS y credenciales nativas.
- **EAS/APK llega a API equivocada:** revise `EXPO_PUBLIC_API_URL` en el perfil/entorno EAS y cree un build nuevo.
- **Foto/comprobante rechazado:** formato MIME soportado, base64/archivo no corrupto y límite 8 MB para fotos (5 MB comprobantes).
- **Ruta o permiso denegado:** confirme método, prefijo `/api`, rol y grants vigentes en MySQL; ocultar una pantalla no sustituye autorización del backend.

Para el diagnóstico ampliado consulte `docs/ERRORES_Y_SOLUCIONES.md` y la API actual en `docs/DOCUMENTACION_API.md`.
