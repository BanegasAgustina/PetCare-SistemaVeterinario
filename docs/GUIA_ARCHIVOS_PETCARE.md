# Guía archivo por archivo de PetCare

Esta guía se genera desde los archivos fuente presentes y sus cabeceras. Las conexiones enumeradas corresponden a imports estáticos locales; la navegación por convención, callbacks, llamadas dinámicas y flujo de datos requieren confirmarse en cada implementación. Las funciones que todavía están en revisión se señalan en la tabla de cobertura.

## backend/eslint.config.mjs

### eslint.config.mjs

**Nombre y ruta:** backend/eslint.config.mjs

**Función:** Configuración y herramientas del backend.

**Contenido:** Configuración y herramientas del backend dentro de PetCare; agrupa las declaraciones de eslint.config.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

## backend/src

### app.ts

**Nombre y ruta:** backend/src/app.ts

**Función:** Código fuente del proyecto.

**Contenido:** Configurar confianza en proxy, CORS, cabeceras de seguridad, lectura de cuerpos, rutas especiales de carga y montaje general de /api. Exportaciones identificadas: app.

**Dependencias:** No se identificaron dependencias en la cabecera.

**Conexiones:** Sin conexiones estáticas locales detectadas.

**Ejemplo práctico:** Consulta la lógica concreta del archivo antes de atribuirle un flujo.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### database.ts

**Nombre y ruta:** backend/src/config/database.ts

**Función:** Configuración de infraestructura del backend.

**Contenido:** Configuración de infraestructura del backend dentro de PetCare; agrupa las declaraciones de database. Exportaciones identificadas: databaseOptions, databasePool.

**Dependencias:** Importa: backend/src/config/env.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts y 49 más

**Conexiones:** Importa: backend/src/config/env.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts y 49 más

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### env.ts

**Nombre y ruta:** backend/src/config/env.ts

**Función:** Configuración de infraestructura del backend.

**Contenido:** Configuración de infraestructura del backend dentro de PetCare; agrupa las declaraciones de env. Exportaciones identificadas: isVercelRuntime, env, getJwtConfiguration.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts, backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/config/oauth.ts, backend/src/config/public-frontend.ts, backend/src/database/clinic-reconcile.ts, backend/src/database/create-database.ts, backend/src/database/lock.ts y 11 más

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts, backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/config/oauth.ts, backend/src/config/public-frontend.ts, backend/src/database/clinic-reconcile.ts, backend/src/database/create-database.ts, backend/src/database/lock.ts y 11 más

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### mail.ts

**Nombre y ruta:** backend/src/config/mail.ts

**Función:** Configuración de infraestructura del backend.

**Contenido:** Configuración de infraestructura del backend dentro de PetCare; agrupa las declaraciones de mail. Exportaciones identificadas: getMailConfiguration, getVerificationSecret.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/notification.repository.ts, backend/src/services/auth.service.ts, backend/src/services/invitation.service.ts, backend/src/services/mail.service.ts, backend/src/services/oauth.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/notification.repository.ts, backend/src/services/auth.service.ts, backend/src/services/invitation.service.ts, backend/src/services/mail.service.ts, backend/src/services/oauth.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth.ts

**Nombre y ruta:** backend/src/config/oauth.ts

**Función:** Configuración de infraestructura del backend.

**Contenido:** Configuración de infraestructura del backend dentro de PetCare; agrupa las declaraciones de oauth. Exportaciones identificadas: providers, OAuthProvider, oauthProvider, backendOrigin, oauthConfig, oauthConfigured, oauthConfigurationIssue, oauthReturnUrl.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/database/oauth-callbacks.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/oauth-provider.service.ts, backend/src/services/oauth.service.ts

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/database/oauth-callbacks.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/oauth-provider.service.ts, backend/src/services/oauth.service.ts

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### public-frontend.ts

**Nombre y ruta:** backend/src/config/public-frontend.ts

**Función:** Configuración de infraestructura del backend.

**Contenido:** Configuración de infraestructura del backend dentro de PetCare; agrupa las declaraciones de public-frontend. Exportaciones identificadas: publicFrontendUrl.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/utils/public-frontend-url.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/password-reset.service.ts

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/utils/public-frontend-url.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/password-reset.service.ts

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.controller.ts

**Nombre y ruta:** backend/src/controllers/auth.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de auth.controller. Exportaciones identificadas: register, login, getCurrentUser, requestPasswordReset, resetPassword, changeInitialPassword.

**Dependencias:** Importa: backend/src/services/auth.service.ts, backend/src/types/auth.ts, backend/src/utils/register-diagnostics.ts, backend/src/services/password-reset.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Conexiones:** Importa: backend/src/services/auth.service.ts, backend/src/types/auth.ts, backend/src/utils/register-diagnostics.ts, backend/src/services/password-reset.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### client.controller.ts

**Nombre y ruta:** backend/src/controllers/client.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de client.controller. Exportaciones identificadas: createClientHandler, clientHandler.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/notification.routes.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/notification.routes.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic.controller.ts

**Nombre y ruta:** backend/src/controllers/clinic.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de clinic.controller. Exportaciones identificadas: clinicHandler.

**Dependencias:** Importa: backend/src/services/clinic.service.ts, backend/src/services/pet-photo.service.ts, backend/src/types/auth.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/routes/clinic.routes.ts

**Conexiones:** Importa: backend/src/services/clinic.service.ts, backend/src/services/pet-photo.service.ts, backend/src/types/auth.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/routes/clinic.routes.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### database-health.controller.ts

**Nombre y ruta:** backend/src/controllers/database-health.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de database-health.controller. Exportaciones identificadas: createDatabaseHealthHandler.

**Dependencias:** Importa: backend/src/services/database.service.ts, backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/services/database.service.ts, backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### health.controller.ts

**Nombre y ruta:** backend/src/controllers/health.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de health.controller. Exportaciones identificadas: getHealth.

**Dependencias:** Importa: backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/types/api.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth.controller.ts

**Nombre y ruta:** backend/src/controllers/oauth.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de oauth.controller. Exportaciones identificadas: start, providerAvailability, link, callback, exchange, registerOAuth, refresh, logout.

**Dependencias:** Importa: backend/src/config/oauth.ts, backend/src/services/oauth.service.ts, backend/src/services/session.service.ts, backend/src/repositories/session.repository.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Conexiones:** Importa: backend/src/config/oauth.ts, backend/src/services/oauth.service.ts, backend/src/services/session.service.ts, backend/src/repositories/session.repository.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.controller.ts

**Nombre y ruta:** backend/src/controllers/verification.controller.ts

**Función:** Adaptación de solicitudes HTTP a operaciones del backend.

**Contenido:** Adaptación de solicitudes HTTP a operaciones del backend dentro de PetCare; agrupa las declaraciones de verification.controller. Exportaciones identificadas: verify, resend.

**Dependencias:** Importa: backend/src/services/verification.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Conexiones:** Importa: backend/src/services/verification.service.ts Se utiliza desde: backend/src/routes/auth.routes.ts

**Ejemplo práctico:** Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### appointment-details-migrate.ts

**Nombre y ruta:** backend/src/database/appointment-details-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de appointment-details-migrate. Exportaciones identificadas: migrateAppointmentDetails.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: backend/src/database/clinic-schema-migrate.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: backend/src/database/clinic-schema-migrate.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth-migrate.ts

**Nombre y ruta:** backend/src/database/auth-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de auth-migrate. Exportaciones identificadas: migrateAuth.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/migration-files.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/migration-files.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### availability-archive-migrate.ts

**Nombre y ruta:** backend/src/database/availability-archive-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de availability-archive-migrate. Exportaciones identificadas: migrateAvailabilityArchive.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### bootstrap.ts

**Nombre y ruta:** backend/src/database/bootstrap.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de bootstrap. Exportaciones identificadas: bootstrapDatabase.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/database/migration-files.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/database/migration-files.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### cli.ts

**Nombre y ruta:** backend/src/database/cli.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de cli.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client-migrate.ts

**Nombre y ruta:** backend/src/database/client-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de client-migrate.

**Dependencias:** Importa: backend/src/database/migration-files.ts, backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/database/migration-files.ts, backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client-reference-seed.ts

**Nombre y ruta:** backend/src/database/client-reference-seed.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de client-reference-seed.

**Dependencias:** Importa: backend/src/database/seed-runner.ts, backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/database/seed-runner.ts, backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-migrate.ts

**Nombre y ruta:** backend/src/database/clinic-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de clinic-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-reconcile.ts

**Nombre y ruta:** backend/src/database/clinic-reconcile.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de clinic-reconcile. Exportaciones identificadas: RECONCILIATION_VERSION, HISTORICAL_VERSION, IndexSpec, ReconcilePlan, decideLedgerAction, planIndexReconciliation, reconcileClinic.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/env.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/env.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-schema-migrate.ts

**Nombre y ruta:** backend/src/database/clinic-schema-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de clinic-schema-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/appointment-details-migrate.ts, backend/src/database/reservation-reason-migrate.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/appointment-details-migrate.ts, backend/src/database/reservation-reason-migrate.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### create-database.ts

**Nombre y ruta:** backend/src/database/create-database.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de create-database. Exportaciones identificadas: createDatabase.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/env.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/cli.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/env.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/cli.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### create-super-admin.ts

**Nombre y ruta:** backend/src/database/create-super-admin.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de create-super-admin.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/utils/app-error.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/utils/app-error.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### employee-password-migrate.ts

**Nombre y ruta:** backend/src/database/employee-password-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de employee-password-migrate. Exportaciones identificadas: migrateEmployeePassword.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### lock.ts

**Nombre y ruta:** backend/src/database/lock.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de lock. Exportaciones identificadas: withDatabaseLock.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts, backend/src/database/clinic-reconcile.ts y 18 más

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts, backend/src/database/clinic-reconcile.ts y 18 más

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### migration-files.ts

**Nombre y ruta:** backend/src/database/migration-files.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de migration-files. Exportaciones identificadas: migrationsDirectory, MigrationFile, MigrationRecord, readMigrationFiles, verifyMigrationHistory.

**Dependencias:** Importa: backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/auth-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/client-migrate.ts, backend/src/database/migration-preflight-readonly.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts

**Conexiones:** Importa: backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/auth-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/client-migrate.ts, backend/src/database/migration-preflight-readonly.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### migration-preflight-readonly.ts

**Nombre y ruta:** backend/src/database/migration-preflight-readonly.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de migration-preflight-readonly.

**Dependencias:** Importa: backend/src/database/migration-files.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/database/migration-files.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### migration-runner.ts

**Nombre y ruta:** backend/src/database/migration-runner.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de migration-runner. Exportaciones identificadas: runMigrations.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts Se utiliza desde: backend/src/database/cli.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts Se utiliza desde: backend/src/database/cli.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth-callbacks.ts

**Nombre y ruta:** backend/src/database/oauth-callbacks.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de oauth-callbacks.

**Dependencias:** Importa: backend/src/config/oauth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/oauth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### password-reset-migrate.ts

**Nombre y ruta:** backend/src/database/password-reset-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de password-reset-migrate. Exportaciones identificadas: migratePasswordResets.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### patient-invitation-migrate.ts

**Nombre y ruta:** backend/src/database/patient-invitation-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de patient-invitation-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### patient-permissions-migrate.ts

**Nombre y ruta:** backend/src/database/patient-permissions-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de patient-permissions-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-form-migrate.ts

**Nombre y ruta:** backend/src/database/pet-form-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de pet-form-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-photo-migrate.ts

**Nombre y ruta:** backend/src/database/pet-photo-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de pet-photo-migrate. Exportaciones identificadas: migratePetPhoto.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-sex-migrate.ts

**Nombre y ruta:** backend/src/database/pet-sex-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de pet-sex-migrate. Exportaciones identificadas: migratePetSex.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### petcare-cleanup-layerbase-audit.ts

**Nombre y ruta:** backend/src/database/petcare-cleanup-layerbase-audit.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de petcare-cleanup-layerbase-audit.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### petcare-cleanup-preview.ts

**Nombre y ruta:** backend/src/database/petcare-cleanup-preview.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de petcare-cleanup-preview.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/env.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### product-origin-migrate.ts

**Nombre y ruta:** backend/src/database/product-origin-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de product-origin-migrate. Exportaciones identificadas: migrateProductOrigins.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/database/product-origin-schema.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/database/product-origin-schema.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### product-origin-schema.ts

**Nombre y ruta:** backend/src/database/product-origin-schema.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de product-origin-schema. Exportaciones identificadas: SchemaColumn, SchemaIndex, SchemaForeignKey, ProductOriginSchema, MigrationStep, planProductOriginMigration.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/database/product-origin-migrate.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/database/product-origin-migrate.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### profile-photo-migrate.ts

**Nombre y ruta:** backend/src/database/profile-photo-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de profile-photo-migrate. Exportaciones identificadas: migrateProfilePhoto.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### promote-super-admin.ts

**Nombre y ruta:** backend/src/database/promote-super-admin.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de promote-super-admin.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/validators/veterinarian.validator.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/validators/veterinarian.validator.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### reservation-reason-migrate.ts

**Nombre y ruta:** backend/src/database/reservation-reason-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de reservation-reason-migrate. Exportaciones identificadas: migrateReservationReason.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: backend/src/database/clinic-schema-migrate.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: backend/src/database/clinic-schema-migrate.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### seed-runner.ts

**Nombre y ruta:** backend/src/database/seed-runner.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de seed-runner. Exportaciones identificadas: readCatalog, runSeeds.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts Se utiliza desde: backend/src/database/cli.ts, backend/src/database/client-reference-seed.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/services/database.service.ts, backend/src/utils/database-error.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts Se utiliza desde: backend/src/database/cli.ts, backend/src/database/client-reference-seed.ts

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### sql-audit-readonly.ts

**Nombre y ruta:** backend/src/database/sql-audit-readonly.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de sql-audit-readonly.

**Dependencias:** Importa: backend/src/config/database.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### user-deletion-migrate.ts

**Nombre y ruta:** backend/src/database/user-deletion-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de user-deletion-migrate. Exportaciones identificadas: migrateUserDeletion.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### veterinarian-clinical-migrate.ts

**Nombre y ruta:** backend/src/database/veterinarian-clinical-migrate.ts

**Función:** Herramienta de datos: conexión, preparación, migración o auditoría.

**Contenido:** Herramienta de datos: conexión, preparación, migración o auditoría dentro de PetCare; agrupa las declaraciones de veterinarian-clinical-migrate.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Realiza una tarea operativa cuyo efecto depende del comando que inicia este archivo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth-rate-limit.middleware.ts

**Nombre y ruta:** backend/src/middlewares/auth-rate-limit.middleware.ts

**Función:** Middleware transversal del procesamiento HTTP.

**Contenido:** Middleware transversal del procesamiento HTTP dentro de PetCare; agrupa las declaraciones de auth-rate-limit.middleware. Exportaciones identificadas: createAuthRateLimiter.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Inspecciona la solicitud y su contexto, y continúa el flujo o lo detiene con una respuesta/error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.middleware.ts

**Nombre y ruta:** backend/src/middlewares/auth.middleware.ts

**Función:** Middleware transversal del procesamiento HTTP.

**Contenido:** Middleware transversal del procesamiento HTTP dentro de PetCare; agrupa las declaraciones de auth.middleware. Exportaciones identificadas: authenticate.

**Dependencias:** Importa: backend/src/repositories/user.repository.ts, backend/src/services/token.service.ts, backend/src/repositories/session.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/account-session-guards.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: backend/src/repositories/user.repository.ts, backend/src/services/token.service.ts, backend/src/repositories/session.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/account-session-guards.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Inspecciona la solicitud y su contexto, y continúa el flujo o lo detiene con una respuesta/error.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### error.middleware.ts

**Nombre y ruta:** backend/src/middlewares/error.middleware.ts

**Función:** Middleware transversal del procesamiento HTTP.

**Contenido:** Middleware transversal del procesamiento HTTP dentro de PetCare; agrupa las declaraciones de error.middleware. Exportaciones identificadas: notFoundHandler, errorHandler.

**Dependencias:** Importa: backend/src/types/api.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts

**Conexiones:** Importa: backend/src/types/api.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts

**Ejemplo práctico:** Inspecciona la solicitud y su contexto, y continúa el flujo o lo detiene con una respuesta/error.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### permission.middleware.ts

**Nombre y ruta:** backend/src/middlewares/permission.middleware.ts

**Función:** Middleware transversal del procesamiento HTTP.

**Contenido:** Middleware transversal del procesamiento HTTP dentro de PetCare; agrupa las declaraciones de permission.middleware. Exportaciones identificadas: requireRole, requirePermission, requireAnyPermission, patientQueryAuthorizationGuard, requirePersonalAccess, requireNotificationAccess, requirePatientScope.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/personal-access.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/personal-access.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Inspecciona la solicitud y su contexto, y continúa el flujo o lo detiene con una respuesta/error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### proxy-trust.middleware.ts

**Nombre y ruta:** backend/src/middlewares/proxy-trust.middleware.ts

**Función:** Middleware transversal del procesamiento HTTP.

**Contenido:** Middleware transversal del procesamiento HTTP dentro de PetCare; agrupa las declaraciones de proxy-trust.middleware. Exportaciones identificadas: configureProxyTrust.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts

**Ejemplo práctico:** Inspecciona la solicitud y su contexto, y continúa el flujo o lo detiene con una respuesta/error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin.repository.ts

**Nombre y ruta:** backend/src/repositories/admin.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de admin.repository. Exportaciones identificadas: freshAdmin, adminHome, adminCatalog, adminUsers, adminUser, updateAdminUserPhoto, createAdminUser, resendAdminInvitation, updateAdminUser, deactivateAdminUser, updateUserPermissions, updateRole, deleteCustomRole, createRole, adminProducts, updateAdminProduct, adminProductStockMovements, adminProductCategories.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/utils/admin-authorization.ts, backend/src/validators/veterinarian.validator.ts, backend/src/validators/auth.validator.ts y 8 más Se utiliza desde: backend/src/repositories/veterinarian.repository.ts, backend/src/routes/admin.routes.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/utils/admin-authorization.ts, backend/src/validators/veterinarian.validator.ts, backend/src/validators/auth.validator.ts y 8 más Se utiliza desde: backend/src/repositories/veterinarian.repository.ts, backend/src/routes/admin.routes.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### authorization.repository.ts

**Nombre y ruta:** backend/src/repositories/authorization.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de authorization.repository. Exportaciones identificadas: readPermissions, readVetProfile, authorizationData.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/types/authorization.ts, backend/src/types/authorization.ts, backend/src/utils/catalog-presentation.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/session.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/types/authorization.ts, backend/src/types/authorization.ts, backend/src/utils/catalog-presentation.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/session.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client.repository.ts

