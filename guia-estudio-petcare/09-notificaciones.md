# 9. Notificaciones y tareas automáticas

## Qué mecanismos hay

1. **Centro interno:** filas persistidas en `client_notifications`; usuario las ve en pantalla y puede marcarlas leídas/ocultarlas.
2. **Correo:** cola independiente `client_notification_email_deliveries`, que entrega mensajes SMTP de notificación.
3. **Push del sistema operativo:** no está implementado en este checkout: no se solicitan permisos ni se guardan device tokens.

El bridge móvil sincroniza cuando la app está activa. La notificación interna permanece en backend aunque no haya sesión abierta; el estado leído también se guarda en servidor.

## Recordatorio de turno: explicación de función

**Nombre:** `createDueAppointmentReminders`.

**Archivo:** `backend/src/services/notifications.service.ts`.

**Qué hace/cuándo:** la llama `processNotificationJobs` cuando el endpoint de cron es invocado. Busca turnos confirmados próximos a 24 h o 4 h.

**Qué recibe/devuelve:** no recibe argumentos; devuelve cantidad de registros internos creados.

**Cómo:** define ventanas de captura: 24 h ± una banda de 10 minutos antes y 5 después; similar para 4 h. Busca turno confirmado, slot activo, mascota, servicio y usuario activo. Excluye evento existente por `event_key`, limita lote a 250, revalida candidato bajo `FOR UPDATE` y crea notificación en transacción. La clave única determinista hace seguras ejecuciones superpuestas.

**Fallo:** transacción revierte; ruta de cron sanitiza por el error middleware. Este proceso no empuja notificación al teléfono.

**Corta para examen:** “El cron captura turnos confirmados que entran en una ventana, crea un evento único en la bandeja y lo hace idempotente.”

## Cola de correo y reintentos

`claimEmailDeliveries()` dentro de transacción marca como fallidos destinatarios inactivos/no verificados; reclama hasta cinco vencidos o con lease caducado usando `FOR UPDATE SKIP LOCKED`; los marca `SENDING` por cuatro minutos y aumenta intentos. `sendEmailBatch` envía en paralelo. Éxito => `SENT`; excepción => vuelve a `PENDING` o termina `FAILED` al alcanzar 8 intentos. Espera exponencial `60 * 2^(attempts-1)` segundos, tope 1800 (30 min). Una lease vencida permite recuperar un trabajo interrumpido.

## Ruta y programación

`backend/src/routes/notification-jobs.routes.ts` crea `GET /api/cron/notifications`; exige `CRON_SECRET` de al menos 32 bytes y header Authorization Bearer correcto. `processNotificationJobs()` hace primero recordatorios y luego claim/envío. `backend/vercel.json` está vacío, por lo que no configura cron Vercel automáticamente. La documentación dice que un scheduler externo debe invocarlo; no se verificó que exista uno en producción. El `setInterval` de `server.ts` vence reservas, no reemplaza al cron de correos/reminders.

## Preguntas de defensa

- **Básica — Diferencia entre email y notificación interna.** Email sale por SMTP; interna queda en DB y aparece en inbox. **Corta:** “Son canales separados.” **Repregunta:** ¿Hay push?
- **Intermedia — ¿Cómo se evita duplicar recordatorio?** Clave de evento asociada a appointment/slot/24h o 4h y transacción/lock. **Corta:** “Una clave única vuelve idempotente el job.” **Repregunta:** ¿Qué significa idempotente?
- **Avanzada — ¿Qué ocurre con fallos de SMTP?** Se agenda reintento exponencial hasta 8 intentos y luego falla. **Corta:** “La entrega se reintenta con espera creciente y límite.” **Repregunta:** ¿Quién inicia el proceso?
