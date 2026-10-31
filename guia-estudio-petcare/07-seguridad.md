# 7. Inicio de sesión, roles y seguridad

## Autenticación y autorización

Autenticación responde “¿quién sos?”; autorización responde “¿qué podés hacer?”. Un JWT (JSON Web Token) de acceso se firma HS256 con issuer/audience, subject de usuario, expiración y versión/familia de sesión. `verifyAccessToken` comprueba firma/algoritmo/emisor/audiencia/claims. `authenticate` vuelve a leer usuario desde DB, verifica activo, versión, familia no revocada, correo confirmado y cambio de contraseña inicial; luego carga permisos efectivos.

El login compara bcrypt incluso con hash ficticio cuando el usuario no existe para reducir diferencias observables de tiempo. Mensaje genérico no distingue email inexistente de password incorrecta. La cuenta sin verificar recibe un challenge, no una sesión completa.

Access token dura por defecto 900 segundos (15 minutos; máximo configurado 3600). Refresh token es rotatorio y su familia se guarda/revoca en servidor. Cliente renueva antes de expirar y comparte una única promesa de renovación para evitar que llamadas concurrentes gasten el mismo refresh token. Logout borra local y solicita revocación remota. Cambiar password o desactivar cuenta incrementa `session_version`.

## Roles y permisos

| Rol | Áreas típicas del código |
|---|---|
| `CLIENT` | Mascotas propias, sus turnos, información clínica permitida, tienda y perfil |
| `VETERINARIAN` | Agenda/pacientes/fichas según asignación y permisos efectivos |
| `GROOMER` | Agenda y datos de peluquería según grants; ficha de peluquería |
| `ADMIN` | Clínica/usuarios/catálogos con grants administrativos |
| `SUPER_ADMIN` | Operaciones sensibles extra, por ejemplo baja de usuario y revisión de pago |

`requireRole` verifica rol, `requirePermission` exige todos los códigos, `requireAnyPermission` al menos uno. Rutas combinan middleware. Repositorios también validan ciertos alcances dentro de transacciones. Ownership personal usa el ID del token/usuario autenticado. Para permisos del personal, ownership de pacientes puede verificarse por asignación `veterinarian_patients`.

Frontend usa layouts/route access para esconder o guiar. Cualquier persona puede alterar cliente; por eso la API repite autorización. Nunca se debe considerar una pestaña oculta como frontera de seguridad.

## OAuth y recuperación

OAuth configurado para Google, Facebook y X sigue flujo de servidor: el backend inicia/protege callback, obtiene resultado del proveedor, vuelve con ticket de un uso y móvil intercambia por sesión. En nativo vuelve mediante `petcare://oauth`; requiere build con scheme propio. Los secretos de proveedor son solo backend. No es SDK nativo de Google Sign-In.

Recuperación manda enlace un uso de 30 minutos; al completar, hash bcrypt nuevo y versión de sesión sube. La cuenta no se revela por respuesta. Cambio inicial de contraseña tiene flujo propio de empleado invitado.

## Defensa de datos

- bcrypt para contraseñas; hash SHA-256 para tokens aleatorios; HMAC con secreto para códigos cortos de verificación.
- HTTPS/TLS esperado en servicios remotos; CORS allowlist y Helmet; rate limiting para auth/uploads.
- Respuestas de error sanitizadas; limitación del tamaño de body; uploads por rutas protegidas y tipos permitidos.
- La baja de usuario es lógica y auditada; no borra historial.
- No hay notificación push al sistema operativo ni permisos de push configurados en este checkout.

### Preguntas de defensa

- **Básica — Diferencia entre autenticación y autorización.** Identidad vs permiso. **Ejemplo:** login prueba usuario; `appointments.manage` permite editar agenda. **Corta:** “Primero quién sos, luego qué acción te corresponde.” **Repregunta:** ¿Qué rol tiene?
- **Intermedia — ¿Cómo se invalida una sesión antes de expiración JWT?** Se cambia versión o revoca familia de refresh; authenticate lo comprueba. **Corta:** “Cada solicitud protegida revisa estado actual.” **Repregunta:** ¿Qué almacena el móvil?
- **Avanzada — ¿Por qué no basta el JWT firmado?** Una firma no actualiza permisos ni estado; DB revalida cuenta/grants. **Corta:** “JWT autentica, la autorización viva viene del servidor.” **Repregunta:** ¿Qué queda si la base no responde?
