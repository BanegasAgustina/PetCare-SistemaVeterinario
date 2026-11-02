# Plan progresivo para estudiar el código de PetCare

Estudia en este orden. En cada etapa intenta explicar el flujo en voz alta sin leer la respuesta; después verifica los archivos y anota las dudas. La [guía archivo por archivo](GUIA_ARCHIVOS_PETCARE.md) sirve como índice y la [cobertura](COBERTURA_DOCUMENTACION_PETCARE.md) indica qué explicaciones funcionales faltan revisar.

## Etapa 1: orientación en el repositorio

**Leer:** `README.md`, `mobile/README.md`, `backend/README.md`, `docs/INVENTARIO_Y_ORDEN_DOCUMENTACION.md`, los dos `package.json`.

**Comprender:** qué paquetes ejecutan frontend/backend, tecnologías reales, scripts, carpetas y qué no debe inferirse de una variable o documento de auditoría.

**Preguntas:** ¿Qué función tiene cada carpeta raíz? ¿Qué comandos hay? ¿Cuáles podrían alterar la base?

## Etapa 2: puntos de entrada

**Leer:** `mobile/src/app/_layout.tsx`, `mobile/src/app/index.tsx`, `mobile/src/components/layout/EntryRedirect.tsx`, `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/routes/index.ts`.

**Comprender:** diferencia entre construir Express y abrir un listener, cómo Expo Router inicia, dónde se montan proveedores, cómo se seleccionan rutas y dónde está `/api`.

**Preguntas:** ¿Qué pasa antes de dibujar la pantalla inicial? ¿Cómo llega una solicitud a un router de dominio?

## Etapa 3: navegación por rol

**Leer:** `mobile/src/utils/role-home.ts`, `mobile/src/utils/navigation-tabs.ts`, `mobile/src/utils/admin-route-access.ts`, layouts bajo `mobile/src/app/client/`, `admin/`, `vet/` y `professional/`.

**Comprender:** rutas basadas en archivos, guardas de UI, diferencia entre rol/capacidad y autorización del servidor.

**Preguntas:** ¿Qué decide el layout? ¿Por qué una ruta oculta no reemplaza el control de backend?

## Etapa 4: componentes visuales

**Leer:** `mobile/src/components/ui/`, `components/forms/`, `components/layout/`; luego un componente de dominio, por ejemplo `components/client/PetEditor.tsx`.

**Comprender:** props, eventos, formularios reutilizables, estados vacíos/carga/error y selección de variantes web/native.

**Preguntas:** ¿Qué recibe el componente como props? ¿Quién conserva el estado? ¿Cómo informa un error?

## Etapa 5: contextos, hooks y estado

**Leer:** `mobile/src/contexts/AuthContext.tsx`, `FeedbackContext.tsx`, `ThemeContext.tsx`, `StoreCheckoutContext.tsx`; hooks `useAuth`, `useClient`, `useClientQuery`, `useAsyncAction`.

**Comprender:** proveedores, hooks consumidores, restauración de sesión, consultas asíncronas, actualización de pantalla y single-flight.

**Preguntas:** ¿Qué estado es global? ¿Cómo se evita repetir solicitudes? ¿Cómo expira la sesión?

## Etapa 6: validaciones y utilidades del cliente

**Leer:** `mobile/src/utils/auth-validation.ts`, `pet-date.ts`, `checkout-validation.ts`, `store-fulfillment-validation.ts`, `authorization.ts`, `profile-photo.ts`.

**Comprender:** reglas para feedback inmediato, normalización de datos y la diferencia entre validar en UI y proteger la API.

**Preguntas:** ¿Qué valida el formulario? ¿Qué debe volver a validar el backend?

## Etapa 7: servicios y HTTP

**Leer:** `mobile/src/services/api.ts`, `auth.service.ts`, `client.service.ts`, `clinic.service.ts`, `admin.service.ts`, `oauth.service.ts`, `oauth-flow.ts`, `verification.service.ts`, `session-store.ts`, `web-session-store.ts`, `notification-events.ts`, `notification-path.ts`, `invitation-paths.ts`.

**Comprender:** resolución de URL, método/body/headers, manejo de token y traducción de errores. Seguir llamadas de una pantalla a un método de servicio.

**Preguntas:** ¿Dónde se añade Bearer? ¿Qué payload envía el alta de mascota? ¿Qué API cambia por plataforma?

## Etapa 8: rutas, controladores y middleware

**Leer:** `backend/src/routes/index.ts`, `auth.routes.ts`, `client.routes.ts`, `clinic.routes.ts`; después `controllers/` y `middlewares/`.

**Comprender:** método y URL, orden de middleware, `RequestHandler`, uso de `next(error)`, autenticación, rol, permiso y alcance.

