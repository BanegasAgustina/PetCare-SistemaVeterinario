# Implementación Cliente de PetCare

El login común dirige el rol CLIENT a `/client`. La experiencia tiene cinco pestañas y rutas secundarias en Expo Router. Todo registro de negocio se obtiene del backend autenticado y MySQL; no se incluyeron registros de demostración.

## Pantallas, rutas y datos

Todos los endpoints de la tabla están bajo `/api/client`.

| Pantalla | Ruta | Datos reales y endpoints | Estado sin registros |
| --- | --- | --- | --- |
| Inicio | `/client` | `GET /home`: mascotas, próximo turno, destacados activos y cantidad de notificaciones sin leer; nombre desde AuthContext y `/auth/me` | No tenés próximos turnos; No tenés mascotas todavía; destacados se ocultan |
| Mis mascotas | `/client/pets` | `GET /pets`, especies/razas mediante JOIN | No tenés mascotas todavía |
| Ficha | `/client/pets/:id` | `GET /pets/:id`: nombre, especie, raza, nacimiento, microchip, peso y foto existentes | Recurso inexistente o ajeno: error seguro 404 |
| Agregar mascota | `/client/pets/new` | `GET /pets/catalog`, `POST /pets` | Sin especies: catálogo no configurado |
| Editar mascota | `/client/pets/:id/edit` | `GET /pets/:id`, `GET /pets/catalog`, `PUT /pets/:id` | Error seguro si no está autorizada |
| Desactivar mascota | ConfirmModal desde ficha | `PATCH /pets/:id/deactivate`; conserva registro, bloquea con turnos pendientes | No borra datos |
| Turnos | `/client/appointments` | `GET /appointments`; próximos/anteriores determinados en backend | No tenés próximos turnos / No tenés turnos anteriores |
| Solicitar turno | `/client/appointments/request` | `GET /pets`, `GET /appointments/catalog`, `GET /appointments/slots`, `POST /appointments` | Sin mascotas, servicios activos u horarios: estados propios |
| Historial | `/client/medical-history?petId=…` | `GET /clinical/medical-history`, filtro mascota | Todavía no hay registros médicos |
| Vacunas | `/client/vaccines?petId=…` | `GET /clinical/vaccines`, próxima fecha solamente si existe | No hay vacunas registradas |
| Recetas | `/client/prescriptions?petId=…` | `GET /clinical/prescriptions`, solo lectura | No hay recetas disponibles |
| Recomendaciones | `/client/recommendations?petId=…` | `GET /clinical/recommendations`, filtro mascota | No hay recomendaciones por el momento |
| Tienda | `/client/store` | `GET /store/categories`, `GET /store/products?search=…&categoryId=…`; precio/promoción activa/stock de MySQL | No hay productos disponibles |
| Producto | `/client/store/:id` | `GET /store/products/:id`, añadir mediante carrito backend | Error 404 o Sin stock |
| Carrito | `/client/cart` | `GET /cart`, `PUT /cart/:id`; subtotales y total calculados por backend | Tu carrito está vacío |
| Mis pedidos | `/client/orders` | `GET /orders`; creación mediante `POST /orders` | Todavía no realizaste pedidos |
| Detalle de pedido | `/client/orders/:id` | `GET /orders/:id`; snapshot de nombre, cantidad y precio al comprar | Error seguro 404 para pedido ajeno/inexistente |
| Notificaciones | `/client/notifications` | `GET /notifications`, `PATCH /notifications/:id/read` | Estás al día |
| Mi perfil | `/client/profile` | AuthContext y `/auth/me`: nombre, email y teléfono | Sin teléfono registrado cuando es null |
| Mis datos | `/client/profile/edit` | `PATCH /profile`, luego `/auth/me` | Validación inline |
| Seguridad | `/client/profile/security` | `PUT /profile/password`: verifica contraseña actual, cambia hash, revoca sesiones | Errores inline; sin IDs/roles/permisos |
| Apariencia | `/client/profile/appearance` | ThemeContext: sistema, claro u oscuro | Preferencia temporal como en el contexto original |

Las cinco rutas de pestañas están en `mobile/src/app/client/(tabs)`. Las demás están en el Stack de Cliente. La raíz protege todo el Stack por rol; el backend aplica `authenticate` y `requireRole('CLIENT')` a todos los endpoints Cliente.

## Componentes y reutilización

