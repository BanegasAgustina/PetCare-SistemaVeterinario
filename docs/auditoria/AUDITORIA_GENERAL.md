# Auditoría general de PetCare

**Fecha:** 26-10-2026. **Rama:** `main`. **Commit observado:** `5d9ad1b`. **Estado Git inicial:** limpio. La auditoría no desplegó cambios. La revisión de Layerbase fue exclusivamente de lectura.

## Resumen ejecutivo

PetCare tiene una arquitectura coherente para un producto full-stack: Expo Router/React Native en `mobile/`, Express en `backend/`, MariaDB/MySQL en Layerbase, sesiones JWT con refresh token rotatorio y autorización consultada desde la base. El backend compiló, los chequeos estáticos y las suites unitarias pasaron. Se verificó una conexión real de solo lectura a Layerbase y una extracción completa de su metadata.

No se verificaron en vivo las credenciales de cada proveedor OAuth, el alta/login de un usuario real desde Android, los CRUD de negocio contra Layerbase ni una compilación/ejecución nativa Android. Por tanto, las capacidades implementadas que dependen de esos recursos se clasifican como **CUMPLE PARCIALMENTE** o **NO VERIFICADO**, no como funcionales por inferencia.

El responsable confirmó para esta etapa que la gestión de migraciones es externa al repositorio y ya fue verificada. La ausencia de directorios SQL en Git no se considera incumplimiento ni motivo para recuperar/crear migraciones o ejecutar cambios de esquema. Sí queda documentado como nota operativa que algunos scripts locales resuelven rutas de migraciones; no se usaron ni deben usarse para cambiar Layerbase en esta etapa.

## Estado inicial y final

| Área | Estado observado | Evidencia |
|---|---|---|
| Git | limpio al comenzar; rama `main` | `git status --short`, `git log -5` |
| Backend | build, typecheck, lint y tests pasaron | `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` |
| Móvil | typecheck, lint y tests pasaron | mismos scripts en `mobile/`; 25 tests |
| Expo | SDK 58.0.0; Expo Router; React Native 0.88 | `mobile/package.json`, `mobile/app.json`, Expo config |
| Base Layerbase | conexión y metadata auditadas en modo solo lectura | MariaDB 11.8.9; auditoría completa: 53 tablas, 433 columnas, 203 constraints, 31 checks, 199 índices |
| Android nativo | **NO VERIFICADO** en dispositivo/emulador en esta sesión | no se generó ni instaló APK |
| OAuth externo | **NO VERIFICADO** con los portales y credenciales de producción | la configuración depende de secretos externos |

La primera invocación de npm fue denegada por el shim de PowerShell; la repetición con `npm.cmd` ejecutó los comandos con normalidad. El primer chequeo DB, sin escalamiento de red, falló con `ENOTFOUND`; tras autorizar explícitamente la salida de solo lectura, `db:check` conectó a la instancia Layerbase y la auditoría de metadata finalizó completa.

## Arquitectura y entradas

- Móvil/web: `mobile/package.json` declara `expo-router/entry`; rutas bajo `mobile/src/app/`; configuración Expo en `mobile/app.json`; perfiles EAS en `mobile/eas.json`.
- Backend local: `backend/src/server.ts`, escucha en `0.0.0.0` y puerto `PORT` (por defecto 3000).
- Backend Vercel: `backend/src/app.ts` exporta la aplicación Express; API bajo `/api`; cron interno declarado en `backend/vercel.json`.
- Datos: pool MariaDB/MySQL en `backend/src/config/database.ts`; configuración validada en `backend/src/config/env.ts`.
- El frontend móvil usa `https://pet-care-sistema-veterinario.vercel.app/api` para release. En desarrollo prioriza `EXPO_PUBLIC_DEV_API_URL`, después API local configurada y, finalmente, host de Metro + puerto 3000. La configuración actual no mezcla el origen web de Vercel con la API.
- Notificaciones: el centro interno persiste en `client_notifications`; contador, lectura, ownership y rutas existen. No hay código activo de Expo Push en el cliente/backend. Permanecen tablas históricas de push en Layerbase y no fueron alteradas.

## Hallazgos y acciones

| Prioridad | Hallazgo | Clasificación | Acción de auditoría |
|---|---|---|---|
| P1 | OAuth Google/Facebook/X no fue ejercitado contra sus proveedores | FALTA DE PRUEBAS | Revisar historial y preparar smoke test local/staging sin credenciales inventadas |
| P1 | El requisito académico de verificación adicional puede significar MFA en cada login | REQUIERE DECISIÓN | La verificación actual es activación por correo, no MFA; no introducir MFA obligatorio sin decisión |
| P1 | No hay prueba E2E de ownership/IDOR con dos identidades sintéticas | FALTA DE PRUEBAS | Preparar pruebas aisladas sin datos de producción |
| P1 | Login, refresh, logout y OAuth no se probaron con una solicitud real Android | FALTA DE PRUEBAS | ADB no pudo iniciar su daemon; pendiente dispositivo/emulador y cuenta QA |
| P2 | Scripts de migración locales esperan SQL que, por decisión arquitectónica, se gestiona fuera del repo | FALSO POSITIVO como incumplimiento; dependencia operativa real | Documentada; no se ejecutaron scripts ni se tocaron migraciones externas |
| P2 | No había `.env.example` en ninguno de los proyectos pese a que README los referenciaban | FALTA DE DOCUMENTACIÓN (corregida) | Se agregaron plantillas sin secretos de producción |
| P2 | README enlazaba documentos inexistentes y describía push Android | FALTA DE DOCUMENTACIÓN (corregida) | Se actualizaron enlaces/descripción; API inventariada desde rutas actuales |
| P2 | `mobile/src-backups/` tenía 1.155 snapshots excluidos de build y sin referencias runtime | ERROR REAL de mantenimiento (corregido en etapa 1) | Carpeta retirada entonces; no se repitió limpieza en esta etapa |
| P2 | Rutas/CRUD carecen de pruebas end-to-end completas | FALTA DE PRUEBAS | Se conserva como pendiente; no se simuló resultado real |
| P2 | Los botones sociales se bloqueaban en Expo Go aunque el servicio ya presentaba una explicación clara | ERROR REAL de UX (corregido en etapa 2) | Los botones vuelven a responder; el toque conserva el guard de esquema y muestra el requisito del dev client |
| P2 | El harness QA firma un JWT local y simula `/auth/login` | REQUIERE DECISIÓN/aislamiento de QA | Se conservó; no se ejecutó contra producción ni se cuenta como autenticación real |

