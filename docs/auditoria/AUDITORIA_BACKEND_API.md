# Auditoría backend y API

## Arquitectura

Node.js/TypeScript y Express 5. La estructura contiene configuración, rutas, controladores, servicios, repositorios, validadores, middlewares, utilidades y database runners. La app configura CORS explícito, Helmet, límite JSON general 100 KB, rutas con límite de carga ajustado tras autenticar, rutas de salud y middleware final de error/no-encontrado. El backend exporta Express para Vercel.

## REST y manejo de errores

La API usa rutas versionadas por dominio bajo `/api` y verbos HTTP apropiados para recursos; hay subrutas de acción (login, activar, cancelar, leer notificación, revisar pago) razonables. Los handlers devuelven envoltorio `{success,data}`; validadores rechazan body/IDs/campos inválidos; las consultas MySQL usan placeholders. `error.middleware.ts` serializa errores controlados y no expone SQL a clientes. `mobile/services/api.ts` centraliza cliente, timeout 12s, errores públicos y logs reducidos. No se observa política general de reintentos (segura para writes) ni cancelación explícita de cada navegación.

## Cobertura funcional de rutas

- Auth: registro, login, `/me`, email, recuperación/reset, password inicial, refresh/logout, OAuth start/callback/link/exchange.
- Cliente: mascotas, agenda, historia clínica de lectura, catálogo/productos, promociones, delivery, direcciones, carrito, pedidos, transferencia/comprobante, notificaciones, perfil.
- Clínica/admin: appointments, ficha de peluquería, pacientes, registros clínicos, clientes, reservas, profesionales, disponibilidad, catálogo, tienda, banners, pedidos y revisión de pagos.
- Superficie administrativa: usuarios, roles, permisos, productos y cuenta propia.
- Personal veterinario: perfil, panel y módulos. La lista exacta de rutas está en `backend/src/routes/`.

## Seguridad observada

- `authenticate` valida JWT y vuelve a cargar usuario/rol/permisos; rutas de clientes exigen rol CLIENT. Rutas administrativas exigen rol administrativo más permiso efectivo.
- Las operaciones clínicas vuelven a revisar el recurso/scope y algunas mutaciones revalidan permisos dentro de transacciones.
- Rate limit está presente en auth, fotos, comprobantes y algunos endpoints sensibles.
- Helmet y CORS están configurados. JSON/archivos tienen límites explícitos. No se vio evidencia de multer/archivo temporal público; carga usa body acotado y servicios de almacenamiento.
- `STORE_DEMO_MODE` es leído únicamente en backend para checkout demo; checkout no envía PAN/CVV. Transferencia real es un flujo manual que depende de migración, banco y storage privado.
- Rate limiter usa `express-rate-limit`; si no hay store distribuido, su cobertura entre instancias/serverless puede ser incompleta. Riesgo potencial, no explotación confirmada.
- Endpoints de salud de DB son públicos según rutas y deben limitar la información de versión/estado expuesta en ambientes públicos.

## CRUD y ciclo de vida

El sistema favorece desactivación/archivo para usuarios, mascotas, servicios, disponibilidad y productos; tiene historial de cambios de inventario/pedidos. No todas las entidades tienen DELETE físico, lo cual es apropiado para datos clínicos/pagos. Hallazgo: varios registros clínicos tienen creación/lectura, pero no se observa edición/archivo general; estudios/adjuntos clínicos dedicados no aparecen en rutas del checkout. Categorías y usuarios tienen ciclo controlado distinto por seguridad. Véase matriz.

## Documentación

README de backend contiene instalación, estructura, variables, contratos y explicaciones de endpoints relevantes; mobile README contiene OAuth/EAS. No se encontró OpenAPI/Swagger generado ni una tabla única de cada endpoint con cada body, response, permission y error. README incluye notas históricas, migraciones incompletas y configuraciones externas, por lo que requiere identificar siempre la sección vigente y evitar inferir runtime desde texto antiguo.

## Pruebas

Backend: typecheck, lint y `npm test` pasaron; 28 pruebas unitarias cubren permisos de peluquería, checkout, endpoints y storefront. No se ejecutaron `test:db` ni integration tests contra base; los unit tests no prueban permisos reales/grants del remoto, SQL contra MariaDB ni proveedores externos.

## Recomendaciones

1. Añadir OpenAPI y comprobar CI que rutas documentadas y rutas registradas permanezcan sincronizadas.
2. Completar tests de integración por dominio con DB temporal estrictamente `_test`; nunca ejecutar estos tests contra producción.
3. Revisar distribución de rate limiters en Vercel, respuestas de health y política de logs para tareas sensibles.
4. Documentar lifecycle por entidad, especialmente registros clínicos y estudios/archivos.
5. Actualizar README de SDK, versión RN y la secuencia de migraciones desde un estado de DB confirmado.
