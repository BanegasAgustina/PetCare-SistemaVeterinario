# PetCare Mobile

Cliente multiplataforma de PetCare en Expo, React Native, TypeScript y Expo Router. Los layouts de `src/app/` controlan login, áreas protegidas y pantallas para cliente, veterinario, peluquero, secretaría y administración. El rol se obtiene de la API; la autorización definitiva siempre la aplica el backend.

## Instalación y ejecución

Requiere Node.js 22.x recomendado y npm.

```bash
cd mobile
npm ci
cp .env.example .env
npm start
```

Para usar desde Expo el mismo backend remoto que la web, defina `EXPO_PUBLIC_DEV_API_URL=https://<host-de-la-api>/api` en `mobile/.env`. Esta URL HTTPS explícita tiene prioridad solo en desarrollo y queda incorporada al bundle local; no incluya credenciales ni secretos.

Si no define `EXPO_PUBLIC_DEV_API_URL`, puede apuntar `EXPO_PUBLIC_API_URL` a un backend local. Si tampoco está configurada (o contiene por error la URL de producción), el cliente usa el host LAN de Metro y el puerto `3000` (`EXPO_PUBLIC_API_PORT` permite cambiarlo). Para un emulador Android con Metro en localhost, `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api` es una opción local válida. La configuración EAS de producción conserva su propia `EXPO_PUBLIC_API_URL` HTTPS y no usa `EXPO_PUBLIC_DEV_API_URL`.

Comandos: `npm start`, `npm run web`, `npm run android`, `npm run typecheck`, `npm run lint`, `npm test`. Android local requiere Android Studio/SDK.

## Arquitectura y funcionalidades

- `src/app/`: rutas Expo Router y layouts por rol.
- `src/services/`: API, autenticación/sesiones, OAuth, clínicas, notificaciones.
- `src/contexts/`: sesión, tema, checkout y feedback.
- `src/components/`: componentes UI, perfil y notificaciones.
- `src/utils/`: autorización de navegación, pestañas y validaciones.

Cliente: Inicio, Mascotas, Turnos, Tienda y Perfil en barra inferior. Veterinario: Inicio, Agenda, Pacientes, Productos y Perfil sujeto a permisos. Peluquero: Inicio, Agenda, Pacientes, Servicios y Cuenta. Secretaría: Inicio, Agenda, Pacientes, Reservas y Cuenta. Administradores ven Inicio, Clínica, Tienda y Administración; destinos adicionales aparecen según permisos. Consulte la [matriz de requisitos](../docs/auditoria/MATRIZ_REQUISITOS.md).

`Mi Perfil`/Cuenta comparte capacidades de edición de datos, apariencia o seguridad según rol y rutas habilitadas. Formularios validan localmente para mejorar experiencia, pero el backend vuelve a validar. Registro no envía `role` y la confirmación de contraseña no se transmite.

## Autenticación y API

El token de acceso se guarda en SecureStore en nativo y `sessionStorage` en web. El cliente consulta `POST /api/auth/me` para restablecer sesión; token vencido requiere flujo de refresh/login. Google, Facebook y X usan redirección a backend y esquema `petcare://oauth` en build nativo; secretos OAuth son solo backend. La referencia de endpoints está en [Documentación API](../docs/DOCUMENTACION_API.md).

## Web, Android, Expo Go y Development Build

Expo Go es útil para pantallas y login tradicional cuando la versión del cliente es compatible con el SDK del proyecto. No incorpora configuración nativa específica para retorno OAuth PetCare. Para OAuth con esquema propio, SecureStore/módulos nativos según el flujo y pruebas cercanas a producción, use Development Build o APK EAS.

Los tres flujos sociales (Google, Facebook y X) usan el navegador del sistema para autorizarse en el backend, que vuelve a la app con un ticket de un solo uso en `petcare://oauth`; la app lo intercambia por su sesión API. Para ese callback nativo hace falta una development build instalada con el scheme `petcare`. En Expo Go, los botones siguen activos: al tocarlos PetCare explica que el retorno de esquema propio requiere el development client. Después de crear o cambiar el scheme, reconstruya e instale ese cliente una vez y arranque Metro con `npx expo start --dev-client`; los cambios JS/TS/estilos siguientes conservan Fast Refresh sin reconstruir la app. La allowlist del backend debe incluir exactamente `petcare://oauth` en `OAUTH_RETURN_URLS`, además de los retornos web que ya use el sitio. No cambie los secretos del proveedor ni la configuración de producción para habilitar el callback local.

El flujo Google existente es OAuth de servidor con code + PKCE, no el SDK nativo de Google Sign-In: Google Cloud debe tener un cliente de tipo Web con el URI de callback HTTPS del backend (`BACKEND_URL` + `/api/auth/oauth/google/callback`) autorizado. Facebook y X también registran el callback HTTPS del backend en la configuración de su proveedor. Este cliente móvil no usa un Android OAuth client ID ni package/SHA-1 para el intercambio; no agregue valores inventados al bundle. Compruebe los Client IDs, secretos, callback autorizados y `OAUTH_RETURN_URLS` en las consolas/configuración del backend existente. Los valores reales de esas cuentas no están disponibles en este repositorio.

El esquema `petcare`, plugins nativos, paquete Android y Project ID EAS están configurados en `app.json`. Cambiar módulos/configuración nativa requiere reconstruir la app. Las notificaciones son internas: el centro muestra el historial del backend, mantiene leídas/no leídas y el badge, y en móvil sincroniza mientras la app está activa. No se solicitan permisos del sistema ni se registran tokens para push. Web usa rutas y navegación web de Expo Router y consulta el mismo centro API.

## APK con EAS

`eas.json` contiene perfiles `development` (development client APK), `preview` (APK interno), `production` y `production-apk` (APK instalable). Desde `mobile/`:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production-apk
```

Development Build se conecta a `npx expo start --dev-client`; preview/production APK pueden instalarse independientemente. Confirme `EXPO_PUBLIC_API_URL` para el perfil/entorno seleccionado. Un build correcto no verifica que OAuth, DB o SMTP estén operativos.

## Problemas frecuentes

- **La API no responde en teléfono:** `localhost` es el teléfono; use IP LAN, misma red y firewall abierto.
- **CORS en navegador:** permita el origen web exacto en `CORS_ALLOWED_ORIGINS` del backend.
- **Lectura devuelve 404:** use POST con body JSON para lecturas internas actuales.
- **OAuth no vuelve en Expo Go:** use build con scheme `petcare`.
- **APK apunta a API anterior:** actualice `EXPO_PUBLIC_API_URL` del entorno EAS y genere build nuevo.
- **Validación falla:** lea error por campo; confirme enums/IDs actuales y conexión API.

Para API y configuración del sistema consulte el [README principal](../README.md), la [documentación de API](../docs/DOCUMENTACION_API.md) y [resultados de pruebas](../docs/auditoria/RESULTADOS_PRUEBAS.md).