## Inventario de clasificación

- **NECESARIO:** `mobile/src/app/` (rutas Expo), `src/components`, servicios, tipos, `backend/src` y sus validadores/repositorios, lockfiles, `app.json`, `eas.json`, `vercel.json`, tests actuales, documentación funcional existente, ledgers/esquema remoto.
- **ELIMINABLE demostrado:** `mobile/src-backups/` (1.155 archivos históricos sin referencias operativas; ya retirado).
- **DUPLICADO:** los snapshots de `src-backups/` repetían versiones del árbol activo; algunos perfiles EAS tienen configuración parecida, pero se dejan intactos hasta verificar su uso manual externo.
- **REVISAR, conservado:** `mobile/layout-review/` (QA visual, incluye automatización que firma un JWT local para preparar una sesión; no prueba una contraseña real), `mobile/cambios-expo.patch`, y los JSON de auditoría de esquema por su fecha/contenido previo. No se usaron como evidencia del estado actual de Layerbase.

## Riesgos y limitaciones

1. La verificación de email se usa al activar una cuenta; el login de cuentas verificadas no exige MFA. Si la consigna académica especifica 2FA, permanece pendiente y debe diseñarse con una decisión explícita sobre UX, recuperación, bloqueo y soporte.
2. Configuración de Google/Facebook/X, SMTP, almacenamiento de objetos, Vercel Cron y EAS reside en entornos externos no inspeccionados desde el repositorio. No afirmar que están activos por existir variables/código.
3. El esquema se auditó en Layerbase en modo lectura. La normalización formal no puede probarse solo con columnas y constraints; requiere dependencias funcionales y DDL/diseño semántico. La administración externa de migraciones no se cuenta como incumplimiento.
4. Los reportes de esquema versionados tienen fechas anteriores. Se mantienen como artefactos históricos, no como autoridad del esquema actual.
5. No se hizo build de APK ni prueba física Android, ni se escribió o desplegó en producción.

## Segunda etapa: revisión de hallazgos

Se preservó el estado local preexistente (README, informes, ejemplos de entorno y el directorio sin rastrear `readmes a borrar/`). No se sobrescribió ni eliminó ese material. La decisión del responsable sobre migraciones corrige el hallazgo anterior: la ausencia de fuentes SQL en el repositorio es una decisión de operación externa, no un defecto ni un requisito de recuperación. La limitación de que los comandos locales esperan esos directorios se mantiene solo como información de uso.

El historial confirma que el commit `0312a36` añadió el requisito de development build para OAuth nativo en Expo Go. La configuración Expo registra el scheme `petcare`, y el perfil EAS `development` usa development client. Esto no demuestra que los proveedores estén configurados ni que un login móvil funcione. Se corrigió el hallazgo UX asociado: los botones OAuth ya no quedan deshabilitados en Expo Go; el toque muestra el error claro que produce el guard de servicio. En el flujo nativo actual hace falta instalar una development build una sola vez; Metro/Fast Refresh sigue sirviendo cambios JS/TS sin reconstruir la app. No se quitó la protección ni se alteró el intercambio OAuth sin una reproducción Android.

## Correcciones de la primera auditoría

- Retiro de snapshots duplicados de `mobile/src-backups/` tras verificar exclusiones y ausencia de referencias.
- Plantillas de entorno locales seguras, sin secretos ni credenciales de producción.
- README raíz/proyectos corregidos para describir notificaciones internas y enlazar documentación existente.
- Inventario API derivado de las rutas reales y entregables de auditoría en `docs/auditoria/`.

## Límites de esta segunda etapa

No se encontró y reprodujo una falla de código de autenticación, permisos o notificaciones que justificara un parche seguro desde este checkout. Sin Android, proveedores OAuth externos ni fixtures aislados, los hallazgos operativos siguen siendo falta de pruebas o requieren decisión; no se marcan como funcionalidades funcionales por inferencia. Ver el [resultado de pruebas](RESULTADOS_PRUEBAS.md) para pruebas que sí se ejecutaron.

Para detalle verificable, consulte [Matriz de requisitos](MATRIZ_REQUISITOS.md), [matriz de endpoints por rol](MATRIZ_ENDPOINTS_ROLES.md), [Layerbase](AUDITORIA_LAYERBASE.md), [Seguridad](AUDITORIA_SEGURIDAD.md), [limpieza](LIMPIEZA_CODIGO.md), [mejoras](PLAN_DE_MEJORAS.md) y [pruebas](RESULTADOS_PRUEBAS.md).
