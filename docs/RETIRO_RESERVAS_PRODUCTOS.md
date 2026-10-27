# Retiro del antiguo módulo de reservas comerciales

## Alcance aplicado en el código

- Se retiraron las pantallas y rutas Expo Router de reservas comerciales para Admin, Secretaría y Cliente.
- Se quitaron los accesos de navegación, tarjetas de Tienda, breadcrumbs, métricas, servicios API y endpoints `/api/clinic/reservations/**`.
- La operación vigente es Tienda → carrito → checkout → Pedidos. Los pedidos de tienda siguen usando sus endpoints y permisos propios.
- Turnos veterinarios y de peluquería continúan bajo `/api/clinic/appointments/**` y las agendas de cada rol.
- Los registros antiguos `order_type='RESERVATION'` continúan visibles como registros históricos en Mis pedidos; no se convierten ni se reportan como compras pagadas.

## Worker legado transitorio

El proceso de vencimiento que ya existía en `backend/src/server.ts` se conserva temporalmente, pero su repositorio ahora solo contiene `expireDueReservations`. No crea, lista ni permite cambiar reservas. Libera `reserved_stock` únicamente para operaciones antiguas vencidas, dentro de una transacción, y conserva su historial.

No se puede retirar este worker de forma segura hasta confirmar que no quedan reservas antiguas abiertas ni cantidades retenidas en inventario. La herramienta de lectura de la base remota falló por DNS (`ENOTFOUND`), así que no se conocen las cantidades actuales. No se ejecutó ninguna consulta mutante, migración ni ajuste de datos.

## Clasificación de tablas y campos

| Objeto | Clasificación | Acción segura ahora |
|---|---|---|
| `client_orders` | Compartida por operaciones históricas y pedidos de tienda | Conservar filas y tabla. No borrar filas `RESERVATION` ni convertirlas a compras. |
| `client_order_items` | Compartida por pedidos y operaciones antiguas; vinculada por `order_id` | Conservar líneas históricas y claves foráneas. |
| `client_order_status_history` | Historial compartido de pedido, pago y entrega | Conservar todos los eventos y referencias. |
| `client_products.reserved_stock` | Campo de inventario leído por Tienda y checkout | No restablecerlo masivamente. Primero conciliar las retenciones heredadas. |
| `client_orders.expires_at` y estados/order types antiguos | Campos compartidos físicamente en la tabla de pedidos | Candidatos a revisión futura, no a eliminación sin inspección del esquema desplegado y las filas. |
| `permissions` con `reservations.view_all` / `reservations.manage` | Permisos obsoletos que pueden persistir en roles | El código de navegación y endpoints ya no los consume. No se borraron grants ni permisos productivos. |

No se identificó en las fuentes una tabla exclusiva del módulo viejo. La fuente de migración `product-origin-migrate.ts` se conserva para instalaciones previas y sigue haciendo el backfill compatible de `expires_at`, pero ya no crea ni asigna permisos de Reservas; solo prepara el permiso de creación de productos. Su comando se renombró a `db:migrate:product-origin`. El migrador histórico de razón de estado se conserva porque su columna se usa también en el historial compartido de pagos; su comando ahora se llama `db:migrate:order-history-reason`. El candidato físico principal es `expires_at` y los valores históricos `RESERVATION` dentro de la tabla compartida, pero no se propone eliminarlos sin revisar consumidores, constraints y respaldos.

No se pudo obtener un conteo live de registros, stock retenido ni asignaciones RBAC: la conexión de solo lectura configurada falló por DNS (`ENOTFOUND`). Las consultas de preflight de abajo devuelven conteos por estado, cantidades abiertas por producto, claves foráneas y grants; no se ejecutaron en producción.

## Preflight de retiro propuesto (solo lectura)

Ejecutar contra una réplica o una conexión de auditoría, guardar el resultado en un respaldo cifrado con acceso restringido y comparar antes de planificar cambios:

```sql
SELECT order_type, status, COUNT(*) AS total, MIN(created_at) AS first_created,
       MAX(created_at) AS last_created
FROM client_orders
GROUP BY order_type, status
ORDER BY order_type, status;

SELECT i.product_id, p.name, SUM(i.quantity) AS legacy_open_quantity,
       p.reserved_stock AS inventory_reserved_stock
FROM client_orders o
JOIN client_order_items i ON i.order_id = o.id
JOIN client_products p ON p.id = i.product_id
WHERE o.order_type = 'RESERVATION'
  AND o.status IN ('PLACED','CONFIRMED','PROCESSING','READY')
GROUP BY i.product_id, p.name, p.reserved_stock
ORDER BY p.name, i.product_id;

SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('client_orders','client_order_items','client_order_status_history')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;

SELECT p.code, p.id AS permission_id, COUNT(DISTINCT rp.role_id) AS assigned_roles
FROM permissions p
LEFT JOIN role_permissions rp ON rp.permission_id = p.id
WHERE p.code IN ('reservations.view_all','reservations.manage')
GROUP BY p.code, p.id;
```

Después del preflight, preparar una copia consistente de la base (snapshot de proveedor o dump transaccional) que incluya pedidos, líneas, historial, notificaciones y estado de inventario. Verificar su checksum y ensayar la restauración en un entorno aislado antes de proponer una migración. Mantener el worker hasta que no haya operaciones abiertas y las cantidades heredadas estén conciliadas. Luego proponer una migración hacia delante que retire solo objetos confirmados exclusivos y ya vacíos; mantener pedidos históricos y su auditoría en sus tablas compartidas. La migración no debe convertir reservas en pedidos pagados, borrar filas históricas ni restablecer stock por una suma no conciliada.

## Validación

Los endpoints de turnos y tienda/pedidos permanecen en el inventario vigente de `docs/DOCUMENTACION_API.md`. Verificación local: pruebas móviles (44) y backend (35) pasan; TypeScript y lint pasan en ambos paquetes; la exportación web y la Android pasan. La suite HTTP de integración no pudo completar porque el sandbox denegó el loopback con `EACCES`; no se ejecutó integración de base de datos. La base remota tampoco se pudo consultar en modo solo lectura por `ENOTFOUND`.
