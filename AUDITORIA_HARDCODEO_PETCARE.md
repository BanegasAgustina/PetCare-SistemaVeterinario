# Auditoría de hardcodeo PetCare

Fecha: 25-10-2026  
Alcance: búsqueda estática en `mobile/src` y `backend/src`, excluyendo backups, dependencias y herramientas SQL de desarrollo. No se encontró evidencia concluyente de datos de negocio ficticios en los flujos activos revisados; la búsqueda estática no certifica el contenido de la DB ni la API desplegada.

## Hallazgos

| ID | Prioridad | Archivo/ubicación | Problema/evidencia | Origen correcto / solución | Estado |
|---|---|---|---|---|---|
| HAR-01 | P3 | `mobile/src/utils/demo-card.ts` (eliminado) | Contenía un número de tarjeta de prueba y un validador sin consumidores en el código activo. No alimentaba checkout ni constituía un pago real. | Eliminado el helper huérfano. Checkout sigue mostrando el modo demo explícito del contrato existente; no se sustituyó por datos de negocio. | Corregido; sin cambio de flujo activo |
| HAR-02 | P2 | `mobile/src/app/admin/store-orders.tsx`, `mobile/src/services/clinic.service.ts`, `backend/src/repositories/store-orders.repository.ts` y `backend/src/utils/store-order-transitions.ts` | La UI calculaba las transiciones posibles por estado/método duplicando `validTransition` de backend. | El detalle existente del pedido ahora devuelve `allowedOrderStatuses`, calculado por backend con la misma función que valida escrituras. La UI consume esa lista. La enumeración/etiquetas de filtro sigue siendo una constante de contrato y presentación, no una regla de transición. | Corregido en código y pruebas unitarias; API/DB pendientes de QA |

No se registraron hallazgos P0/P1 de mock data durante esta búsqueda. La ausencia de resultados es una observación acotada a los archivos activos revisados, no una certificación de todos los despliegues.

## Catálogos estáticos que son constantes válidas

- Roles y rutas (`mobile/src/utils/role-home.ts`, `navigation-tabs.ts`) traducen navegación/etiquetas y no asignan permisos; los permisos efectivos proceden de `/auth/me` y se vuelven a validar en backend.
- Enum de roles/estados, tipos clínicos, pasos del formulario de turnos, días de semana e iconos son constantes de contrato/presentación. Los servicios, precios, horarios, disponibilidad, banners, promociones, stock, perfiles, pedidos y métricas se solicitan mediante servicios de cliente/clinic/admin.
- `CARD_DEMO` es explícitamente una operación de demostración; backend rechaza el checkout demo cuando `STORE_DEMO_MODE` está apagado y las pantallas expresan que no se procesa un cobro real (`backend/src/services/client.service.ts`, `store-checkout.validator.ts`, `mobile/src/app/client/(tabs)/store/checkout.tsx`).
- Las imágenes de marca en `mobile/src/assets/` son recursos visuales, no se identificaron como fuente de catálogo o precio.

## Procedencia dinámica constatada estáticamente

| Información | Fuente en frontend | Fuente de negocio backend |
|---|---|---|
| Perfil/roles/grants | `AuthContext` y `/auth/me` | middleware JWT/permissions y repositorio de usuario/autorización |
| Mascotas y catálogo | `client.service.ts` | `client.service.ts` + `client.repository.ts` |
| Slots, servicios, profesionales, agenda | `client.service.ts`, `clinic.service.ts` | `clinic.service.ts`, `clinic.repository.ts`, `clinic-admin.repository.ts` |
| Productos, categorías, promociones, banners | client/clinic services | `storefront.repository.ts`, `client.repository.ts` |
| Pedido, stock y montos | `client.service.ts` | `store-checkout.repository.ts`, que vuelve a leer productos/precios y confirma stock en DB |
| Entrega/cotización | `client.service.ts` | `storefront.repository.ts` y configuración persistida |
| Estadísticas | hooks de panel | repositorios de cliente/clínica/admin |

## Límites

La búsqueda cubrió `mobile/src` y `backend/src`; se excluyeron `mobile/src-backups`, las pruebas unitarias y scripts SQL/de semilla por no ser interfaces productivas. Los archivos `backend/bootstrap/` y `backend/migrations/` faltan según README, y no se consultó una DB. Para cerrar esta fase hay que comparar respuestas reales de QA con pantallas y estado persistido, además de buscar fixture/seeds fuera de estas raíces antes de una release.

