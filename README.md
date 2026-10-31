# PetCare

PetCare es una aplicación web y móvil para coordinar atención veterinaria, peluquería, turnos y servicios entre clientes y personal de una clínica.

## Funcionalidades

- Cuentas verificadas por correo, autenticación JWT, recuperación de contraseña y flujos OAuth configurables.
- Roles `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN` y `SUPER_ADMIN`, con permisos efectivos validados por el backend.
- Mascotas, turnos, disponibilidad, fichas clínicas, tienda, carrito, pedidos y comprobantes de transferencia.
- Centro de notificaciones internas con estados persistidos en la API; no se envían push al sistema operativo.
- Aplicación Expo Router para web y Android. El checkout de demostración no procesa dinero.

## Arquitectura

`mobile/` contiene Expo SDK 58, React Native, TypeScript y Expo Router. `backend/` contiene Node.js, Express y TypeScript dividido en rutas, middleware, controladores, servicios, repositorios, validadores, configuración y herramientas de base de datos. La persistencia usa MariaDB/MySQL en Layerbase. Vercel aloja el frontend y el backend según el Root Directory de cada proyecto; EAS crea los builds Android.

```text
backend/src/{routes,controllers,middlewares,services,repositories,validators,config,database}
mobile/src/{app,components,contexts,hooks,services,utils,types}
```

## Requisitos e instalación

Se recomienda Node.js 22.x y npm. Para desarrollo local se requiere MariaDB/MySQL; producción usa la instancia Layerbase ya configurada por el operador. No ejecutes los scripts de migración sin revisar previamente el entorno y el SQL.

```bash
cd backend
npm ci
Copy-Item .env.example .env
# Completar backend/.env con el entorno autorizado; no compartir secretos.
npm run dev
```

En otra terminal:

```bash
cd mobile
npm ci
Copy-Item .env.example .env
npm start
```

En `mobile/.env`, `EXPO_PUBLIC_DEV_API_URL` permite elegir explícitamente una API HTTPS durante desarrollo. Debe ser el backend real con el sufijo `/api`, no la URL del frontend de Vercel. Si se omite, el resolver usa el backend local por el host de Metro en el puerto 3000. Para el emulador Android puede usarse `http://10.0.2.2:3000/api`. Nunca pongas secretos en `EXPO_PUBLIC_*`.

Las plantillas `.env.example` contienen solo valores de ejemplo; reemplaza secretos localmente y no subas `.env` al repositorio.

## Pruebas

En `backend/`: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`. Las comprobaciones `npm run db:check` y `npm run db:audit:readonly` son de solo lectura; `db:migrate*`, `db:bootstrap`, `db:seed` y herramientas de administración pueden modificar datos/esquema.

En `mobile/`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run web`. Para compilar Android localmente se requiere Android SDK; para OAuth nativo se requiere development build.

## API, despliegue y documentos

La API local predeterminada es `http://localhost:3000/api`. Las lecturas privadas migradas utilizan POST con filtros JSON. El build móvil de producción usa `https://pet-care-sistema-veterinario.vercel.app/api`; configura variables privadas de backend en el proyecto Vercel correcto. El cron interno procesa recordatorios y correos, y no envía push Android.

