# Implementación Etapa 4 — CRUD y ciclo de vida

Fecha: 22/10/2026. Alcance limitado a la Etapa 4. El inventario describe operaciones observadas en código de frontend y backend; no certifica los permisos/grants del servidor ni el estado actual de la base. La única evidencia de esquema disponible es el snapshot de solo lectura del 21/10/2026.

## Matriz de ciclo de vida

`C` crear, `L` listar/consultar, `E` editar, `D` desactivar, `R` reactivar, `A` archivar/restaurar, `X` eliminar físicamente. `—` no se observó. La ausencia de controles de frontend no implica que la ruta sea imposible de invocar; el backend debe autorizar cada escritura.

| Entidad | Frontend observado | Backend observado | Falta / criterio |
|---|---|---|---|
| Usuarios y cuentas | C/L/E/D/R desde administración; perfil y contraseña propia | Alta/consulta/edición, `is_active`, aumento de `session_version` al cambiar rol/estado; revoca invitaciones y verificaciones al desactivar | Sin X. SUPER_ADMIN protegido; no se permite auto desactivación en flujos de profesionales. Grants reales del remoto no verificados. |
| Roles y permisos | L/E de roles; asignación y overrides de permisos | Consultar catálogo y actualizar nombre/grants con delegación; no alta dinámica ni borrado de roles | No hay ciclo completo para crear/eliminar roles. No añadir códigos de rol: el conjunto es fijo en backend. |
| Clientes | L en módulos de personal; editar perfil propio | Lectura de clientes y actualización propia; cuenta administrada desde Users | No hay baja de cliente separada de la baja de cuenta. |
| Veterinarios | C/L/E/D/R; confirmación para cambiar estado | Alta/consulta/edición y activar/desactivar; invalida sesiones en cambios de estado/email; asigna especialidades existentes | Sin X. La asignación de permisos sigue sujeta a grants actuales. |
| Peluqueros | L/estado desde Profesionales y edición de usuario en administración | Profesional se representa mediante usuario/tipo profesional; usuarios se crean/editan/desactivan por administración | Sin formulario especializado de alta y perfil completo equivalente al veterinario. |
| Secretarios | Edición/estado de cuenta desde Users; agenda y coordinación | Cuenta y permisos desde administración; acciones de agenda/reservas mediante rutas protegidas | No hay entidad o CRUD independiente de secretario. |
| Mascotas | C/L/E/D; se añadió lista de inactivas y acción R para el propietario | C/L/E y desactivación con ownership; se añadió consulta opcional de inactivas y reactivación con ownership en transacción | No X. La reactivación no altera autoría ni historial clínico. |
| Pacientes | L/E/D en clínica; “paciente” es la mascota dentro del scope profesional | L/E/D con permiso `pets.update`, alcance clínico y comprobación de turnos pendientes | La ruta de clínica no tiene R propia; el propietario puede reactivar la mascota desde su módulo. |
| Especialidades | C/L/E/D/R; X solo si no hay referencias | `specialties.manage` en rutas; `is_active`; X comprueba referencias a servicios y profesionales y responde conflicto si se usa | Sin archivo/restauración con historial de cambios. Relaciones inactivas se conservan. |
| Servicios | C/L/E/D/R; confirmación para retirar/eliminar | Guardas `services.manage`; `is_active`; X solo si no hay turnos asociados; si hay historial, archiva y conserva referencias | Sin registro de enmiendas/cambios del servicio. |
| Tipos profesionales / especialidades | C/L/E para tipos; especialidades además D/R | Tipos C/L/E con rol validado; especialidades C/L/E/D/R | Tipos no tienen `is_active` en snapshot; D/R requiere migración. No se implementa. |
| Asignaciones profesionales | Añadir asignación al guardar servicio; asignar servicios desde profesionales | Reemplaza vínculos bajo permiso `professionals.manage`; las especialidades se validan | No hay historial de vigencia de asignación. No se añadió X/archivo histórico al vínculo. |
| Horarios y disponibilidad | C/L/D de horarios y bloqueos; se añadió R con confirmación para períodos futuros | C/L/D existente; R nueva bajo `schedule.manage`, con verificación de vigencia, usuario/servicio activo, asignación y cruces | No se reactivan horas pasadas, duplicadas, bloqueadas o con turnos incompatibles. |
| Turnos | Solicitud, consulta y cambios de estado; cancelar/reprogramar según transición disponible | Crear/consultar y transición protegida por estado, rol, scope y disponibilidad | Sin X; no se borran turnos históricos. Cancelación no equivale a restaurar un turno. |
| Historia clínica / consultas | C/L en veterinaria y consulta del cliente según permiso | Inserción y consulta por permiso y scope; no se observó edición ni borrado | Enmiendas, archivo e historial de modificación bloqueados por esquema y política de trazabilidad. |
| Vacunas | C/L | Inserción/consulta como tipos de registro clínico | Sin E/D/R/X ni historial de correcciones. |
| Recetas | C/L | Inserción/consulta con permisos `prescriptions.*` | Sin E/D/R/X ni historial de correcciones. |
| Recomendaciones | C/L | Inserción/consulta con permiso clínico | Sin E/D/R/X ni historial de correcciones. |
| Estudios/archivos clínicos | — | No se halló recurso dedicado | Requiere tabla, almacenamiento privado, política de propiedad/visibilidad, permisos e historial. Diseño pendiente abajo. |
| Productos | C/L/E/D/R desde administración; consulta de movimientos de stock | C/L/Catalog CRUD; edición con permisos por campo; stock y auditoría en tablas de movimientos/cambios | Sin X general; conserva referencias de pedidos. No se verificó contra DB real. |
| Categorías | C/L/E/D/R en catálogo | C/L/E y `is_active`; catálogo público filtra inactivas | Sin acción de eliminación. No borrar si existen relaciones. |
| Promociones | C/L/E/D/R en catálogo | CRUD por catálogo con `is_active` y fechas | Sin X/archivo con historial dedicado. Consulta pública exige promoción vigente y producto activo. |
| Banners | C/L/E/orden/D/X en administración | CRUD, orden y borrado físico con `store.banners.manage` | X disponible; no se observó papelera/restauración. Revisar relaciones y retención antes de extender borrado. |
| Pedidos | C/L y seguimiento; gestión administrativa de estados | Alta por checkout, ownership para clientes y transiciones/historial para administración | Sin X; pedidos conservan historial. |
| Pagos | Iniciar/renovar intento, cargar comprobante y consultar; revisión administrativa | Intenciones de pago, comprobante y revisión protegida; la transferencia depende de migración/storage | Sin X/edición arbitraria. Operación bancaria externa no verificada. |
| Envíos / cumplimiento | Selección/configuración de retiro y envío; consulta del pedido | Método/dirección/estado de entrega se guarda en pedido; configuración por admin | No hay entidad de envío independiente ni restore de estados. |
| Direcciones | C/L/C/E en perfil de compra | Alta y actualización con ownership del cliente | Sin D/R; actualmente el esquema no ofrece ciclo de baja dedicado. |
| Notificaciones | L y marcar leída; registrar/revocar token push | Crear por evento, consultar, marcar leída, registrar/revocar push token | Sin borrar/restaurar notificaciones. El estado leído no afecta el historial. |
| Bloqueos de agenda | C/L/D; se añadió R futuro | C/L/D/R en la tabla existente, bajo `schedule.manage` | La reactivación impide cruces con otro bloqueo o turno vigente. |

