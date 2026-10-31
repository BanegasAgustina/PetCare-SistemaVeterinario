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

Use `.env.example` como lista actual de nombres, sin copiar secretos al frontend. Las variables principales son `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CORS_ALLOWED_ORIGINS`, `SMTP_*`, `EMAIL_CODE_SECRET`, `PUBLIC_FRONTEND_URL`, `BACKEND_URL`, `OAUTH_RETURN_URLS`, credenciales Google/Facebook/X, `CRON_SECRET` y configuración Cloudinary/S3. `PUBLIC_FRONTEND_URL` es el origen base del sitio web público usado por invitaciones y recuperación; `BACKEND_URL` es exclusivo para callbacks OAuth. Producción requiere base remota, TLS y secreto JWT aleatorio de al menos 32 bytes. Las variables optativas solo se necesitan para su función..

## Layerbase/MariaDB y migraciones

La conexión requiere host/puerto/base/usuario/clave del proveedor y TLS en producción. `npm run db:check` y `npm run db:audit:readonly` son verificaciones de lectura. La gestión del esquema de producción es externa a este repositorio. Este checkout no incluye el SQL canónico necesario para instalar una base limpia; algunos comandos de migración y bootstrap pueden no tener sus archivos de entrada. No los invoque como procedimiento de instalación. Los scripts `db:migrate*`, `db:bootstrap`, `db:seed`, `create:super-admin` y `admin:promote` pueden escribir; úselos solo conforme al procedimiento autorizado por el responsable de la base. No considere `schema-audit.json` ni informes antiguos prueba del esquema remoto actual.

## Autenticación, roles y errores

Los cinco roles del sistema son `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN` y `SUPER_ADMIN`. `GROOMER` corresponde a peluquería canina/felina y habilita las funciones profesionales concedidas. `SECRETARY` ya no es un rol reconocido por el código de aplicación. El token identifica al usuario; los permisos se cargan desde los datos del sistema y las rutas vuelven a comprobarlos. `requirePermission` exige todos los códigos indicados; `requireAnyPermission` requiere al menos uno. El acceso a datos personales valida ownership. Los errores se normalizan sin exponer SQL, credenciales ni stack trace al cliente.

La baja de usuarios es lógica (`is_active=0`): conserva historial, incrementa `session_version` y registra actor/acción en `admin_sensitive_action_audit`; el login y los guards JWT/refresh rechazan la cuenta o las sesiones previas. El Admin Principal puede aplicar esa baja con `DELETE /api/admin/users/:id` para cualquier rol y estado; es idempotente para cuentas ya inactivas y no admite darse de baja a sí mismo ni desactivar al último SUPER_ADMIN activo/verificado. La ruta `DELETE /api/admin/roles/:id` elimina únicamente roles personalizados sin usuarios asignados y registra la operación. Los cinco roles de sistema no son eliminables. Los cambios requieren grants efectivos y la tabla de auditoría debe existir en el entorno antes de ejecutar estas operaciones. El estado remoto del esquema requiere verificación de solo lectura.

Registro requiere verificación de email. JWT tiene access TTL por defecto 900 segundos y parámetros issuer/audience; la política OAuth Google, Facebook y X se ejecuta en backend con callbacks registrados en la consola externa. SMTP envía verificación, invitaciones y recuperación. Revise variables/URLs del proveedor antes de atribuir un fallo al código.

## Rutas y lectura POST

Prefijo global `/api`; módulos en `src/routes/`. Las lecturas internas usan POST y filtros JSON en body. Los GET vigentes son health, health DB, configuración pública, callback OAuth, cron de notificaciones y resolver de foto autorizada. No existe compatibilidad GET para las lecturas migradas. Las operaciones de escritura conservan su método definido. Las rutas vigentes se encuentran en los archivos de `src/routes/` y en `src/app.ts`.

## Correo, notificaciones, imágenes y tienda

SMTP requiere `SMTP_*`, `MAIL_FROM` y secretos de códigos; el cron requiere `CRON_SECRET` y Vercel Cron. Las notificaciones internas y los recordatorios de turnos se guardan en el centro de notificaciones; el cron procesa recordatorios y correos. Imágenes usan configuración privada Cloudinary o S3 compatible. `STORE_DEMO_MODE` está desactivado por defecto y habilita únicamente checkout de demostración no cobrable. Transferencias y revisión de comprobantes son flujos separados sujetos a configuración, esquema y decisión administrativa; no afirme que una captura de comprobante constituye pago.

La gestión comercial usa Tienda, `/api/client/orders` y `/api/clinic/store-orders`. Las rutas comerciales antiguas de Reservas ya no se montan. `client_orders` e historiales son compartidos con datos históricos: no borrar filas ni ejecutar limpieza de stock sin auditar el entorno. Los turnos veterinarios y de peluquería siguen en `/api/client/appointments` y `/api/clinic/appointments`.

## Comandos disponibles

| Comando | Función |
|---|---|
| `npm run dev` | Desarrollo con recarga. |
| `npm run build` / `npm start` | Compilar y servir `dist/server.js`. |
| `npm run typecheck`, `npm run lint`, `npm test` | Tipos, ESLint y 35 pruebas unitarias/servicios sin DB. |
| `npm run test:http` | 4 pruebas de Express por loopback; requiere permiso de loopback en sandboxes restrictivos. La prueba fija DB a `127.0.0.1:1` y no usa Layerbase. |
| `npm run oauth:callbacks` | Imprime callbacks configurados. |
| `npm run db:check`, `npm run db:audit:readonly` | Verificaciones no mutantes. |
| `npm run db:migrate`, `npm run db:bootstrap`, `npm run db:seed` | Operaciones potencialmente mutantes; revisar antes de usar. |
| `npm run db:migrate:availability-archive` | Agrega el indicador para ocultar horarios desactivados conservando sus filas. |
| `npm run db:migrate:product-origin` | Revisa metadatos de productos; ya no crea permisos del módulo comercial retirado. |
| `npm run db:migrate:order-history-reason` | Ajuste aditivo del historial compartido de pedidos/pagos; no borra datos. |

El resto de comandos está listado en `package.json`. `test:db` y `test:clinic:db` requieren entorno DB preparado.

## Vercel

Para desplegar la API configure el proyecto con Root Directory `backend`, variables privadas en el entorno correcto, `BACKEND_URL` como origen del backend OAuth y `PUBLIC_FRONTEND_URL` como origen web. En producción, `PUBLIC_FRONTEND_URL=https://petcare-sistemaveterinario-mobile.vercel.app`. El endpoint `/api/cron/notifications` procesa recordatorios internos y la cola de correo cuando un scheduler externo lo invoca con el Bearer de `CRON_SECRET`. `backend/vercel.json` no define una programación automática; configúrela por separado si se necesitan recordatorios periódicos. Las notificaciones push externas a dispositivos no están habilitadas; el centro interno lee su historial y estados desde `client_notifications`.

## Resolución de problemas

- **Conexión DB:** verificar host Layerbase, DNS, puerto, TLS, usuario y `/api/health/database`.
- **503 de auth:** revisar largo/formato de `JWT_ACCESS_SECRET`, TTL, issuer y audience.
- **403:** revisar rol, grant efectivo y ownership; grants se administran en la aplicación/base.
- **404 después de GET:** usar POST para lecturas migradas y verificar `/api`.
- **OAuth/email:** comprobar callback exacto, allowlist, SMTP y estado de proveedor en sus consolas.
- **SQL/schema:** consultar logs sanitizados y comparar esquema; aplicar una migración solo tras revisión y aprobación del operador.


