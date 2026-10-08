# Diagnóstico del registro de PetCare

## Resultado real

La causa comprobada del 503 actual es el rechazo de autenticación de MySQL remoto: `ER_ACCESS_DENIED_ERROR`. El backend activo responde `DB_UNAVAILABLE` (503) en `/api/health/database`. Se probó la conexión con los valores efectivos y con los valores leídos directamente de `backend/.env`; ambos resultados coinciden. No se publicaron credenciales.

El hostname corresponde al patrón de Railway. Esto identifica el proveedor por inferencia; no demuestra que los datos pertenezcan al servicio o entorno correcto. No se puede distinguir contraseña incorrecta, usuario incorrecto o restricciones de acceso únicamente con este error.

## Flujo y punto de fallo

`POST /api/auth/register` pasa por el límite de solicitudes, controlador, validación, configuración de correo, consulta de email existente, bcrypt, creación del usuario y verificación, reserva del código, SMTP y persistencia del resultado de entrega. El error actual impide consultar el email existente, antes de bcrypt y del INSERT.

Otros 503 posibles son configuración de correo o secreto inválidos (`EMAIL_UNAVAILABLE`), falta del rol CLIENT (`AUTH_UNAVAILABLE`), errores de conexión de base (`DB_UNAVAILABLE`) y envío SMTP (`EMAIL_DELIVERY_FAILED`). El reenvío captura este último y devuelve explícitamente `delivery: failed`; no verifica la cuenta. El registro conserva ese resultado en su respuesta. La aceptación SMTP no equivale a recepción en la bandeja.

## Comprobaciones

- Variables SMTP y secreto de verificación: presentes; no se imprimieron valores.
- `nodemailer.verify()` contra Gmail: autenticación correcta. No se envió un correo de prueba.
- MySQL: autenticación rechazada. `SELECT 1`, tablas, migraciones y permisos no pudieron comprobarse.
- Esquema esperado: `users`, `roles`, `email_verifications`; las migraciones 003 y 004 aportan campos utilizados por autenticación, incluida `session_version`. No se aplicaron migraciones al servidor remoto.
- Rol público esperado: CLIENT, resuelto exclusivamente por el backend.
- Cuenta de intentos anteriores: estado desconocido; no fue posible consultar el email indicado por el usuario. El fallo actual ocurre antes de insertar, pero eso no demuestra qué ocurrió en intentos previos.
- No se ejecutó un POST real: la revisión automática lo rechazó porque podía crear una cuenta o enviar un correo.

## Correcciones realizadas

La cuenta y la prueba restringida de verificación ahora se insertan en una misma transacción en `user.repository.ts`. Un fallo al persistir esa prueba revierte también la cuenta. El código de seis dígitos mantiene su reserva transaccional y sus límites en el backend antes del envío SMTP. Un fallo de entrega conserva la cuenta pendiente y el flujo de recuperación por Login; no otorga acceso ni verifica el email.

Se agregaron etapas de diagnóstico en controlador, servicio de autenticación, repositorio, verificación y correo. `REGISTER_DIAGNOSTICS=true` habilita el seguimiento solo fuera de producción. El diagnóstico usa identificadores aleatorios y una lista blanca de códigos; omite cuerpo, email, contraseña, token, código, SQL y mensajes crudos del proveedor. Está deshabilitado por defecto en `.env.example`.

Se añadieron pruebas de que los errores sensibles no se filtran. Comandos `npm run typecheck`, `npm run lint` y `npm test`: finalizaron con código 0. Estos controles no demuestran integración remota ni un registro exitoso. La atomicidad aún requiere validación con la base accesible. No se modificó la interfaz ni se omitió la verificación.

## Configuración pendiente

Para un backend ejecutado en esta PC, usar la conexión pública del servicio MySQL remoto. En Railway, los datos externos proceden de `MYSQL_PUBLIC_URL` y del TCP Proxy, con dominio y puerto públicos. Copiar sus componentes a `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en `backend/.env`. Usuario y contraseña deben corresponder a ese mismo servicio y entorno. No usar un hostname privado de Railway desde la PC ni asumir el puerto público 3306. Reiniciar el backend después de modificar la configuración. No compartir contraseñas por chat.

Fuente: https://docs.railway.com/databases/mysql

Una vez corregida la autenticación, comprobar SELECT 1, esquema, migraciones, CLIENT y la cuenta pendiente. Solo entonces puede validarse el registro real y la entrega. No se afirma que el 503 esté resuelto.
