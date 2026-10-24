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

Defina `EXPO_PUBLIC_API_URL` en `mobile/.env`, por ejemplo `http://localhost:3000/api` para navegador, `http://10.0.2.2:3000/api` para emulador Android, o una IP LAN para teléfono físico. En producción use la URL HTTPS de API. Esta variable queda incorporada en el cliente; no guardar contraseñas ni secretos allí.

Comandos: `npm start`, `npm run web`, `npm run android`, `npm run typecheck`, `npm run lint`, `npm test`. Android local requiere Android Studio/SDK.

## Arquitectura y funcionalidades

- `src/app/`: rutas Expo Router y layouts por rol.
- `src/services/`: API, autenticación/sesiones, OAuth, clínicas, notificaciones.
- `src/contexts/`: sesión, tema, checkout y feedback.
- `src/components/`: componentes UI, perfil y notificaciones.
- `src/utils/`: autorización de navegación, pestañas y validaciones.

Cliente: Inicio, Mascotas, Turnos, Tienda y Perfil en barra inferior. Veterinario: Inicio, Agenda, Pacientes, Productos y Perfil sujeto a permisos. Peluquero: Inicio, Agenda, Pacientes, Servicios y Cuenta. Secretaría: Inicio, Agenda, Pacientes, Reservas y Cuenta. Administradores ven Inicio, Clínica, Tienda y Administración; destinos adicionales aparecen según permisos. Consulte [manual por roles](../docs/MANUAL_FUNCIONAL_PETCARE.md).

`Mi Perfil`/Cuenta comparte capacidades de edición de datos, apariencia o seguridad según rol y rutas habilitadas. Formularios validan localmente para mejorar experiencia, pero el backend vuelve a validar. Registro no envía `role` y la confirmación de contraseña no se transmite.

## Autenticación y API

El token de acceso se guarda en SecureStore en nativo y `sessionStorage` en web. El cliente consulta `POST /api/auth/me` para restablecer sesión; token vencido requiere flujo de refresh/login. Google, Facebook y X usan redirección a backend y esquema `petcare://oauth` en build nativo; secretos OAuth son solo backend. La referencia de endpoints está en [Documentación API](../docs/DOCUMENTACION_API.md).

## Web, Android, Expo Go y Development Build

Expo Go es útil para pantallas y login tradicional cuando la versión del cliente es compatible con el SDK del proyecto. No incorpora configuración nativa específica para retorno OAuth PetCare y no admite push remoto en Android. Para OAuth con esquema propio, notificaciones push, SecureStore/módulos nativos según el flujo y pruebas cercanas a producción, use Development Build o APK EAS.

El esquema `petcare`, plugins nativos, paquete Android y Project ID EAS están configurados en `app.json`. Cambiar módulos/configuración nativa requiere reconstruir la app. Web usa rutas y navegación web de Expo Router; las notificaciones web consultan el centro API pero no implementan browser push.

## APK con EAS

`eas.json` contiene perfiles `development` (development client APK), `preview` (APK interno), `production` y `production-apk` (APK instalable). Desde `mobile/`:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile production-apk
```

Development Build se conecta a `npx expo start --dev-client`; preview/production APK pueden instalarse independientemente. Confirme `EXPO_PUBLIC_API_URL` y credenciales Expo/FCM para el perfil/entorno seleccionado. Un build correcto no verifica que OAuth, DB, SMTP o push estén operativos.

## Problemas frecuentes

- **La API no responde en teléfono:** `localhost` es el teléfono; use IP LAN, misma red y firewall abierto.
- **CORS en navegador:** permita el origen web exacto en `CORS_ALLOWED_ORIGINS` del backend.
- **Lectura devuelve 404:** use POST con body JSON para lecturas internas actuales.
- **OAuth no vuelve en Expo Go:** use build con scheme `petcare`.
- **Push no aparece:** use APK/development build y configure FCM/EAS, token y permiso del dispositivo.
- **APK apunta a API anterior:** actualice `EXPO_PUBLIC_API_URL` del entorno EAS y genere build nuevo.
- **Validación falla:** lea error por campo; confirme enums/IDs actuales y conexión API.

Para instalación de backend, variables, servicios externos y solución ampliada consulte [guía de instalación](../docs/GUIA_INSTALACION_CONFIGURACION.md) y [errores](../docs/ERRORES_Y_SOLUCIONES.md).
