# Auditoría de base de datos

## Evidencia disponible

No se abrió una conexión durante la presente auditoría. No se consultaron filas reales ni se ejecutó SQL. Se leyó el artefacto versionado [layerbase-sql-audit.json](../../backend/layerbase-sql-audit.json): generado el 21/10/2026 16:45 UTC, `auditComplete=true`, servidor MariaDB 11.8.9, 46 tablas, 342 columnas, 181 constraints, 30 CHECK, 169 índices y 4 historiales de migración. El artefacto documenta consulta de metadatos (no filas de negocio). Es una captura de fecha anterior, no prueba el estado del servidor a 22/10.

Las entidades de la captura incluyen usuarios/roles/permisos y overrides, mascotas/especies/razas, veterinarios, servicios y asignaciones, turnos/slots, historia clínica, productos/categorías/promociones, carrito/pedidos/entregas, notificaciones, OAuth, refresh, verificación y reset. Se observan claves e índices y engine InnoDB en tablas. No se verificó el DDL remoto actual.

## Historial de migraciones en snapshot

| Ledger | Estado observado 21/10 | Notas |
|---|---|---|
| `auth_schema_migrations` | `001_oauth_sessions.sql` applied | Registro con checksum. |
| `client_schema_migrations` | `001`, `002` archivada, `003`–`007` applied | `002_pet_breed_name.sql` falta del checkout pero su checksum histórico está embebido en `client-migrate.ts`. 008–013 existen en checkout, no figuran como applied en la captura; README declara 013 preparada y no aplicada. |
| `clinic_schema_migrations` | `002_adopt_existing_clinic_schema.sql` applied | Reconciliación/adopción; el SQL clínico original 001 no está presente en checkout. |
| `employee_password_schema_migrations` | `001_must_change_password.sql` applied | DDL de extensión visible. |

La fuente canonical completa para crear una base vacía y el historial original no están íntegramente versionados en las rutas actuales. Además, `backend/src/database/migration-files.ts` resuelve por defecto `backend/migrations`, y `backend/src/database/bootstrap.ts` busca `backend/bootstrap`; ninguno de esos directorios está en el checkout (`rg --files backend` no los encuentra). Por tanto, `db:migrate` no encuentra las migraciones base y `db:bootstrap` no encuentra su carpeta fuente con los archivos actuales. Hay runners de extensiones auth/clinic/client y SQL de extensiones, pero no un juego único de migrations base recuperable. La documentación del backend advierte que el migrador de cliente exige restaurar/verificar secuencia histórica antes de usarlo. **Hallazgo ALTO confirmado estáticamente:** no ejecutar esos scripts en la DB real como método de reparación.

## Integridad, consultas y compatibilidad

- Consultas revisadas usan `mysql2` con placeholders; operaciones de alto impacto usan transacción/locking en varios repositorios.
- Convenciones observadas: IDs FK, índices únicos/catálogos, restricciones CHECK y relaciones restrictivas para conservar autoría/historial.
- Layerbase está en MariaDB 11.8.9 según snapshot; la dependencia `mysql2` soporta protocolo MySQL. No obstante, solo pruebas de compatibilidad en staging con DDL/queries actuales confirman que futuras migraciones corren en esa versión.
- JSON snapshot registra collation `utf8mb4_0900_ai_ci`; revisar compatibilidad exacta de collation si se construye otra instancia MariaDB/MySQL distinta.
- El artefacto de auditoría da metadata de una base cuyo nombre aparece en el propio JSON; informes evitan exponer host/credenciales/datos personales.

## Límites y riesgos

1. La snapshot no contiene grant rows, usuarios, permisos efectivos ni datos comerciales. No se pudo construir matriz de permisos efectivos ni verificar conteos/consistencia de datos.
2. El snapshot está un día antes del informe, el entorno local pudo no resolver Layerbase según el informe histórico, y la configuración de Vercel no se consultó.
3. SQL históricos ausentes hacen que ejecutar el migrador a ciegas sea inseguro. Ninguna migración se ejecutó para esta auditoría.
4. Migraciones con DDL MySQL/MariaDB pueden dejar cambios parciales por commits implícitos. Los runners registran estados/checksum, pero el operador debe confirmar backup e historial antes de intervenir.

## Recomendación

Obtener en staging un `db:audit:readonly` fresco con metadatos únicamente; comparar checksums/historial y el DDL con el checkout; restaurar el historial fuente en Git desde un artefacto confiable antes de habilitar más migraciones. Ejecutar cambios de esquema solo con aprobación operacional, backup verificable y plan reversible.
