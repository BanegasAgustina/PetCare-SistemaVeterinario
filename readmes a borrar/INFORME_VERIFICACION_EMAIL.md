# Informe — verificación de email y feedback global PetCare

Fecha: 01/10/2026. Alcance: corrección solicitada, autenticación/verificación y componentes de feedback. No se implementaron OAuth, recuperación completa, mascotas, turnos ni tienda.

## 1–3. Auditoría de alerts y reemplazos

Antes y después: **0 usos de alerts nativos** en código propio. No había archivos con Alert.alert, importación de Alert, window.alert, alert(), confirm() o prompt(). Se revisaron mobile/src, backend/src y sus pruebas; se excluyeron dependencias/compilados. FormNotice usa el rol accesible alert: es un mensaje integrado para lectores de pantalla y no un diálogo nativo.

No hubo alerts nativos que reemplazar. RecoveryNotice ya era un modal personalizado; ahora reutiliza AppModal. AGENTS.md establece la regla global y mobile/eslint.config.js bloquea los alerts y equivalentes. La auditoría encontró que la verificación segura de email todavía no existía: esta corrección incorpora backend y frontend completos.

## 4. AppModal

Base común con React Native Modal: fade, overlay oscuro/transparente, tema, Safe Area, teclado, esquinas redondeadas, sombra sutil, ancho 90% y máximo 440 px. Scroll interno solo si falta altura. Expone visible, dismissible, onClose y children; por defecto no permite cierre accidental. Usa rol dialog y accessibilityViewIsModal. RecoveryNotice y los otros modales comparten esta base.

## 5. ConfirmModal

Título, explicación, cancelar y confirmar; variante destructiva, spinner y error integrado. useAsyncAction bloquea solicitudes duplicadas; mientras ejecuta no permite cancelar ni cerrar por backdrop/atrás. onConfirm conserva la acción real del consumidor. Componente preparado para futuras confirmaciones; no se añadieron acciones destructivas ficticias para demostrarlo.

## 6. Toast/Snackbar

FeedbackProvider y useFeedback().showToast(message, kind) implementan success/error/info con ThemeContext. Uno por vez, no bloqueante, Safe Area, cierre manual, desaparición a los 4,5 segundos y animación de 160 ms respetando Reduce Motion. Se utiliza al continuar después de verificar. Los errores de inputs siguen inline.

## 7. VerificationCodeModal

Compartido por Registro/Login desde el layout raíz. Seis casillas visuales con un único input numérico accesible; permite avanzar, borrar y pegar, conservando ceros iniciales. Muestra email enmascarado. El contador usa el momento de recepción del desafío y el reloj actual; recupera tiempo real al volver del background. Errores, expiración, reenvío y loading permanecen dentro del modal. No se permite cerrar por backdrop o atrás; una prueba vencida ofrece volver a Login para retomar con contraseña. No hay ruta /verify-email.

## 8. Después de Crear cuenta

Backend valida, asigna CLIENT y almacena bcrypt; crea usuario pendiente y prepara código/envío SMTP. Mobile permanece en Registro y abre el modal. Correcto → email_verified_at UTC → éxito «Correo verificado» → CONTINUAR → Login con email precargado y toast. La verificación no emite JWT ni inicia sesión automáticamente.

Configuración SMTP inválida devuelve 503 antes de crear usuario. Rechazo SMTP conserva la cuenta pendiente, devuelve delivery=failed y permite reintentar, sin afirmar entrega. Un fallo DB posterior a creación se retoma desde Login. No se introducen usuarios de ejemplo en producción.

## 9. Código incorrecto

400/VERIFICATION_CODE_INVALID, error dentro del modal. El backend confirma el contador de fallos; máximo cinco intentos por código. La UI permanece abierta y permite corregir o solicitar otro código según el límite de envío.

## 10. Código vencido

Diez minutos de vigencia. Backend responde 410/VERIFICATION_CODE_EXPIRED; mensaje en el modal y opción de reenviar. El cliente también reconoce expiresAt vencido. La prueba opaca vence en 24 horas; volver a Login permite obtener otra tras validar contraseña.

## 11. Reenviar

Prueba opaca válida → reserva transaccional → código nuevo diferente → invalida anterior → envío SMTP → contador de 45 segundos y feedback «Te enviamos un nuevo código». Máximo cinco envíos por usuario/hora, incluyendo fallos SMTP; nuevo código reinicia intentos. HMAC-SHA256 con secreto independiente y user_id; token opaco de 256 bits guardado como SHA-256. Un único desafío por usuario, locks y consultas parametrizadas; consumo de un solo uso. Límites adicionales independientes por IP: 30 solicitudes/15 minutos por endpoint.

## 12. Login de usuario pendiente

Contraseña correcta → 403/EMAIL_NOT_VERIFIED, aviso inline y «Verificar ahora». Abre el mismo modal y reutiliza código vigente o inicia envío cuando corresponde. Rotar la prueba no reinicia cuotas ni intentos. /me también requiere correo verificado; una cuenta pendiente no accede aunque presente un JWT anterior. Email enmascarado no modifica el destinatario real.

