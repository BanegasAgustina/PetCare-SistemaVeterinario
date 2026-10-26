# PetCare — Requisitos y entregables

Este documento relaciona los requisitos del trabajo con su implementación en el repositorio. Las rutas mencionadas son relativas a la raíz del proyecto. La disponibilidad de OAuth, correo, base de datos y despliegues depende de credenciales y servicios externos; tener el código implementado no significa que esos servicios ya estén configurados.

## 1. Requisitos funcionales

### Registro e inicio de sesión

- **Registro e inicio de sesión con correo y contraseña:** implementados. El frontend está en `mobile/src/app/register.tsx` y `mobile/src/app/login.tsx`; la API se define en `backend/src/routes/auth.routes.ts` y sus controladores/servicios.
- **Contraseñas:** el backend almacena hashes con bcrypt; nunca se envía el rol desde el formulario de registro. La validación del frontend está en `mobile/src/utils` y la validación de servidor en `backend/src/validators`.
- **Tres redes sociales:** están implementados Google, Facebook Login y X (antes Twitter), mediante OAuth coordinado por el backend. Facebook Login se configura en Meta for Developers; Facebook y Meta no son dos proveedores distintos. El código está en `mobile/src/services/oauth.service.ts`, `mobile/src/contexts/AuthContext.tsx` y `backend/src/controllers/oauth.controller.ts` / `backend/src/services/oauth.service.ts`.
- **Verificaciones adicionales:** el registro verifica el correo mediante un código de seis dígitos enviado por SMTP. También existen invitaciones de un solo uso para profesionales, cambio obligatorio de contraseña inicial y recuperación de contraseña por correo. La verificación por código se muestra en `mobile/src/components/ui/VerificationCodeModal.tsx`; sus endpoints y reglas están en `backend/src/routes/auth.routes.ts` y `backend/README.md`.
- **Configuración pendiente para producción:** OAuth necesita credenciales y callbacks válidos de Google, Meta y X; los correos necesitan SMTP. Los nombres de variables y pasos se documentan en `mobile/README.md` y `backend/.env.example`. No colocar secretos en `mobile` ni en variables `EXPO_PUBLIC_*`.

### Roles y permisos

El proyecto tiene más de tres tipos de usuario: `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN` y `SUPER_ADMIN`. Los roles y permisos se consultan desde MySQL/API. La autorización se implementa en `backend/src/middlewares/permission.middleware.ts`, `backend/src/middlewares/auth.middleware.ts` y los guards de `mobile/src/app`.

Clientes, profesionales y administración reciben pantallas y módulos distintos. El servidor vuelve a comprobar rol, permisos y estado de la cuenta en cada endpoint protegido; ocultar una opción en la interfaz no es la única protección. El alta pública crea clientes; los roles de personal se asignan desde funciones administrativas autorizadas.

### Interfaz y navegación

- La aplicación está desarrollada con React Native y Expo. Las rutas y layouts usan Expo Router en `mobile/src/app`.
- La interfaz incluye áreas de cliente, profesional/veterinario, secretaría y administración. Los componentes reutilizables están en `mobile/src/components`.
- `ScreenContainer`, `LoginLayout`, Safe Area, scroll, ajuste al teclado y `useWindowDimensions` ayudan a adaptar pantallas a distintos tamaños. La configuración Android usa ajuste de teclado `resize`; revisar la apariencia final en dispositivos reales.
- Los temas y estilos compartidos están en `mobile/src/contexts/ThemeContext.tsx` y `mobile/src/constants/theme.ts`.

### Consumo de API y operaciones de datos

El frontend usa una API REST de Express. `mobile/src/services/api.ts` agrega la URL de `EXPO_PUBLIC_API_URL`, envía JSON y el token Bearer cuando corresponde, aplica timeout y normaliza errores. Los servicios específicos están en `mobile/src/services`.

La API incluye consultas y operaciones de alta/edición/estado para usuarios, mascotas, turnos, productos, perfiles, permisos y otros módulos. Por seguridad, algunas entidades se desactivan o revocan en lugar de borrarse físicamente; por ejemplo, las cuentas y mascotas conservan historial y relaciones. No todos los recursos ofrecen un DELETE HTTP.

El backend devuelve respuestas JSON uniformes y maneja errores de validación, autenticación, autorización, base de datos y rutas inexistentes. El frontend presenta errores de campo, avisos y feedback al usuario mediante formularios, `FormNotice`, modales y toasts.

## 2. Requisitos técnicos de frontend (React Native)

### Navegación y UX/UI

Expo Router resuelve rutas a partir de `mobile/src/app`; los layouts de cada área definen la navegación y las pantallas protegidas. Formularios, carga, mensajes accesibles y confirmaciones usan componentes comunes en `mobile/src/components`. Las reglas visuales y de feedback se detallan en `mobile/README.md`.

### Estado global

Se usa **Context API**, no Redux. `mobile/src/contexts/AuthContext.tsx` centraliza autenticación, perfil, permisos, renovación y cierre de sesión. `ThemeContext` administra tema y `FeedbackContext` los mensajes globales.

### Persistencia de sesión

En Android/iOS, `mobile/src/services/session-store.ts` usa Expo SecureStore para guardar los tokens de sesión. Al abrir la app, `AuthContext` restaura la sesión y consulta `/api/auth/me`; los access tokens se renuevan con el refresh token rotativo. Al cerrar sesión se limpia el almacenamiento local y se solicita revocar la renovación.

En la versión web, la sesión se conserva solo en memoria y se pierde al recargar o cerrar la pestaña. La persistencia descrita arriba corresponde a la aplicación nativa.

