# Implementación de mejoras · Etapa 1

**Fecha:** 22/10/2026 · **Alcance:** roles, permisos y autorización. No se avanzó a la Etapa 2.

## Hallazgos verificados

- Se conservaron los seis códigos canónicos de rol. Las comparaciones en layouts y backend delimitan experiencias, ownership o funciones exclusivas de profesión/sistema.
- Los permisos efectivos provienen de `authorizationData` en el backend; `authenticate` vuelve a cargar usuario y permisos por solicitud. Las acciones administrativas consultan permisos; varias mutaciones además revalidan grants dentro de una transacción.
- Los datos por recurso están acotados: mascota de cliente por `owner_id`, paciente veterinario por asignación y registros clínicos por permiso/scope. Peluquería no obtiene rutas de historia clínica.
- AuthContext ya actualiza `/auth/me` al reanudar la app y tras respuesta 403, además de refrescar los cambios propios del panel. No se encontró un caso concreto donde un rol legítimo debiera sustituirse por un permiso configurable ni una autorización productiva que requiriera cambio; por eso no se modificaron rutas, roles o grants.

## Cambios realizados

- Se agregó `backend/tests/authorization-boundaries.test.ts` con siete pruebas sin acceso a DB real. Los mocks interceptan `databasePool.execute` solo dentro de cada caso y se restauran al terminar.
- Casos: cliente solicita mascota ajena; veterinario sin asignación; peluquería solicita registro médico mediante ruta directa; administrador sin grant; usuario desactivado; permiso revocado entre dos autenticaciones; solicitud de endpoint sin Bearer.
- Las pruebas de ownership verifican las consultas parametrizadas y sus condiciones de alcance. La prueba de permiso revocado demuestra que una autenticación nueva ya no devuelve el grant y que la guarda de la ruta retorna 403.

## Verificación

| Comando | Resultado |
|---|---|
| `backend/npm test` | 35/35 pruebas pasaron (28 existentes + 7 nuevas). |
| `backend/npm run lint` | Pasó sin errores. |
| `backend/npm run typecheck` | Pasó sin errores. |

Los tests nuevos no abren una conexión. No se ejecutó `test:db`; las pruebas de integración que pudieran conectarse requieren un DB de test aislado. No se ejecutaron migraciones ni se accedió a Layerbase.

## Archivos modificados por esta etapa

- `backend/tests/authorization-boundaries.test.ts` — nuevas pruebas de seguridad.
- `docs/auditoria/IMPLEMENTACION_ETAPA_1.md` — este registro.

Los demás cambios locales ya existentes se conservaron.

## Riesgos pendientes

- Los tests son pruebas unitarias con respuestas SQL simuladas; no sustituyen integración con una DB aislada ni validan el esquema remoto.
- El snapshot Layerbase y el historial de migraciones mantienen las limitaciones señaladas en [auditoría de base de datos](AUDITORIA_BASE_DATOS.md).
- Las etapas posteriores de MFA, proveedores externos, estudio/archivo clínico, OpenAPI y APK quedan fuera de este alcance.

## Siguiente etapa propuesta

La Etapa 2 puede empezar con inventario de importaciones para listar/ficha/búsqueda de pacientes y agenda, comparando responsabilidades reales antes de consolidar componentes. Mantener los endpoints y filtros de ownership actuales.
