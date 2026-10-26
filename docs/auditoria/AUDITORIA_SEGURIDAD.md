# Auditoría de seguridad

Revisión estática de backend y cliente, más lectura de metadata de Layerbase. No incluye pentest, escaneo autenticado de producción, prueba con credenciales reales de OAuth ni lectura de datos personales.

## Autenticación y sesiones

- Registro valida campos permitidos y contraseña (mínimo 8 caracteres, mayúscula/minúscula/dígito/símbolo, máximo 72 bytes por bcrypt); usa bcrypt con 12 rondas por defecto y un hash ficticio al comparar cuando el email no existe.
- Login exige email normalizado, cuenta activa y email verificado. Las credenciales incorrectas comparten respuesta `INVALID_CREDENTIALS`.
- Access JWT usa HS256 con issuer/audience, TTL acotado y secreto mínimo de 32 bytes. `authenticate` reconsulta usuario, estado, versión de sesión, familia refresh y permisos actuales.
- Refresh tokens opacos se guardan como SHA-256, rotan bajo transacción y revocan la familia ante replay/logout. Cambios de contraseña incrementan `session_version`.
- Android/iOS persiste la sesión con Expo SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Web usa `sessionStorage`, lo cual reduce persistencia frente a `localStorage`, pero deja tokens expuestos a JavaScript si hubiese XSS; no son cookies HttpOnly.
- El backend no imprime tokens o contraseñas en los paths revisados; los errores DB se reducen a códigos seguros. Diagnóstico de registro opt-in, solo no producción, con lista blanca de códigos y sin body/email.

**Estado:** controles presentes en código; persistencia real, refresh, logout y replay no se probaron en un flujo E2E con una cuenta en Android/web durante esta auditoría.

En la tercera etapa se ejercitaron rutas HTTP reales sin cuenta: validación 400 de login/registro, 401 sin sesión, JWT inválido y vencido. Esto comprueba el comportamiento de denegación y sanitización de respuesta, no que una contraseña válida inicie una sesión.

## Verificación adicional y OAuth

- Correo verificado requiere código de seis dígitos guardado como HMAC, expiración 10 minutos, hasta cinco intentos y límites de reenvío/cooldown. El token de prueba de cuenta es aleatorio, guardado como hash y limitado en tiempo.
- Password reset usa token hash, vencimiento y transacción; sus límites deben mantenerse conforme al código actual.
- **La verificación de email no es MFA/2FA.** Ocurre al activar la cuenta; el login posterior con email verificado usa un solo factor de contraseña. Si la consigna requiere dos factores en cada inicio de sesión, está pendiente.
- OAuth admite Google, Facebook y X. Usa state de un solo uso, expiración, PKCE para Google/X, callback HTTPS y ticket de intercambio de un solo uso; no devuelve access/refresh token en la URL de callback.
- La disponibilidad real depende de secretos y callbacks exactos en Google, Facebook, X, Vercel y el scheme `petcare://oauth`. No fue verificada.

## Autorización, roles e IDOR/BOLA

- Los roles identificados en el código son `CLIENT`, `VETERINARIAN`, `GROOMER`, `SECRETARY`, `ADMIN` y `SUPER_ADMIN`.
- Los middleware diferencian rol (`requireRole`), permisos efectivos individuales (`requirePermission`/`requireAnyPermission`) y acceso personal. `clientRouter` deriva ownership del JWT y los repositorios cliente reciben `owner`, no un `ownerId` del body.
- Las rutas clínicas comprueban permisos/grants y la documentación del controller indica que los repositorios vuelven a validar dentro de transacciones para permisos sensibles. Hay tests para permisos de administración, delegación y restricciones de rol.
- La prueba de penetración no intentó variar IDs con dos cuentas reales. No afirmar resistencia IDOR completa solamente por revisar el middleware; las operaciones clínicas/almacenamiento requieren tests de ownership por entidad.

## Middleware y superficie HTTP

- Express aplica Helmet, CORS exacto para web y previews de Vercel, desactiva `x-powered-by`, limita JSON general a 100 KB y usa parsers de 8 MB/5 MB solo tras autenticación/permiso para fotos/comprobantes.
- Auth/acciones sensibles usan `express-rate-limit` (ventana 15 min). El store por defecto es memoria de proceso; en serverless cada instancia puede tener contadores separados. No reemplaza rate limiting global del borde.
- No se encontró confianza universal en `X-Forwarded-*`; `configureProxyTrust` la configura según runtime. CORS no es control de autorización, pero las rutas usan JWT/roles.
- SQL visible en repositories usa `execute` con parámetros; SQL dinámico debe revisar whitelist de identificadores/campos. La configuración del pool desactiva `multipleStatements`.
- El error handler no entrega stack trace ni SQL al cliente. Para `500` usa mensaje genérico y log estructurado sanitizado.

## Hallazgos / pendientes de seguridad

| Prioridad | Hallazgo | Estado |
|---|---|---|
| P1 | Si se exige MFA, el factor adicional actual solo verifica email al activar y no al login | Pendiente de alcance académico/producto; no se cambió autenticación |
| P1 | OAuth depende de credenciales, callbacks y claims reales no accesibles en este checkout | No verificado; smoke test por proveedor pendiente |
| P2 | Los scripts locales de migración resuelven SQL que se administra externamente y no vive en este checkout | FALSO POSITIVO como hallazgo de esquema; documentar la dependencia y no ejecutar esos scripts aquí |
| P2 | Rate limiting en memoria no garantiza cuota global entre instancias serverless | Evaluar limitador compartido si el modelo de abuso/escala lo requiere |
| P2 | Sesión web en `sessionStorage` comparte riesgo de XSS con JS de origen | Mantener dependencias/origen seguro; valorar cookies HttpOnly solo si se diseña un contrato web específico |
| P2 | El harness de QA `mobile/layout-review/client-qa.cjs` prepara una identidad real firmando un JWT local y simula `POST /auth/login`; no prueba credenciales ni debe ejecutarse contra producción | Conservado y clasificado como QA visual; hacer explícita esa limitación si se modifica |
| P3 | Seguridad de secretos depende de Vercel/EAS/Layerbase, no inspeccionados | Revisar configuración en consola antes de release |

No se encontraron razones para cambiar Firebase/Expo OAuth, el esquema de auth o los permisos existentes durante esta auditoría. No se ejecutaron pruebas destructivas ni requests de escritura a producción.
