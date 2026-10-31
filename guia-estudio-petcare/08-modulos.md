# 8. Módulos funcionales

Las pantallas están en `mobile/src/app`; los componentes visuales de dominios en `mobile/src/components`; funciones de acceso HTTP en `mobile/src/services`; el servidor agrupa rutas y lógica en `backend/src/routes`, `controllers`, `services`, `repositories` y `validators`.

| Módulo | Qué permite / actores | API y datos principales | Nota de implementación |
|---|---|---|---|
| Cuentas y perfiles | Registro cliente, activación de personal, perfil propio; admins administran cuentas | `/auth/*`, `/client/profile`, `/admin/users`, `/vet/profile`; `users`, roles/sesiones | Cambio de roles/grants exige backend y permisos efectivos |
| Mascotas | Cliente crea/edita/desactiva/reactiva; staff busca pacientes y consulta fichas | `/client/pets*`, `/clinic/patients*`; `pets`, relaciones profesionales | Desactivar se bloquea si hay turnos pendientes en utilidades/reglas |
| Turnos y agenda | Cliente selecciona servicio/slot; personal consulta, administra y cancela/actualiza según grants | `/client/appointments*`, `/clinic/appointments*`, `/clinic/slots`; turnos, slots, servicios | Reglas de solapamiento/estado están en repositorios/utilidades de clínica |
| Fichas clínicas | Cliente consulta registros permitidos; veterinario crea atención; peluquero guarda registro de grooming | `/client/clinical/:kind`, `/clinic/patients/:id/records/:kind*`, `/clinic/grooming/*` | No asumir todos los roles pueden crear nota médica |
| Servicios y profesionales | Admin crea/edita especialidades, profesionales, asigna servicios y tipos | `/admin/veterinarians`, `/admin/specialties`, `/clinic/professionals` | Identidad profesional enlazada a cuenta |
| Disponibilidad | Admin publica/desactiva/archiva slots/horarios; personal puede consultar con permiso | `/clinic/availability*`, `/clinic/slots` | `is_archived` conserva fila al ocultar horarios anteriores |
| Tienda | Cliente ve categorías/productos/banners/promos, carrito, dirección, fulfillment y pedidos | `/client/store/*`, `/client/cart`, `/client/orders*`; productos/órdenes/historial | Checkout de tarjeta demo no cobra; transferencia requiere comprobante y revisión |
| Imágenes | Cliente sube foto mascota/perfil; personal/admin gestiona fotos de producto/profesional | `/media`, `/client/pets`, endpoints admin/vet | Configuración soporta Cloudinary/S3; proveedor activo necesita confirmar entorno |
| Notificaciones | Usuarios permitidos consultan, leen y ocultan mensajes | `/api/notifications`, alias cliente | Almacenadas en centro interno; no push OS |
| Administración | usuarios, roles, permisos, productos, tienda, información general, agenda, clientes | `/api/admin`, `/api/clinic/admin` | La API limita por rol + grant; revisar función concreta para cada acción |
| OAuth/verificación | usuario verifica email o accede con proveedor | `/api/auth/verify-email`, `/oauth/*` | OAuth real depende de configuración externa |

## Procesos CRUD de ejemplo

**Mascota:** create `POST /api/client/pets`, lectura por `POST /pets/query` y detalle `POST /pets/:id`, update `PUT /pets/:id`, soft deactivate/reactivate con PATCH. El `ownerId` debe derivarse de sesión. **Servicio/catálogo:** las rutas administrativas genéricas `/clinic/admin/:kind` delegan a validadores/repositorios; distinguir catálogo clínico de producto de tienda. **Producto:** cliente lee `/client/store/products`; administración lee y modifica `/api/admin/products`; stock/precio puede tener permisos específicos. **Turno:** consulta slot disponible, crea; backend revalida capacidad y estado, cambios pasan transiciones explícitas. **Pedido:** carrito/checkout genera orden; tarjeta demo está apagada por defecto; transferencia crea intención y comprobante que no equivale a pago confirmado.

## Qué conviene demostrar ante el profesor

Elegí un flujo completo (mascota o turno), un flujo de privilegio (admin modifica profesional) y uno de error (slot tomado o falta permiso). Explicá función de pantalla, ruta y método, datos clave, validación, tabla y respuesta; enseguida indicá qué evita la regla de seguridad.

### Preguntas de defensa

- **Básica — ¿Qué módulos de cliente existen?** Mascotas, turnos, tienda/pedidos, perfil y notificaciones. **Corta:** “El cliente organiza el cuidado y servicios de sus mascotas.” **Repregunta:** ¿Qué datos son de su propiedad?
- **Intermedia — ¿Cómo se conecta agenda con servicio?** Slots refieren servicio y turno reserva slot. **Corta:** “El turno elige un horario ofrecido para un servicio.” **Repregunta:** ¿Qué pasa si el slot ya no está disponible?
- **Avanzada — ¿Un comprobante prueba el pago?** No; se almacena y requiere revisión por SUPER_ADMIN. **Corta:** “Subir comprobante inicia revisión, no confirma fondos.” **Repregunta:** ¿Quién cambia el estado final?