### Adaptabilidad y errores

Los formularios validan los datos antes de enviarlos; el backend también valida cada solicitud. La interfaz contempla carga, errores de conexión, respuestas HTTP y expiración de sesión. Los componentes de layout usan ancho flexible, scroll y ajuste al teclado; la revisión en varios dispositivos sigue siendo necesaria antes de publicar.

## 3. Requisitos técnicos de backend

### API REST, tokens y middlewares

El backend está en `backend/` y usa Node.js, Express 5 y TypeScript. Las rutas están agrupadas bajo `/api` en `backend/src/routes`. Incluye registro, login, verificación de email, perfil, refresh/logout y endpoints de cliente, clínica, profesionales y administración.

La autenticación usa JWT de acceso y refresh tokens rotativos. `authenticate` valida la sesión y el usuario; los middlewares de permisos/roles bloquean accesos no autorizados; también hay límites de intentos, CORS, Helmet, validación de datos y manejo central de errores.

### MySQL y estructura de datos

La aplicación usa MySQL y `mysql2`. La configuración y el pool están en `backend/src/config`; las consultas se organizan en `backend/src/repositories`; migraciones y seeds están en `backend/src/database` y directorios relacionados. Las variables `DB_*` son exclusivas del backend. Las instrucciones de preparación, migración y conexión se encuentran en `backend/README.md`.

### Documentación de endpoints

La documentación técnica de API, ejemplos de cuerpos/respuestas, autenticación, códigos de error y configuración se encuentra en [`backend/README.md`](backend/README.md). Las rutas implementadas se pueden consultar directamente en `backend/src/routes`.

Endpoints de autenticación principales (prefijo `/api`):

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/auth/register` | Crear cuenta de cliente e iniciar verificación de correo |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/verify-email` | Confirmar código de correo |
| `POST` | `/auth/resend-verification` | Reenviar código |
| `GET` | `/auth/me` | Consultar perfil de la sesión; requiere Bearer |
| `POST` | `/auth/refresh` | Renovar tokens |
| `POST` | `/auth/logout` | Revocar refresh token |
| `POST` | `/auth/password-reset/request` | Solicitar recuperación de contraseña |
| `POST` | `/auth/password-reset/confirm` | Confirmar nueva contraseña |
| `GET` | `/health` | Comprobar disponibilidad HTTP |
| `GET` | `/health/database` | Comprobar disponibilidad de MySQL |

Hay más endpoints para los demás módulos; la tabla es un resumen, no una lista exhaustiva.

## 4. Buenas prácticas y organización

- Frontend organizado por rutas, componentes, contextos, servicios, hooks, tipos y utilidades en `mobile/src/`.
- Backend organizado por configuración, rutas, controladores, servicios, repositorios, validadores, middlewares, tipos y base de datos en `backend/src/`.
- TypeScript se usa en ambas partes. El backend valida datos y utiliza consultas parametrizadas; el frontend centraliza el acceso HTTP y el feedback.
- El repositorio contiene `.git`. La configuración local usa archivos `.env` ignorados por Git y ejemplos sin credenciales en `.env.example`. La publicación o existencia de un remoto de GitHub debe verificarse en la configuración del repositorio.
- Comandos de calidad disponibles: en `mobile`, `npm run lint`, `npm run typecheck` y `npm test`; en `backend`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. La prueba de integración requiere MySQL de prueba configurado.

## 5. Entregables y evaluación

### Código fuente

El frontend y backend están en este repositorio. Los README específicos contienen instrucciones ampliadas:

- [Guía de frontend, uso, OAuth y APK](mobile/README.md)
- [Guía de backend, API, base de datos y variables](backend/README.md)

### Manual de usuario

`mobile/README.md` explica el registro, verificación por correo, acceso, login social y uso de la app. Las pantallas y el menú cambian según el rol y los permisos recibidos. El uso de OAuth requiere probar en un Development Build o APK: Expo Go no registra el esquema nativo `petcare://oauth`.

### Instalación y configuración

Resumen para entorno local:

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Completar backend/.env con la conexión MySQL y configuración necesaria
```

Preparar la base de datos según el estado de la instancia siguiendo [`backend/README.md`](backend/README.md); no ejecutar un bootstrap de base nueva sobre una base existente sin revisar primero sus datos y esquema. Luego, en otra terminal:

```powershell
cd mobile
npm install
Copy-Item .env.example .env
# Definir EXPO_PUBLIC_API_URL con la URL alcanzable del backend y /api
npx expo start
```

Los pasos de Vercel, EAS, OAuth, SMTP y MySQL gestionado requieren completar los datos reales en sus respectivos paneles. No se incluyen credenciales en el repositorio.

### APK Android

La configuración EAS está en `mobile/eas.json`; los perfiles `development` y `preview` están definidos como APK instalable. Generarlo desde `mobile/` con:

```bash
npx eas-cli@latest build --platform android --profile preview
```

El APK se descarga desde el enlace del build de EAS. **No se encontró un archivo `.apk` dentro del repositorio en esta revisión**, así que su generación y publicación/entrega quedan pendientes.

### Video de demostración

Es opcional y no se encontró un video de demostración en el repositorio al redactar este documento. Puede grabarse mostrando registro y verificación, login, navegación por roles y consumo de API.

## Referencias del repositorio

- [README general](README.md)
- [README Mobile](mobile/README.md)
- [README Backend](backend/README.md)
- [Configuración de variables del backend](backend/.env.example)
- [Configuración de variables del frontend](mobile/.env.example)
- [Configuración de Vercel para la web](mobile/vercel.json)
- [Configuración EAS para Android](mobile/eas.json)