**Nombre y ruta:** backend/src/repositories/client.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de client.repository. Exportaciones identificadas: pets, pet, petLifecycleHistoryForOwner, petCatalog, updateOwnedPetPhoto, savePet, deactivatePet, reactivatePet, appointments, appointmentCatalog, slots, createAppointment, clinical, products, product, categories, cart, updateCart, orders, order, notifications, unreadNotificationCount, readNotification, readAllNotifications, hideNotification, updateProfile, changePassword.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/repositories/clinic.repository.ts, backend/src/types/auth.ts, backend/src/validators/client.validator.ts, backend/src/utils/pet-lifecycle.ts Se utiliza desde: backend/src/app.ts, backend/src/repositories/storefront.repository.ts, backend/src/services/client.service.ts, backend/src/services/clinic.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/repositories/clinic.repository.ts, backend/src/types/auth.ts, backend/src/validators/client.validator.ts, backend/src/utils/pet-lifecycle.ts Se utiliza desde: backend/src/app.ts, backend/src/repositories/storefront.repository.ts, backend/src/services/client.service.ts, backend/src/services/clinic.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-admin.repository.ts

**Nombre y ruta:** backend/src/repositories/clinic-admin.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de clinic-admin.repository. Exportaciones identificadas: Entity, entity, list, save, deleteService, assignServices, availability, archiveAvailability, saveAvailability, setAvailabilityActive, administrative, assignType.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/repositories/clinic.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/catalog-presentation.ts, backend/src/utils/availability-lifecycle.ts Se utiliza desde: backend/src/services/clinic.service.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/repositories/clinic.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/catalog-presentation.ts, backend/src/utils/availability-lifecycle.ts Se utiliza desde: backend/src/services/clinic.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic.repository.ts

**Nombre y ruta:** backend/src/repositories/clinic.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de clinic.repository. Exportaciones identificadas: Connection, SqlValue, Data, map, permit, transaction, rows, one, notify, appendPetLifecycleHistory, professionals, catalog, slots, requestAppointment, appointments, changeAppointment, cancelClientAppointment, patientScope, patientListOrdering, patientNextAppointmentExpression, patients, createPatient, searchPatientOwners, resendPatientInvitation, clinical, saveClinical, clients, clientDetails, home, patient, groomerPatient, groomingRecord, saveGroomingRecord, updatePatient, deactivatePatient, reactivatePatient.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/types/auth.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/clinic-rules.ts, backend/src/utils/appointment-order.ts y 12 más Se utiliza desde: backend/src/repositories/client.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/general-information.repository.ts, backend/src/repositories/reservation.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/store-payment.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/routes/veterinarian.routes.ts y 2 más

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/types/auth.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/clinic-rules.ts, backend/src/utils/appointment-order.ts y 12 más Se utiliza desde: backend/src/repositories/client.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/general-information.repository.ts, backend/src/repositories/reservation.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/store-payment.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/routes/veterinarian.routes.ts y 2 más

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### delivery-address.repository.ts

**Nombre y ruta:** backend/src/repositories/delivery-address.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de delivery-address.repository. Exportaciones identificadas: list, save.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/services/client.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/services/client.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### general-information.repository.ts

**Nombre y ruta:** backend/src/repositories/general-information.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de general-information.repository. Exportaciones identificadas: Weekday, OpeningHours, GeneralInformation, defaultGeneralInformation, validateGeneralInformation, publicGeneralInformation, adminGeneralInformation, saveGeneralInformation.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/routes/admin.routes.ts, backend/src/routes/settings.routes.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/routes/admin.routes.ts, backend/src/routes/settings.routes.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notification.repository.ts

**Nombre y ruta:** backend/src/repositories/notification.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de notification.repository. Exportaciones identificadas: ClientNotificationInput, createClientNotification.

**Dependencias:** Importa: backend/src/config/mail.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-checkout.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/services/notifications.service.ts

**Conexiones:** Importa: backend/src/config/mail.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-checkout.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/services/notifications.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth.repository.ts

**Nombre y ruta:** backend/src/repositories/oauth.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de oauth.repository. Exportaciones identificadas: OAuthAttempt, createAttempt, claimCallback, saveCallback, withTicket, consume.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/repositories/session.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/config/oauth.ts, backend/src/services/oauth-provider.service.ts Se utiliza desde: backend/src/services/oauth.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/repositories/session.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/config/oauth.ts, backend/src/services/oauth-provider.service.ts Se utiliza desde: backend/src/services/oauth.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### reservation.repository.ts

**Nombre y ruta:** backend/src/repositories/reservation.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de reservation.repository. Exportaciones identificadas: expireDueReservations.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/server.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/server.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### session.repository.ts

**Nombre y ruta:** backend/src/repositories/session.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de session.repository. Exportaciones identificadas: digest, opaqueToken, refreshLifetime, issueRefresh, refreshFamily, activeFamily, rotateRefresh, revokeRefresh.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/middlewares/auth.middleware.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/session.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/middlewares/auth.middleware.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/session.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-checkout.repository.ts

**Nombre y ruta:** backend/src/repositories/store-checkout.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de store-checkout.repository. Exportaciones identificadas: create.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/store-checkout.validator.ts, backend/src/repositories/notification.repository.ts Se utiliza desde: backend/src/services/client.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/store-checkout.validator.ts, backend/src/repositories/notification.repository.ts Se utiliza desde: backend/src/services/client.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-orders.repository.ts

**Nombre y ruta:** backend/src/repositories/store-orders.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de store-orders.repository. Exportaciones identificadas: list, detail, update, proof, reviewPayment.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/repositories/clinic.repository.ts, backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts, backend/src/validators/clinic.validator.ts, backend/src/repositories/store-payment.repository.ts, backend/src/services/pet-photo.service.ts y 2 más Se utiliza desde: backend/src/services/clinic.service.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/repositories/clinic.repository.ts, backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts, backend/src/validators/clinic.validator.ts, backend/src/repositories/store-payment.repository.ts, backend/src/services/pet-photo.service.ts y 2 más Se utiliza desde: backend/src/services/clinic.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-payment.repository.ts

**Nombre y ruta:** backend/src/repositories/store-payment.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de store-payment.repository. Exportaciones identificadas: submitProof, assertOwnedIntent, proofForAdmin, review, createNewIntent.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/store-orders.repository.ts, backend/src/services/client.service.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/store-orders.repository.ts, backend/src/services/client.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### storefront.repository.ts

**Nombre y ruta:** backend/src/repositories/storefront.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de storefront.repository. Exportaciones identificadas: DeliveryZone, FulfillmentSettings, PromotionBanner, StoreBanner, publicBanners, adminBanners, bannerDestinationChoices, promotionProductChoices, saveBanner, removeBanner, reorderBanners, publicPromotions, publicFulfillment, adminFulfillment, quoteDelivery, saveFulfillment.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/client.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/services/pet-photo.service.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/app-error.ts y 2 más Se utiliza desde: backend/src/services/client.service.ts, backend/src/services/clinic.service.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/config/database.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/client.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/services/pet-photo.service.ts, backend/src/utils/admin-authorization.ts, backend/src/utils/app-error.ts y 2 más Se utiliza desde: backend/src/services/client.service.ts, backend/src/services/clinic.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### user.repository.ts

**Nombre y ruta:** backend/src/repositories/user.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de user.repository. Exportaciones identificadas: findUserByEmail, findUserById, publicUser, createClientUser.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/utils/register-diagnostics.ts, backend/src/utils/catalog-presentation.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/auth.service.ts, backend/src/services/client.service.ts, backend/src/services/oauth.service.ts, backend/src/services/session.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/utils/register-diagnostics.ts, backend/src/utils/catalog-presentation.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/auth.service.ts, backend/src/services/client.service.ts, backend/src/services/oauth.service.ts, backend/src/services/session.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.repository.ts

**Nombre y ruta:** backend/src/repositories/verification.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de verification.repository. Exportaciones identificadas: VerificationRow, findVerificationUser, withVerificationUser, readVerification.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/verification.service.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### veterinarian.repository.ts

**Nombre y ruta:** backend/src/repositories/veterinarian.repository.ts

**Función:** Acceso y persistencia de datos por dominio.

**Contenido:** Acceso y persistencia de datos por dominio dentro de PetCare; agrupa las declaraciones de veterinarian.repository. Exportaciones identificadas: vetCatalog, vetDetail, vetList, updateVetPhoto, updateOwnProfessionalPhoto, createVet, updateVet, updateVetStatus.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/veterinarian.validator.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/admin.repository.ts, backend/src/database/lock.ts, backend/src/services/password.service.ts y 4 más Se utiliza desde: backend/src/routes/veterinarian.routes.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/veterinarian.validator.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/admin.repository.ts, backend/src/database/lock.ts, backend/src/services/password.service.ts y 4 más Se utiliza desde: backend/src/routes/veterinarian.routes.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Recibe identificadores/filtros, consulta o modifica datos y devuelve los resultados que consume la capa de servicio.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin.routes.ts

**Nombre y ruta:** backend/src/routes/admin.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de admin.routes. Exportaciones identificadas: adminRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/validators/veterinarian.validator.ts, backend/src/types/auth.ts, backend/src/repositories/admin.repository.ts, backend/src/services/pet-photo.service.ts, backend/src/utils/app-error.ts y 2 más Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/validators/veterinarian.validator.ts, backend/src/types/auth.ts, backend/src/repositories/admin.repository.ts, backend/src/services/pet-photo.service.ts, backend/src/utils/app-error.ts y 2 más Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.routes.ts

**Nombre y ruta:** backend/src/routes/auth.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de auth.routes. Exportaciones identificadas: authRouter.

**Dependencias:** Importa: backend/src/controllers/auth.controller.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/verification.controller.ts, backend/src/controllers/oauth.controller.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/controllers/auth.controller.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/verification.controller.ts, backend/src/controllers/oauth.controller.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### client.routes.ts

**Nombre y ruta:** backend/src/routes/client.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de client.routes. Exportaciones identificadas: clientRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/client.controller.ts, backend/src/routes/notification.routes.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/client.controller.ts, backend/src/routes/notification.routes.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### clinic.routes.ts

**Nombre y ruta:** backend/src/routes/clinic.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de clinic.routes. Exportaciones identificadas: clinicRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/clinic.controller.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/controllers/clinic.controller.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### index.ts

**Nombre y ruta:** backend/src/routes/index.ts

**Función:** Código fuente del proyecto.

**Contenido:** Definir los prefijos URL para autenticación, clientes, administración, clínica, profesionales, notificaciones, configuración y medios. Exportaciones identificadas: apiRouter.

**Dependencias:** No se identificaron dependencias en la cabecera.

**Conexiones:** Sin conexiones estáticas locales detectadas.

**Ejemplo práctico:** Consulta la lógica concreta del archivo antes de atribuirle un flujo.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### media.routes.ts

**Nombre y ruta:** backend/src/routes/media.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de media.routes. Exportaciones identificadas: mediaRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/types/auth.ts, backend/src/services/direct-image-upload.service.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/types/auth.ts, backend/src/services/direct-image-upload.service.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### notification-jobs.routes.ts

**Nombre y ruta:** backend/src/routes/notification-jobs.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de notification-jobs.routes. Exportaciones identificadas: createNotificationJobsRouter, notificationJobsRouter.

**Dependencias:** Importa: backend/src/services/notifications.service.ts, backend/src/utils/app-error.ts, backend/src/utils/cron-auth.ts Se utiliza desde: backend/src/app.ts

**Conexiones:** Importa: backend/src/services/notifications.service.ts, backend/src/utils/app-error.ts, backend/src/utils/cron-auth.ts Se utiliza desde: backend/src/app.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notification.routes.ts

**Nombre y ruta:** backend/src/routes/notification.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de notification.routes. Exportaciones identificadas: notificationRouter, legacyClientNotificationRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/controllers/client.controller.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/controllers/client.controller.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### settings.routes.ts

**Nombre y ruta:** backend/src/routes/settings.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de settings.routes. Exportaciones identificadas: publicSettingsRouter.

**Dependencias:** Importa: backend/src/repositories/general-information.repository.ts Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/repositories/general-information.repository.ts Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### veterinarian.routes.ts

**Nombre y ruta:** backend/src/routes/veterinarian.routes.ts

**Función:** Definición o composición de rutas HTTP.

**Contenido:** Definición o composición de rutas HTTP dentro de PetCare; agrupa las declaraciones de veterinarian.routes. Exportaciones identificadas: veterinarianAdminRouter, invitationRouter, specialtiesAdminRouter, veterinarianPanelRouter, professionalPhotoRouter.

**Dependencias:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/validators/veterinarian.validator.ts, backend/src/services/invitation.service.ts, backend/src/repositories/clinic.repository.ts, backend/src/config/database.ts y 7 más Se utiliza desde: backend/src/routes/index.ts

**Conexiones:** Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/validators/veterinarian.validator.ts, backend/src/services/invitation.service.ts, backend/src/repositories/clinic.repository.ts, backend/src/config/database.ts y 7 más Se utiliza desde: backend/src/routes/index.ts

**Ejemplo práctico:** Declara rutas y middlewares y dirige cada solicitud al handler correspondiente.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### server.ts

**Nombre y ruta:** backend/src/server.ts

**Función:** Código fuente del proyecto.

**Contenido:** Escuchar solicitudes, ejecutar la revisión periódica de reservas vencidas y liberar el pool SQL al recibir SIGINT/SIGTERM.

**Dependencias:** No se identificaron dependencias en la cabecera.

**Conexiones:** Sin conexiones estáticas locales detectadas.

**Ejemplo práctico:** Consulta la lógica concreta del archivo antes de atribuirle un flujo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin-account.service.ts

**Nombre y ruta:** backend/src/services/admin-account.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de admin-account.service. Exportaciones identificadas: updateOwnProfile, changeOwnPassword.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts Se utiliza desde: backend/src/routes/admin.routes.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts Se utiliza desde: backend/src/routes/admin.routes.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.service.ts

**Nombre y ruta:** backend/src/services/auth.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de auth.service. Exportaciones identificadas: registerUser, loginUser.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/repositories/user.repository.ts, backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/session.service.ts, backend/src/config/mail.ts, backend/src/services/verification.service.ts y 4 más Se utiliza desde: backend/src/controllers/auth.controller.ts

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/repositories/user.repository.ts, backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/session.service.ts, backend/src/config/mail.ts, backend/src/services/verification.service.ts y 4 más Se utiliza desde: backend/src/controllers/auth.controller.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### bootstrap-super-admin.service.ts

**Nombre y ruta:** backend/src/services/bootstrap-super-admin.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de bootstrap-super-admin.service. Exportaciones identificadas: createFirstSuperAdmin.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/database/create-super-admin.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/database/create-super-admin.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client.service.ts

**Nombre y ruta:** backend/src/services/client.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de client.service. Exportaciones identificadas: clinicalKinds, clientOperation.

**Dependencias:** Importa: backend/src/repositories/client.repository.ts, backend/src/repositories/user.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/config/env.ts, backend/src/services/pet-photo.service.ts, backend/src/validators/auth.validator.ts, backend/src/validators/client.validator.ts y 8 más Se utiliza desde: backend/src/controllers/client.controller.ts

**Conexiones:** Importa: backend/src/repositories/client.repository.ts, backend/src/repositories/user.repository.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts, backend/src/config/env.ts, backend/src/services/pet-photo.service.ts, backend/src/validators/auth.validator.ts, backend/src/validators/client.validator.ts y 8 más Se utiliza desde: backend/src/controllers/client.controller.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic.service.ts

**Nombre y ruta:** backend/src/services/clinic.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de clinic.service. Exportaciones identificadas: clinicOperation.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/utils/database-error.ts y 2 más Se utiliza desde: backend/src/controllers/clinic.controller.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/validators/clinic.validator.ts, backend/src/utils/database-error.ts y 2 más Se utiliza desde: backend/src/controllers/clinic.controller.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### database.service.ts

**Nombre y ruta:** backend/src/services/database.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de database.service. Exportaciones identificadas: assertSupportedMysqlVersion, assertMysql8Version, checkDatabaseConnection.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-reference-seed.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-reference-seed.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### direct-image-upload.service.ts

**Nombre y ruta:** backend/src/services/direct-image-upload.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de direct-image-upload.service. Exportaciones identificadas: ImageKind, signDirectImageUpload, verifyDirectImageUpload.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/media.routes.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/media.routes.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### invitation.service.ts

**Nombre y ruta:** backend/src/services/invitation.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de invitation.service. Exportaciones identificadas: invitationUrl, tokenHash, saveInvitation, deliverInvitation, renewInvitation, renewUserInvitation, acceptInvitation.

**Dependencias:** Importa: backend/src/services/password.service.ts, backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/config/public-frontend.ts, backend/src/services/mail.service.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/veterinarian.validator.ts y 1 más Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: backend/src/services/password.service.ts, backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/config/public-frontend.ts, backend/src/services/mail.service.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/validators/veterinarian.validator.ts y 1 más Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### mail.service.ts

**Nombre y ruta:** backend/src/services/mail.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de mail.service. Exportaciones identificadas: sendInvitationEmail, sendVerificationEmail, sendPasswordResetEmail, sendClientNotificationEmail.

**Dependencias:** Importa: backend/src/config/mail.ts, backend/src/utils/app-error.ts, backend/src/utils/register-diagnostics.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/notifications.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/config/mail.ts, backend/src/utils/app-error.ts, backend/src/utils/register-diagnostics.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/notifications.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notifications.service.ts

**Nombre y ruta:** backend/src/services/notifications.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de notifications.service. Exportaciones identificadas: appointmentReminderWindow, appointmentReminderEventKey, createDueAppointmentReminders, retryDelaySeconds, NotificationJobTasks, runNotificationJobTasks, processNotificationJobs.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/repositories/notification.repository.ts, backend/src/utils/notification-date.ts, backend/src/services/mail.service.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/notification-jobs.routes.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/repositories/notification.repository.ts, backend/src/utils/notification-date.ts, backend/src/services/mail.service.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/notification-jobs.routes.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth-policy.ts

**Nombre y ruta:** backend/src/services/oauth-policy.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de oauth-policy. Exportaciones identificadas: OAuthExchangeAction, oauthExchangeAction, assertOAuthRegistrationEmailAvailable, shouldIssueSessionAfterVerification.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth-provider.service.ts

**Nombre y ruta:** backend/src/services/oauth-provider.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de oauth-provider.service. Exportaciones identificadas: ProviderIdentity, authorizationUrl, providerIdentity.

**Dependencias:** Importa: backend/src/config/oauth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/oauth.repository.ts, backend/src/services/oauth.service.ts

**Conexiones:** Importa: backend/src/config/oauth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/oauth.repository.ts, backend/src/services/oauth.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth.service.ts

**Nombre y ruta:** backend/src/services/oauth.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de oauth.service. Exportaciones identificadas: startOAuth, callbackOAuth, exchangeOAuth, registerOAuth.

**Dependencias:** Importa: backend/src/config/oauth.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/oauth-provider.service.ts, backend/src/repositories/user.repository.ts, backend/src/services/session.service.ts, backend/src/services/oauth-policy.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts y 3 más Se utiliza desde: backend/src/controllers/oauth.controller.ts

