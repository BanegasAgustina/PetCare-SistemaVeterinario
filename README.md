# PetCare

PetCare es una aplicación móvil y web para coordinar la atención veterinaria, peluquería, turnos y servicios para clientes y personal de una clínica. El objetivo es ofrecer un punto de acceso compartido con datos y permisos administrados por el backend.

## Funcionalidades actuales

- Cuentas con email verificado, JWT, recuperación de contraseña y autenticación social OAuth configurable.
- Roles `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN` y `SUPER_ADMIN`, con permisos efectivos consultados por el backend.
- Mascotas, turnos, disponibilidad, fichas clínicas, reservas, tienda, carrito, pedidos y gestión de comprobantes por transferencia.
- Centro de notificaciones, email y push Android sujeto a configuración externa.
- Interfaz Expo Router para web y Android. Checkout de demostración no procesa dinero; la transferencia requiere configuración y aprobación manual.

## Tecnologías y arquitectura

`mobile/` contiene Expo, React Native, TypeScript y Expo Router. `backend/` contiene Node.js, Express y TypeScript, organizado en rutas, middleware, controladores, servicios, repositorios, validadores y conexión a MariaDB/MySQL. El backend aplica JWT, roles, permisos y ownership; la interfaz no reemplaza estas comprobaciones. En despliegue, Vercel sirve la API y/o la web según Root Directory, mientras EAS produce builds Android.

```text
backend/src/{routes,controllers,middlewares,services,repositories,validators,config,database}
mobile/src/{app,components,contexts,hooks,services,utils,types}
docs/                          documentación técnica y funcional
```

## Requisitos y arranque rápido

Requisitos recomendados: Git, Node.js 22.x, npm y una instancia MariaDB/MySQL accesible. Para Android nativo se requiere Android SDK; para APK distribuible se requiere cuenta Expo/EAS.

```bash
cd backend
npm ci
cp .env.example .env
# Complete backend/.env usando backend/.env.example como referencia
npm run dev
```

En otra terminal:

```bash
cd mobile
npm ci
cp .env.example .env
# En mobile/.env configure EXPO_PUBLIC_API_URL=http://localhost:3000/api
npm start
```

Use `http://10.0.2.2:3000/api` desde emulador Android o la IP LAN del equipo desde teléfono físico. No incluya secretos en `mobile/.env` ni en variables `EXPO_PUBLIC_*`. Para una instalación paso a paso, DB, OAuth, SMTP, Vercel y EAS consulte [Guía de instalación](docs/GUIA_INSTALACION_CONFIGURACION.md).

## Ejecución y verificación

Backend: `npm run dev`, `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`, `npm test`.

Frontend: `npm start`, `npm run web`, `npm run android`, `npm run typecheck`, `npm run lint`, `npm test`.

La app no ejecuta migraciones automáticamente. **En este checkout faltan `backend/bootstrap/` y `backend/migrations/`, aunque los runners `db:bootstrap` y `db:migrate` los buscan. No puede completarse una instalación limpia solo con esos scripts hasta recuperar del mantenedor los SQL base canónicos y su orden.** Los demás scripts de migración/bootstrap pueden modificar el esquema o datos; revise SQL y estado de la base antes de ejecutarlos.

## API y métodos HTTP

La base local es `http://localhost:3000/api`. Las lecturas internas usan POST con filtros JSON en body. GET se conserva para health, health DB, configuración pública, callback OAuth, cron y recurso de imagen; el backend no conserva alias GET de lecturas migradas. La referencia completa está en [Documentación API](docs/DOCUMENTACION_API.md), y el detalle de migración en [api-read-post-migration.md](docs/api-read-post-migration.md).

## Documentación

- [Instalación y configuración](docs/GUIA_INSTALACION_CONFIGURACION.md)
- [API completa](docs/DOCUMENTACION_API.md)
- [Errores y soluciones](docs/ERRORES_Y_SOLUCIONES.md)
- [Manual funcional por roles](docs/MANUAL_FUNCIONAL_PETCARE.md)
- [Backend](backend/README.md)
- [Frontend móvil/web](mobile/README.md)

Los README anteriores se conservaron en `docs/historico/`; las afirmaciones operativas de esos snapshots pueden referirse a revisiones o entornos previos. Para el comportamiento vigente, prevalecen estos documentos y el código actual.
