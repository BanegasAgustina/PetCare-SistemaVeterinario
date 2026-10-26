# Limpieza de código y archivos

## Cambios realizados en esta auditoría

| Elemento | Acción | Evidencia/justificación |
|---|---|---|
| `mobile/src-backups/` | Eliminado: 1.155 archivos | No aparece en configuración ni scripts; está expresamente excluido de `mobile/tsconfig.json` y `mobile/eslint.config.js`; las búsquedas del repo no encontraron consumidores productivos. Son snapshots de código redundantes con el historial Git y no forman parte de `src/`, raíz Expo Router ni bundle. |
| `backend/.env.example` | Agregado | El README la pedía pero no existía. Incluye únicamente nombres de variables y placeholders locales sin secretos. |
| `mobile/.env.example` | Agregado | No existía. Documenta API HTTPS explícita de desarrollo y alternativa Android local; no contiene credenciales. |
| README raíz/backend/mobile | Actualizados | Se corrigieron enlaces a documentos inexistentes y la descripción de push Android, ahora deshabilitado. |
| `docs/DOCUMENTACION_API.md` | Agregado | 141 rutas enumeradas desde declaraciones reales de router/app y ejemplos contrastados con validadores/servicios. |
| `docs/auditoria/*.md` | Agregados | Informes de auditoría solicitados con estados y límites de verificación. |
| `mobile/src/app/login.tsx` | Ajustado | Se mantienen activos los botones OAuth en Expo Go; el guard de `beginOAuth` explica el requisito de development build en lugar de bloquear los botones. |

Las versiones de `mobile/src-backups/` siguen disponibles en el historial Git. No se modificó el historial ni se hizo push.

## Funciones o dependencias retiradas

En el estado del repositorio al iniciar esta auditoría no había llamadas activas a Expo Notifications/FCM ni dependencia `expo-notifications`; el sistema push ya estaba retirado en cambios previos. Esta auditoría confirmó que `mobile/app.json`, `mobile/package.json`, `mobile/src` y `backend/src` no contienen integración push activa. Las tablas históricas de push y preferencias aún viven en Layerbase y los ledgers refieren migraciones push aplicadas; se conservaron para evitar una eliminación irreversible de esquema/datos.

En esta auditoría no se retiraron dependencias npm ni funcionalidades de auth, OAuth, permisos, reservas, turnos, correo, recordatorios internos o tienda. No se consolidaron funciones equivalentes porque no se demostró una duplicación runtime segura para cambiar sin alterar contratos.

## Elementos revisados y conservados

| Elemento | Clasificación | Motivo |
|---|---|---|
| `mobile/layout-review/` (scripts, screenshots, resultados) | REVISAR / útil para QA | Tiene pruebas de layout por tema/viewport y navegación; un script prepara una sesión JWT real para probar pantallas después del login. No se ejecutó ni se usó como evidencia de credenciales reales. |
| `mobile/cambios-expo.patch` | REVISAR | Patch histórico sin referencia automatizada. Se conserva hasta verificar que no sea material de recuperación del mantenedor. |
| `backend/auditoria-actual.json`, `schema-audit.json`, `layerbase-sql-audit.json` | REVISAR / histórico | Snapshots con fechas previas; no son fuente de verdad frente a la lectura Layerbase actual. No se borraron porque pueden servir de traza de auditorías anteriores. |
| `mobile/android/` | NECESARIO / generado local | Carpeta nativa local excluida de Git; el agente no editó archivos generados a mano. |
| Migraciones aplicadas en DB | NECESARIO / gestión externa | Por decisión del responsable, no se almacenan necesariamente en este repo; no se borró ni cambió ninguna tabla o registro. Los scripts locales que resuelven SQL ausente no se ejecutaron. |

## Dependencias y duplicaciones

- Los lockfiles `mobile/package-lock.json` y `backend/package-lock.json` se conservaron.
- No se agregaron dependencias.
- No se ejecutó `npm audit` ni se declaró que dependencias estén libres de CVE; eso requiere un escaneo separado y revisión de advisories actuales.
- `eas.json` contiene perfiles que comparten valores de producción; se conservaron porque un perfil puede ser invocado manualmente desde EAS aun sin referencia en scripts locales.