## 13. Archivos creados

Raíz:

- AGENTS.md
- INFORME_VERIFICACION_EMAIL.md

Backend:

- migrations/003_email_verification.sql
- src/config/mail.ts
- src/controllers/verification.controller.ts
- src/repositories/verification.repository.ts
- src/services/mail.service.ts
- src/services/verification.service.ts
- src/types/verification.ts
- src/utils/mask-email.ts
- src/validators/verification.validator.ts
- tests/helpers/smtp.ts
- tests/verification.test.ts

Mobile:

- src/components/ui/AppModal.tsx
- src/components/ui/ConfirmModal.tsx
- src/components/ui/VerificationCodeModal.tsx
- src/components/forms/VerificationCodeInput.tsx
- src/contexts/FeedbackContext.tsx
- src/services/verification.service.ts
- src/utils/mask-email.ts
- tests/verification.test.ts

## 14. Archivos modificados

Raíz: README.md.

Backend:

- .env.example
- README.md
- package.json y package-lock.json (Nodemailer y tipos)
- src/controllers/auth.controller.ts
- src/middlewares/auth.middleware.ts
- src/middlewares/error.middleware.ts
- src/repositories/user.repository.ts
- src/routes/auth.routes.ts
- src/services/auth.service.ts
- src/types/auth.ts
- src/types/api.ts
- src/utils/app-error.ts
- tests/integration/auth.test.ts

Mobile:

- README.md
- eslint.config.js
- src/app/_layout.tsx
- src/app/login.tsx
- src/app/register.tsx
- src/components/forms/AuthForm.tsx
- src/components/layout/LoginBrand.tsx
- src/components/layout/LoginPets.tsx
- src/components/ui/AppButton.tsx
- src/components/ui/RecoveryNotice.tsx
- src/contexts/AuthContext.tsx
- src/services/api.ts
- src/services/auth.service.ts
- src/types/auth.ts
- src/utils/auth-validation.ts
- tests/auth.test.ts

No se alteraron imágenes originales ni migraciones 001/002. No hay dependencias mobile nuevas. Registro usa Nombre completo (primer término como firstName y resto como lastName), manteniendo el contrato existente. Se limpian contraseñas del formulario tras un envío exitoso. Se conserva teléfono opcional, igual que la autenticación anterior.

## 15. Pruebas realizadas

| Verificación | Resultado |
| --- | --- |
| Mobile npm test | 5/5 |
| Backend npm test | 7/7 |
| Backend npm run test:db | 19/19, incluyendo prueba padre y 18 escenarios |
| Backend npm run build | Correcto |
| Exportación Android Expo | Correcta |
| Navegador: 360×640, 390×844, 412×915, claro/oscuro | 6 combinaciones correctas |
| Alerts nativos al ejecutar flujos visuales | 0 |
| Errores JavaScript en revisión visual | 0 |
| Auditoría final de código propio | 0 usos de alerts nativos |

Integración HTTP real contra MySQL **8.0.39 temporal** separado: migraciones/seeds idempotentes, bcrypt, duplicados incluso concurrentes, validación, rechazo de roles de app, login, JWT, /me, health, desactivación y secretos ausentes. Verificación: hashes, email pendiente, rotación, intento persistido, cooldown, vencimiento, máximo de intentos, nuevo código, invalidación anterior, cuota, rechazo SMTP y consumo concurrente (uno 200 y otro 409). SMTP loopback efímero captura correos en memoria; no se envió a terceros ni se usaron credenciales reales. La prueba inicial detectó expresiones BIGINT de mysql2 devueltas como strings; se corrigió su conversión numérica y la suite completa pasó.

Revisión visual con API controlada y navegador Edge aislado: Login sin scroll/desbordamiento en reposo, logos circulares correctos, registro abre modal sobre la misma ruta, backdrop/Escape no lo cierran, pegado con limpieza y retroceso, error incorrecto/vencido/red, reenvío con cooldown, spinner/botón deshabilitado, éxito, Continuar, toast automático y retomar desde Login pendiente. Se revisaron capturas. La franja inferior ocupa el ancho móvil; en baja altura la composición se reduce proporcionalmente para conservar todos los animales y evitar scroll. Registro sí permite desplazamiento para acceder al formulario completo.

Límites: el navegador no sustituye pruebas de teclado numérico, botón físico atrás, Safe Area y lector de pantalla en Android/iOS reales. ConfirmModal está revisado estáticamente pero no tiene aún una acción destructiva real que probar. La entrega a una bandeja real requiere configurar SMTP y remitente autorizados en backend/.env; se comprobó el transporte contra SMTP local, no un proveedor externo. Configuración local y pasos de DB/SMTP están en los tres README. No se crearon .env con secretos.

## 16. TypeScript y lint

Mobile: npm run lint y npm run typecheck, sin errores ni warnings. Backend: npm run lint y npm run typecheck, sin errores ni warnings; incluye pruebas. Backend compila y Android exporta. No se ejecutó una fase posterior ni se agregaron funcionalidades fuera del alcance solicitado.