**Conexiones:** Importa: backend/src/config/oauth.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/oauth-provider.service.ts, backend/src/repositories/user.repository.ts, backend/src/services/session.service.ts, backend/src/services/oauth-policy.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts y 3 más Se utiliza desde: backend/src/controllers/oauth.controller.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### password-reset.service.ts

**Nombre y ruta:** backend/src/services/password-reset.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de password-reset.service. Exportaciones identificadas: requestPasswordReset, resetPassword, changeInitialPassword.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/utils/app-error.ts, backend/src/utils/password-reset-token.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts, backend/src/services/mail.service.ts, backend/src/config/public-frontend.ts Se utiliza desde: backend/src/controllers/auth.controller.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/utils/app-error.ts, backend/src/utils/password-reset-token.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts, backend/src/services/mail.service.ts, backend/src/config/public-frontend.ts Se utiliza desde: backend/src/controllers/auth.controller.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### password.service.ts

**Nombre y ruta:** backend/src/services/password.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de password.service. Exportaciones identificadas: hashPassword.

**Dependencias:** Importa: backend/src/config/env.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/admin-account.service.ts, backend/src/services/auth.service.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/services/invitation.service.ts, backend/src/services/oauth.service.ts y 2 más

**Conexiones:** Importa: backend/src/config/env.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/admin-account.service.ts, backend/src/services/auth.service.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/services/invitation.service.ts, backend/src/services/oauth.service.ts y 2 más

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-photo.service.ts

**Nombre y ruta:** backend/src/services/pet-photo.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de pet-photo.service. Exportaciones identificadas: PHOTO_URL_TTL_SECONDS, isPetPhotoKey, isProductPhotoKey, isServicePhotoKey, isProfilePhotoKey, isBannerPhotoKey, photoStorage, optimizePetPhoto, storePetPhoto, removePetPhoto, petPhotoUrl, storeProductPhoto, storeBannerPhoto, removeBannerPhoto, storeServicePhoto, removeServicePhoto, removeProductPhoto, productPhotoUrl, servicePhotoUrl, storeProfilePhoto, removeProfilePhoto, profilePhotoUrl, storePaymentProof, paymentProofUrl, removePaymentProof, presentPetPhotos, presentProductImages, presentServiceImages.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/app.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts y 6 más

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/app.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts y 6 más

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### session.service.ts

**Nombre y ruta:** backend/src/services/session.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de session.service. Exportaciones identificadas: sessionForUser, refreshSession.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/session.repository.ts, backend/src/config/env.ts, backend/src/services/token.service.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/session.repository.ts, backend/src/config/env.ts, backend/src/services/token.service.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### token.service.ts

**Nombre y ruta:** backend/src/services/token.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de token.service. Exportaciones identificadas: createAccessToken, accessTokenFamily, accessTokenSessionVersion, verifyAccessToken.

**Dependencias:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/session.service.ts

**Conexiones:** Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/session.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.service.ts

**Nombre y ruta:** backend/src/services/verification.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de verification.service. Exportaciones identificadas: hashVerificationToken, hashVerificationCode, createVerificationProof, resendVerification, verifyEmail.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/repositories/verification.repository.ts, backend/src/types/verification.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/utils/mask-email.ts, backend/src/validators/verification.validator.ts y 6 más Se utiliza desde: backend/src/controllers/verification.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/repositories/verification.repository.ts, backend/src/types/verification.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/utils/mask-email.ts, backend/src/validators/verification.validator.ts y 6 más Se utiliza desde: backend/src/controllers/verification.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### veterinarian-account.service.ts

**Nombre y ruta:** backend/src/services/veterinarian-account.service.ts

**Función:** Servicio de negocio o integración del backend.

**Contenido:** Servicio de negocio o integración del backend dentro de PetCare; agrupa las declaraciones de veterinarian-account.service. Exportaciones identificadas: updateOwnProfile, changeOwnPassword.

**Dependencias:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts Se utiliza desde: backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts Se utiliza desde: backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### api.ts

**Nombre y ruta:** backend/src/types/api.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de api. Exportaciones identificadas: ApiSuccess, ApiFailure.

**Dependencias:** Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/controllers/health.controller.ts, backend/src/middlewares/error.middleware.ts

**Conexiones:** Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/controllers/health.controller.ts, backend/src/middlewares/error.middleware.ts

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### auth.ts

**Nombre y ruta:** backend/src/types/auth.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de auth. Exportaciones identificadas: RoleCode, AuthUser, StoredUser, RegisterInput, LoginInput, AccessSession.

**Dependencias:** Importa: backend/src/types/authorization.ts Se utiliza desde: backend/src/controllers/auth.controller.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/middlewares/permission.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts y 18 más

**Conexiones:** Importa: backend/src/types/authorization.ts Se utiliza desde: backend/src/controllers/auth.controller.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/middlewares/permission.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts y 18 más

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### authorization.ts

**Nombre y ruta:** backend/src/types/authorization.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de authorization. Exportaciones identificadas: Permission, Specialty, VetProfile, effectivePermission, effectiveRolePermission.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/authorization.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/types/auth.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/authorization.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/types/auth.ts

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.ts

**Nombre y ruta:** backend/src/types/verification.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de verification. Exportaciones identificadas: VerificationChallenge.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/auth.service.ts, backend/src/services/verification.service.ts, backend/src/types/api.ts, backend/src/utils/app-error.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/auth.service.ts, backend/src/services/verification.service.ts, backend/src/types/api.ts, backend/src/utils/app-error.ts

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### account-session-guards.ts

**Nombre y ruta:** backend/src/utils/account-session-guards.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de account-session-guards. Exportaciones identificadas: isLoginAllowed, isAccessSessionCurrent.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/auth.service.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/auth.service.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin-authorization.ts

**Nombre y ruta:** backend/src/utils/admin-authorization.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de admin-authorization. Exportaciones identificadas: forbidden, assertAdminPermission, assertCapabilityPermission, assertDelegation, assertTarget, assertRoleAssignment.

**Dependencias:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/storefront.repository.ts

**Conexiones:** Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/storefront.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin-destructive-actions.ts

**Nombre y ruta:** backend/src/utils/admin-destructive-actions.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de admin-destructive-actions. Exportaciones identificadas: protectedSystemRoleCodes, assertCustomRoleDeletable, assertAccountDeactivationAllowed.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### app-error.ts

**Nombre y ruta:** backend/src/utils/app-error.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de app-error. Exportaciones identificadas: ApiFieldError, AppError.

**Dependencias:** Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/config/env.ts, backend/src/config/mail.ts, backend/src/config/oauth.ts, backend/src/controllers/oauth.controller.ts, backend/src/database/create-super-admin.ts, backend/src/database/promote-super-admin.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/error.middleware.ts y 52 más

**Conexiones:** Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/config/env.ts, backend/src/config/mail.ts, backend/src/config/oauth.ts, backend/src/controllers/oauth.controller.ts, backend/src/database/create-super-admin.ts, backend/src/database/promote-super-admin.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/error.middleware.ts y 52 más

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### appointment-cancellation.ts

**Nombre y ruta:** backend/src/utils/appointment-cancellation.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de appointment-cancellation. Exportaciones identificadas: requiredCancellationReason.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### appointment-order.ts

**Nombre y ruta:** backend/src/utils/appointment-order.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de appointment-order. Exportaciones identificadas: AdminAppointmentSort, compareAdminAppointments, adminAppointmentOrderSql.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### availability-lifecycle.ts

**Nombre y ruta:** backend/src/utils/availability-lifecycle.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de availability-lifecycle. Exportaciones identificadas: AvailabilityKind, ReactivationChecks, availabilityReactivationError.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic-admin.repository.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic-admin.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### catalog-presentation.ts

**Nombre y ruta:** backend/src/utils/catalog-presentation.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de catalog-presentation. Exportaciones identificadas: permissionName, permissionDescription, permissionModuleName, roleName, catalogName.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/veterinarian.routes.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/veterinarian.routes.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-rules.ts

**Nombre y ruta:** backend/src/utils/clinic-rules.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de clinic-rules. Exportaciones identificadas: appointmentTransitions, professionalUpcomingAppointments, assertTransition, overlap.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinical-presentation.ts

**Nombre y ruta:** backend/src/utils/clinical-presentation.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de clinical-presentation. Exportaciones identificadas: clientClinicalRecord.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### cron-auth.ts

**Nombre y ruta:** backend/src/utils/cron-auth.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de cron-auth. Exportaciones identificadas: isCronAuthorized.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/routes/notification-jobs.routes.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/routes/notification-jobs.routes.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### database-error.ts

**Nombre y ruta:** backend/src/utils/database-error.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de database-error. Exportaciones identificadas: DatabaseError, normalizeDatabaseError, runDatabaseOperation.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/clinic.controller.ts, backend/src/database/cli.ts, backend/src/database/create-database.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts, backend/src/database/migration-runner.ts, backend/src/database/promote-super-admin.ts, backend/src/database/seed-runner.ts y 22 más

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/clinic.controller.ts, backend/src/database/cli.ts, backend/src/database/create-database.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts, backend/src/database/migration-runner.ts, backend/src/database/promote-super-admin.ts, backend/src/database/seed-runner.ts y 22 más

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### mask-email.ts

**Nombre y ruta:** backend/src/utils/mask-email.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de mask-email. Exportaciones identificadas: maskEmail.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/verification.service.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/verification.service.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notification-date.ts

**Nombre y ruta:** backend/src/utils/notification-date.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de notification-date. Exportaciones identificadas: formatNotificationDateTime.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts, backend/src/services/notifications.service.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts, backend/src/services/notifications.service.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### password-reset-token.ts

**Nombre y ruta:** backend/src/utils/password-reset-token.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de password-reset-token. Exportaciones identificadas: normalizePasswordResetToken.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/password-reset.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/password-reset.service.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### personal-access.ts

**Nombre y ruta:** backend/src/utils/personal-access.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de personal-access. Exportaciones identificadas: personalPermissionsForRoute, canAccessNotificationCenter, canAccessPersonalRoute.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/permission.middleware.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/permission.middleware.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-lifecycle.ts

**Nombre y ruta:** backend/src/utils/pet-lifecycle.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de pet-lifecycle. Exportaciones identificadas: normalizePetActiveFlag, requirePetActiveFlag, assertNoFuturePatientAppointments, assertCanManagePetLifecycle, requiredPetDeactivationReason, assertPetLifecycleTransition, petDeactivationNotification, petReactivationNotification.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/types/auth.ts Se utiliza desde: backend/src/repositories/client.repository.ts, backend/src/repositories/clinic.repository.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/types/auth.ts Se utiliza desde: backend/src/repositories/client.repository.ts, backend/src/repositories/clinic.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### public-frontend-url.ts

**Nombre y ruta:** backend/src/utils/public-frontend-url.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de public-frontend-url. Exportaciones identificadas: PublicFrontendLinkKind, buildPublicFrontendUrl.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/config/public-frontend.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/config/public-frontend.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### register-diagnostics.ts

**Nombre y ruta:** backend/src/utils/register-diagnostics.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de register-diagnostics. Exportaciones identificadas: RegisterStage, safeRegisterError, registerStage, registerDiagnosticFailure, withRegisterDiagnostics.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/config/env.ts Se utiliza desde: backend/src/controllers/auth.controller.ts, backend/src/repositories/user.repository.ts, backend/src/services/auth.service.ts, backend/src/services/mail.service.ts, backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/config/env.ts Se utiliza desde: backend/src/controllers/auth.controller.ts, backend/src/repositories/user.repository.ts, backend/src/services/auth.service.ts, backend/src/services/mail.service.ts, backend/src/services/verification.service.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### role-code.ts

**Nombre y ruta:** backend/src/utils/role-code.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de role-code. Exportaciones identificadas: roleCodeFromName.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-order-transitions.ts

**Nombre y ruta:** backend/src/utils/store-order-transitions.ts

**Función:** Regla auxiliar del backend.

**Contenido:** Regla auxiliar del backend dentro de PetCare; agrupa las declaraciones de store-order-transitions. Exportaciones identificadas: operationalOrderStatuses, allowedOrderTransitions, validOrderTransition.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/store-orders.repository.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/store-orders.repository.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.validator.ts

**Nombre y ruta:** backend/src/validators/auth.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de auth.validator. Exportaciones identificadas: readName, normalizeEmail, readPhone, readPassword, validateRegister, validateLogin.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/types/auth.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/services/admin-account.service.ts, backend/src/services/auth.service.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/services/client.service.ts, backend/src/services/oauth.service.ts, backend/src/services/password-reset.service.ts y 2 más

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/types/auth.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/services/admin-account.service.ts, backend/src/services/auth.service.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/services/client.service.ts, backend/src/services/oauth.service.ts, backend/src/services/password-reset.service.ts y 2 más

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client.validator.ts

**Nombre y ruta:** backend/src/validators/client.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de client.validator. Exportaciones identificadas: invalid, clientId, clientBody, text, imageUrl, petInput, cartQuantity, requestKey.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/delivery-address.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/store-payment.repository.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts, backend/src/validators/clinic.validator.ts y 1 más

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/delivery-address.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/store-payment.repository.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts, backend/src/validators/clinic.validator.ts y 1 más

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic.validator.ts

**Nombre y ruta:** backend/src/validators/clinic.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de clinic.validator. Exportaciones identificadas: productImage, serviceImage, integer, bool, optionalId, instant, queryPage.

**Dependencias:** Importa: backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/services/clinic.service.ts

**Conexiones:** Importa: backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/services/clinic.service.ts

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-checkout.validator.ts

**Nombre y ruta:** backend/src/validators/store-checkout.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de store-checkout.validator. Exportaciones identificadas: CheckoutAddress, CheckoutPayment, storeCheckoutInput, storeTransferInput.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/store-checkout.repository.ts, backend/src/services/client.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/store-checkout.repository.ts, backend/src/services/client.service.ts

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.validator.ts

**Nombre y ruta:** backend/src/validators/verification.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de verification.validator. Exportaciones identificadas: validateVerification.

**Dependencias:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/verification.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/verification.service.ts

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### veterinarian.validator.ts

**Nombre y ruta:** backend/src/validators/veterinarian.validator.ts

**Función:** Validación y normalización de entradas.

**Contenido:** Validación y normalización de entradas dentro de PetCare; agrupa las declaraciones de veterinarian.validator. Exportaciones identificadas: VetInput, PermissionOverride, objectBody, identifier, textField, permissionOverrides, validateVet, validateInvitation.

**Dependencias:** Importa: backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts Se utiliza desde: backend/src/database/promote-super-admin.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/admin.routes.ts, backend/src/routes/veterinarian.routes.ts, backend/src/services/invitation.service.ts

**Conexiones:** Importa: backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts Se utiliza desde: backend/src/database/promote-super-admin.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/routes/admin.routes.ts, backend/src/routes/veterinarian.routes.ts, backend/src/services/invitation.service.ts

**Ejemplo práctico:** Comprueba o normaliza entradas según las reglas del módulo y entrega datos válidos o un error.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

## mobile/eslint.config.js

### eslint.config.js

**Nombre y ruta:** mobile/eslint.config.js

**Función:** Configuración y herramientas del frontend.

**Contenido:** Configuración y herramientas del frontend dentro de PetCare; agrupa las declaraciones de eslint.config.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Lee valores de entorno o dependencias y expone la configuración consumida por otros módulos.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

## mobile/src

### _layout.tsx

**Nombre y ruta:** mobile/src/app/_layout.tsx

**Función:** Código fuente del proyecto.

**Contenido:** Proveer área segura, tema, sesión y feedback; declarar rutas y guardas por sesión/rol; montar navegación global, avisos, registro OAuth y puente de notificaciones. Exportaciones identificadas: RootLayout.

**Dependencias:** No se identificaron dependencias en la cabecera.

**Conexiones:** Sin conexiones estáticas locales detectadas.

**Ejemplo práctico:** Consulta la lógica concreta del archivo antes de atribuirle un flujo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### account.tsx

**Nombre y ruta:** mobile/src/app/account.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de account. Exportaciones identificadas: AccountScreen.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### activate-account.tsx

**Nombre y ruta:** mobile/src/app/activate-account.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de activate-account. Exportaciones identificadas: ActivateAccount.

**Dependencias:** Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### activate-vet.tsx

**Nombre y ruta:** mobile/src/app/activate-vet.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de activate-vet. Exportaciones identificadas: ActivateVet.

**Dependencias:** Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/forms/ActivationForm.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/admin/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: AdminLayout.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/utils/admin-route-access.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/utils/admin-route-access.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### administration.tsx

**Nombre y ruta:** mobile/src/app/admin/administration.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de administration. Exportaciones identificadas: AdminAdministrationSection.

**Dependencias:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### agenda.tsx

**Nombre y ruta:** mobile/src/app/admin/agenda.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de agenda.

**Dependencias:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### appointment.tsx

**Nombre y ruta:** mobile/src/app/admin/appointment.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de appointment.

**Dependencias:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### availability.tsx

**Nombre y ruta:** mobile/src/app/admin/availability.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de availability. Exportaciones identificadas: AdminAvailabilityPage.

**Dependencias:** Importa: mobile/src/components/clinic/AvailabilityScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AvailabilityScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [kind].tsx

**Nombre y ruta:** mobile/src/app/admin/catalog/[kind].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [kind].

**Dependencias:** Importa: mobile/src/components/clinic/CatalogScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/CatalogScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### client.tsx

**Nombre y ruta:** mobile/src/app/admin/client.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de client.

**Dependencias:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### clients.tsx

**Nombre y ruta:** mobile/src/app/admin/clients.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de clients.

**Dependencias:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### clinic.tsx

**Nombre y ruta:** mobile/src/app/admin/clinic.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de clinic. Exportaciones identificadas: AdminClinicSection.

**Dependencias:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### general-information.tsx

**Nombre y ruta:** mobile/src/app/admin/general-information.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de general-information. Exportaciones identificadas: GeneralInformationScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SelectionRow.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SelectionRow.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/admin/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: AdminHome.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/clinic-date.ts, mobile/src/components/ui/AppButton.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/clinic-date.ts, mobile/src/components/ui/AppButton.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### patient.tsx

**Nombre y ruta:** mobile/src/app/admin/patient.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patient.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### patients.tsx

**Nombre y ruta:** mobile/src/app/admin/patients.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patients.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### permissions.tsx

**Nombre y ruta:** mobile/src/app/admin/permissions.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de permissions. Exportaciones identificadas: PermissionsScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/utils/admin-permissions.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/utils/admin-permissions.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### products.tsx

**Nombre y ruta:** mobile/src/app/admin/products.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de products. Exportaciones identificadas: AdminProducts.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/ConfirmModal.tsx y 13 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/ConfirmModal.tsx y 13 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### professionals.tsx

**Nombre y ruta:** mobile/src/app/admin/professionals.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de professionals.

