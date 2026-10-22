# Auditoría de autenticación

## Resumen

La autenticación tradicional y social tienen implementación considerable en el cliente y servidor. No se comprobó el intercambio real con proveedores, la entrega real de correos ni el estado actual de secretos/configuración externa. No se encontró segundo factor MFA.

## Registro e inicio de sesión

- `POST /api/auth/register` y `POST /login` tienen rate limit, validadores, respuestas sin datos secretos y `Cache-Control: no-store`.
- El alta pública no acepta `role`; el backend asigna CLIENT y persiste bcrypt hash (no contraseña plana).
- El registro exige verificación de email con código temporal. Login rechaza cuenta sin verificar; enlaces/códigos tienen vencimiento, intentos y control de reenvío documentados e implementados en `verification.service.ts`.
- Login/`/me` obtienen permisos y perfil actualizados. Usuario inactivo o sesión inválida es rechazado por el middleware de autenticación.
- Recuperación está en endpoints separados de login: request y confirmación con token hash, expiración y uso único. La ruta devuelve respuesta para no revelar si un email existe (según implementación).
- No es prueba de que SMTP funcione hoy ni de que una persona reciba efectivamente el mensaje.

## OAuth social

| Proveedor | Implementación en código | Credenciales/callback externo | Web | Android | Problemas/estado |
|---|---|---|---|---|---|
| Google | Authorization Code, state, PKCE S256, identidad estable, claims de email verificado si disponibles, ticket de canje y política de link/signup. | NO VERIFICABLE desde checkout. | Flujo implementado; no ejecutado con Google real. | Retorno `petcare://oauth`; requiere build propio, no Expo Go; no ejecutado. | Implementado sin verificación externa. |
| Facebook | Authorization Code mediante backend confidencial, state y verificación adicional del email PetCare. | NO VERIFICABLE desde checkout. | Flujo implementado; no ejecutado. | URI PetCare descrita; no ejecutado. | Implementado sin verificación externa. |
| X/Twitter | OAuth 2 Authorization Code + PKCE, state, API `/2/users/me`, signup pide email al usuario y exige verificación PetCare. | NO VERIFICABLE desde checkout. | Flujo implementado; no ejecutado. | URI PetCare/build propio; no ejecutado. | Implementado sin verificación externa. |

Google está incluido en la implementación, pero el requisito “tres proveedores operativos” no se puede declarar cumplido hasta probar configuración y flujo de extremo a extremo en web y Android. Meta/Facebook no se cuenta dos veces. Secrets están en variables backend según código y documentación; no se imprimieron ni leyeron `.env`.

## Sesión, JWT y refresh

- Access token firmado HS256, `iss`, `aud`, `sub`, `exp` y `sessionVersion`; expiración máxima configurada hasta 3600s, default 900s, según `token.service.ts`/`config/env.ts`.
- Refresh token aleatorio con persistencia hash, family, expiración, rotación y detección/revocación descritas en OAuth/session repositories.
- El cliente guarda tokens nativos en Expo SecureStore con restricción de acceso del dispositivo. Web guarda en `sessionStorage` por pestaña (persiste recarga, no nueva sesión de navegador). No almacena contraseña.
- Restauración verifica `/me`, refresca tokens vencidos y limpia la sesión ante 401. Web no tiene persistencia de largo plazo entre sesiones.
- Cierre de sesión revoca refresh family desde servidor cuando llega a `/logout`, y borra almacenamiento local; un access token emitido puede seguir siendo válido hasta expirar salvo invalidación de sesión/usuario. Revisar y probar revocación inmediata de access si se requiere.
- No se inspeccionaron settings externos EAS/Vercel, ni SecureStore en un dispositivo real.

## Verificación adicional

| Mecanismo | Estado | Observación |
|---|---|---|
| Verificación de email | CUMPLE PARCIALMENTE | Código temporal, expiración, límites y reenvío; SMTP real no verificado. |
| Recuperación/restablecimiento | CUMPLE PARCIALMENTE | Token hash, expiración/uso único observados; SMTP real no verificado. |
| OTP/TOTP como segundo factor | NO IMPLEMENTADO | No existe factor adicional luego de credenciales. Código de email de verificación de cuenta no es 2FA. |
| Email alternativo de recuperación | NO IMPLEMENTADO / NO REQUERIDO por código | No se encontró ruta/columna clara para mantener canal alternativo. |
| Protección de intentos | CUMPLE PARCIALMENTE | express-rate-limit; riesgo potencial de estado en memoria no compartido en despliegue serverless multi-instancia. |

## Hallazgos / recomendaciones

1. Prioridad ALTA: evaluar y añadir 2FA después de verificar operación base, con TOTP o WebAuthn y códigos de recuperación de un solo uso; no reutilizar el código de verificación de email como segundo factor.
2. Verificar rotación y reutilización de refresh con pruebas de integración bajo base exclusiva de test y comprobar sesiones paralelas.
3. Ejecutar una prueba manual con cuentas controladas para Google/Facebook/X en web y development build Android; comprobar state, cancelación, linking, logout y expiración. No colocar secretos en móvil.
4. Confirmar SMTP, remitente, DNS y plantillas en entorno de staging, incluyendo expiración y respuesta sin enumeración de cuentas.

## Evidencia

`backend/src/routes/auth.routes.ts`, `controllers/auth.controller.ts`, `controllers/oauth.controller.ts`, `services/auth.service.ts`, `verification.service.ts`, `password-reset.service.ts`, `token.service.ts`, `session.service.ts`, `oauth.service.ts`, `oauth-provider.service.ts`, `repositories/oauth.repository.ts`, `middlewares/auth-rate-limit.middleware.ts`; `mobile/src/contexts/AuthContext.tsx`, `services/session-store.ts`, `services/web-session-store.ts`, `services/oauth.service.ts`; `mobile/README.md`.