- `PetCareUI`: Screen con Safe Area/teclado/scroll, Header, Card, Section, Badge, IconButton, EmptyState, Action, QueryState y placeholder gráfico genérico. Logo existente con contraste por tema, huella decorativa al 5%, sin emojis.
- `RecordCards`: PetCard, AppointmentCard, MedicalRecordCard, VaccineCard, PrescriptionCard, RecommendationCard, ProductCard y OrderCard. Las tarjetas clínicas comparten estructura porque tienen el mismo contrato de registro.
- `PetEditor` y `ClinicalScreen` comparten formularios y selección de mascotas.
- Se reutilizan AppText, AppButton, AppInput, SelectionRow, LoadingIndicator, FormNotice, ConfirmModal/AppModal y `useFeedback().showToast`; no hay modales/toasts paralelos.
- `client.service` centraliza llamadas mediante `AuthContext.request`; `useClientQuery` separa loading/error/empty/data y reconsulta al volver.

## Backend y persistencia

Se añadieron repository, service, controller, routes y validator de Cliente. Se reutilizan MySQL pool, JWT, middleware de autenticación, barrera de rol, validaciones de identidad/contraseña y errores seguros. Auth conserva sus endpoints y contratos. Los services no envían IDs libres de usuario.

El esquema real fue leído mediante `information_schema`: ya existían users/pets/species/breeds/veterinarians/specialties, pero no turnos, clínica ni comercio. La migración aditiva `backend/client-migrations/001_client_experience.sql` añade:

- `client_pet_details` (foto/peso, sin ALTER de pets).
- `client_services`, `client_appointment_slots`, `client_appointments`.
- `client_clinical_records`: tipo, mascota, profesional, título, contenido, fecha y próxima fecha opcional.
- `client_product_categories`, `client_products`, `client_promotions`.
- `client_cart_items`, `client_orders`, `client_order_items`, `client_notifications`.

La migración ya fue aplicada a MySQL configurado. Usa `client_schema_migrations` con checksum y lock compartido: las migraciones originales aplicadas no existen en este checkout; no se fabricó ni alteró su historial. Son 12 tablas funcionales nuevas y una tabla de historial. No se borraron tablas/datos ni se recreó la base.

En otro entorno con el esquema original existente: `npm run db:migrate:client` desde backend. Si necesita el catálogo estructural previo: `npm run db:seed:client:reference`.

La base real tenía cero especies. Se cargó exclusivamente DOG/CAT (Perro/Gato) de `seeds/001_reference_catalogs.json`, necesario para `pets.species_id`. No se agregó un catálogo nuevo. No se crearon usuarios, mascotas, veterinarios, turnos, productos, pedidos, notificaciones ni registros clínicos de demostración. El cargador es manual, transaccional e idempotente y no cambia etiquetas existentes. MySQL real es 9.7.2; se corrigió el guard de compatibilidad para aceptar MySQL 8.0.16+ y la rama 9, preservando el rechazo de MariaDB y versiones sin CHECK efectivo.

## Reglas funcionales

- Mascotas: ownership en lectura, edición y desactivación. La raza debe pertenecer a la especie. Foto opcional mediante URL HTTPS real; ausencia/error usa una huella.
- Turnos: slots activos de MySQL para servicio/profesional activos. La reserva bloquea mascota y slot; UNIQUE evita reservar el mismo slot dos veces. No se genera disponibilidad artificialmente.
- Clínica: JOIN con la mascota perteneciente al JWT. Cliente no tiene rutas de escritura clínica.
- Carrito: persistido por usuario en MySQL; cantidades 0–99, máximo 100 productos distintos. Cero elimina la línea. No recibe precios desde frontend.
- Pedido: locks, promoción vigente, verificación de activo/stock, snapshot y total, descuento de stock y vaciado de carrito en una transacción. Clave de idempotencia evita duplicados.
- No hay pasarela ni cobro simulado: se registra un pedido real para gestión de la clínica.
- Notificaciones: solo registros asociados al JWT; no se generan avisos ficticios.
- Perfil: email verificado de solo lectura; edición de nombre/apellido/teléfono. Cambiar contraseña incrementa session_version y cierra sesiones. SecureStore/login/registro/verificación se conservan. No había refresh token implementado; no se inventó uno.

## Archivos modificados

- `mobile/src/app/_layout.tsx`, `mobile/src/app/account.tsx`, `mobile/src/utils/role-home.ts`, `mobile/src/services/api.ts`, `mobile/tests/role-home.test.ts`.
- `backend/src/routes/index.ts`, `backend/package.json`, `backend/src/database/seed-runner.ts` (exporta validador de catálogos).
- `backend/src/services/database.service.ts` para la versión real MySQL 9.7; `mobile/src/components/ui/SelectionRow.tsx` usa iconos instalados.
- README raíz/mobile/backend e informe histórico previo para enlazar la implementación actual.

## Archivos creados