**Dependencias:** Importa: mobile/src/components/clinic/ProfessionalsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ProfessionalsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### roles.tsx

**Nombre y ruta:** mobile/src/app/admin/roles.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de roles. Exportaciones identificadas: RolesScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/components/ui/ConfirmModal.tsx, mobile/src/components/client/PetCareUI.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/components/ui/ConfirmModal.tsx, mobile/src/components/client/PetCareUI.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### specialties.tsx

**Nombre y ruta:** mobile/src/app/admin/specialties.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de specialties.

**Dependencias:** Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### store-banners.tsx

**Nombre y ruta:** mobile/src/app/admin/store-banners.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de store-banners. Exportaciones identificadas: StoreBannersScreen.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-orders.tsx

**Nombre y ruta:** mobile/src/app/admin/store-orders.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de store-orders. Exportaciones identificadas: StoreOrders.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx y 11 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx y 11 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store-settings.tsx

**Nombre y ruta:** mobile/src/app/admin/store-settings.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de store-settings. Exportaciones identificadas: StoreSettings.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### store.tsx

**Nombre y ruta:** mobile/src/app/admin/store.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de store. Exportaciones identificadas: AdminStoreSection.

**Dependencias:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/admin/AdminSectionHub.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/admin/users/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: UserEditor.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/ConfirmModal.tsx y 13 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/ConfirmModal.tsx y 13 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/admin/users/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: UsersLayout.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/admin/users/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: UsersScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/admin/AdminPersonRow.tsx, mobile/src/hooks/useAdmin.ts y 20 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/admin/AdminPersonRow.tsx, mobile/src/hooks/useAdmin.ts y 20 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/admin/veterinarians/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: VeterinarianEditor.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/ConfirmModal.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/ConfirmModal.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/admin/veterinarians/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: VeterinariansLayout.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/admin/veterinarians/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: VeterinariansScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useAuth.ts y 18 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useAuth.ts y 18 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### specialties.tsx

**Nombre y ruta:** mobile/src/app/admin/veterinarians/specialties.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de specialties.

**Dependencias:** Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/admin/SpecialtiesScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### change-initial-password.tsx

**Nombre y ruta:** mobile/src/app/change-initial-password.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de change-initial-password. Exportaciones identificadas: ChangeInitialPasswordScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts, mobile/src/services/api.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts, mobile/src/services/api.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: ClientTabs.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/contexts/StoreCheckoutContext.tsx, mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/contexts/StoreCheckoutContext.tsx, mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### appointments.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/appointments.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de appointments. Exportaciones identificadas: AppointmentsScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: ClientHome.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleQuickAccess.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/types/client.ts, mobile/src/components/client/GeneralInformationCard.tsx y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleQuickAccess.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/types/client.ts, mobile/src/components/client/GeneralInformationCard.tsx y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pets.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/pets.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de pets. Exportaciones identificadas: PetsScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/constants/responsive.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/constants/responsive.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### profile.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/profile.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de profile. Exportaciones identificadas: ProfileScreen.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: ProductDetail.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: StoreStack.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### cart.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/cart.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de cart. Exportaciones identificadas: CartScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx y 2 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx y 2 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### checkout.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/checkout.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de checkout. Exportaciones identificadas: StoreCheckout.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/StoreCheckoutContext.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/AppText.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/StoreCheckoutContext.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/ui/AppText.tsx y 8 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### delivery.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/delivery.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de delivery. Exportaciones identificadas: DeliveryRedirect.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/client/(tabs)/store/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: StoreScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/Storefront.tsx, mobile/src/components/forms/AppInput.tsx y 6 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/Storefront.tsx, mobile/src/components/forms/AppInput.tsx y 6 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/client/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: ClientLayout.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/utils/personal-route-access.ts, mobile/src/utils/role-home.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/utils/personal-route-access.ts, mobile/src/utils/role-home.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/client/appointments/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: ClientAppointmentDetail.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### request.tsx

**Nombre y ruta:** mobile/src/app/client/appointments/request.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de request. Exportaciones identificadas: RequestAppointment.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 7 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 7 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### medical-history.tsx

**Nombre y ruta:** mobile/src/app/client/medical-history.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de medical-history. Exportaciones identificadas: History.

**Dependencias:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notifications.tsx

**Nombre y ruta:** mobile/src/app/client/notifications.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de notifications. Exportaciones identificadas: NotificationsScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/services/notification-path.ts y 4 más Se utiliza desde: mobile/src/app/notifications.tsx

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/services/notification-path.ts y 4 más Se utiliza desde: mobile/src/app/notifications.tsx

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/client/orders/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: ClientOrderDetail.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/utils/display-labels.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/utils/display-labels.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/client/orders/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: ClientOrders.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/admin/AdminDataTable.tsx, mobile/src/constants/responsive.ts, mobile/src/utils/display-labels.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/admin/AdminDataTable.tsx, mobile/src/constants/responsive.ts, mobile/src/utils/display-labels.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [id].tsx

**Nombre y ruta:** mobile/src/app/client/payment-intents/[id].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [id]. Exportaciones identificadas: PaymentIntentScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### edit.tsx

**Nombre y ruta:** mobile/src/app/client/pets/[id]/edit.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de edit. Exportaciones identificadas: EditPet.

**Dependencias:** Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/client/pets/[id]/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index. Exportaciones identificadas: PetDetail.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/services/api.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/services/api.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 3 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### new.tsx

**Nombre y ruta:** mobile/src/app/client/pets/new.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de new. Exportaciones identificadas: AddPet.

**Dependencias:** Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/PetEditor.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### prescriptions.tsx

**Nombre y ruta:** mobile/src/app/client/prescriptions.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de prescriptions. Exportaciones identificadas: Prescriptions.

**Dependencias:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### appearance.tsx

**Nombre y ruta:** mobile/src/app/client/profile/appearance.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de appearance. Exportaciones identificadas: Appearance.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SelectionRow.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SelectionRow.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### edit.tsx

**Nombre y ruta:** mobile/src/app/client/profile/edit.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de edit. Exportaciones identificadas: ProfileEdit.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### security.tsx

**Nombre y ruta:** mobile/src/app/client/profile/security.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de security. Exportaciones identificadas: Security.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### recommendations.tsx

**Nombre y ruta:** mobile/src/app/client/recommendations.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de recommendations. Exportaciones identificadas: Recommendations.

**Dependencias:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### vaccines.tsx

**Nombre y ruta:** mobile/src/app/client/vaccines.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de vaccines. Exportaciones identificadas: Vaccines.

**Dependencias:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/client/ClinicalScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### index.tsx

**Nombre y ruta:** mobile/src/app/index.tsx

**Función:** Código fuente del proyecto.

**Contenido:** Entregar la decisión de entrada a EntryRedirect usando el usuario actual de AuthContext. Exportaciones identificadas: EntryScreen.

**Dependencias:** No se identificaron dependencias en la cabecera.

**Conexiones:** Sin conexiones estáticas locales detectadas.

**Ejemplo práctico:** Consulta la lógica concreta del archivo antes de atribuirle un flujo.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### login.tsx

**Nombre y ruta:** mobile/src/app/login.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de login. Exportaciones identificadas: LoginScreen.

**Dependencias:** Importa: mobile/src/components/forms/AuthForm.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/components/ui/RecoveryNotice.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/FormNotice.tsx y 5 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/forms/AuthForm.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/components/ui/RecoveryNotice.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/FormNotice.tsx y 5 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notifications.tsx

**Nombre y ruta:** mobile/src/app/notifications.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de notifications.

**Dependencias:** Importa: mobile/src/app/client/notifications.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/app/client/notifications.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### oauth.tsx

**Nombre y ruta:** mobile/src/app/oauth.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de oauth. Exportaciones identificadas: OAuthReturn.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/role-home.ts, mobile/src/services/api.ts, mobile/src/services/oauth.service.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/role-home.ts, mobile/src/services/api.ts, mobile/src/services/oauth.service.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/professional/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: Layout.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### agenda.tsx

**Nombre y ruta:** mobile/src/app/professional/agenda.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de agenda.

**Dependencias:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### appointment.tsx

**Nombre y ruta:** mobile/src/app/professional/appointment.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de appointment.

**Dependencias:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### index.tsx

**Nombre y ruta:** mobile/src/app/professional/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index.

**Dependencias:** Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### patient.tsx

**Nombre y ruta:** mobile/src/app/professional/patient.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patient.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### patients.tsx

**Nombre y ruta:** mobile/src/app/professional/patients.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patients.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### services.tsx

**Nombre y ruta:** mobile/src/app/professional/services.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de services. Exportaciones identificadas: ProfessionalServices.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### register.tsx

**Nombre y ruta:** mobile/src/app/register.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de register. Exportaciones identificadas: RegisterScreen.

**Dependencias:** Importa: mobile/src/components/forms/AuthForm.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/layout/LoginPets.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts y 2 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/forms/AuthForm.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/layout/LoginPets.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts y 2 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### reset-password.tsx

**Nombre y ruta:** mobile/src/app/reset-password.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de reset-password. Exportaciones identificadas: ResetPasswordScreen.

**Dependencias:** Importa: mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### [module].tsx

**Nombre y ruta:** mobile/src/app/vet/[module].tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de [module]. Exportaciones identificadas: LegacyModule.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### _layout.tsx

**Nombre y ruta:** mobile/src/app/vet/_layout.tsx

**Función:** Layout y navegación de la aplicación.

**Contenido:** Layout y navegación de la aplicación dentro de PetCare; agrupa las declaraciones de _layout. Exportaciones identificadas: Layout.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### agenda.tsx

**Nombre y ruta:** mobile/src/app/vet/agenda.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de agenda.

**Dependencias:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### appointment.tsx

**Nombre y ruta:** mobile/src/app/vet/appointment.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de appointment.

**Dependencias:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### client.tsx

**Nombre y ruta:** mobile/src/app/vet/client.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de client.

**Dependencias:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### clients.tsx

**Nombre y ruta:** mobile/src/app/vet/clients.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de clients.

**Dependencias:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ClientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### index.tsx

**Nombre y ruta:** mobile/src/app/vet/index.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de index.

**Dependencias:** Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### patient.tsx

**Nombre y ruta:** mobile/src/app/vet/patient.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patient.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### patients.tsx

**Nombre y ruta:** mobile/src/app/vet/patients.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de patients.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### products.tsx

**Nombre y ruta:** mobile/src/app/vet/products.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de products.

**Dependencias:** Importa: mobile/src/components/clinic/ClinicProductsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/ClinicProductsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### profile.tsx

**Nombre y ruta:** mobile/src/app/vet/profile.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de profile. Exportaciones identificadas: VeterinarianProfileRoute.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### record.tsx

**Nombre y ruta:** mobile/src/app/vet/record.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de record.

**Dependencias:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### workspace.tsx

**Nombre y ruta:** mobile/src/app/workspace.tsx

**Función:** Pantalla o ruta de la aplicación.

**Contenido:** Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de workspace. Exportaciones identificadas: WorkspaceHome.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/capability-modules.ts, mobile/src/components/layout/RoleQuickAccess.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/capability-modules.ts, mobile/src/components/layout/RoleQuickAccess.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminDataTable.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminDataTable.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminDataTable. Exportaciones identificadas: AdminDataTableColumn, AdminDataTable.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx y 2 más

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx y 2 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### AdminFormLayout.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminFormLayout.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminFormLayout. Exportaciones identificadas: AdminFormSection, AdminFormGrid, AdminFormField, AdminFormActions.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx y 1 más

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx y 1 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminListToolbar.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminListToolbar.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminListToolbar. Exportaciones identificadas: AdminListToolbar.

**Dependencias:** Importa: mobile/src/constants/responsive.ts, mobile/src/components/ui/FilterDisclosure.tsx Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx y 1 más

**Conexiones:** Importa: mobile/src/constants/responsive.ts, mobile/src/components/ui/FilterDisclosure.tsx Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx y 1 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminPageHeading.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminPageHeading.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminPageHeading. Exportaciones identificadas: AdminPageHeading.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useBackNavigation.ts, mobile/src/components/layout/BackButton.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useBackNavigation.ts, mobile/src/components/layout/BackButton.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminPersonRow.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminPersonRow.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminPersonRow. Exportaciones identificadas: AdminPersonRow.

**Dependencias:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts Se utiliza desde: mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx

**Conexiones:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts Se utiliza desde: mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminSectionHub.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminSectionHub.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminSectionHub. Exportaciones identificadas: AdminSection, AdminSectionHub.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/utils/admin-route-access.ts Se utiliza desde: mobile/src/app/admin/administration.tsx, mobile/src/app/admin/clinic.tsx, mobile/src/app/admin/store.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/utils/admin-route-access.ts Se utiliza desde: mobile/src/app/admin/administration.tsx, mobile/src/app/admin/clinic.tsx, mobile/src/app/admin/store.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AdminStatusBadge.tsx

**Nombre y ruta:** mobile/src/components/admin/AdminStatusBadge.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AdminStatusBadge. Exportaciones identificadas: AdminStatusBadge.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/utils/display-labels.ts Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/utils/display-labels.ts Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ConfirmNameModal.tsx

**Nombre y ruta:** mobile/src/components/admin/ConfirmNameModal.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ConfirmNameModal. Exportaciones identificadas: ConfirmNameModal.

**Dependencias:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/exact-name-confirmation.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/exact-name-confirmation.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SpecialtiesScreen.tsx

**Nombre y ruta:** mobile/src/components/admin/SpecialtiesScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SpecialtiesScreen. Exportaciones identificadas: SpecialtiesScreen.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAdmin.ts y 11 más Se utiliza desde: mobile/src/app/admin/specialties.tsx, mobile/src/app/admin/veterinarians/specialties.tsx

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAdmin.ts y 11 más Se utiliza desde: mobile/src/app/admin/specialties.tsx, mobile/src/app/admin/veterinarians/specialties.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicalScreen.tsx

**Nombre y ruta:** mobile/src/components/client/ClinicalScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicalScreen. Exportaciones identificadas: ClinicalScreen.

**Dependencias:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/medical-history.tsx, mobile/src/app/client/prescriptions.tsx, mobile/src/app/client/recommendations.tsx, mobile/src/app/client/vaccines.tsx

**Conexiones:** Importa: mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/medical-history.tsx, mobile/src/app/client/prescriptions.tsx, mobile/src/app/client/recommendations.tsx, mobile/src/app/client/vaccines.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### GeneralInformationCard.tsx

**Nombre y ruta:** mobile/src/components/client/GeneralInformationCard.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de GeneralInformationCard. Exportaciones identificadas: GeneralInformationCard.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/app/client/(tabs)/index.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/app/client/(tabs)/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetBirthDate.tsx

**Nombre y ruta:** mobile/src/components/client/PetBirthDate.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetBirthDate. Exportaciones identificadas: PetBirthDate.

**Dependencias:** Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/client/PetEditor.tsx

**Conexiones:** Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/client/PetEditor.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetBirthDate.web.tsx

**Nombre y ruta:** mobile/src/components/client/PetBirthDate.web.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetBirthDate.web. Exportaciones identificadas: PetBirthDate.

**Dependencias:** Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/forms/CalendarDateField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetCareDecorations.tsx

**Nombre y ruta:** mobile/src/components/client/PetCareDecorations.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetCareDecorations. Exportaciones identificadas: PetCareDecorationVariant, PetCareDecorativeBackground.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/ScreenContainer.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/ScreenContainer.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetCareUI.tsx

**Nombre y ruta:** mobile/src/components/client/PetCareUI.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetCareUI. Exportaciones identificadas: IconName, petSpeciesIcon, PetCarePetIllustration, PetCarePetCardDecoration, PetCareScreen, PetCareHero, PetCareHeader, PetCareCard, ResponsiveGrid, PetCareBadge, PetCareSection, PetCareIconButton, PetCareEmptyState, QueryState, PetCareAction, PetImage, money, dateTime, statusLabel.

**Dependencias:** Importa: mobile/src/components/layout/BackButton.tsx, mobile/src/hooks/useBackNavigation.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/LoadingIndicator.tsx, mobile/src/components/layout/PetCareLogo.tsx y 6 más Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 46 más

**Conexiones:** Importa: mobile/src/components/layout/BackButton.tsx, mobile/src/hooks/useBackNavigation.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/LoadingIndicator.tsx, mobile/src/components/layout/PetCareLogo.tsx y 6 más Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 46 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetEditor.tsx

**Nombre y ruta:** mobile/src/components/client/PetEditor.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetEditor. Exportaciones identificadas: PetEditor.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ImageUploadField.tsx y 11 más Se utiliza desde: mobile/src/app/client/pets/[id]/edit.tsx, mobile/src/app/client/pets/new.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/ImageUploadField.tsx y 11 más Se utiliza desde: mobile/src/app/client/pets/[id]/edit.tsx, mobile/src/app/client/pets/new.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### RecordCards.tsx

**Nombre y ruta:** mobile/src/components/client/RecordCards.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de RecordCards. Exportaciones identificadas: PetCard, ViewAllPetsButton, AppointmentCard, MedicalRecordCard, VaccineCard, PrescriptionCard, RecommendationCard, ProductCard, OrderCard.

**Dependencias:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/utils/display-labels.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/clinic-date.ts, mobile/src/utils/pet-status.ts, mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/pets/[id]/index.tsx, mobile/src/components/client/ClinicalScreen.tsx

**Conexiones:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/utils/display-labels.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/clinic-date.ts, mobile/src/utils/pet-status.ts, mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/pets/[id]/index.tsx, mobile/src/components/client/ClinicalScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SlotSelectionCard.tsx

**Nombre y ruta:** mobile/src/components/client/SlotSelectionCard.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SlotSelectionCard. Exportaciones identificadas: SlotSelectionCard.

**Dependencias:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/client/appointments/request.tsx, mobile/src/components/clinic/AppointmentScreen.tsx

**Conexiones:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/client/appointments/request.tsx, mobile/src/components/clinic/AppointmentScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### Storefront.tsx

**Nombre y ruta:** mobile/src/components/client/Storefront.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de Storefront. Exportaciones identificadas: StoreProductCard, PromotionCarousel, StoreBannerCarousel, ProductDetailModal.

**Dependencias:** Importa: mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useTheme.ts y 2 más Se utiliza desde: mobile/src/app/client/(tabs)/store/index.tsx