## Cambios implementados

- **Reactivación de disponibilidad:** la mutación ya existente `PATCH /clinic/availability/:kind/:id` acepta `isActive`. Desactivar conserva la regla que protege turnos asociados. Reactivar usa permisos frescos dentro de la transacción y rechaza intervalos pasados, profesional inactivo, servicio/asignación inactivos, cruce con otro horario/bloque o turnos incompatibles. Se agregaron listas de horarios y bloqueos futuros desactivados, confirmación y errores en la interfaz de agenda.
- **Reactivación de mascotas propias:** `GET /client/pets?includeInactive=true` incluye el estado y se agregó `PATCH /client/pets/:id/reactivate`. La operación verifica ownership, es idempotente y no toca historia ni relaciones. La pantalla Mis mascotas permite mostrar inactivas y confirmarlas antes de reactivar.
- **Pruebas:** reglas de conflictos, estados inactivos/pasados, turno asociado y permiso `schedule.manage`; además, contrato mobile para listar inactivas y llamar la ruta autenticada de reactivación de mascotas.

## Bloqueos por esquema y diseño propuesto

No se ejecutó SQL, migración ni conexión a Layerbase. El snapshot de `professional_types` no contiene `is_active`; añadir desactivación requeriría modificar el esquema y filtrar asignaciones existentes. Queda pendiente.

