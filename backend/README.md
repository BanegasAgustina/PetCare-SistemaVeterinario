# Backend PetCare

API Node.js, Express y TypeScript. Las rutas están agrupadas por dominio; los controladores delegan reglas de negocio a servicios y persistencia a repositorios. El middleware aplica validación de JWT, rol, permisos efectivos, acceso personal y manejo seguro de errores. MariaDB/MySQL se conecta mediante pool.

## Instalación y arranque

Requiere Node.js 22.x recomendado y una base MariaDB/MySQL accesible.

```bash
cd backend
npm ci
cp .env.example .env
# Configure DB_*, JWT_* y CORS_ALLOWED_ORIGINS en .env
npm run dev
```

La API local usa `http://localhost:3000/api`. `GET /api/health` verifica proceso y `GET /api/health/database` consulta conectividad SQL. El arranque no ejecuta migraciones.

## Variables de entorno

Use `.env.example` como lista actual de nombres, sin copiar secretos al frontend. Las variables principales son `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CORS_ALLOWED_ORIGINS`, `SMTP_*`, `EMAIL_CODE_SECRET`, `BACKEND_URL`, `OAUTH_RETURN_URLS`, credenciales Google/Facebook/X, `CRON_SECRET` y configuración Cloudinary/S3. Producción requiere base remota, TLS y secreto JWT aleatorio de al menos 32 bytes. Las variables optativas solo se necesitan para su función.

Consulte [guía completa de instalación](../docs/GUIA_INSTALACION_CONFIGURACION.md), [API](../docs/DOCUMENTACION_API.md) y [errores](../docs/ERRORES_Y_SOLUCIONES.md).

## Layerbase/MariaDB y migraciones

La conexión requiere host/puerto/base/usuario/clave del proveedor y TLS en producción. `npm run db:check` y `npm run db:audit:readonly` son verificaciones de lectura. **En este checkout faltan `backend/bootstrap/` y `backend/migrations/`, que los runners `db:bootstrap` y `db:migrate` resuelven como origen de SQL; por eso no son una ruta funcional de instalación limpia hasta restaurar los archivos canónicos.** Scripts `db:migrate*`, `db:bootstrap`, `db:seed`, `create:super-admin` y `admin:promote` pueden escribir. Revise historial, SQL, respaldo y conexión al entorno correcto antes de usarlos. No considere `schema-audit.json` ni informes antiguos prueba del esquema remoto actual.

## Autenticación, roles y errores

Los roles actuales son `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN` y `SUPER_ADMIN`. El token identifica al usuario; permisos se cargan desde datos del sistema y las rutas vuelven a comprobarlos. `requirePermission` exige todos los códigos indicados; `requireAnyPermission` requiere al menos uno. Acceso a datos personales valida ownership. Los errores se normalizan sin exponer SQL, credenciales ni stack trace al cliente.

Registro requiere verificación de email. JWT tiene access TTL por defecto 900 segundos y parámetros issuer/audience; la política OAuth Google, Facebook y X se ejecuta en backend con callbacks registrados en la consola externa. SMTP envía verificación, invitaciones y recuperación. Revise variables/URLs del proveedor antes de atribuir un fallo al código.

## Rutas y lectura POST

Prefijo global `/api`; módulos en `src/routes/`. Las lecturas internas usan POST y filtros JSON en body. Los GET vigentes son health, health DB, configuración pública, callback OAuth, cron de notificaciones y resolver de foto autorizada. No existe compatibilidad GET para las lecturas migradas. Las operaciones de escritura conservan su método definido. Vea el inventario individual en [DOCUMENTACION_API.md](../docs/DOCUMENTACION_API.md).

## Correo, notificaciones, imágenes y tienda

SMTP requiere `SMTP_*`, `MAIL_FROM` y secretos de códigos; el cron requiere `CRON_SECRET` y Vercel Cron. Las notificaciones internas y los recordatorios de turnos se guardan en el centro de notificaciones; el cron procesa recordatorios y correos. Imágenes usan configuración privada Cloudinary o S3 compatible. `STORE_DEMO_MODE` está desactivado por defecto y habilita únicamente checkout de demostración no cobrable. Transferencias y revisión de comprobantes son flujos separados sujetos a configuración, esquema y decisión administrativa; no afirme que una captura de comprobante constituye pago.

## Comandos disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Desarrollo con recarga. |
| `npm run build` / `npm start` | Compilar y servir `dist/server.js`. |
| `npm run typecheck`, `npm run lint`, `npm test` | Tipos, ESLint y pruebas. |
| `npm run oauth:callbacks` | Imprime callbacks configurados. |
| `npm run db:check`, `npm run db:audit:readonly` | Verificaciones no mutantes. |
| `npm run db:migrate`, `npm run db:bootstrap`, `npm run db:seed` | Operaciones potencialmente mutantes; revisar antes de usar. |
| `npm run db:migrate:availability-archive` | Agrega el indicador para ocultar horarios desactivados conservando sus filas. |

El resto de comandos está listado en `package.json`. `test:db` y `test:clinic:db` requieren entorno DB preparado.

## Vercel

Para desplegar la API configure el proyecto con Root Directory `backend`, variables privadas en el entorno correcto y URL pública HTTPS en `BACKEND_URL`. El cron de `/api/cron/notifications` crea recordatorios internos de 24/4 h y procesa la cola de correo. `backend/vercel.json` lo programa cada cinco minutos (UTC), lo que requiere un plan Vercel Pro o Enterprise; Hobby solo permite cron diario y no sirve para ventanas de recordatorios de 15 minutos. El endpoint cron requiere un Bearer de `CRON_SECRET`. Las notificaciones push externas a dispositivos no están habilitadas; el centro interno lee su historial y estados desde `client_notifications`.

## Resolución de problemas

- **Conexión DB:** verificar host Layerbase, DNS, puerto, TLS, usuario y `/api/health/database`.
- **503 de auth:** revisar largo/formato de `JWT_ACCESS_SECRET`, TTL, issuer y audience.
- **403:** revisar rol, grant efectivo y ownership; grants se administran en la aplicación/base.
- **404 después de GET:** usar POST para lecturas migradas y verificar `/api`.
- **OAuth/email:** comprobar callback exacto, allowlist, SMTP y estado de proveedor en sus consolas.
- **SQL/schema:** consultar logs sanitizados y comparar esquema; aplicar una migración solo tras revisión y aprobación del operador.

Scripts adicionales y estado histórico se conservan en documentación histórica. Para instrucciones actuales vea `../docs/GUIA_INSTALACION_CONFIGURACION.md`.