**Conexiones:** Importa: mobile/src/types/client.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useTheme.ts y 2 más Se utiliza desde: mobile/src/app/client/(tabs)/store/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AgendaScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/AgendaScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AgendaScreen. Exportaciones identificadas: AgendaScreen.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx y 13 más Se utiliza desde: mobile/src/app/admin/agenda.tsx, mobile/src/app/professional/agenda.tsx, mobile/src/app/vet/agenda.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/forms/AppSelectField.tsx y 13 más Se utiliza desde: mobile/src/app/admin/agenda.tsx, mobile/src/app/professional/agenda.tsx, mobile/src/app/vet/agenda.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppointmentScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/AppointmentScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppointmentScreen. Exportaciones identificadas: AppointmentScreen.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/SlotSelectionCard.tsx, mobile/src/components/ui/AppText.tsx y 11 más Se utiliza desde: mobile/src/app/admin/appointment.tsx, mobile/src/app/professional/appointment.tsx, mobile/src/app/vet/appointment.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/SlotSelectionCard.tsx, mobile/src/components/ui/AppText.tsx y 11 más Se utiliza desde: mobile/src/app/admin/appointment.tsx, mobile/src/app/professional/appointment.tsx, mobile/src/app/vet/appointment.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AvailabilityScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/AvailabilityScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AvailabilityScreen. Exportaciones identificadas: AvailabilityScreen.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/SearchFilterBar.tsx y 3 más Se utiliza desde: mobile/src/app/admin/availability.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/SearchFilterBar.tsx y 3 más Se utiliza desde: mobile/src/app/admin/availability.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### CatalogScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/CatalogScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de CatalogScreen. Exportaciones identificadas: CatalogScreen, ServiceScheduleModal.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx y 21 más Se utiliza desde: mobile/src/app/admin/catalog/[kind].tsx, mobile/src/components/clinic/AvailabilityScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx y 21 más Se utiliza desde: mobile/src/app/admin/catalog/[kind].tsx, mobile/src/components/clinic/AvailabilityScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClientsScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/ClientsScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClientsScreen. Exportaciones identificadas: ClientsScreen, ClientScreen.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/SearchFilterBar.tsx Se utiliza desde: mobile/src/app/admin/client.tsx, mobile/src/app/admin/clients.tsx, mobile/src/app/vet/client.tsx, mobile/src/app/vet/clients.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/SearchFilterBar.tsx Se utiliza desde: mobile/src/app/admin/client.tsx, mobile/src/app/admin/clients.tsx, mobile/src/app/vet/client.tsx, mobile/src/app/vet/clients.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicProductsScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/ClinicProductsScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicProductsScreen. Exportaciones identificadas: ClinicProductsScreen.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SearchFilterBar.tsx, mobile/src/components/ui/FilterDisclosure.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/components/ui/AppModal.tsx y 4 más Se utiliza desde: mobile/src/app/vet/products.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/SearchFilterBar.tsx, mobile/src/components/ui/FilterDisclosure.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/components/ui/AppModal.tsx y 4 más Se utiliza desde: mobile/src/app/vet/products.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicalScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/ClinicalScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicalScreen.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### PatientDetailScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/PatientDetailScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PatientDetailScreen. Exportaciones identificadas: PatientDetailScreen.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/types/clinic.ts, mobile/src/utils/clinic-date.ts y 10 más Se utiliza desde: mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/types/clinic.ts, mobile/src/utils/clinic-date.ts y 10 más Se utiliza desde: mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PatientLifecycleControl.tsx

**Nombre y ruta:** mobile/src/components/clinic/PatientLifecycleControl.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PatientLifecycleControl. Exportaciones identificadas: PatientLifecycleControl.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx y 4 más Se utiliza desde: mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx y 4 más Se utiliza desde: mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PatientListCard.tsx

**Nombre y ruta:** mobile/src/components/clinic/PatientListCard.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PatientListCard. Exportaciones identificadas: PatientListCard.

**Dependencias:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/admin/AdminStatusBadge.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/clinic/PatientLifecycleControl.tsx, mobile/src/types/clinic.ts, mobile/src/utils/clinic-date.ts y 1 más Se utiliza desde: mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/admin/AdminStatusBadge.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/clinic/PatientLifecycleControl.tsx, mobile/src/types/clinic.ts, mobile/src/utils/clinic-date.ts y 1 más Se utiliza desde: mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PatientsScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/PatientsScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PatientsScreen. Exportaciones identificadas: PatientsScreen, PatientScreen, ClinicalEditor.

**Dependencias:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx y 22 más Se utiliza desde: mobile/src/app/admin/patient.tsx, mobile/src/app/admin/patients.tsx, mobile/src/app/professional/patient.tsx, mobile/src/app/professional/patients.tsx, mobile/src/app/vet/patient.tsx, mobile/src/app/vet/patients.tsx, mobile/src/app/vet/record.tsx

**Conexiones:** Importa: mobile/src/hooks/useClinic.ts, mobile/src/hooks/useDebouncedValue.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx y 22 más Se utiliza desde: mobile/src/app/admin/patient.tsx, mobile/src/app/admin/patients.tsx, mobile/src/app/professional/patient.tsx, mobile/src/app/professional/patients.tsx, mobile/src/app/vet/patient.tsx, mobile/src/app/vet/patients.tsx, mobile/src/app/vet/record.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ProfessionalsScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/ProfessionalsScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ProfessionalsScreen. Exportaciones identificadas: ProfessionalsScreen.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 12 más Se utiliza desde: mobile/src/app/admin/professionals.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 12 más Se utiliza desde: mobile/src/app/admin/professionals.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### StaffHome.tsx

**Nombre y ruta:** mobile/src/components/clinic/StaffHome.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de StaffHome. Exportaciones identificadas: StaffHome.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleQuickAccess.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 2 más Se utiliza desde: mobile/src/app/professional/index.tsx, mobile/src/app/vet/index.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClinic.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleQuickAccess.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx y 2 más Se utiliza desde: mobile/src/app/professional/index.tsx, mobile/src/app/vet/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### VeterinarianProfileScreen.tsx

**Nombre y ruta:** mobile/src/components/clinic/VeterinarianProfileScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de VeterinarianProfileScreen. Exportaciones identificadas: VeterinarianProfileScreen.

**Dependencias:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/profile/AccountProfileScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ActivationForm.tsx

**Nombre y ruta:** mobile/src/components/forms/ActivationForm.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ActivationForm. Exportaciones identificadas: ActivationForm.

**Dependencias:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/services/api.ts, mobile/src/services/invitation-paths.ts, mobile/src/hooks/useAsyncAction.ts y 2 más Se utiliza desde: mobile/src/app/activate-account.tsx, mobile/src/app/activate-vet.tsx

**Conexiones:** Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/services/api.ts, mobile/src/services/invitation-paths.ts, mobile/src/hooks/useAsyncAction.ts y 2 más Se utiliza desde: mobile/src/app/activate-account.tsx, mobile/src/app/activate-vet.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppInput.tsx

**Nombre y ruta:** mobile/src/components/forms/AppInput.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppInput. Exportaciones identificadas: AppInput.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx y 29 más

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx y 29 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppSelectField.tsx

**Nombre y ruta:** mobile/src/components/forms/AppSelectField.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppSelectField. Exportaciones identificadas: SelectOption, AppSelectField.

**Dependencias:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/search-normalization.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx y 5 más

**Conexiones:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/search-normalization.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx y 5 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AuthForm.tsx

**Nombre y ruta:** mobile/src/components/forms/AuthForm.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AuthForm. Exportaciones identificadas: AuthField, AuthForm.

**Dependencias:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/auth-validation.ts Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx

**Conexiones:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/utils/auth-validation.ts Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### CalendarDateField.tsx

**Nombre y ruta:** mobile/src/components/forms/CalendarDateField.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de CalendarDateField. Exportaciones identificadas: CalendarDateField.

**Dependencias:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/pet-date.ts Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/components/client/PetBirthDate.tsx, mobile/src/components/client/PetBirthDate.web.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/components/forms/ClinicDateTimeField.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/pet-date.ts Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/components/client/PetBirthDate.tsx, mobile/src/components/client/PetBirthDate.web.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/components/forms/ClinicDateTimeField.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### CalendarDateField.web.tsx

**Nombre y ruta:** mobile/src/components/forms/CalendarDateField.web.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de CalendarDateField.web. Exportaciones identificadas: CalendarDateField.

**Dependencias:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/pet-date.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/utils/pet-date.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicDateTimeField.tsx

**Nombre y ruta:** mobile/src/components/forms/ClinicDateTimeField.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicDateTimeField. Exportaciones identificadas: ClinicDateTimeField.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/ClinicTimeField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/ClinicTimeField.tsx, mobile/src/utils/clinic-date.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicTimeField.tsx

**Nombre y ruta:** mobile/src/components/forms/ClinicTimeField.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicTimeField. Exportaciones identificadas: ClinicTimeField.

**Dependencias:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ClinicDateTimeField.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ClinicDateTimeField.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ClinicTimeField.web.tsx

**Nombre y ruta:** mobile/src/components/forms/ClinicTimeField.web.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ClinicTimeField.web. Exportaciones identificadas: ClinicTimeField.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ImageUploadField.tsx

**Nombre y ruta:** mobile/src/components/forms/ImageUploadField.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ImageUploadField. Exportaciones identificadas: ImageUploadField.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/forms/ProfilePhotoInput.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### OAuthRegistrationModal.tsx

**Nombre y ruta:** mobile/src/components/forms/OAuthRegistrationModal.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de OAuthRegistrationModal. Exportaciones identificadas: OAuthRegistrationModal.

**Dependencias:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AuthForm.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/_layout.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AuthForm.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/_layout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ProfilePhotoInput.tsx

**Nombre y ruta:** mobile/src/components/forms/ProfilePhotoInput.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ProfilePhotoInput. Exportaciones identificadas: PickedProfilePhoto, ProfilePhotoInput.

**Dependencias:** Importa: mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/profile/AccountProfileScreen.tsx

**Conexiones:** Importa: mobile/src/components/forms/ImageUploadField.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/profile/AccountProfileScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SearchableMultiSelect.tsx

**Nombre y ruta:** mobile/src/components/forms/SearchableMultiSelect.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SearchableMultiSelect. Exportaciones identificadas: SearchableMultiSelect.

**Dependencias:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/forms/AppSelectField.tsx, mobile/src/utils/search-normalization.ts Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx

**Conexiones:** Importa: mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/forms/AppSelectField.tsx, mobile/src/utils/search-normalization.ts Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### VerificationCodeInput.tsx

**Nombre y ruta:** mobile/src/components/forms/VerificationCodeInput.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de VerificationCodeInput. Exportaciones identificadas: VerificationCodeInput.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/ui/VerificationCodeModal.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/ui/VerificationCodeModal.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppBreadcrumbs.tsx

**Nombre y ruta:** mobile/src/components/layout/AppBreadcrumbs.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppBreadcrumbs. Exportaciones identificadas: AppBreadcrumbs.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AuthHeader.tsx

**Nombre y ruta:** mobile/src/components/layout/AuthHeader.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AuthHeader. Exportaciones identificadas: AuthHeader.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### BackButton.tsx

**Nombre y ruta:** mobile/src/components/layout/BackButton.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de BackButton. Exportaciones identificadas: BackButton.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useBackNavigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/hooks/useBackNavigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### EntryRedirect.tsx

**Nombre y ruta:** mobile/src/components/layout/EntryRedirect.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de EntryRedirect. Exportaciones identificadas: EntryRedirect.

**Dependencias:** Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/app/index.tsx

**Conexiones:** Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/app/index.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### GlobalNavigation.tsx

**Nombre y ruta:** mobile/src/components/layout/GlobalNavigation.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de GlobalNavigation. Exportaciones identificadas: useAdminModules, useAdminModulesLoading, GlobalNavigation.

**Dependencias:** Importa: mobile/src/services/notification-events.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/utils/role-label.ts, mobile/src/constants/surface.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/PetCareLogo.tsx y 11 más Se utiliza desde: mobile/src/app/_layout.tsx

**Conexiones:** Importa: mobile/src/services/notification-events.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/utils/role-label.ts, mobile/src/constants/surface.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/PetCareLogo.tsx y 11 más Se utiliza desde: mobile/src/app/_layout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### LoginBrand.tsx

**Nombre y ruta:** mobile/src/components/layout/LoginBrand.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de LoginBrand. Exportaciones identificadas: LoginBrand.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/layout/PetCareLogo.tsx Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/app/reset-password.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/components/layout/PetCareLogo.tsx Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/app/reset-password.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### LoginLayout.tsx

**Nombre y ruta:** mobile/src/components/layout/LoginLayout.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de LoginLayout. Exportaciones identificadas: LoginLayout.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/layout/LoginPets.tsx, mobile/src/constants/responsive.ts, mobile/src/components/client/PetCareDecorations.tsx Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/app/reset-password.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/layout/LoginPets.tsx, mobile/src/constants/responsive.ts, mobile/src/components/client/PetCareDecorations.tsx Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/app/reset-password.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### LoginPets.tsx

**Nombre y ruta:** mobile/src/components/layout/LoginPets.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de LoginPets. Exportaciones identificadas: LoginPets.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/register.tsx, mobile/src/components/layout/LoginLayout.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/register.tsx, mobile/src/components/layout/LoginLayout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### PetCareLogo.tsx

**Nombre y ruta:** mobile/src/components/layout/PetCareLogo.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de PetCareLogo. Exportaciones identificadas: PetCareLogo.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/LoginBrand.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/LoginBrand.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### RoleBottomNavigation.tsx

**Nombre y ruta:** mobile/src/components/layout/RoleBottomNavigation.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de RoleBottomNavigation. Exportaciones identificadas: NavigationTab, RoleBottomNavigation.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/RoleNavigationContext.tsx, mobile/src/components/layout/RoleQuickAccess.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/RoleNavigationContext.tsx, mobile/src/components/layout/RoleQuickAccess.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### RoleNavigationContext.tsx

**Nombre y ruta:** mobile/src/components/layout/RoleNavigationContext.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de RoleNavigationContext. Exportaciones identificadas: RoleQuickAccessProvider, useRoleQuickAccess.

**Dependencias:** Importa: mobile/src/components/layout/RoleBottomNavigation.tsx Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/RoleQuickAccess.tsx

**Conexiones:** Importa: mobile/src/components/layout/RoleBottomNavigation.tsx Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/RoleQuickAccess.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### RoleQuickAccess.tsx

**Nombre y ruta:** mobile/src/components/layout/RoleQuickAccess.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de RoleQuickAccess. Exportaciones identificadas: RoleQuickAccess.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleNavigationContext.tsx, mobile/src/components/layout/RoleBottomNavigation.tsx Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/workspace.tsx, mobile/src/components/clinic/StaffHome.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/RoleNavigationContext.tsx, mobile/src/components/layout/RoleBottomNavigation.tsx Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/workspace.tsx, mobile/src/components/clinic/StaffHome.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ScreenContainer.tsx

**Nombre y ruta:** mobile/src/components/layout/ScreenContainer.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ScreenContainer. Exportaciones identificadas: ScreenContainer.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/client/PetCareDecorations.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 7 más

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/responsive.ts, mobile/src/components/client/PetCareDecorations.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 7 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### WebScrollStyles.tsx

**Nombre y ruta:** mobile/src/components/layout/WebScrollStyles.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de WebScrollStyles. Exportaciones identificadas: WebScrollStyles.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### WebScrollStyles.web.tsx

**Nombre y ruta:** mobile/src/components/layout/WebScrollStyles.web.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de WebScrollStyles.web. Exportaciones identificadas: WebScrollStyles.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### NotificationBridge.native.tsx

**Nombre y ruta:** mobile/src/components/notifications/NotificationBridge.native.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de NotificationBridge.native. Exportaciones identificadas: NotificationBridge.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: mobile/src/components/notifications/NotificationBridge.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: mobile/src/components/notifications/NotificationBridge.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### NotificationBridge.tsx

**Nombre y ruta:** mobile/src/components/notifications/NotificationBridge.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de NotificationBridge.

**Dependencias:** Importa: mobile/src/components/notifications/NotificationBridge.native.tsx Se utiliza desde: mobile/src/app/_layout.tsx

**Conexiones:** Importa: mobile/src/components/notifications/NotificationBridge.native.tsx Se utiliza desde: mobile/src/app/_layout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### NotificationBridge.web.tsx

**Nombre y ruta:** mobile/src/components/notifications/NotificationBridge.web.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de NotificationBridge.web. Exportaciones identificadas: NotificationBridge.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AccountProfileScreen.tsx

**Nombre y ruta:** mobile/src/components/profile/AccountProfileScreen.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AccountProfileScreen. Exportaciones identificadas: AccountProfileScreen, ProfileEditRoute, ProfileSecurityRoute.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/services/api.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts y 15 más Se utiliza desde: mobile/src/app/account.tsx, mobile/src/app/client/(tabs)/profile.tsx, mobile/src/app/client/profile/edit.tsx, mobile/src/app/client/profile/security.tsx, mobile/src/app/vet/profile.tsx, mobile/src/components/clinic/VeterinarianProfileScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClient.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/hooks/useTheme.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/services/api.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts y 15 más Se utiliza desde: mobile/src/app/account.tsx, mobile/src/app/client/(tabs)/profile.tsx, mobile/src/app/client/profile/edit.tsx, mobile/src/app/client/profile/security.tsx, mobile/src/app/vet/profile.tsx, mobile/src/components/clinic/VeterinarianProfileScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppButton.tsx

**Nombre y ruta:** mobile/src/components/ui/AppButton.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppButton. Exportaciones identificadas: AppButton.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 51 más

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 51 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppModal.tsx

**Nombre y ruta:** mobile/src/components/ui/AppModal.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppModal. Exportaciones identificadas: AppModal.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/components/admin/ConfirmNameModal.tsx y 17 más

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/components/admin/ConfirmNameModal.tsx y 17 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### AppText.tsx

**Nombre y ruta:** mobile/src/components/ui/AppText.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de AppText. Exportaciones identificadas: AppText.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 83 más

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 83 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### CompactPagination.tsx

**Nombre y ruta:** mobile/src/components/ui/CompactPagination.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de CompactPagination. Exportaciones identificadas: CompactPagination.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ConfirmModal.tsx

**Nombre y ruta:** mobile/src/components/ui/ConfirmModal.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de ConfirmModal. Exportaciones identificadas: ConfirmModal.

**Dependencias:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 10 más

**Conexiones:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 10 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### FilterDisclosure.tsx

**Nombre y ruta:** mobile/src/components/ui/FilterDisclosure.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de FilterDisclosure. Exportaciones identificadas: FilterDisclosure.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/components/admin/AdminListToolbar.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/ClinicProductsScreen.tsx, mobile/src/components/ui/SearchFilterBar.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/constants/responsive.ts Se utiliza desde: mobile/src/components/admin/AdminListToolbar.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/ClinicProductsScreen.tsx, mobile/src/components/ui/SearchFilterBar.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### FormNotice.tsx

**Nombre y ruta:** mobile/src/components/ui/FormNotice.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de FormNotice. Exportaciones identificadas: FormNotice.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 30 más

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 30 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### LoadingIndicator.tsx

**Nombre y ruta:** mobile/src/components/ui/LoadingIndicator.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de LoadingIndicator. Exportaciones identificadas: LoadingIndicator.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### OAuthLinks.tsx

