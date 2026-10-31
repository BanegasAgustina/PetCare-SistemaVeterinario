# 11. Recorridos completos de funcionalidades

Los diagramas siguientes usan estructura verificada; varias pantallas reutilizan servicios/handlers y validadores. Cuando no hay una operación en el código, se marca pendiente en lugar de inventarla.

## Login y registro

**Login:** persona → `app/login.tsx` → `AuthContext.signIn` → `auth.service.login` → `POST /auth/login` → rate limiter → controller → `loginUser` valida, busca y compara bcrypt → `sessionForUser` crea access/refresh → frontend llama `/auth/me`, guarda sesión en SecureStore o sessionStorage → layout decide destino. Errores comunes: 401 credenciales, 403 correo no verificado/cambio inicial requerido, 503 configuración auth.

**Registro:** persona → `app/register.tsx` → acción contexto → `/auth/register` → validador de registro (sin aceptar role desde cliente) → correo duplicado → hash bcrypt → crea usuario CLIENT aún no verificado → crea desafío de verificación/envía correo → frontend muestra código. No hay sesión antes de verificar.

## Invitación y activación

Admin → pantalla de usuario/profesional → servicio HTTP protegido → ruta de creación/reenvío → backend valida permisos/rol → persiste cuenta/invitación hash+vencimiento → SMTP → respuesta `delivery`. Destinatario abre URL → `activate-account.tsx` o `activate-vet.tsx` → `POST /auth/invitations/accept` → hash de password + validación transaccional del token → activa/consume → pantalla confirma y la persona inicia sesión. El endpoint de aceptar está en `invitationRouter`; se monta bajo alias `/api/auth/invitations` y `/api/auth/veterinarian-invitations`.

## Mascota

Cliente → `client/(tabs)/pets.tsx`/`client/pets/new.tsx` → `useClient`/`client.service` create → `POST /api/client/pets` → autenticación + permiso personal → validación campos/foto → servicio/repositorio → INSERT ligado al ID autenticado → respuesta 201 con dato → lista actualizada. Edición: `PUT /pets/:id`; desactivar/reactivar: PATCH. Solicitudes de imagen tienen límite y controles extra. Owner nunca debe derivarse de un campo manipulable del frontend.

## Turno

Cliente → `client/(tabs)/appointments.tsx` o `client/appointments/request.tsx` → carga catálogo y slots vía POST → elige mascota/slot → `POST /api/client/appointments` → autentica, valida propiedad de mascota, validez/estado de slot y reglas de reserva → transacción/repositorio crea estado `REQUESTED` o `CONFIRMED` según regla → respuesta → UI refresca agenda. Profesional/admin usa `/clinic/appointments` con permiso para consultar/actualizar. Cliente cancela por `PATCH /appointments/:id/cancel`; backend valida propietario/estado/razón y registra transición. No asumir que creación siempre confirma automáticamente: respuesta admite ambos estados.

## Servicio, producto e imagen

Servicios clínicos y disponibilidad se administran por rutas de clínica; rutas genéricas `/clinic/admin/:kind` se resuelven en `clinic.controller.ts` y validaciones por tipo. Productos de tienda son distintos: cliente lee `/client/store/products`; admin modifica `/api/admin/products/:id`, con permisos de producto/precio/stock. Enviar imagen: elegir/comprimir → `photoBase64` o body tipo permitido → limiter y middleware de tamaño → servicio de storage Cloudinary/S3 compatible según configuración → guardar referencia SQL → limpiar foto previa solo tras éxito. Proveedor real activo no verificable aquí.

## Notificación

Un evento de backend crea fila inbox y, cuando corresponde, fila de correo. `POST /api/notifications` lista; PATCH `/read-all` o `/:id/read` guarda lectura; DELETE oculta. Cron separado crea recordatorios y entrega correos. No equivale a push.

## Cambio de rol/permisos y baja

Admin → `admin/permissions.ts`, `roles.ts` o `users/[id].tsx` → admin service → ruta `/api/admin/users/:id/permissions` o `/roles` → authenticate + rol + grants requeridos → repo valida IDs/roles/alcances → actualiza persistencia → próxima llamada protected vuelve a cargar grants. Cambio de roles de sistema está restringido.

Baja: SUPER_ADMIN → DELETE `/api/admin/users/:id` → `users.manage` + controles que impiden baja propia y último superadmin activo/verificado → desactiva y audita, aumenta session_version → llamadas futuras rechazadas. No borra usuario físicamente.

## Tienda y cobro

Carrito → checkout → backend vuelve a validar cantidades, stock, fulfillment e idempotency key. Modo tarjeta `CARD_DEMO` es de demostración y no cobra; está desactivado por defecto. Transferencia crea pedido/intención y acepta comprobante (máx 5MB formatos PDF/JPEG/PNG/WebP); revisión de pago requiere SUPER_ADMIN. Captura enviada no es confirmación bancaria.

### Preguntas de defensa

- **Básica — ¿Qué hace frontend tras una respuesta?** Actualiza estado/lista o muestra error. **Ejemplo:** lista de mascotas tras creación. **Corta:** “El servicio retorna dato y la pantalla lo presenta.” **Repregunta:** ¿Qué valida servidor?
- **Intermedia — ¿Cómo previene doble alta en checkout?** `requestKey`/idempotencia y validaciones de pedido, con reglas de stock. **Corta:** “El servidor vuelve a controlar operación y transición.” **Repregunta:** ¿Qué pasa si se repite solicitud?
- **Avanzada — ¿Qué ocurre con cambio de permisos?** Backend actualiza persistencia y los siguientes requests recargan grants. **Corta:** “Los permisos no dependen de claims viejos de interfaz.” **Repregunta:** ¿Qué ocurre con sesión ya abierta?
