# Resultados de verificaciones

Fecha de ejecución: 2026-10-26. Todas las pruebas fueron locales, salvo la comprobación de conexión de base de datos descrita abajo. No se escribieron datos, no se modificó el esquema y no se hizo despliegue.

## Automatizadas

| Componente | Verificación | Resultado | Alcance |
|---|---|---|---|
| Mobile | `npm run typecheck` | PASS | TypeScript sin emitir archivos. |
| Mobile | `npm run lint` | PASS | Reglas del proyecto. |
| Mobile | `npm test` | PASS | 25 pruebas; configuración API, validación de formularios, rutas seguras de notificaciones y políticas/callback OAuth. No prueba un login remoto real. |
| Mobile | `expo export -p web` | PASS | Bundle web de Expo completado; no es build Android nativo ni evidencia de autenticación. |
| Backend | `npm run typecheck` | PASS | Configuración de chequeo TypeScript del backend. |
| Backend | `npm run lint` | PASS | Reglas del proyecto. |
| Backend | `npm test` + `npm run test:http` | PASS | 21 pruebas unitarias + 4 pruebas HTTP de Express (25 combinadas); incluye guards/delegación, validación, notificaciones internas, pedidos y auth HTTP. No es una suite E2E de login válido. |
| Backend | `npm run build` | PASS | Build del backend. |
| DB | `npm run db:check` | PASS | Conexión de solo lectura al servidor MariaDB compatible desde el entorno configurado. No se imprimen hostname, credenciales ni filas. |
| DB | `npm run db:audit:readonly` | PASS con límites | Extracción completa de metadatos: 53 tablas, 433 columnas, 203 constraints, 31 checks y 199 índices. Sin escrituras; solo estructura/ledger. |

En la segunda etapa, las suites base finalizaron con 25/25 mobile y 17/17 backend. En la tercera etapa se conserva el baseline predeterminado aislado (21 backend) y se agregan cuatro casos HTTP ejecutados como `npm run test:http`; el total combinado es 25 backend. `mobile/src-backups/` se había eliminado en la primera etapa y no se repitió esa limpieza.

## No ejecutadas / no demostradas

- No se confirmó un dispositivo Android físico ni emulador: `adb devices -l` no pudo consultar el daemon, que falló al iniciar. Por tanto no se verificó instalación, conectividad desde Android ni una solicitud autenticada real.
- No se realizó login real ni se usaron credenciales de usuario. El acceso a MariaDB confirma conectividad del cliente de auditoría, no que el endpoint `/auth/login` consulte con éxito ni que genere tokens en vivo.
- No se usaron credenciales OAuth ni SMTP, ni se validaron callbacks de proveedores externos.
- No se ejecutaron pruebas de CRUD completas por rol, aislamiento BOLA/IDOR con dos usuarios, concurrencia, restauración de backup ni evaluación de accesibilidad.
- La pantalla QA existente que consulta datos de cliente no se ejecutó: su helper simula el endpoint de login y puede firmar un token local, así que no certifica autenticación y no debe tratarse como prueba de producción.

## Interpretación de auditoría de base

La conexión leída en la etapa anterior correspondía a la configuración local no publicada y apunta a un proveedor compatible con Layerbase; el entorno reportado por la app era desarrollo. No hay valores esperados de hostname/base configurados para demostrar si esa instancia es staging o producción. Esta tercera etapa no reabrió la conexión. No se consultaron datos de negocio.

El auditor estático de SQL generó sugerencias heurísticas de tablas potencialmente ausentes (incluye fragmentos dinámicos y nombres derivados); esas sugerencias no son prueba de drift. La extracción estructural completa no reportó errores ni secciones faltantes. Según la decisión del responsable, migraciones se administran externamente; no se compararon checksums locales ni se invocó ningún migrator. Algunos scripts sí esperan fuentes en `backend/migrations/` y `backend/client-migrations/`, lo que se registra como dependencia operativa del CLI, no como hallazgo del esquema Layerbase.

## Reproducibilidad

Desde `mobile/`: `npm run typecheck`, `npm run lint`, `npm test` y `npx expo export -p web`.

Desde `backend/`: `npm run typecheck`, `npm run lint`, `npm test` y `npm run build`. Los comandos `db:check` y `db:audit:readonly` requieren las variables locales de base; se ejecutaron de modo solo lectura y su salida no se incorporó con secretos.