**Preguntas:** ¿Qué ruta recibe el request? ¿Qué middleware se ejecuta primero? ¿Cómo llega el usuario autenticado al controlador?

## Etapa 9: validación y servicios backend

**Leer:** `backend/src/validators/auth.validator.ts`, `client.validator.ts`, `store-checkout.validator.ts`; `src/utils/admin-authorization.ts`, `pet-lifecycle.ts`, `clinic-rules.ts`, `store-order-transitions.ts`, `personal-access.ts`; `services/auth.service.ts`, `client.service.ts`, `clinic.service.ts`.

**Comprender:** convertir `unknown`, reglas de negocio, errores `AppError`, políticas no delegadas al frontend e integraciones.

**Preguntas:** ¿Qué valida `petInput`? ¿Qué diferencia una validación HTTP de una regla de negocio?

## Etapa 10: repositorios, SQL y transacciones

**Leer:** `backend/src/config/database.ts`, `repositories/user.repository.ts`, `client.repository.ts`, `clinic.repository.ts`; después el repository del proceso de interés.

**Comprender:** pool, placeholders, filtros por owner, `beginTransaction/commit/rollback`, bloqueo de filas y conversión de IDs/fechas.

**Preguntas:** ¿Qué datos devuelve el repository? ¿Cómo se impide guardar una mascota bajo otro owner? ¿Qué evita una transacción?

## Etapa 11: autenticación y autorización

**Leer:** `backend/src/services/token.service.ts`, `session.service.ts`, `session.repository.ts`, `authorization.repository.ts`, `auth.middleware.ts`, `permission.middleware.ts`; contraparte móvil en `AuthContext.tsx`.

**Comprender:** login, registro y verificación, access/refresh, revocación, roles, grants, ownership y revisiones del servidor.

**Preguntas:** ¿Qué vuelve a consultar el servidor después de verificar JWT? ¿Cómo se revoca sesión? ¿Qué hacen requirePermission y requireAnyPermission?

## Etapa 12: recorridos funcionales completos

**Leer y trazar:** alta de mascota (`PetEditor` → `client.service` → `client.routes` → controller → service → repository); solicitud de turno (`request.tsx` → slots → creación); luego login, fichas clínicas, invitaciones, productos/pedidos, comprobantes y notificaciones.

**Comprender:** punto de inicio UI, datos del request, validación, ruta, ownership, SQL, respuesta y actualización visual. No asumir integraciones que no estén implementadas.

**Preguntas:** ¿Qué datos atraviesan cada capa? ¿Qué sucede si el slot deja de estar disponible? ¿Cómo se recupera la interfaz?

## Etapa 13: operaciones, web y Android

**Leer:** `mobile/app.json`, `mobile/eas.json`, `mobile/vercel.json`, `backend/vercel.json`, `backend/src/config/env.ts`, README de cada paquete; herramientas de `backend/src/database/` solo en lectura.

**Comprender:** configuración de Expo y scheme, exportación web, perfiles EAS, variables del backend, migraciones explícitas y diferencias de almacenamiento/OAuth por plataforma.

**Preguntas:** ¿Qué cambia si se añade un plugin nativo? ¿Qué configura Vercel? ¿Qué no prueba un build exitoso?

## Método de repaso

1. Elige un flujo y dibújalo con flechas desde la pantalla hasta la tabla/repositorio y de vuelta.
2. Señala las validaciones en ambas plataformas y explica por qué no son redundantes.
3. Explica ownership, rol y permiso con un endpoint real.
4. Practica la presentación breve y responde preguntas de [GUIA_DEFENSA_ORAL_PETCARE.md](GUIA_DEFENSA_ORAL_PETCARE.md).
5. Antes de afirmar cobertura total, revisa que la fila de cada archivo elegible pase a **Completo** y tenga sus funciones justificadas en comentarios.






## Etapa 14: servicios de dominio backend

**Leer:** `backend/src/services/client.service.ts`, `clinic.service.ts`, `auth.service.ts`, `session.service.ts`, `oauth.service.ts`, `invitation.service.ts`, `password-reset.service.ts`, `verification.service.ts`, `notifications.service.ts` y `pet-photo.service.ts`.

**Trazar:** petición HTTP → ruta/controlador → servicio → repository o integración → resultado/errores. Contrastar ownership y permisos en las operaciones cliente/clínica; seguir alta/login hasta emisión de sesión; recorrer una notificación desde turno confirmado hasta email.

**Preguntas:** ¿Qué valida cada capa? ¿Qué fuente determina permisos actuales? ¿Qué protege el lease del job? ¿Qué datos guarda la base para una invitación sin guardar el token?


## Etapa 15: repositories, SQL y ownership