## Resultado de lotes implementados

Se eliminó del repositorio el número de tarjeta de prueba contenido en un helper sin referencias activas. No había un mock activo de producto/precio/usuario que pudiera retirarse con evidencia. Se retiró de la UI la regla local de transiciones del pedido; ahora usa `allowedOrderStatuses` del detalle backend. No se conectó el backend a la DB configurada porque el host es remoto y el entorno no se pudo identificar como QA. Las pruebas unitarias cubren validadores y reglas puras de permisos/transición; no demuestran API desplegada ni persistencia.


## Actualización visual — tercer lote

Los encabezados incorporados usan textos fijos de presentación (nombre del rol/área y subtítulos); el saludo toma el nombre del usuario autenticado, con fallback neutral. No se introdujeron usuarios, productos, turnos, precios, métricas ni respuestas simuladas. Las métricas, agenda y tarjetas continúan condicionadas a los datos y permisos existentes.


## Actualización — cuarto lote (mascotas y turnos)

Los cambios son de estados visuales, etiquetas y navegación hacia rutas existentes. Mascotas y turnos siguen viniendo de `useClient`/API; el vacío solo se decide con una respuesta cargada. No se agregaron registros, precios, horarios ni respuestas simuladas, ni se cambió la fuente o contrato de datos.


## Actualización — quinto lote (tienda y compra)

Precios, precio regular, stock y promociones en tienda/detalle/carrito siguen siendo los entregados por las consultas de producto y carrito. El costo de envío solo se muestra como monto al existir cotización disponible que corresponda al subtotal actual; en otro caso queda pendiente de confirmar. Las instrucciones bancarias se leen de la configuración actual de fulfillment; no se añadieron cuentas, costos, productos ni pagos simulados.

## Actualización — sexto lote (productos y categorías)

La gestión usa el catálogo y las categorías obtenidas por `api.catalog`/`/admin/products/catalog`, junto con los endpoints administrativos existentes para listar y guardar. Los estados activo/inactivo y los tipos `MEDICINE`/`ACCESSORY` son opciones de presentación/enum del contrato; las categorías, productos, precio, stock y estados persistidos no se crean como valores ficticios. Los formularios validan datos ingresados, no proponen precios ni categorías predeterminados. No se retiró hardcodeo de negocio porque no se encontró uno que alimentara estas pantallas.

Para promociones, la lista de productos elegibles se consulta con `api.products()` únicamente bajo `products.view`. Sin ese grant el formulario mantiene la referencia de producto por ID y la API conserva la validación final. No se añadió endpoint, permiso ni catálogo local.

## Actualización — séptimo lote (servicios)

Los servicios, sus imágenes y metadatos se leen de los registros existentes. El selector del cliente recibe el campo `imageUrl` persistido y usa URL pública o firmada según el almacenamiento ya configurado. Estados, tipos, especialidades, profesionales y precios continúan viniendo de API; la tarjeta no genera valores de negocio cuando faltan.

En la publicación de disponibilidad se eliminaron las horas por defecto 09:00/17:00 y la duración de respaldo de 30 minutos. La pantalla ahora usa la duración leída del servicio y obliga a seleccionar el período/horario; si la duración no está disponible, bloquea la publicación y pide actualizar la lista.

## Actualización — octavo lote (profesionales y asignaciones)

Nombres, roles/tipos, especialidades, estado, servicios y asignaciones que presenta el listado se derivan de `/clinic/professionals` y `/clinic/catalog`. La disponibilidad contextual consulta servicios activos asignados en ese catálogo; las horas y turnos siguen dependiendo de `/clinic/availability` y del servicio persistido. No se incorporaron profesionales, especialidades, servicios u horarios de muestra. Se quitó el fallback de 30 minutos al abrir disponibilidad desde su pantalla y, si el dato real de duración falta, la publicación permanece bloqueada.

El acceso directo a disponibilidad no preselecciona un profesional si la asignación/especialidad actual no lo hace elegible; la elegibilidad se contrasta con el catálogo entregado por la API.