**Nombre y ruta:** mobile/src/components/ui/OAuthLinks.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de OAuthLinks. Exportaciones identificadas: OAuthLinks.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### OAuthSignInOptions.tsx

**Nombre y ruta:** mobile/src/components/ui/OAuthSignInOptions.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de OAuthSignInOptions. Exportaciones identificadas: OAuthSignInOptions.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/oauth.service.ts, mobile/src/services/api.ts, mobile/src/utils/oauth-availability.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 1 más Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/oauth.service.ts, mobile/src/services/api.ts, mobile/src/utils/oauth-availability.ts, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx y 1 más Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### RecoveryNotice.tsx

**Nombre y ruta:** mobile/src/components/ui/RecoveryNotice.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de RecoveryNotice. Exportaciones identificadas: RecoveryNotice.

**Dependencias:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts Se utiliza desde: mobile/src/app/login.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts Se utiliza desde: mobile/src/app/login.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SearchFilterBar.tsx

**Nombre y ruta:** mobile/src/components/ui/SearchFilterBar.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SearchFilterBar. Exportaciones identificadas: SearchFilterBar.

**Dependencias:** Importa: mobile/src/components/ui/FilterDisclosure.tsx, mobile/src/components/admin/AdminListToolbar.tsx Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/ClientsScreen.tsx, mobile/src/components/clinic/ClinicProductsScreen.tsx

**Conexiones:** Importa: mobile/src/components/ui/FilterDisclosure.tsx, mobile/src/components/admin/AdminListToolbar.tsx Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AvailabilityScreen.tsx, mobile/src/components/clinic/ClientsScreen.tsx, mobile/src/components/clinic/ClinicProductsScreen.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SelectionRow.tsx

**Nombre y ruta:** mobile/src/components/ui/SelectionRow.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SelectionRow. Exportaciones identificadas: SelectionRow.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx y 16 más

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx y 16 más

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### SocialLoginButton.tsx

**Nombre y ruta:** mobile/src/components/ui/SocialLoginButton.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de SocialLoginButton. Exportaciones identificadas: SocialLoginButton.

**Dependencias:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/ui/OAuthSignInOptions.tsx

**Conexiones:** Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/ui/OAuthSignInOptions.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### VerificationCodeModal.tsx

**Nombre y ruta:** mobile/src/components/ui/VerificationCodeModal.tsx

**Función:** Componente visual reutilizable o pantalla compuesta.

**Contenido:** Componente visual reutilizable o pantalla compuesta dentro de PetCare; agrupa las declaraciones de VerificationCodeModal. Exportaciones identificadas: VerificationCodeModal.

**Dependencias:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/forms/VerificationCodeInput.tsx, mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAuth.ts, mobile/src/contexts/FeedbackContext.tsx y 4 más Se utiliza desde: mobile/src/app/_layout.tsx

**Conexiones:** Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/components/forms/VerificationCodeInput.tsx, mobile/src/hooks/useTheme.ts, mobile/src/hooks/useAuth.ts, mobile/src/contexts/FeedbackContext.tsx y 4 más Se utiliza desde: mobile/src/app/_layout.tsx

**Ejemplo práctico:** Recibe props, presenta o edita datos y comunica acciones mediante callbacks; la implementación define sus estados y errores.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### responsive.ts

**Nombre y ruta:** mobile/src/constants/responsive.ts

**Función:** Constantes compartidas de presentación o comportamiento.

**Contenido:** Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de responsive. Exportaciones identificadas: responsiveLayout, isWebAtLeast, patientDetailPresentation, desktopSidebarWidth.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/notifications.tsx, mobile/src/app/client/orders/index.tsx y 26 más

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/notifications.tsx, mobile/src/app/client/orders/index.tsx y 26 más

**Ejemplo práctico:** Expone valores de referencia compartidos por los módulos que los importan.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### surface.ts

**Nombre y ruta:** mobile/src/constants/surface.ts

**Función:** Constantes compartidas de presentación o comportamiento.

**Contenido:** Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de surface. Exportaciones identificadas: softSurfaceShadow.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/components/admin/AdminPersonRow.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/Storefront.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/components/admin/AdminPersonRow.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/Storefront.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx

**Ejemplo práctico:** Expone valores de referencia compartidos por los módulos que los importan.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### theme.ts

**Nombre y ruta:** mobile/src/constants/theme.ts

**Función:** Constantes compartidas de presentación o comportamiento.

**Contenido:** Constantes compartidas de presentación o comportamiento dentro de PetCare; agrupa las declaraciones de theme. Exportaciones identificadas: themes.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/ThemeContext.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/ThemeContext.tsx

**Ejemplo práctico:** Expone valores de referencia compartidos por los módulos que los importan.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### AuthContext.tsx

**Nombre y ruta:** mobile/src/contexts/AuthContext.tsx

**Función:** Proveedor de estado compartido.

**Contenido:** Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de AuthContext. Exportaciones identificadas: AuthContext, AuthProvider.

**Dependencias:** Importa: mobile/src/services/auth.service.ts, mobile/src/services/api.ts, mobile/src/services/session-store.ts, mobile/src/types/auth.ts, mobile/src/services/verification.service.ts, mobile/src/utils/authorization.ts, mobile/src/services/oauth.service.ts, mobile/src/utils/single-flight.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/hooks/useAuth.ts

**Conexiones:** Importa: mobile/src/services/auth.service.ts, mobile/src/services/api.ts, mobile/src/services/session-store.ts, mobile/src/types/auth.ts, mobile/src/services/verification.service.ts, mobile/src/utils/authorization.ts, mobile/src/services/oauth.service.ts, mobile/src/utils/single-flight.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/hooks/useAuth.ts

**Ejemplo práctico:** Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### FeedbackContext.tsx

**Nombre y ruta:** mobile/src/contexts/FeedbackContext.tsx

**Función:** Proveedor de estado compartido.

**Contenido:** Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de FeedbackContext. Exportaciones identificadas: FeedbackProvider, useFeedback.

**Dependencias:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx y 19 más

**Conexiones:** Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx y 19 más

**Ejemplo práctico:** Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### StoreCheckoutContext.tsx

**Nombre y ruta:** mobile/src/contexts/StoreCheckoutContext.tsx

**Función:** Proveedor de estado compartido.

**Contenido:** Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de StoreCheckoutContext. Exportaciones identificadas: CheckoutAddress, StoreCheckoutProvider, useStoreCheckout.

**Dependencias:** Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx

**Conexiones:** Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx

**Ejemplo práctico:** Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### ThemeContext.tsx

**Nombre y ruta:** mobile/src/contexts/ThemeContext.tsx

**Función:** Proveedor de estado compartido.

**Contenido:** Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de ThemeContext. Exportaciones identificadas: ThemeContext, ThemeProvider.

**Dependencias:** Importa: mobile/src/constants/theme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/hooks/useTheme.ts

**Conexiones:** Importa: mobile/src/constants/theme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/hooks/useTheme.ts

**Ejemplo práctico:** Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useAdmin.ts

**Nombre y ruta:** mobile/src/hooks/useAdmin.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAdmin. Exportaciones identificadas: useAdmin.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/admin.service.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/admin/AdminSectionHub.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx y 1 más

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/admin.service.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/admin/AdminSectionHub.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx y 1 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useAsyncAction.ts

**Nombre y ruta:** mobile/src/hooks/useAsyncAction.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAsyncAction. Exportaciones identificadas: useAsyncAction.

**Dependencias:** Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/change-initial-password.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/appointments/request.tsx y 18 más

**Conexiones:** Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/change-initial-password.tsx, mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/appointments/request.tsx y 18 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useAuth.ts

**Nombre y ruta:** mobile/src/hooks/useAuth.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useAuth. Exportaciones identificadas: useAuth.

**Dependencias:** Importa: mobile/src/contexts/AuthContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 46 más

**Conexiones:** Importa: mobile/src/contexts/AuthContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 46 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useBackNavigation.ts

**Nombre y ruta:** mobile/src/hooks/useBackNavigation.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useBackNavigation. Exportaciones identificadas: useBackNavigation.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/utils/back-navigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/BackButton.tsx, mobile/src/components/layout/GlobalNavigation.tsx

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/utils/back-navigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/BackButton.tsx, mobile/src/components/layout/GlobalNavigation.tsx

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useClient.ts

**Nombre y ruta:** mobile/src/hooks/useClient.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClient. Exportaciones identificadas: useClient.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/client.service.ts Se utiliza desde: mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/[id].tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/[id].tsx y 10 más

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/client.service.ts Se utiliza desde: mobile/src/app/client/(tabs)/appointments.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/(tabs)/store/[id].tsx, mobile/src/app/client/(tabs)/store/cart.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/[id].tsx y 10 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useClientQuery.ts

**Nombre y ruta:** mobile/src/hooks/useClientQuery.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClientQuery. Exportaciones identificadas: useClientQuery.

**Dependencias:** Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx y 33 más

**Conexiones:** Importa: mobile/src/services/api.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx y 33 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### useClinic.ts

**Nombre y ruta:** mobile/src/hooks/useClinic.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useClinic. Exportaciones identificadas: useClinic.

**Dependencias:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/clinic.service.ts Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/professional/services.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 10 más

**Conexiones:** Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/clinic.service.ts Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/professional/services.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 10 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useDebouncedValue.ts

**Nombre y ruta:** mobile/src/hooks/useDebouncedValue.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useDebouncedValue. Exportaciones identificadas: useDebouncedValue.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### useTheme.ts

**Nombre y ruta:** mobile/src/hooks/useTheme.ts

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useTheme. Exportaciones identificadas: useTheme.

**Dependencias:** Importa: mobile/src/contexts/ThemeContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/[id].tsx y 61 más

**Conexiones:** Importa: mobile/src/contexts/ThemeContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/[id].tsx y 61 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### useUnsavedChangesGuard.tsx

**Nombre y ruta:** mobile/src/hooks/useUnsavedChangesGuard.tsx

**Función:** Hook de React para compartir estado o comportamiento.

**Contenido:** Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useUnsavedChangesGuard. Exportaciones identificadas: useUnsavedChangesGuard.

**Dependencias:** Importa: mobile/src/components/ui/ConfirmModal.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx y 1 más

**Conexiones:** Importa: mobile/src/components/ui/ConfirmModal.tsx Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx y 1 más

**Ejemplo práctico:** Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin.service.ts

**Nombre y ruta:** mobile/src/services/admin.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de admin.service. Exportaciones identificadas: adminService.

**Dependencias:** Importa: mobile/src/services/client.service.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/hooks/useAdmin.ts

**Conexiones:** Importa: mobile/src/services/client.service.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/hooks/useAdmin.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### api.ts

**Nombre y ruta:** mobile/src/services/api.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de api. Exportaciones identificadas: ApiError, ApiFieldError, PRODUCTION_API_URL, developmentApiUrl, resolveApiUrl, getApiUrl, buildApiEndpoint, apiRequest, friendlyError.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/change-initial-password.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/pets/[id]/index.tsx y 15 más

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/change-initial-password.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/pets/[id]/index.tsx y 15 más

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth.service.ts

**Nombre y ruta:** mobile/src/services/auth.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de auth.service. Exportaciones identificadas: register, login, requestPasswordReset, resetPassword, changeInitialPassword, readAccessSession, refresh, logout, getCurrentUser.

**Dependencias:** Importa: mobile/src/services/api.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts, mobile/src/services/verification.service.ts Se utiliza desde: mobile/src/app/change-initial-password.tsx, mobile/src/app/reset-password.tsx, mobile/src/components/ui/RecoveryNotice.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/oauth.service.ts

**Conexiones:** Importa: mobile/src/services/api.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts, mobile/src/services/verification.service.ts Se utiliza desde: mobile/src/app/change-initial-password.tsx, mobile/src/app/reset-password.tsx, mobile/src/components/ui/RecoveryNotice.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/oauth.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### client.service.ts

**Nombre y ruta:** mobile/src/services/client.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de client.service. Exportaciones identificadas: ClientRequest, clientService.

**Dependencias:** Importa: mobile/src/types/client.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/hooks/useClient.ts, mobile/src/services/admin.service.ts, mobile/src/services/clinic.service.ts

**Conexiones:** Importa: mobile/src/types/client.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/hooks/useClient.ts, mobile/src/services/admin.service.ts, mobile/src/services/clinic.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic.service.ts

**Nombre y ruta:** mobile/src/services/clinic.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de clinic.service. Exportaciones identificadas: StoreOrder, StoreOrderDetail, clinicService.

**Dependencias:** Importa: mobile/src/types/client.ts, mobile/src/services/client.service.ts, mobile/src/types/clinic.ts Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/hooks/useClinic.ts

**Conexiones:** Importa: mobile/src/types/client.ts, mobile/src/services/client.service.ts, mobile/src/types/clinic.ts Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/hooks/useClinic.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### invitation-paths.ts

**Nombre y ruta:** mobile/src/services/invitation-paths.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de invitation-paths. Exportaciones identificadas: invitationAcceptancePath.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/ActivationForm.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/ActivationForm.tsx

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### notification-events.ts

**Nombre y ruta:** mobile/src/services/notification-events.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de notification-events. Exportaciones identificadas: subscribeToNotificationChanges, publishNotificationChange.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### notification-path.ts

**Nombre y ruta:** mobile/src/services/notification-path.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de notification-path. Exportaciones identificadas: notificationCenterPath, isWorkNotification, notificationMatchesContext, notificationPath.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth-flow.ts

**Nombre y ruta:** mobile/src/services/oauth-flow.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de oauth-flow. Exportaciones identificadas: OAuthCallbackResult, parseOAuthCallback, nativeOAuthSupported, oauthBrowserResultError.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/services/oauth.service.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/services/oauth.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### oauth.service.ts

**Nombre y ruta:** mobile/src/services/oauth.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de oauth.service. Exportaciones identificadas: OAuthProvider, OAuthProviderAvailability, OAuthPending, oauthDiagnostic, getOAuthProviderAvailability, beginOAuth, clearWebOAuthReturn, exchangeWebOAuthReturn, completeOAuth.

**Dependencias:** Importa: mobile/src/services/api.ts, mobile/src/services/auth.service.ts, mobile/src/types/auth.ts, mobile/src/services/web-session-store.ts, mobile/src/services/oauth-flow.ts Se utiliza desde: mobile/src/app/oauth.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/utils/oauth-availability.ts

**Conexiones:** Importa: mobile/src/services/api.ts, mobile/src/services/auth.service.ts, mobile/src/types/auth.ts, mobile/src/services/web-session-store.ts, mobile/src/services/oauth-flow.ts Se utiliza desde: mobile/src/app/oauth.tsx, mobile/src/components/ui/OAuthSignInOptions.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/utils/oauth-availability.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### session-store.ts

**Nombre y ruta:** mobile/src/services/session-store.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de session-store. Exportaciones identificadas: saveSession, clearSession, readSession.

**Dependencias:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts, mobile/src/services/web-session-store.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Conexiones:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts, mobile/src/services/web-session-store.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### verification.service.ts

**Nombre y ruta:** mobile/src/services/verification.service.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de verification.service. Exportaciones identificadas: readVerification, resendCode, verifyCode.

**Dependencias:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts

**Conexiones:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### web-session-store.ts

**Nombre y ruta:** mobile/src/services/web-session-store.ts

**Función:** Cliente de API o servicio del frontend.

**Contenido:** Cliente de API o servicio del frontend dentro de PetCare; agrupa las declaraciones de web-session-store. Exportaciones identificadas: saveWebSession, clearWebSession, saveWebOAuthProof, hasWebOAuthProof, readWebOAuthProof, clearWebOAuthProof, readWebSession.

**Dependencias:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/services/oauth.service.ts, mobile/src/services/session-store.ts

**Conexiones:** Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/services/oauth.service.ts, mobile/src/services/session-store.ts

**Ejemplo práctico:** Coordina operaciones del dominio y delega en las dependencias importadas; devuelve resultados o propaga errores según el contrato implementado.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### admin.ts

**Nombre y ruta:** mobile/src/types/admin.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de admin. Exportaciones identificadas: AdminRole, AdminPermission, AdminCatalog, AdminUser, UserPermission, AdminUserDetail, AdminUserPage, AdminHome, GeneralInformation, Weekday, OpeningHours.

**Dependencias:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/client/GeneralInformationCard.tsx, mobile/src/services/admin.service.ts, mobile/src/services/client.service.ts

**Conexiones:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/client/GeneralInformationCard.tsx, mobile/src/services/admin.service.ts, mobile/src/services/client.service.ts

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### auth.ts

**Nombre y ruta:** mobile/src/types/auth.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de auth. Exportaciones identificadas: AuthUser, LoginValues, RegisterValues, AccessSession, StoredSession, VerificationChallenge, RegistrationFormValues, RegistrationResult.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts y 10 más

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts y 10 más

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### client.ts

**Nombre y ruta:** mobile/src/types/client.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de client. Exportaciones identificadas: CatalogItem, PetSex, PetLifecycleEvent, Pet, PetValues, PetCatalog, Appointment, AppointmentCatalog, Slot, ClinicalKind, ClinicalRecord, Product, PromotionBanner, StoreBanner, CartItem, Cart, DeliveryZone, FulfillmentSettings, DeliveryQuote, DeliveryAddress, Order, OrderDetail, Notification, NotificationPage, Home.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/ClinicalScreen.tsx, mobile/src/components/client/PetEditor.tsx y 7 más

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/index.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx, mobile/src/app/client/(tabs)/store/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/ClinicalScreen.tsx, mobile/src/components/client/PetEditor.tsx y 7 más

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### clinic.ts

**Nombre y ruta:** mobile/src/types/clinic.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de clinic. Exportaciones identificadas: ClinicRow, ClinicCatalog.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/services/clinic.service.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/services/clinic.service.ts

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### veterinarian.ts

**Nombre y ruta:** mobile/src/types/veterinarian.ts

**Función:** Tipos y contratos TypeScript.

**Contenido:** Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de veterinarian. Exportaciones identificadas: Specialty, VetCatalog, VetSummary, VetDetail, VetPage, VetValues.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx

**Ejemplo práctico:** Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### admin-permissions.ts

**Nombre y ruta:** mobile/src/utils/admin-permissions.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de admin-permissions. Exportaciones identificadas: PermissionModule, groupPermissionsByModule.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### admin-route-access.ts

**Nombre y ruta:** mobile/src/utils/admin-route-access.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de admin-route-access. Exportaciones identificadas: PermissionCheck, canAccessAdminPath.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/components/admin/AdminSectionHub.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/components/admin/AdminSectionHub.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### agenda-screen-config.ts

**Nombre y ruta:** mobile/src/utils/agenda-screen-config.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de agenda-screen-config. Exportaciones identificadas: AgendaPermissionCheck, agendaScreenConfig.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### appointment-display.ts

**Nombre y ruta:** mobile/src/utils/appointment-display.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de appointment-display. Exportaciones identificadas: appointmentRouteId, appointmentDisplayValue.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/StaffHome.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/StaffHome.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### auth-validation.ts