`client_clinical_records` no incluye metadatos suficientes para conservar enmiendas. Diseño orientativo para revisión legal/operativa antes de una futura migración:

```sql
CREATE TABLE client_clinical_record_amendments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  record_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reason VARCHAR(1000) NOT NULL,
  changes_json JSON NOT NULL,
  CONSTRAINT fk_clinical_amendment_record FOREIGN KEY (record_id) REFERENCES client_clinical_records(id),
  CONSTRAINT fk_clinical_amendment_author FOREIGN KEY (author_user_id) REFERENCES users(id),
  INDEX idx_clinical_amendment_history (record_id, created_at)
);
```

La propuesta es append-only: correcciones agregan una enmienda con autor/fecha/motivo y campos corregidos; la ficha original no se elimina. Definir qué roles pueden corregir y qué campos ve el propietario antes de implementar. Si el contrato exige conservar valores anteriores y nuevos, ambos deben quedar dentro del JSON validado por servidor.

Para estudios, falta una entidad que vincule mascota, profesional autor, tipo, fecha, resultado, clave privada del objeto, metadatos de visibilidad y autor/fecha de carga. Los archivos requieren bucket privado, allowlist de tipo/tamaño, acceso mediante URL firmada corta y comprobación de scope del propietario/profesional en cada lectura. No guardar binarios como URLs públicas ni aceptar una clave libre del cliente. El DDL dependerá del esquema de estudios aprobado y de las relaciones reales; se deja como diseño, sin SQL ejecutable hasta confirmar ambos.

## Archivos modificados

- `backend/src/repositories/client.repository.ts`, `backend/src/services/client.service.ts`, `backend/src/routes/client.routes.ts`
- `backend/src/repositories/clinic-admin.repository.ts`, `backend/src/services/clinic.service.ts`, `backend/src/utils/availability-lifecycle.ts`
- `mobile/src/services/client.service.ts`, `mobile/src/services/clinic.service.ts`, `mobile/src/types/client.ts`, `mobile/src/app/client/(tabs)/pets.tsx`, `mobile/src/components/clinic/CatalogScreen.tsx`
- `backend/tests/availability-lifecycle.test.ts`, `mobile/tests/pet-lifecycle.test.ts`
- `docs/auditoria/IMPLEMENTACION_ETAPA_4.md`

## Verificación

- Backend: pruebas unitarias **43/43**, lint y typecheck pasaron.
- Mobile: pruebas unitarias **28/28**, lint y typecheck pasaron.
- Para evitar el shim global `npm` denegado por Windows, se invocaron los CLIs locales con Node. No se ejecutaron pruebas de base de datos, migraciones, checkout de proveedor, pruebas en dispositivos ni pruebas end-to-end.

## Riesgos y próximas acciones

- No hay conexión o snapshot fresco de Layerbase; matriz y compatibilidad corresponden a revisión estática con snapshot anterior.
- La reactivación de mascotas/disponibilidad no fue probada con MariaDB real; verificar integración en DB `_test` cuando exista el esquema de prueba seguro.
- Implementar enmiendas clínicas y estudios requiere aprobación de política, DDL, almacenamiento privado y pruebas de ownership/permisos.
- Evaluar la baja/restauración de direcciones, historia de cambios de banners, y vigencia histórica de asignaciones en una etapa posterior autorizada.
