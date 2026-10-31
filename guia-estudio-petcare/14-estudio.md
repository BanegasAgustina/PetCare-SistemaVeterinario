# 14. Plan de estudio, glosario y exposición oral

## Plan progresivo de siete sesiones

1. **Mapa del sistema:** explica roles y componentes sin nombres técnicos. Dibuja cliente → API → DB.
2. **Frontend:** abre login, mascotas y turnos; encuentra el callback del botón, hook, servicio y estado. Resume cada pantalla en voz alta.
3. **Backend:** sigue login y create pet desde route hasta repository. Repite “qué recibe, qué valida, qué devuelve y qué falla”.
4. **Datos y permisos:** dibuja users-pets-appointments; diferencia rol, permission y ownership; explica transacción y baja lógica.
5. **Correo/seguridad:** cuenta verificación, invitación y reset; contrasta token, código, expiración y hashing.
6. **Módulos/despliegue:** explica turnos, tienda, recordatorios y build APK. Señala qué función no está implementada (push, cobro real) y qué requiere consola externa.
7. **Simulacro:** responde 50 preguntas. Grábate en bloques de 2, 5 y 15 min. Donde no puedas nombrar archivo o regla, vuelve a buscarla; no inventes.

Cada sesión: 25 minutos de lectura, 10 de recorrido en código, 5 de explicación sin pantalla; al día siguiente repaso activo de lo anterior.

## Presentación de 2 minutos

“PetCare es una aplicación para organizar la atención de una clínica veterinaria. Tiene un cliente multiplataforma creado con Expo, React Native y TypeScript, que funciona en navegador y Android, y una API Node.js con Express. El cliente permite gestionar mascotas, solicitar turnos, consultar información y operar la tienda; el personal veterinario, de peluquería y administración usa áreas con funciones según sus permisos. Cuando se hace una acción, la pantalla llama a un servicio móvil que envía HTTP/JSON a la API. El backend verifica la sesión, rol, permiso, los datos y la propiedad del recurso; después consulta MariaDB/MySQL y devuelve resultado o error. Las contraseñas se guardan con bcrypt y la sesión usa access y refresh tokens. El correo SMTP se utiliza para verificación, invitaciones y recuperación. Hay notificaciones internas y cola de correos; no hay push a teléfonos ni cobro real de tarjeta. La web se configura para Vercel y Android para builds de EAS. La base remota y servicios externos deben verificarse en su entorno para confirmar el despliegue.”

## Presentación técnica de 5 minutos

1. **Propósito y usuarios (40 s):** coordinación de clientes, profesionales y administradores; cinco roles vigentes; rol más grants.
2. **Arquitectura (50 s):** `mobile/src/app` crea rutas; hooks/contexts manejan estado; `services/api.ts` envía solicitudes; backend Express recibe `/api`; MySQL persiste.
3. **Flujo demostrable (90 s):** login desde `login.tsx` → `AuthContext.signIn` → `/auth/login` → `loginUser` valida y bcrypt → `sessionForUser` → `/auth/me` → almacenamiento y navegación.
4. **Seguridad (60 s):** `authenticate` valida firma y consulta estado/grants; rutas aplican rol/permiso; repositorio limita ownership; errores sanitizados y rate limit.
5. **Negocio (50 s):** mascota y turno; servicio/slot y estados; tienda con tarjeta demo apagada y transferencia con revisión.
6. **Operación (50 s):** verificación/invitación por SMTP; recordatorio interno + cola email; Vercel/EAS configurados; entorno remoto necesita confirmar scheduler/proveedores.

## Defensa de unos 15 minutos

**0–2 min, problema y alcance:** presentación anterior con foco en qué coordina; mostrar roles y límites de negocio.

**2–5 min, recorrido de interfaz:** abrir la ruta de login y una pantalla de mascota o turno; identificar layout, componente, hook, estado y servicio. Explicar que validación cliente guía, pero no autoriza.

**5–8 min, flujo interno:** mostrar una ruta backend; ordenar middleware → controller → service → repository. Explicar solicitud, Bearer, JSON, SQL parametrizado y respuesta uniforme.

**8–10 min, modelo y seguridad:** users/pets/appointments, PK/FK, joins y transacciones. Distinguir authentication/authorization y explicar ownership, bcrypt, expiración, refresh y sesión revocada.

**10–12 min, módulos:** turno y ficha; agenda profesional; catálogo/checkout. Describir estados y límites: demo no cobra; transferencia requiere comprobante y revisión.

**12–13 min, comunicaciones:** SMTP para verificación/invitación/reset; inbox y cola; job cron autenticado y reintentos. Push no implementado.

**13–14 min, despliegue:** web en Vercel por config; backend por root directory y variables privadas; APK EAS con API pública; OAuth nativo necesita scheme/build.

**14–15 min, reflexión:** qué decisiones aportan seguridad, qué no se verificó en producción y qué mejoraría: confirmar esquema en entorno, cron proveedor y observabilidad operativa sin exponer datos.

## Glosario alfabético

- **API:** contrato por el que programas intercambian operaciones.
- **APK:** paquete instalable Android.
- **Autenticación:** verificar identidad.
- **Autorización:** verificar si la identidad puede ejecutar acción.
- **Backend:** servidor con reglas y persistencia.
- **Bearer:** forma HTTP de enviar token como credencial.
- **bcrypt:** hashing de password resistente a fuerza bruta.
- **Build:** compilación de código/config/assets.
- **CORS:** política de acceso entre orígenes web.
- **CRUD:** crear, leer, actualizar y borrar.
- **Cron:** tarea llamada por un programador según calendario.
- **Endpoint:** método y URL para una operación API.
- **EAS:** servicios de Expo, incluido build remoto.
- **Expo:** herramientas para apps React Native.
- **FK:** foreign key; clave foránea que referencia otra tabla.
- **Frontend:** interfaz del usuario.
- **Hook:** función React que conecta estado/efectos/lógica.
- **HTTP/HTTPS:** protocolo web; HTTPS agrega cifrado TLS.
- **Índice:** estructura que acelera búsquedas en DB.
- **Integridad:** consistencia de referencias y reglas de datos.
- **JSON:** formato texto para datos estructurados.
- **JWT:** JSON Web Token firmado.
- **Middleware:** paso intermedio de procesamiento HTTP.
- **Migración:** cambio versionado de estructura de base.
- **OAuth:** protocolo de delegación/autorización con proveedor externo.
- **Ownership:** comprobación de que un recurso es del usuario.
- **PK:** primary key; clave primaria de fila.
- **Props:** valores de entrada a componente React.
- **Refresh token:** credencial de renovación de access token.
- **Render:** cálculo/actualización de interfaz visible.
- **Repositorio:** capa que encapsula consulta/escritura en DB.
- **REST:** estilo de API basado en recursos y HTTP.
- **Rol:** categoría general de cuenta.
- **SMTP:** protocolo para enviar correo a servidor de correo.
- **SQL:** lenguaje de consultas relacionales.
- **Estado (React):** dato que controla interfaz y puede cambiar.
- **TLS:** cifrado de transporte de red.
- **Transacción:** unidad de cambios que confirma o revierte en conjunto.
- **Vercel:** hosting y plataforma de build/despliegue.
- **Verificación de email:** prueba de control del correo, normalmente temporal.
- **Variable de entorno:** ajuste entregado al proceso fuera del código.
