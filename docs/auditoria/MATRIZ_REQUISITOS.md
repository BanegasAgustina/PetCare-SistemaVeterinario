# Matriz académica de requisitos

Fecha de actualización: 2026-10-26, segunda etapa. Estados asentados con evidencia disponible en código, pruebas y configuración inspeccionada. La gestión de migraciones es externa por decisión del responsable y no se penaliza como defecto del repositorio.

**Estados:** CUMPLE = evidencia suficiente dentro del nivel indicado; CUMPLE PARCIALMENTE = implementación presente, falta evidencia o algún alcance; NO CUMPLE = falla demostrada; NO VERIFICADO = depende de una prueba/entorno no disponible; NO APLICA = justificado.

| Área | Requisito | Estado | Evidencia, archivos relacionados y límite |
|---|---|---|---|
| Funcional | Registro tradicional con validaciones | CUMPLE PARCIALMENTE | Validadores y flujo presentes; HTTP real verificó rechazo de body inválido. Registro válido requiere DB/SMTP QA, no se probó. |
| Funcional | Inicio/cierre de sesión tradicional | CUMPLE PARCIALMENTE | HTTP real probó validación/login sin sesión; no se hizo login válido, logout ni ciclo persistente. |
| Funcional | Verificación de email en activación | CUMPLE PARCIALMENTE | OTP/HMAC, expiración e intentos en backend; no se ejercitó envío SMTP ni activación real. |
| Funcional | Prevención de duplicados, hash de contraseña y recuperación | CUMPLE PARCIALMENTE | Código inspeccionado (bcrypt y reset hash); falta test E2E de persistencia y correo. |
| Funcional | OAuth Google | NO VERIFICADO | Flujo común backend/web/native; faltan secreto/callback y prueba de proveedor. El gate móvil requiere development build. |
| Funcional | OAuth Facebook | NO VERIFICADO | Flujo común backend/web/native; faltan secreto/callback y prueba de proveedor. El gate móvil requiere development build. |
| Funcional | OAuth X | NO VERIFICADO | Flujo común backend/web/native; faltan secreto/callback y prueba de proveedor. El gate móvil requiere development build. |
| Funcional | Selección, callback, state, PKCE, canje y cancelación OAuth | CUMPLE PARCIALMENTE | Validadores unitarios en `mobile/tests/oauth-flow.test.ts`; no prueba intercambio externo ni sesión real. |
| Funcional | Verificación adicional exigida académicamente | CUMPLE PARCIALMENTE | Email verifica la activación y puede cubrir literalmente “verificación” según consigna; NO es MFA al login. Definición final requiere docente/owner. |
| Funcional | Tres o más roles | CUMPLE | Código declara seis roles: CLIENT, VETERINARIAN, GROOMER, SECRETARY, ADMIN, SUPER_ADMIN. |
| Funcional | Permisos diferenciados por rol | CUMPLE PARCIALMENTE | Nuevos tests cubren guards permit/deny y la [matriz de endpoints](MATRIZ_ENDPOINTS_ROLES.md); grants reales y cuentas separadas pendientes. |
| Funcional | UI, navegación y redirección por rol | CUMPLE PARCIALMENTE | Rutas y homes por rol presentes; no se recorrieron perfiles en Android. |
| Funcional | REST y CRUD de negocio | CUMPLE PARCIALMENTE | Inventario API de 141 combinaciones método/ruta; no hay CRUD E2E por módulo/rol. |
| Funcional | Manejo de errores | CUMPLE PARCIALMENTE | Middleware central sanitiza; faltan pruebas de contrato HTTP E2E por endpoint. |
| Frontend | React Native, Expo SDK 58, Expo Router | CUMPLE | Configuración y bundle web de Expo verificados. |
| Frontend | Navegación fluida, rutas protegidas, deep links | CUMPLE PARCIALMENTE | Estructura presente; deep links OAuth y rutas protegidas no se probaron en dispositivo. |
| Frontend | Context API/estado compartido para sesión/tema/datos | CUMPLE PARCIALMENTE | Contextos y hooks existentes; recorrido completo de restauración no verificado. |
| Frontend | Persistencia y restauración de sesión | CUMPLE PARCIALMENTE | SecureStore nativo y sessionStorage web; login-refresh-logout real pendiente. |
| Frontend | Almacenamiento seguro móvil | CUMPLE PARCIALMENTE | SecureStore con opción `WHEN_UNLOCKED_THIS_DEVICE_ONLY` inspeccionada; no se probó en Android. |
| Frontend | Responsive, safe areas, teclado y orientación | CUMPLE PARCIALMENTE | Ajustes/componentes y capturas QA existentes; matriz completa no ejecutada esta etapa. |
| Frontend | Formularios y validación de campos | CUMPLE PARCIALMENTE | Tests de validación pasan; falta E2E de formularios críticos en web y Android. |
| Frontend | UX/UI, estados de carga/vacío/error y accesibilidad | CUMPLE PARCIALMENTE | Capturas QA previas; evaluación de accesibilidad y tareas con usuarios no ejecutada. |
| Backend | API REST y rutas montadas | CUMPLE | `backend/src/app.ts`, routers y documento con 141 rutas. |
| Backend | Registro/login | CUMPLE PARCIALMENTE | Código, validadores y manejo revisados; sin integración real contra base con cuenta de prueba. |
| Backend | Access JWT y restricciones | CUMPLE PARCIALMENTE | HTTP real rechazó JWT inválido y vencido; no se ejercitó un token de sesión válido contra DB. |
| Backend | Refresh rotatorio, revocación y logout | CUMPLE PARCIALMENTE | Hash, rotación/familia y transacciones inspeccionados; no se probó replay/expiración E2E. |
| Backend | MySQL/MariaDB Layerbase | CUMPLE PARCIALMENTE | Conexión de solo lectura y metadata; no prueba de escritura/login de aplicación. Migraciones son externas por decisión del owner. |
| Backend | Middleware de autenticación | CUMPLE PARCIALMENTE | Revalidación de usuario/sesión/permisos inspeccionada; falta prueba HTTP integral. |
| Backend | Middleware de roles/autorización | CUMPLE PARCIALMENTE | Pruebas directas permiten/niegan roles, grants all/any, scope personal y paciente; no cobertura DB por endpoint/rol. |
| Backend | Ownership y protección IDOR/BOLA | CUMPLE PARCIALMENTE | Derivación de owner desde JWT en módulos cliente; falta prueba adversarial con dos usuarios sintéticos. |
| Backend | Validación, consultas parametrizadas y errores seguros | CUMPLE PARCIALMENTE | Revisado estáticamente; falta cobertura integral y auditoría por endpoint. |
| Backend | README/documentación API | CUMPLE PARCIALMENTE | Inventario API y guía general añadidos; esquemas body/response/permiso no exhaustivos. |
| Base de datos | SQL relacional desplegado en Layerbase | CUMPLE | Conexión de solo lectura observó MariaDB y 53 tablas; no se validó actividad de filas. |
| Base de datos | Integridad referencial | CUMPLE PARCIALMENTE | Metadata refleja FKs/constraints; corrección funcional de todas las reglas no se probó. |
| Base de datos | Seguridad y mínimo privilegio | CUMPLE PARCIALMENTE | TLS verificado en config; grants, backups y restore no inspeccionados. |
| Base de datos | Primera forma normal (1NF) | CUMPLE PARCIALMENTE | Evidencia estructural; atomicidad semántica de cada campo no demostrada. |
| Base de datos | Segunda forma normal (2NF) | NO VERIFICADO | Requiere claves candidatas y dependencias funcionales documentadas. |
| Base de datos | Tercera forma normal (3NF) | NO VERIFICADO | Requiere dependencias funcionales y decidir snapshots históricos intencionales. |
| Base de datos | Gestión de migraciones | NO APLICA | Es externa al repo según decisión expresa del responsable; no se alteró ni ejecutó. Los CLI que esperan SQL locales se documentan como nota operativa. |
| Calidad | Typecheck, lint, tests y build disponibles | CUMPLE | Mobile pasó 25/25; backend pasó 25/25 más build, typecheck y lint; detalles en `RESULTADOS_PRUEBAS.md`. |
| Calidad | Completitud funcional de los flujos críticos | CUMPLE PARCIALMENTE | Módulos implementados, pero sin integración completa de login, CRUD, OAuth y Android. |
| Calidad | Responsive y temas claro/oscuro | CUMPLE PARCIALMENTE | Tema automático y capturas existentes; revisión visual sistemática pendiente. |
| Calidad | Modularidad y separación de responsabilidades | CUMPLE PARCIALMENTE | Revisión estática muestra módulos; no se midió mantenibilidad/rendimiento. |
| Calidad | Atomicidad y transacciones | CUMPLE PARCIALMENTE | Refresh y operaciones puntuales transaccionadas; no se revisaron todas las escrituras/concurrencia. |
| Calidad | Versionado, README y documentación | CUMPLE PARCIALMENTE | Git/docs presentes; proceso externo de migración no está documentado por completo. |
| Calidad | Código limpio, formato, estructura y validaciones | CUMPLE PARCIALMENTE | ESLint/types pasan; no hay análisis exhaustivo de complejidad/dead code. |
| Calidad | Requests/renderizados/consultas y rendimiento | NO VERIFICADO | Sin perfilado ni mediciones de carga. |
| Calidad | Notificaciones internas | CUMPLE PARCIALMENTE | Persistencia, lectura, contador, rutas y actualización están en código; pruebas existentes cubren rutas y job, no recorrido UI/API E2E. |
| Entrega | Sin push externa; conservar Fast Refresh | CUMPLE PARCIALMENTE | Cliente actual usa notificación interna y Expo dev-client existe; no se instaló un development build Android esta etapa. |
| Entrega | Validación de login real desde Android | NO VERIFICADO | ADB no pudo consultar dispositivos porque el daemon falló al iniciar; no se usaron credenciales reales. |

## Conteo de esta matriz

El conteo mecánico arroja **5 CUMPLE, 37 CUMPLE PARCIALMENTE, 0 NO CUMPLE, 7 NO VERIFICADO y 1 NO APLICA**. El índice descriptivo asigna 1 a CUMPLE, 0.5 a CUMPLE PARCIALMENTE y 0 a NO CUMPLE/NO VERIFICADO, excluyendo NO APLICA: **47.96% (23.5/49)**. No es una calificación ni una estimación de producto terminado. Aun con suites locales en verde, login real, OAuth de proveedores y Android dependen de prueba operativa; la matriz no certifica esos flujos por presencia de código.