**Nombre y ruta:** mobile/src/utils/auth-validation.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de auth-validation. Exportaciones identificadas: FieldErrors, firstInvalidField, normalizeEmail, validateLoginForm, validateIdentityForm, validatePasswordForm, validateRegisterForm, registrationPayload, validateRegistrationForm.

**Dependencias:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/ActivationForm.tsx y 4 más

**Conexiones:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/ActivationForm.tsx y 4 más

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### authorization.ts

**Nombre y ruta:** mobile/src/utils/authorization.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de authorization. Exportaciones identificadas: hasRole, hasPermission.

**Dependencias:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Conexiones:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### back-navigation.ts

**Nombre y ruta:** mobile/src/utils/back-navigation.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de back-navigation. Exportaciones identificadas: shouldShowRouteBack, BackControlPlacement, backControlPlacement, BackNavigationAction, backNavigationAction.

**Dependencias:** Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/hooks/useBackNavigation.ts

**Conexiones:** Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/hooks/useBackNavigation.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### capability-modules.ts

**Nombre y ruta:** mobile/src/utils/capability-modules.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de capability-modules. Exportaciones identificadas: personalCapabilityModules, administrativeCapabilityModules, capabilityModules, hasCapabilityModule, hasPersonalCapabilityModule, personalModulesForCapabilities, modulesForCapabilities.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/workspace.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/utils/role-home.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/workspace.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/utils/role-home.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### checkout-validation.ts

**Nombre y ruta:** mobile/src/utils/checkout-validation.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de checkout-validation. Exportaciones identificadas: CheckoutAddressValues, CheckoutBuyerValues, CheckoutFieldErrors, validateCheckoutAddress, validateCheckoutBuyer, mapCheckoutFieldErrors.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/(tabs)/store/checkout.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/(tabs)/store/checkout.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### clinic-date.ts

**Nombre y ruta:** mobile/src/utils/clinic-date.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de clinic-date. Exportaciones identificadas: clinicInstant, clinicToday, clinicDate, clinicDateFilterToApi, clinicDateTime.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetBirthDate.tsx, mobile/src/components/client/PetBirthDate.web.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 6 más

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetBirthDate.tsx, mobile/src/components/client/PetBirthDate.web.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 6 más

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### display-labels.ts

**Nombre y ruta:** mobile/src/utils/display-labels.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de display-labels. Exportaciones identificadas: appointmentStatusLabel, orderStatusLabel, reservationStatusLabel, paymentStatusLabel, deliveryStatusLabel, generalStatusLabel, paymentMethodLabel, historyTypeLabel, historyStatusLabel.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/orders/[id].tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/admin/AdminStatusBadge.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/orders/[id].tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/admin/AdminStatusBadge.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### exact-name-confirmation.ts

**Nombre y ruta:** mobile/src/utils/exact-name-confirmation.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de exact-name-confirmation. Exportaciones identificadas: matchesExactConfirmation.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/ConfirmNameModal.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/ConfirmNameModal.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### fulfillment.ts

**Nombre y ruta:** mobile/src/utils/fulfillment.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de fulfillment. Exportaciones identificadas: hasDeliveryCoverage.

**Dependencias:** Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/store/checkout.tsx

**Conexiones:** Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/store/checkout.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### invitation-label.ts

**Nombre y ruta:** mobile/src/utils/invitation-label.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de invitation-label. Exportaciones identificadas: invitationLabel.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### mask-email.ts

**Nombre y ruta:** mobile/src/utils/mask-email.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de mask-email. Exportaciones identificadas: maskEmail.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### navigation-tabs.ts

**Nombre y ruta:** mobile/src/utils/navigation-tabs.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de navigation-tabs. Exportaciones identificadas: RoleNavigationItem, selectPrimaryNavigation, selectSecondaryNavigation, activePrimaryNavigationPath.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### oauth-availability.ts

**Nombre y ruta:** mobile/src/utils/oauth-availability.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de oauth-availability. Exportaciones identificadas: availableOAuthProviders.

**Dependencias:** Importa: mobile/src/services/oauth.service.ts Se utiliza desde: mobile/src/components/ui/OAuthSignInOptions.tsx

**Conexiones:** Importa: mobile/src/services/oauth.service.ts Se utiliza desde: mobile/src/components/ui/OAuthSignInOptions.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### password-reset-token.ts

**Nombre y ruta:** mobile/src/utils/password-reset-token.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de password-reset-token. Exportaciones identificadas: normalizePasswordResetToken, isValidPasswordResetToken.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/reset-password.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/reset-password.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### patient-screen-config.ts

**Nombre y ruta:** mobile/src/utils/patient-screen-config.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de patient-screen-config. Exportaciones identificadas: PatientPermissionCheck, patientScreenConfig.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### personal-route-access.ts

**Nombre y ruta:** mobile/src/utils/personal-route-access.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de personal-route-access. Exportaciones identificadas: personalPermissionsForPathname, canAccessNotificationCenter, canEnterPersonalPath.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/_layout.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx, mobile/src/utils/role-home.ts

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/_layout.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx, mobile/src/utils/role-home.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-date.ts

**Nombre y ruta:** mobile/src/utils/pet-date.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-date. Exportaciones identificadas: dateToApi, dateFromApi, displayPetDate, validPetDate.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/CalendarDateField.web.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/CalendarDateField.web.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-photo.ts

**Nombre y ruta:** mobile/src/utils/pet-photo.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-photo. Exportaciones identificadas: PET_PHOTO_MAX_BASE64_LENGTH, petPhotoResizePlan.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### pet-status.ts

**Nombre y ruta:** mobile/src/utils/pet-status.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-status. Exportaciones identificadas: PetActiveValue, normalizePetActiveFlag, petStatusBadge.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/app/client/pets/[id]/index.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/(tabs)/pets.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/app/client/pets/[id]/index.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### profile-photo.ts

**Nombre y ruta:** mobile/src/utils/profile-photo.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de profile-photo. Exportaciones identificadas: ProfilePhotoAssetMetadata, isValidProfilePhotoAsset.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### role-home.ts

**Nombre y ruta:** mobile/src/utils/role-home.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de role-home. Exportaciones identificadas: roleHome, canEnterClientRoot, canEnterWorkspace.

**Dependencias:** Importa: mobile/src/types/auth.ts, mobile/src/utils/capability-modules.ts, mobile/src/utils/personal-route-access.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/client/_layout.tsx, mobile/src/app/oauth.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/utils/back-navigation.ts

**Conexiones:** Importa: mobile/src/types/auth.ts, mobile/src/utils/capability-modules.ts, mobile/src/utils/personal-route-access.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/client/_layout.tsx, mobile/src/app/oauth.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/utils/back-navigation.ts

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### role-label.ts

**Nombre y ruta:** mobile/src/utils/role-label.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de role-label. Exportaciones identificadas: roleLabel.

**Dependencias:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/profile/AccountProfileScreen.tsx

**Conexiones:** Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/profile/AccountProfileScreen.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### search-normalization.ts

**Nombre y ruta:** mobile/src/utils/search-normalization.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de search-normalization. Exportaciones identificadas: normalizeSearchTerm.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### single-flight.ts

**Nombre y ruta:** mobile/src/utils/single-flight.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de single-flight. Exportaciones identificadas: createSingleFlight.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/AuthContext.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; revisar ejemplos y relaciones dinámicas en la siguiente pasada.

### store-fulfillment-validation.ts

**Nombre y ruta:** mobile/src/utils/store-fulfillment-validation.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de store-fulfillment-validation. Exportaciones identificadas: StoreFulfillmentFieldErrors, validatePostalCodePrefix, parseArsToCents, validateStoreFulfillment.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-settings.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-settings.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

### submission-gate.ts

**Nombre y ruta:** mobile/src/utils/submission-gate.ts

**Función:** Regla auxiliar de la interfaz.

**Contenido:** Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de submission-gate. Exportaciones identificadas: createSubmissionGate.

**Dependencias:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx

**Conexiones:** Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx

**Ejemplo práctico:** Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.

**Estado de revisión:** Cabecera creada; documentación detallada de funciones pendiente.

## Módulos revisados en detalle

Las funciones y contratos de estos 38 archivos ya tienen comentarios específicos en el código. Esta sección sintetiza su uso para el estudio.

### Utilidades de interfaz

- `mobile/src/utils/admin-permissions.ts`: agrupa grants por módulo para las pantallas de permisos y roles.
- `mobile/src/utils/admin-route-access.ts`: asocia rutas administrativas con permisos; las rutas desconocidas se cierran y la API valida cada acción.
- `mobile/src/utils/agenda-screen-config.ts`: calcula título, ruta base y capacidades visibles de agenda según rol/permisos.
- `mobile/src/utils/appointment-display.ts`: valida IDs de ruta y presenta valores defensivos de turnos.
- `mobile/src/utils/auth-validation.ts`: valida formularios de acceso/registro, mide bytes UTF-8 de contraseña y adapta nombre completo al contrato del servicio.
- `mobile/src/utils/authorization.ts`: ayuda a mostrar interfaz según rol/grants cargados; no sustituye autorización de API.
- `mobile/src/utils/back-navigation.ts`: decide si mostrar volver y si usar historial o inicio de rol como destino.
- `mobile/src/utils/capability-modules.ts`: filtra módulos personales/administrativos y elimina rutas repetidas.
- `mobile/src/utils/checkout-validation.ts`: valida dirección/comprador y mapea errores del servidor a claves UI.
- `mobile/src/utils/clinic-date.ts`: maneja fechas en la zona fija de Buenos Aires.
- `mobile/src/utils/display-labels.ts`: traduce estados de turnos, pedidos, pagos y entregas sin modificar códigos API.
- `mobile/src/utils/exact-name-confirmation.ts`: compara literalmente el nombre ingresado con el esperado.
- `mobile/src/utils/fulfillment.ts`: confirma si envío está habilitado y hay zonas configuradas.
- `mobile/src/utils/invitation-label.ts`: traduce estados de invitación con fallback.
- `mobile/src/utils/mask-email.ts`: oculta parte del email para presentarlo como pista.
- `mobile/src/utils/navigation-tabs.ts`: elige pestañas y resuelve rutas secundarias hacia navegación principal.
- `mobile/src/utils/oauth-availability.ts`: filtra providers OAuth explícitamente habilitados.
- `mobile/src/utils/password-reset-token.ts`: normaliza el token del query y comprueba 64 caracteres hexadecimales.
- `mobile/src/utils/patient-screen-config.ts`: configura controles visibles de pacientes; backend conserva autorización.
- `mobile/src/utils/personal-route-access.ts`: mapea rutas personales a capacidades.
- `mobile/src/utils/pet-date.ts`: conserva fechas de nacimiento como fechas civiles y rechaza inválidas/futuras.
- `mobile/src/utils/pet-photo.ts`: calcula alternativas de tamaño/calidad y el límite Base64 de fotos de mascota.
- `mobile/src/utils/pet-status.ts`: normaliza estados booleanos/números/texto y produce la insignia de estado.
- `mobile/src/utils/profile-photo.ts`: comprueba límites de foto de perfil.
- `mobile/src/utils/role-home.ts`: decide destino inicial según rol o sesión.
- `mobile/src/utils/role-label.ts`: presenta el nombre localizado de un rol con fallback.
- `mobile/src/utils/search-normalization.ts`: elimina diacríticos y normaliza minúsculas para buscar catálogos.
- `mobile/src/utils/single-flight.ts`: comparte una operación concurrente y libera la promesa al terminar.
- `mobile/src/utils/store-fulfillment-validation.ts`: valida prefijos postales, importes y configuración de entrega/retiro.
- `mobile/src/utils/submission-gate.ts`: impide doble envío mientras una operación está pendiente.

### Contratos y constantes

- `mobile/src/types/auth.ts`: contratos de perfil, login/registro, desafío de verificación y sesión. La confirmación de contraseña es local al formulario.
- `mobile/src/types/admin.ts`: respuestas administrativas para roles, permisos, usuarios, paginación y datos generales.
- `mobile/src/types/client.ts`: entidades de mascota, turnos, ficha, tienda, pedido, entrega y notificación.
- `mobile/src/types/clinic.ts`: filas y catálogos compartidos de clínica.
- `mobile/src/types/veterinarian.ts`: catálogo, resumen, detalle, página y valores editables de veterinario.
- `mobile/src/constants/theme.ts`: paletas light/dark consumidas por ThemeContext.
- `mobile/src/constants/surface.ts`: sombra adaptada a web/nativo.
- `mobile/src/constants/responsive.ts`: breakpoints y dimensiones compartidos por layouts y componentes adaptables.

### Hooks y estado compartido

- `mobile/src/hooks/useAsyncAction.ts`: ejecuta una acción asíncrona con estado loading/error, impide reentradas y evita actualizar tras desmontaje.
- `mobile/src/hooks/useAuth.ts` y `useTheme.ts`: consumen proveedores obligatorios con error temprano si se usan fuera del árbol configurado.
- `mobile/src/hooks/useBackNavigation.ts`: conecta ruta actual, rol e historial de Expo Router con la política reutilizable de volver.
- `mobile/src/hooks/useClient.ts`, `useClinic.ts` y `useAdmin.ts`: crean servicios memoizados enlazados al request autenticado.
- `mobile/src/hooks/useClientQuery.ts`: carga al enfocar, invalida resultados obsoletos y expone estado de consulta.
- `mobile/src/hooks/useDebouncedValue.ts`: difiere propagación de un valor mientras se escribe o filtra.
- `mobile/src/hooks/useUnsavedChangesGuard.tsx`: usa `usePreventRemove` y un modal para confirmar salida ante cambios no guardados.
- `mobile/src/contexts/AuthContext.tsx`: estado global de sesión, renovación, login/registro/OAuth, verificación y request autenticado. Es el contexto más complejo del cliente.
- `mobile/src/contexts/FeedbackContext.tsx`: expone mensajes toast temporales accesibles.
- `mobile/src/contexts/StoreCheckoutContext.tsx`: conserva temporalmente retiro/entrega, dirección y cotización entre pantallas de tienda.
- `mobile/src/contexts/ThemeContext.tsx`: decide tema del sistema o preferencia manual y comparte tokens visuales.

## Cómo usar el catálogo

Busca el archivo por carpeta y sigue los imports locales declarados. Los imports no revelan por sí solos llamadas indirectas, relaciones creadas por convención ni ownership/autorización; esos recorridos se explican por proceso en la guía de arquitectura y defensa conforme se verifique cada módulo.

## Servicios del frontend documentados en detalle

Los servicios reciben el transporte autenticado desde sus hooks o desde `AuthContext`; ese transporte termina en `mobile/src/services/api.ts`, que resuelve la URL, serializa JSON o binarios, aplica timeout de 12 segundos y transforma fallos en `ApiError` con mensajes públicos.

- `mobile/src/services/api.ts`: `developmentApiUrl` y `resolveApiUrl` distinguen desarrollo y producción; `buildApiEndpoint` normaliza rutas; `apiRequest` maneja encabezados Bearer, carga binaria, errores de red/HTTP y respuestas con `success` y `data`. Los diagnósticos se limitan a desarrollo y redactan IDs.
- `mobile/src/services/auth.service.ts`: `register` normaliza nombre y correo y omite rol/confirmación; `login`, `refresh` y `getCurrentUser` validan la sesión o usuario antes de retornarlos. Recuperación, cambio de contraseña y logout delegan en endpoints explícitos. `readUser` y `readAccessSession` rechazan respuestas que no cumplan el contrato.
- `mobile/src/services/session-store.ts` y `web-session-store.ts`: el nativo usa SecureStore y web usa sessionStorage. La sesión contiene tokens, nunca contraseñas; las escrituras se ordenan y los valores leídos se validan. En web, la prueba OAuth expira a los diez minutos.
- `mobile/src/services/verification.service.ts`: `readVerification` valida token hexadecimal, email enmascarado, espera, vencimiento y entrega; `resendCode` y `verifyCode` llaman al backend y devuelven el desafío o la sesión opcional.
- `mobile/src/services/oauth-flow.ts` valida que el retorno coincida exactamente con protocolo, host y ruta esperados, sin fragmento, y acepta solo un parámetro `ticket` o un error permitido. `mobile/src/services/oauth.service.ts` inicia con prueba aleatoria criptográfica, crea el challenge SHA-256, pide inicio al backend, abre navegador o redirige web y canjea ticket+prueba. El canje puede devolver sesión, vínculo existente o registro pendiente; `completeOAuth` envía los datos de perfil para ese último caso.
- `mobile/src/services/client.service.ts`: ofrece endpoints del cliente autenticado para mascotas, turnos, historia, tienda, carrito, pedidos, notificaciones y perfil. La propiedad se deriva de la cuenta en backend; el cliente no envía ownerId.
- `mobile/src/services/clinic.service.ts`: organiza catálogos, turnos, pacientes, historias, profesionales, disponibilidad, configuración de tienda y revisión de pedidos. Las consultas usan `/clinic` y los permisos se aplican en servidor.
- `mobile/src/services/admin.service.ts`: organiza usuarios, permisos particulares, roles e información general. La API del cliente no concede privilegios; cada operación sigue su ruta administrativa autenticada.
- `mobile/src/services/notification-events.ts` implementa un bus local en memoria con alta y limpieza de callbacks; `notification-path.ts` clasifica eventos `WORK_`, filtra contextos y mapea referencias a rutas. `invitation-paths.ts` centraliza las dos rutas de aceptación de invitación.

**Recorridos concretos:** formulario de login → `AuthContext` → `auth.service.login` → `apiRequest('/auth/login')` → validación con `readAccessSession` → persistencia con `session-store`; OAuth web → `beginOAuth` → retorno `/oauth` → `parseOAuthCallback` → `exchangeWebOAuthReturn` → canje del ticket → `AuthContext`; edición de mascota → `clientService.savePet` → `POST` o `PUT /client/pets` → backend deriva propietario y persiste; revisión de transferencia → pantalla admin → `clinicService.reviewStorePayment` → `/clinic/store-orders/:id/payment-review` → backend verifica transición y permisos.

### Componentes UI reutilizables

`mobile/src/components/ui/` reúne piezas que aparecen en formularios, pantallas de administración y clínica. `AppText` y `AppButton` aplican el tema; `AppModal` resuelve el contenedor adaptable; `FormNotice` y `LoadingIndicator` comunican estados; `ConfirmModal` estandariza acciones asincrónicas que requieren confirmación. `SelectionRow` representa opciones accesibles y `CompactPagination` muestra controles cuyos datos los controla el padre.

`FilterDisclosure` mantiene abierto/cerrado el panel y delega cambios al listado; `SearchFilterBar` conserva compatibilidad con el toolbar compartido. `SocialLoginButton` solo entrega un callback: el flujo está en `OAuthSignInOptions` y `oauth.service.ts`. `OAuthLinks` permite al usuario autenticado gestionar proveedores vinculados. `RecoveryNotice` valida el correo antes de pedir recuperación y limpia estado al cerrar. `VerificationCodeModal` coordina el cronómetro, reenvío y verificación; si el backend devuelve una sesión validada, se la entrega a `AuthContext`, y si no, dirige al login.