- 23 archivos de rutas/layout Cliente en `mobile/src/app/client` (21 pantallas y 2 layouts).
- `mobile/src/components/client/PetCareUI.tsx`, `RecordCards.tsx`, `PetEditor.tsx`, `ClinicalScreen.tsx`.
- `mobile/src/types/client.ts`, `mobile/src/services/client.service.ts`, `mobile/src/hooks/useClient.ts`, `mobile/src/hooks/useClientQuery.ts`, `mobile/tests/client.test.ts`.
- `backend/src/repositories/client.repository.ts`, `backend/src/services/client.service.ts`, `backend/src/controllers/client.controller.ts`, `backend/src/routes/client.routes.ts`, `backend/src/validators/client.validator.ts`.
- `backend/client-migrations/001_client_experience.sql`, `backend/src/database/client-migrate.ts`, `backend/src/database/client-reference-seed.ts`.
- `backend/tests/client.test.ts`, `backend/tests/client-transactions.test.ts`, `backend/tests/client-readonly.ts`.
- `mobile/layout-review/client-qa.cjs` y capturas en `mobile/layout-review/client`; este documento.

## Pruebas manuales en Expo Go

La revisión visual automatizada completó 40 combinaciones (5 pestañas × 4 tamaños × 2 temas) sin scroll horizontal ni errores JS. Tamaños: 360×640, 360×800, 390×844 y 412×915. Se revisaron capturas y navegación hacia clínica, alta de mascota, solicitud de turno, carrito, pedidos y notificaciones. Evidencia: `mobile/layout-review/client/results.json` y PNGs en ese directorio.

La sesión web de QA se preparó en memoria mediante un JWT válido de un CLIENT real existente: `/me` y todos los datos de negocio se consultaron a la API/MySQL reales. No prueba la contraseña real de login ni agrega un bypass al código de producción. No había mascotas/productos/pedidos para inspeccionar sus fichas con contenido real; sus contratos, errores de acceso y lógica transaccional se verifican en tests, y los recorridos con registros reales requieren prueba manual. No se insertaron fixtures en la base configurada.

TypeScript y lint: correctos en mobile/backend. Tests unitarios: 8 mobile y 21 backend, incluidos stock/precios/rollback/idempotencia/ownership y compatibilidad MySQL 9.7. Auditoría de producción: sin Alert.alert, alert(), window.alert ni arrays de datos de demostración. Los fixtures se limitan a tests automatizados.

Integración `npm run test:client:readonly`: 14 endpoints de lectura correctos contra MySQL real, readiness 200, acceso sin JWT 401 y recursos inexistentes/ajenos 404. Las comprobaciones con otra identidad existente se ejecutan únicamente cuando hay cuentas/mascotas que permitan ese caso. No modifica datos de negocio.

Exportación Expo Android/iOS correcta: bundles Hermes generados con las rutas Cliente e imports reales. Los artefactos son de verificación local, no un build instalado ni un despliegue; se guardaron fuera del repositorio en el directorio de visualizaciones de esta conversación.

Preview local de revisión: web en `http://localhost:8087`, API actualizada en puerto 3097. Este preview usa configuración de entorno del proceso; no se modificaron archivos `.env` ni se publicó una versión remota.

1. Iniciar API actualizada y configurar `EXPO_PUBLIC_API_URL` con dirección alcanzable desde el teléfono (Railway publicado o IP LAN; localhost apunta al celular). Iniciar Expo e ingresar con un CLIENT real verificado.
2. Comprobar cinco pestañas/saludo. Ir desde Inicio a las cuatro secciones clínicas y volver.
3. Crear una mascota real, abrir ficha, editar y verificar que otra cuenta no la ve. Probar desactivación sin turnos pendientes.
4. Solicitar slot real cuando haya servicios/slots registrados. Ver próximos/anteriores. Sin horarios, debe aparecer vacío.
5. Consultar clínica real por mascota, sin posibilidad de editarla.
6. Con productos reales activos: buscar/filtrar, detalle, carrito, cantidades/eliminar, confirmar y detalle de pedido. Verificar stock/precios y reintento sin duplicado.
7. Marcar notificación real como leída. Editar perfil/cambiar contraseña y volver a ingresar.
8. Probar ambos temas, teclado, botón atrás y Safe Area en Android/iOS. Web no sustituye Expo Go.

## Límites explícitos

No se publica automáticamente backend en Railway ni se crea build nativo. Servicios, slots, productos, promociones, clínica y notificaciones requieren datos reales registrados por la clínica. No se añadió gestión veterinaria/administrativa futura para producirlos. No hay carga de fotos desde cámara/galería ni cobros online: foto HTTPS y registro de pedido son los flujos implementados.

Las migraciones originales ausentes requieren recuperación para preparar una base original completamente nueva. El esquema existente y las migraciones Cliente aditivas sí están operativos en la base configurada.