**Leer:** `backend/src/repositories/user.repository.ts`, `authorization.repository.ts`, `client.repository.ts`, `clinic.repository.ts`, `store-checkout.repository.ts`, `store-orders.repository.ts` y `session.repository.ts`.

**Trazar:** SELECT por propietario, actualización bajo `FOR UPDATE`, transacción de checkout y rotación de refresh. Contrastar llamadas desde services y validar dónde se deriva la identidad del actor.

**Preguntas:** ¿Qué campos se omiten en `publicUser`? ¿Por qué se vuelve a leer el precio? ¿Qué operaciones requieren transacción? ¿Qué se guarda del refresh token?


## Etapa 16: migraciones y herramientas de datos

**Leer:** `backend/src/database/cli.ts`, `migration-files.ts`, `migration-runner.ts`, `bootstrap.ts`, `seed-runner.ts`, `lock.ts`, `migration-preflight-readonly.ts` y `sql-audit-readonly.ts`.

**Distinguir:** lectura vs escritura, migración de esquema vs seed de catálogo, script operativo local vs endpoint HTTP. Revisar checksums, ledger, orden y rollback/comportamiento ante error.

**Preguntas:** ¿Qué evidencia ofrece un preflight? ¿Qué no demuestra una auditoría? ¿Cómo se evita ejecutar dos migraciones simultáneas?


## Etapa 17: rutas raíz e identidad móvil

**Leer:** `mobile/src/app/_layout.tsx`, `index.tsx`, `login.tsx`, `register.tsx`, `oauth.tsx`, `activate-account.tsx`, `reset-password.tsx` y `change-initial-password.tsx`.

**Trazar:** proveedor/contexto → formulario o callback → servicio HTTP → ruta/controlador/backend → cambio de sesión y navegación. Distinguir ruta Expo de regla de autorización.

**Preguntas:** ¿Dónde se confirma el código de email? ¿Qué protege el state OAuth? ¿Qué diferencia hay entre activación y recuperación?


## Etapa 18: rutas administrativas Expo

**Leer:** `mobile/src/app/admin/agenda.tsx`, `appointment.tsx`, `catalog/[kind].tsx`, `patients.tsx`, `professionals.tsx` y sus componentes reexportados.

**Trazar:** segmento de rol → pantalla compartida → hook/servicio → permiso del backend. Identificar qué archivos solo enrutan y cuáles contienen estado/formulario.

**Pregunta:** ¿Por qué una ruta visible en Expo no constituye autorización?


## Etapa 19: rutas profesionales y veterinarias

**Leer:** rutas `mobile/src/app/professional/` y `mobile/src/app/vet/`, junto con `components/clinic/AgendaScreen.tsx`, `PatientsScreen.tsx` y `StaffHome.tsx`.

**Comprender:** qué rutas son alias, qué parámetros seleccionan vistas y qué filtros/alcances se verifican en backend.

**Pregunta:** ¿Qué diferencia entre navegación por rol y autorización de datos?


## Etapa 20: layouts y guards por rol

**Leer:** layouts de `admin/`, `professional/` y `vet/`, además de `admin-route-access.ts` y los middlewares de backend.

**Comprender:** guards de navegación, grupos de Stack y autorización HTTP. Verificar qué permisos cambian rutas y cuáles vuelve a consultar el backend.

**Pregunta:** ¿Qué pasa si alguien invoca directamente un endpoint aunque no vea la ruta?


## Etapa 21: área cliente, turnos y notificaciones

**Leer:** layouts de cliente, `client/(tabs)/index.tsx`, `appointments.tsx`, `client/notifications.tsx` y `NotificationBridge`.

**Trazar:** consulta propia → servicio → backend; cancelación con motivo; evento notificación → bandeja y navegación. Revisar cómo persiste el contexto de checkout entre pestañas.

**Pregunta:** ¿Qué actualiza la pantalla después de una cancelación exitosa?


## Etapa 22: perfil cliente

**Leer:** rutas `client/profile/`, `AccountProfileScreen`, `ThemeContext` y servicios de cuenta. Distinguir preferencia local de persistencia remota de perfil/contraseña.


## Etapa 23: catálogo y compra

**Leer:** rutas `client/(tabs)/store/`, `StoreCheckoutContext`, validadores de checkout y repositories de storefront/checkout/orders.

**Trazar:** búsqueda → carrito → dirección/cotización → pedido → pago/fulfillment. Identificar qué valores calcula el cliente y cuáles vuelve a calcular el backend.

**Pregunta:** ¿Cómo se conserva el carrito si falla la creación del pedido?


## Etapa 24: ciclo de vida de mascotas

**Leer:** pestaña de mascotas, rutas `pets/`, `PetEditor`, `client.service.ts`, `client.repository.ts` y `pet-lifecycle.ts`. Seguir ownership, fotos e historial de activación/desactivación.
