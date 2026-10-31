# 4. Backend: servidor, rutas y capas

## Inicio y recepción de solicitudes

`backend/src/server.ts` importa `app`, escucha en `PORT` (por defecto local 3000), revisa reservas vencidas al arrancar y cada 30 segundos, y cierra pool/conexiones al recibir `SIGINT` o `SIGTERM`. En Vercel se exporta Express desde `app.ts`; no se debe asumir que el worker en memoria de `server.ts` corre como proceso persistente de cada función serverless.

`backend/src/app.ts` configura proxy trust, CORS, Helmet, límites y parseo de JSON. Casos de subida elevan el límite solo en rutas concretas y tras autenticar; comprobante PDF/imagen usa cuerpo raw de hasta 5 MB. Luego monta cron y `/api`; finalmente registra 404 y error middleware. `routes/index.ts` agrupa routers.

## Capas

| Capa | Función | Ejemplo |
|---|---|---|
| Route | método + camino + cadena middleware | `client.routes.ts` |
| Middleware | identidad, rol, permiso, límite, etc. | `authenticate`, `requirePermission` |
| Controller | traduce Request/Response y delega | `auth.controller.ts` |
| Validator | valida forma y normaliza entradas | `auth.validator.ts`, `client.validator.ts` |
| Service | reglas de negocio/orquestación | `auth.service.ts`, `invitation.service.ts` |
| Repository | consulta/escritura SQL | `user.repository.ts`, `clinic.repository.ts` |
| Config/util | dependencias, entorno y reglas comunes | `config/database.ts`, `utils/app-error.ts` |

El patrón no es absolutamente uniforme: algunas rutas administrativas invocan repositorio directamente desde el handler; los módulos más grandes pasan por controller y service. Por eso hay que seguir la ruta concreta en vez de asumir arquitectura ideal uniforme.

## Ejemplo de autorización

```ts
clientRouter.use(authenticate, requirePersonalAccess);
clientRouter.post('/pets', handle('create-pet', 201));
```

Primera línea: toda ruta de cliente pasa autenticación y acceso personal. Segunda: un POST crea mascota y devuelve 201 al handler. `authenticate` lee Bearer, verifica firma/expiración, encuentra cuenta activa, compara versión de sesión, comprueba verificación de correo y carga permisos desde MySQL. El handler/controller y servicio validan los datos; la consulta debe tomar owner desde el usuario autenticado, no de un `ownerId` libre enviado por móvil.

## Base y errores

`config/database.ts` crea `mysql2/promise` pool: UTF-8, fechas UTC, BIGINT como string, límite de conexiones según entorno y sentencias múltiples desactivadas. Los repositorios usan placeholders `?` para valores. El controlador devuelve `{success:true,data}`. Si una operación arroja `AppError`, `error.middleware.ts` transforma el fallo en respuesta pública; SQL y stack no deben filtrarse.

Funciones importantes: `loginUser` valida y autentica; `authenticate` crea el usuario confiable en `res.locals`; `requireRole` y `requirePermission` cortan antes de ejecutar; `clientHandler`/`clinicHandler` enrutan operaciones a servicios de dominio; `runDatabaseOperation` sanitiza errores SQL; `shutdown` limpia procesos. Para el detalle función por función, use capítulos 6–9 y busque símbolos en archivos, ya que este repositorio tiene cientos de helpers.

## Rutas actuales (resumen verificable)

- `/api/auth`: registro/login/refresh/logout/me, verificación, recuperación, contraseña inicial y OAuth.
- `/api/client`: hogar, mascotas, catálogo/solicitud/agenda de turnos, registros clínicos de consulta, tienda/carrito/pedidos/pagos, perfil y contraseña.
- `/api/clinic`: turnos de personal, pacientes y fichas clínicas, clientes, profesionales, horarios, banners, configuración de fulfillment y pedidos de tienda.
- `/api/admin`: usuarios, invitaciones, roles/permisos, productos y cuenta de administrador.
- `/api/admin/veterinarians`, `/api/admin/specialties`: profesionales y especialidades.
- `/api/notifications`: listar, marcar leída, leer todas, ocultar.
- `/api/cron/notifications`: proceso protegido por secreto Bearer.
- `/api/health`, `/api/health/database`, `/api/settings`, `/api/media`: estado, configuración pública y recursos.

Muchas lecturas privadas actuales son POST con filtros JSON; no se debe explicar que un endpoint GET existe sin mirar la tabla de rutas.

### Preguntas de defensa

- **Básica — ¿Qué es middleware?** Función entre petición y acción que puede verificar o modificar contexto. **Ejemplo:** autenticar antes de `/api/client`. **Corta:** “Es una puerta de control previa al controlador.” **Repregunta:** ¿Qué pasa si falla?
- **Intermedia — ¿Por qué separar controlador y repositorio?** Controlador conoce HTTP; repositorio conoce SQL. **Corta:** “Cada capa tiene una responsabilidad.” **Repregunta:** ¿Todo el backend lo sigue igual?
- **Avanzada — ¿Qué previene SQL parametrizado?** Que valores de usuario se interpreten como fragmentos SQL. **Corta:** “Los parámetros mantienen separados consulta y dato.” **Repregunta:** ¿Por qué no pasar IDs como texto en SQL interpolado?