## Segunda etapa

- Tras el ajuste UX del login (botones OAuth activos en Expo Go y explicación al pulsar), `mobile` volvió a pasar typecheck, lint y `npm test` (25/25). La prueba de OAuth cubre parseo de callback, cancelación y política de development build, no una autenticación del proveedor.
- `expo config --type public` resolvió Expo SDK 58 y el scheme `petcare`. La configuración EAS ya define un perfil `development` con `developmentClient: true`; para los siguientes cambios JS/TS se puede conectar Metro con Fast Refresh sin rebuild.
- `expo install --check` reportó paquetes al día usando el mapa local `expo/bundledNativeModules.json`, pero indicó que no pudo acceder al endpoint de versiones conocido porque la red está deshabilitada. El resultado es útil como chequeo offline y no como validación online completa.
- Tras el ajuste de `mobile/src/app/login.tsx`, `expo export -p web` volvió a terminar correctamente (bundle web exportado).
- Backend repitió typecheck, lint, tests (17/17) y build; todos finalizaron con código cero. `npm ls --depth=0` mostró `@img/sharp-wasm32` y `@emnapi/runtime` como extraneous en el `node_modules` local; `npm explain` relaciona el segundo con el primero. No son dependencias declaradas del producto ni se retiraron del entorno local sin demostrar que fueran residuos seguros.
- `adb devices -l` no pudo enumerar dispositivos: el daemon ADB falló al iniciar y no contestó en `tcp:5037`. Esto impide una prueba real desde Android en este entorno; no se considera que la solicitud de login haya sido probada.
- `git diff --check` terminó sin errores de whitespace (Git solo advirtió la conversión LF/CRLF habitual en tres README). No se hizo `npm audit` por indisponibilidad de red y no se afirma ausencia de vulnerabilidades.

## Tercera etapa: pruebas funcionales locales

- Se agregaron `backend/tests/http/auth-http.integration.test.ts` (4 casos) y `backend/tests/authorization-middleware.test.ts` (4 casos). El primero levanta el Express real por loopback y verifica rutas/errores HTTP; define `DB_HOST=127.0.0.1`, `DB_PORT=1`, credenciales ficticias y secreto JWT exclusivo de test antes de importar la app. Los casos terminan antes de cualquier query, por lo que no escriben ni leen Layerbase.
- HTTP probado: body inválido de login y registro (`400 VALIDATION_ERROR`), `/auth/me` y `/client/pets/query` sin sesión (`401 AUTH_REQUIRED`), JWT malformado y expirado (`401 INVALID_TOKEN`/`TOKEN_EXPIRED`). Errores no incluyeron secreto, SQL ni dirección de la DB.
- Guards probados directamente: seis roles aceptados solo al declarar el rol, acceso permitido/denegado por `requireRole`, permisos acumulativos y alternativos, acceso personal para cliente/staff con grant, y restricción de paciente a roles/autorización global. No prueba permisos efectivos leídos de Layerbase ni BOLA entre dos filas reales.
- Backend final: typecheck, lint y build PASS; `npm test` **21/21** y `npm run test:http` **4/4**. Mobile final: typecheck, lint y suite **25/25**. La suite HTTP necesitó permiso de loopback porque el sandbox bloqueaba conexiones locales; al ejecutarla de forma autorizada, pasó. No hubo acceso remoto a DB.
- El [inventario API](../DOCUMENTACION_API.md) se complementa ahora con la [matriz de endpoints por rol](MATRIZ_ENDPOINTS_ROLES.md), que deja explícito qué familias dependen de grants internos.
- No se probó login exitoso, refresh/logout real, activación/correo, password reset, OAuth externo, CRUD persistido, IDOR con datos, build Android instalado ni interacción visual. Hace falta cuenta/servicio/Android QA y una DB aislada. Una prueba con mock no se presenta como E2E.

La corrección de código de la etapa anterior sigue siendo solo UX en `mobile/src/app/login.tsx`: al tocar un proveedor desde Expo Go, se muestra el requisito del development client y se conserva el guard de seguridad. En esta tercera etapa no se detectó otro error reproducible de código que pudiera corregirse sin cuenta/DB/dispositivo QA.