### Formularios y campos reutilizables

`AppInput` conecta etiquetas, pistas y errores con TextInput; `AuthForm` recibe una definición de campos y validador, enfoca la primera entrada inválida y evita envíos concurrentes. `AppSelectField` permite búsqueda local o remota y paginación; `SearchableMultiSelect` emite una nueva lista de IDs al alternar una selección.

`CalendarDateField` y `ClinicTimeField` tienen variante nativa y `.web.tsx` para adaptar controles al entorno; sus contratos devuelven fecha/hora simple al formulario. `ClinicDateTimeField` compone ambos valores. `ActivationForm` recibe el token de invitación desde fragmento/deep link y decide la ruta de cuenta o veterinario. `OAuthRegistrationModal` completa un alta pendiente. `VerificationCodeInput` filtra dígitos y lo consume `VerificationCodeModal`.

`ImageUploadField` elige y prepara imágenes, pide una firma a PetCare con sesión autenticada y envía el archivo al proveedor de almacenamiento; la credencial de firma se obtiene del backend y el progreso vuelve al padre. `ProfilePhotoInput` adapta esa carga a foto personal con vista previa y opción de quitar.

### Navegación y layout compartido

`EntryRedirect` usa el usuario de `AuthContext` y `roleHome` para resolver la entrada inicial. `GlobalNavigation` configura destinos por rol, módulos admin habilitados, contadores de notificación, ruta activa y presentación de escritorio/móvil; los componentes descendientes reciben accesos rápidos por `RoleNavigationContext`. `RoleBottomNavigation` es presentacional y devuelve la navegación al padre.

`AppBreadcrumbs` convierte la ruta y el rol en migas jerárquicas, limitadas a destinos recibidos; `BackButton` usa `useBackNavigation` salvo que la pantalla provea un callback. `ScreenContainer` proporciona superficie, safe area, ancho adaptable y ajuste al teclado. `LoginLayout`, `LoginBrand`, `AuthHeader`, `LoginPets` y `PetCareLogo` componen identidad y presentación para el flujo de acceso. Las variantes `WebScrollStyles.web.tsx` y `WebScrollStyles.tsx` separan CSS de navegador de la plataforma nativa.

### Componentes administrativos

`AdminDataTable` y `AdminListToolbar` son presentacionales: reciben filas, columnas y acciones desde la ruta o pantalla de dominio. `AdminFormLayout` establece secciones y columnas comunes; `AdminPageHeading` integra el botón de regreso. `AdminPersonRow` resume personas y `AdminStatusBadge` resuelve etiquetas visuales a través de `display-labels.ts`.

`AdminSectionHub` presenta las secciones de clínica, tienda y administración, y consulta los indicadores configurados para el usuario; el filtrado de accesos en UI no reemplaza los permisos de backend. `SpecialtiesScreen` mantiene listados y edición de tipos/especialidades usados por perfiles profesionales. `ConfirmNameModal` añade una barrera de texto explícita a operaciones delicadas y ejecuta la acción con estado asíncrono.

### Perfil y sincronización de notificaciones

`AccountProfileScreen` reutiliza una pantalla por sección y rol: valida identidad y contraseña, guarda foto, permite gestionar descripción profesional de veterinarios, aplica preferencia de tema y usa una guardia ante cambios sin guardar. Las operaciones específicas pueden ir a rutas `/client`, `/vet` o `/admin`; la sección y permisos visibles dependen de la identidad de `AuthContext`.

`NotificationBridge` exporta la entrada común. El resolver de plataforma selecciona `NotificationBridge.native.tsx` o `.web.tsx`: ambos consultan el centro autenticado cada 30 segundos, no solapan solicitudes, comparan contador/última notificación y publican `notification-events` si detectan cambio. La variante nativa pausa al pasar a segundo plano; la web pausa cuando la pestaña no es visible.

### Componentes del área cliente

`PetCareUI.tsx` centraliza superficies, encabezados, tarjetas, badges, imágenes, acciones y formatos visuales. `RecordCards.tsx` presenta resúmenes de mascota, turno, historia, recomendación, producto y pedido; los destinos de detalle se resuelven con Expo Router. `PetEditor.tsx` controla borrador, validación, foto y guardado contra `client.service.ts`; `PetBirthDate` adapta límites/formato de fecha por plataforma y `SlotSelectionCard` retorna la disponibilidad elegida al formulario.

`ClinicalScreen` carga el tipo de historial pedido por la ruta y opcionalmente filtra por mascota; presenta tarjetas del registro correspondiente. `Storefront` compone tarjeta de producto, promociones, banners y modal de detalle, pero el agregado real al carrito y el checkout pertenecen a los flujos de tienda. `GeneralInformationCard` consulta los datos públicos de clínica y formatea horarios/contactos. `PetCareDecorations` solo dibuja elementos decorativos sin tocar estado de dominio.

### Pantallas de clínica y trabajo profesional

`AgendaScreen` consulta turnos según búsqueda, fecha, estado, profesional y permisos; las solicitudes se debouncean y la paginación se reinicia al cambiar filtros. `AppointmentScreen` carga un turno y guarda observaciones/cambios de estado con `clinicService`. `AvailabilityScreen` mantiene slots y bloqueos que luego consumen los formularios de reserva.

`PatientsScreen` y `CatalogScreen` concentran editores dinámicos complejos y quedan pendientes de revisión funcional completa en la cobertura. Los componentes más acotados ya documentados son `PatientDetailScreen` (ficha, registros y ciclo de vida), `PatientListCard` (resumen e invitación), `PatientLifecycleControl` (desactivación/reactivación), `ClinicalScreen` (lectura por tipo de antecedente), `ClinicProductsScreen` (productos para personal clínico), `ClientsScreen` (titulares), `ProfessionalsScreen` (servicios y estado) y `StaffHome` (métricas/agenda por rol). `VeterinarianProfileScreen` delega el contenido al perfil compartido.

### Configuración e inicio del backend

`backend/src/config/env.ts` carga variables y valida puertos, límites, base, TLS, CORS, modo demo y parámetros JWT bajo demanda. `database.ts` transforma `env.database` en opciones MySQL, conserva IDs grandes como texto, limita el pool y fija UTC al conectar. `mail.ts` valida SMTP y el secreto HMAC para códigos de correo; `oauth.ts` verifica proveedores, dominio público y destinos allowlist; `public-frontend.ts` delega URLs de invitación/recuperación en el validador compartido. `backend/eslint.config.mjs` aplica el preset recomendado de TypeScript e ignora compilados/dependencias.

`backend/src/app.ts` configura Express sin abrir un puerto: proxy, CORS, Helmet, límites de cuerpos, rutas protegidas de carga, router `/api`, 404 y errores. `backend/src/server.ts` es el arranque local: escucha en el puerto configurado, ejecuta vencimiento periódico de reservas y cierra HTTP y el pool ante señales de terminación. Vercel importa la app directamente.

### Controladores HTTP

Los controladores de `backend/src/controllers/` forman la capa entre Express y servicios: devuelven `{ success, data }` y pasan fallos a `next` para `error.middleware.ts`. `auth.controller.ts` adapta registro, login y contraseñas; `oauth.controller.ts` maneja inicio/callback/canje/registro/vínculo y usa el usuario autenticado de `res.locals`; `verification.controller.ts` delega verificación y reenvío. `client.controller.ts` y `clinic.controller.ts` generan handlers por operación y mantienen la respuesta uniforme. `health.controller.ts` informa proceso activo; `database-health.controller.ts` evalúa conexión SQL sin exponer detalle interno.

### Rutas y middlewares backend

`backend/src/routes/index.ts` monta routers de dominio bajo `/api`. `auth.routes.ts` agrupa login, registro, recuperación, verificación y OAuth con sus límites y protección de sesión. `client.routes.ts` y `clinic.routes.ts` separan operaciones de cuenta cliente y personal clínico; `admin.routes.ts` y `veterinarian.routes.ts` aplican sus controles de roles/permisos y validadores. `media.routes.ts` gestiona firma temporal de cargas. `notification.routes.ts` conecta bandeja autenticada; `notification-jobs.routes.ts` protege procesamiento programado con autorización cron. `settings.routes.ts` expone datos generales públicos.

El recorrido habitual es: ruta y middleware → controlador → servicio → repositorio → respuesta JSON. El orden concreto de cada middleware se declara en el router, por lo que determina cuándo se autentica, se valida, se limita o se autoriza cada acción.

### Utilidades de dominio y seguridad del backend

`admin-authorization.ts` comprueba permisos, delegación y asignación de rol; `admin-destructive-actions.ts` preserva roles de sistema y evita dejar el sistema sin superadministrador. `account-session-guards.ts` aplica predicados de login/versión de sesión; `personal-access.ts` mapea rutas y métodos a permisos de acceso personal.

Reglas de clínica se descomponen entre `clinic-rules.ts` (transiciones y solapamiento), `appointment-order.ts` (comparación en memoria y ORDER BY equivalente), `appointment-cancellation.ts`, `availability-lifecycle.ts`, y `pet-lifecycle.ts`. `store-order-transitions.ts` deriva cambios según pago/fulfillment. `clinical-presentation.ts` quita campos profesionales antes de responder al cliente. `catalog-presentation.ts` traduce códigos de permisos, roles y catálogos.

Otras utilidades tratan bordes: `app-error.ts` y `database-error.ts` normalizan excepciones; `mask-email.ts` oculta parte del correo; `password-reset-token.ts` valida token; `public-frontend-url.ts` arma enlaces autorizados; `register-diagnostics.ts` relaciona etapas y fallos sin exponer datos privados; `notification-date.ts` formatea fecha/hora; `cron-auth.ts` valida jobs programados; `role-code.ts` normaliza códigos de rol.

### Middlewares, validadores y tipos del backend

`auth.middleware.ts` valida token, cuenta y sesión y establece el actor de `res.locals`; `permission.middleware.ts` aplica roles, permisos, acceso propio y alcance de paciente. `auth-rate-limit.middleware.ts` crea limitadores; `proxy-trust.middleware.ts` configura la frontera de proxy. `error.middleware.ts` cierra rutas inexistentes y errores con respuestas públicas seguras.

Los validadores convierten `unknown` en DTOs: `auth.validator.ts` normaliza identidad/credenciales; `client.validator.ts` revisa IDs, mascota, imagen y carrito; `clinic.validator.ts` valida catálogos, valores y fechas con zona; `store-checkout.validator.ts` valida variantes de pago y dirección; `verification.validator.ts` valida desafío/código; `veterinarian.validator.ts` valida perfil, permiso e invitación. Todos producen `AppError` para que el middleware preserve el sobre HTTP.

`types/api.ts`, `auth.ts`, `authorization.ts` y `verification.ts` son contratos estáticos compartidos. No validan datos en runtime: esa tarea pertenece a validadores/servicios.


### Servicios de dominio del backend

`auth.service.ts` coordina registro/login con validadores, repositorios, correo y verificación; `session.service.ts` vuelve a consultar usuario y permisos al emitir o renovar sesión y `token.service.ts` firma/verifica el access token. `oauth.service.ts` organiza inicio, callback, canje y vinculación; delega los intercambios de Google/Facebook/X en `oauth-provider.service.ts` y las decisiones de cuenta en `oauth-policy.ts`. El correo sale por `mail.service.ts`; invitaciones y recuperación guardan hashes de pruebas de un solo uso y vencimiento.

`client.service.ts` procesa operaciones de cliente y propiedad de mascotas; `clinic.service.ts` organiza operaciones de clínica y catálogo según permisos. Ambos delegan persistencia en repositories. `pet-photo.service.ts` verifica referencias, optimiza imágenes y entrega URL; `direct-image-upload.service.ts` firma y verifica cargas directas en Cloudinary. `notifications.service.ts` busca turnos en ventanas de 24/4 horas, crea eventos con clave idempotente y procesa correos pendientes con lease y reintentos.

`admin-account.service.ts` y `veterinarian-account.service.ts` limitan perfil/contraseña a la identidad autenticada; al cambiar la contraseña incrementan `session_version`. `bootstrap-super-admin.service.ts` solo crea la primera cuenta desde herramienta local. `database.service.ts` verifica conexión y versiones compatibles. Las funciones y sus decisiones específicas quedan anotadas en cada archivo de `backend/src/services/`.


### Repositories y persistencia

Los repositories implementan consultas SQL y mapean filas hacia contratos del backend. `user.repository.ts` separa la forma interna con hash de `publicUser`; `authorization.repository.ts` obtiene permisos efectivos. `session.repository.ts`, `oauth.repository.ts` y `verification.repository.ts` persisten pruebas y tokens como hashes o intentos de un solo uso.

`client.repository.ts` filtra mascotas, notificaciones y pedidos por propietario; comparte turnos y catálogo clínico con `clinic.repository.ts`. Este último determina alcance de pacientes y controla disponibilidad, reservas, turnos y registros clínicos. `clinic-admin.repository.ts` edita catálogos y agenda dentro de una lista permitida. `veterinarian.repository.ts` coordina cuenta y ficha profesional.

La tienda separa responsabilidades: `storefront.repository.ts` sirve configuración pública/campañas y cotiza entrega; `store-checkout.repository.ts` calcula y reserva dentro de transacción; `store-orders.repository.ts` filtra seguimiento por actor; `store-payment.repository.ts` controla comprobantes y revisión. `delivery-address.repository.ts` gestiona direcciones propias y `notification.repository.ts` inserta eventos idempotentes. `admin.repository.ts` contiene mutaciones privilegiadas; `general-information.repository.ts` persiste contacto y horarios públicos; `reservation.repository.ts` libera reservas vencidas por lotes.


### Base de datos, migraciones y auditorías

`migration-files.ts` enumera SQL versionado, calcula checksum y compara historial. `migration-runner.ts` y los runners por dominio (`auth-migrate.ts`, `client-migrate.ts`, `clinic-migrate.ts`) aplican archivos pendientes. `bootstrap.ts` combina migraciones y seeds; `seed-runner.ts` carga catálogos. `lock.ts` serializa operaciones concurrentes. La creación de la base y la primera cuenta privilegiada son tareas locales separadas (`create-database.ts`, `create-super-admin.ts`).

Las migraciones puntuales (`pet-sex-migrate.ts`, `pet-photo-migrate.ts`, `profile-photo-migrate.ts`, `user-deletion-migrate.ts`, `password-reset-migrate.ts`, `reservation-reason-migrate.ts` y otras) comprueban el esquema antes de actuar. `product-origin-schema.ts` calcula un plan sin conexión; `product-origin-migrate.ts` lo contrasta con metadatos reales. `clinic-reconcile.ts` hace preflight y reconciliación limitada de índices.

Las herramientas `migration-preflight-readonly.ts`, `sql-audit-readonly.ts`, `petcare-cleanup-layerbase-audit.ts` y `petcare-cleanup-preview.ts` son de inspección: consultan fuentes/metadatos/conteos y no deben describirse como migraciones ni como prueba de que un cambio ya se aplicó. Los comandos operativos deben ejecutarse explícitamente desde CLI.


### Rutas de entrada y autenticación

`app/_layout.tsx` monta proveedores globales y navegación; `app/index.tsx` entrega el usuario a `EntryRedirect`. `login.tsx` y `register.tsx` conectan `AuthForm` con AuthContext; el alta continúa con el modal de verificación. `oauth.tsx` procesa el retorno de navegador/deep link y actualiza AuthContext al completar canje. `activate-account.tsx` y `activate-vet.tsx` configuran el formulario común de invitación. `reset-password.tsx` consume un token de recuperación; `change-initial-password.tsx` completa el cambio obligatorio de cuentas de empleado.

`account.tsx` adapta parámetros a la pantalla de perfil compartida. `notifications.tsx` reexporta la bandeja común y `workspace.tsx` presenta módulos según capacidades disponibles. Estas rutas no otorgan permisos de backend: el servidor valida la sesión para cada operación.


### Rutas administrativas compartidas

Las rutas de agenda, turnos, catálogos, clientes, pacientes, profesionales y especialidades en `mobile/src/app/admin/` son adaptadores: reexportan pantallas compartidas de `components/clinic` o `components/admin`. El segmento Expo organiza el acceso y el rol, mientras las pantallas llaman servicios y el backend aplica permisos/alcance. La ruta dinámica `catalog/[kind].tsx` pasa la variación de catálogo al componente común.


### Rutas de profesional y veterinario

Las rutas de `professional/` y `vet/` reexportan componentes clínicos compartidos para agenda, turnos, clientes, pacientes e inicio. `vet/products.tsx` conecta la consulta de catálogo clínico. El rol organiza la navegación, mientras las consultas de `clinic.repository.ts` y los middlewares del backend siguen definiendo qué profesionales y pacientes puede ver cada actor.


### Layouts de administración y trabajo clínico

Los layouts de `admin/`, `professional/` y `vet/` declaran rutas y guards según contexto de permisos. Los grupos `admin/users/` y `admin/veterinarians/` agregan navegación interna de lista/detalle. Los hubs `administration.tsx`, `clinic.tsx` y `store.tsx` seleccionan secciones de `AdminSectionHub`. Los guards mejoran navegación y presentación; no reemplazan la autorización por request en Express.


### Navegación de cliente, turnos y notificaciones

El layout de `client/` comprueba navegación personal con `personal-route-access.ts`; el layout de pestañas conserva checkout en `StoreCheckoutContext`. El inicio presenta consultas de cliente en tarjetas responsivas. Turnos permiten cancelar con motivo y refrescar desde el servicio; notificaciones usan paginación, eventos compartidos y navegación al destino apropiado. La configuración ESLint de `mobile/` prohíbe dialogs nativos para conservar los componentes de confirmación y feedback de PetCare.


### Perfil cliente: datos personales, seguridad y tema

Las rutas de `client/profile/` son adaptadores de sección para `AccountProfileScreen`; appearance modifica ThemeContext localmente. La persistencia de datos personales y contraseña usa servicios de cuenta, mientras preferencia visual no genera consulta de negocio.


### Tienda cliente: catálogo, carrito y checkout

La tienda se organiza en `store/index.tsx` (catálogo/filtros), `[id].tsx` (detalle), `cart.tsx` (revisión) y `checkout.tsx` (dirección, cotización y pedido); `delivery.tsx` redirige enlaces previos al checkout unificado. `StoreCheckoutContext` conserva modalidad/dirección y cotización. El cliente solicita tarifa, pero `store-checkout.repository.ts` vuelve a verificar precios/stock y crea la reserva de forma transaccional.


### Mascotas del cliente

La pestaña `pets.tsx` lista mascotas propias; `pets/new.tsx` y `pets/[id]/edit.tsx` reutilizan `PetEditor` para alta/edición. `pets/[id]/index.tsx` combina ficha, turnos relacionados y ciclo de vida. El servicio y el backend derivan titular del JWT y bloquean transiciones incompatibles con turnos futuros.
