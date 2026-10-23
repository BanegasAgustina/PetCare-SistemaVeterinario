import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { createClientNotification } from '../repositories/notification.repository';
import { formatNotificationDateTime } from '../utils/notification-date';
import { sendClientNotificationEmail } from './mail.service';
import { AppError } from '../utils/app-error';

type AppointmentReminder = RowDataPacket & {
  id: string;
  ownerId: string;
  petId: string;
  slotId: string;
  petName: string;
  serviceName: string;
  startsAt: string;
};

type PushDelivery = RowDataPacket & {
  id: string;
  notificationId: string;
  tokenId: string;
  token: string;
  ownerId: string;
  title: string;
  body: string;
  eventType: string;
  referenceType: string | null;
  referenceId: string | null;
  attempts: number;
};

type ExpoTicket = { status?: unknown; id?: unknown; details?: { error?: unknown } };
type ExpoResponse = { data?: ExpoTicket[] };
type EmailDelivery = RowDataPacket & {
  id: string;
  email: string;
  title: string;
  body: string;
  attempts: number;
};

const MAX_PUSH_ATTEMPTS = 8;
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

export function appointmentReminderWindow(hours: 4 | 24): { lowerOffsetMinutes: number; upperOffsetMinutes: number } {
  return { lowerOffsetMinutes: hours * 60 - 10, upperOffsetMinutes: hours * 60 + 5 };
}

export function appointmentReminderEventKey(appointmentId: string, slotId: string, hours: 4 | 24): string {
  return `appointment:${appointmentId}:slot:${slotId}:reminder:${hours}h`;
}

async function withTransaction<T>(operation: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Finds confirmed appointments in a bounded catch-up window; unique event keys make overlapping cron runs safe. */
export async function createDueAppointmentReminders(): Promise<number> {
  let created = 0;
  for (const hours of [24, 4] as const) {
    const keySuffix = `${hours}h`;
    const window = appointmentReminderWindow(hours);
    const [candidates] = await databasePool.execute<AppointmentReminder[]>(
      `SELECT CAST(a.id AS CHAR) AS id,CAST(a.owner_id AS CHAR) AS ownerId,
              CAST(a.pet_id AS CHAR) AS petId,CAST(a.slot_id AS CHAR) AS slotId,
              p.name AS petName,sv.name AS serviceName,s.starts_at AS startsAt
       FROM client_appointments a
       JOIN pets p ON p.id=a.pet_id
       JOIN users recipient ON recipient.id=a.owner_id AND recipient.is_active=1
       JOIN client_appointment_slots s ON s.id=a.slot_id
       JOIN client_services sv ON sv.id=s.service_id
       WHERE a.status='CONFIRMED' AND s.is_active=1
         AND s.starts_at>UTC_TIMESTAMP(3)
         AND s.starts_at>TIMESTAMPADD(MINUTE,?,UTC_TIMESTAMP(3))
         AND s.starts_at<=TIMESTAMPADD(MINUTE,?,UTC_TIMESTAMP(3))
         AND NOT EXISTS (
           SELECT 1 FROM client_notifications n
           WHERE n.event_key=CONCAT('appointment:',a.id,':slot:',a.slot_id,':reminder:',?)
         )
       ORDER BY s.starts_at,a.id LIMIT 250`,
      [window.lowerOffsetMinutes, window.upperOffsetMinutes, keySuffix],
    );

    for (const candidate of candidates) {
      const inserted = await withTransaction(async connection => {
        const [currentRows] = await connection.execute<AppointmentReminder[]>(
          `SELECT CAST(a.id AS CHAR) AS id,CAST(a.owner_id AS CHAR) AS ownerId,
                  CAST(a.pet_id AS CHAR) AS petId,CAST(a.slot_id AS CHAR) AS slotId,
                  p.name AS petName,sv.name AS serviceName,s.starts_at AS startsAt
           FROM client_appointments a
           JOIN pets p ON p.id=a.pet_id
           JOIN users recipient ON recipient.id=a.owner_id AND recipient.is_active=1
           JOIN client_appointment_slots s ON s.id=a.slot_id
           JOIN client_services sv ON sv.id=s.service_id
           WHERE a.id=? AND a.status='CONFIRMED' AND s.is_active=1
             AND s.starts_at>UTC_TIMESTAMP(3)
             AND s.starts_at>TIMESTAMPADD(MINUTE,?,UTC_TIMESTAMP(3))
             AND s.starts_at<=TIMESTAMPADD(MINUTE,?,UTC_TIMESTAMP(3))
           FOR UPDATE`,
          [candidate.id, window.lowerOffsetMinutes, window.upperOffsetMinutes],
        );
        const appointment = currentRows[0];
        if (!appointment) return false;
        const { date, time } = formatNotificationDateTime(appointment.startsAt);
        const shortName = String(appointment.petName);
        const service = String(appointment.serviceName);
        const title = hours === 24 ? 'Recordatorio de turno para mañana' : 'Recordatorio de turno en 4 horas';
        const body = hours === 24
          ? `Mañana tenés un turno de ${service} para ${shortName} el ${date} a las ${time}.`
          : `Tu turno de ${shortName} es dentro de 4 horas. Servicio: ${service}. Horario: ${time}.`;
        return createClientNotification(connection, {
          ownerId: String(appointment.ownerId),
          title,
          body,
          eventType: hours === 24 ? 'APPOINTMENT_REMINDER_24H' : 'APPOINTMENT_REMINDER_4H',
          eventKey: appointmentReminderEventKey(String(appointment.id), String(appointment.slotId), hours),
          referenceType: 'appointment',
          referenceId: String(appointment.id),
        });
      });
      if (inserted) created += 1;
    }
  }
  return created;
}

function retryDelaySeconds(attempts: number): number {
  return Math.min(60 * (2 ** Math.max(0, attempts - 1)), 1800);
}

function safeProviderCode(value: unknown): string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : 'PROVIDER_ERROR';
}

async function claimPushDeliveries(): Promise<PushDelivery[]> {
  return withTransaction(async connection => {
    const [deliveries] = await connection.execute<PushDelivery[]>(
      `SELECT CAST(d.id AS CHAR) AS id,CAST(n.id AS CHAR) AS notificationId,
              CAST(t.id AS CHAR) AS tokenId,t.expo_push_token AS token,
              CAST(n.owner_id AS CHAR) AS ownerId,n.title,n.body,n.event_type AS eventType,
              n.reference_type AS referenceType,CAST(n.reference_id AS CHAR) AS referenceId,d.attempts
       FROM client_notification_push_deliveries d
       JOIN client_notifications n ON n.id=d.notification_id
       JOIN client_push_tokens t ON t.id=d.push_token_id
       LEFT JOIN client_notification_preferences p ON p.user_id=n.owner_id
       WHERE t.revoked_at IS NULL AND t.user_id=n.owner_id AND COALESCE(p.push_enabled,1)=1
         AND (CASE WHEN n.event_type LIKE 'APPOINTMENT_REMINDER_%' THEN COALESCE(p.appointment_reminders_enabled,1)
                   WHEN n.event_type LIKE 'ORDER_%' OR n.event_type LIKE 'RESERVATION_%' THEN COALESCE(p.order_updates_enabled,1)
                   ELSE 1 END)=1
         AND ((d.status='PENDING' AND d.next_attempt_at<=UTC_TIMESTAMP(3))
           OR (d.status='SENDING' AND d.lease_expires_at<=UTC_TIMESTAMP(3)))
       ORDER BY d.id LIMIT 100 FOR UPDATE SKIP LOCKED`,
    );
    for (const delivery of deliveries) {
      await connection.execute(
        `UPDATE client_notification_push_deliveries
         SET status='SENDING',attempts=attempts+1,lease_expires_at=TIMESTAMPADD(MINUTE,4,UTC_TIMESTAMP(3))
         WHERE id=?`,
        [delivery.id],
      );
      delivery.attempts += 1;
    }
    return deliveries;
  });
}

async function updateFailedDelivery(delivery: PushDelivery, code: string, retryable: boolean): Promise<void> {
  const exhausted = delivery.attempts >= MAX_PUSH_ATTEMPTS;
  const status = retryable && !exhausted ? 'PENDING' : 'FAILED';
  const delay = retryDelaySeconds(delivery.attempts);
  await databasePool.execute<ResultSetHeader>(
    `UPDATE client_notification_push_deliveries
     SET status=?,last_error_code=?,next_attempt_at=TIMESTAMPADD(SECOND,?,UTC_TIMESTAMP(3)),lease_expires_at=NULL
     WHERE id=? AND status='SENDING'`,
    [status, code, delay, delivery.id],
  );
}

async function sendPushBatch(deliveries: PushDelivery[]): Promise<number> {
  if (!deliveries.length) return 0;
  const messages = deliveries.map(delivery => ({
    to: delivery.token,
    title: delivery.title,
    body: delivery.body,
    sound: 'default',
    channelId: 'petcare-notifications',
    data: {
      notificationId: delivery.notificationId,
      eventType: delivery.eventType,
      referenceType: delivery.referenceType,
      referenceId: delivery.referenceId,
    },
  }));
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  const accessToken = process.env.EXPO_PUSH_ACCESS_TOKEN?.trim();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    for (const delivery of deliveries) await updateFailedDelivery(delivery, 'NETWORK_ERROR', true);
    return 0;
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    for (const delivery of deliveries) await updateFailedDelivery(delivery, `HTTP_${response.status}`, retryable);
    return 0;
  }

  let result: ExpoResponse;
  try {
    result = await response.json() as ExpoResponse;
  } catch {
    for (const delivery of deliveries) await updateFailedDelivery(delivery, 'INVALID_RESPONSE', true);
    return 0;
  }
  if (!Array.isArray(result.data) || result.data.length !== deliveries.length) {
    for (const delivery of deliveries) await updateFailedDelivery(delivery, 'INVALID_RESPONSE', true);
    return 0;
  }

  let accepted = 0;
  for (const [index, delivery] of deliveries.entries()) {
    const ticket = result.data[index];
    if (ticket?.status === 'ok' && typeof ticket.id === 'string') {
      await databasePool.execute(
        `UPDATE client_notification_push_deliveries
         SET status='ACCEPTED',expo_ticket_id=?,lease_expires_at=NULL,last_error_code=NULL
         WHERE id=? AND status='SENDING'`,
        [ticket.id, delivery.id],
      );
      accepted += 1;
      continue;
    }
    const code = safeProviderCode(ticket?.details?.error);
    if (code === 'DeviceNotRegistered') {
      await databasePool.execute(
        `UPDATE client_push_tokens SET revoked_at=UTC_TIMESTAMP(3),updated_at=UTC_TIMESTAMP(3) WHERE id=?`,
        [delivery.tokenId],
      );
      await updateFailedDelivery(delivery, code, false);
    } else {
      await updateFailedDelivery(delivery, code, code === 'MessageRateExceeded' || code === 'PROVIDER_ERROR');
    }
  }
  return accepted;
}

async function checkPushReceipts(): Promise<number> {
  const [deliveries] = await databasePool.execute<Array<RowDataPacket & {
    id: string;
    tokenId: string;
    ticketId: string;
  }>>(
    `SELECT CAST(d.id AS CHAR) AS id,CAST(d.push_token_id AS CHAR) AS tokenId,d.expo_ticket_id AS ticketId
     FROM client_notification_push_deliveries d
     WHERE d.status='ACCEPTED' AND d.receipt_checked_at IS NULL
       AND d.updated_at<=TIMESTAMPADD(MINUTE,-15,UTC_TIMESTAMP(3))
     ORDER BY d.id LIMIT 100`,
  );
  if (!deliveries.length) return 0;
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  const accessToken = process.env.EXPO_PUSH_ACCESS_TOKEN?.trim();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response: Response;
  try {
    response = await fetch(EXPO_RECEIPTS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ids: deliveries.map(delivery => delivery.ticketId) }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { return 0; }
  if (!response.ok) return 0;

  let result: { data?: Record<string, ExpoTicket> };
  try { result = await response.json() as { data?: Record<string, ExpoTicket> }; }
  catch { return 0; }
  if (!result.data || typeof result.data !== 'object') return 0;

  let checked = 0;
  for (const delivery of deliveries) {
    const receipt = result.data[delivery.ticketId];
    if (!receipt) continue;
    const code = safeProviderCode(receipt.details?.error);
    if (receipt.status === 'ok') {
      await databasePool.execute(
        `UPDATE client_notification_push_deliveries
         SET status='DELIVERED',receipt_checked_at=UTC_TIMESTAMP(3),last_error_code=NULL
         WHERE id=? AND status='ACCEPTED'`,
        [delivery.id],
      );
    } else {
      if (code === 'DeviceNotRegistered') {
        await databasePool.execute(
          `UPDATE client_push_tokens SET revoked_at=UTC_TIMESTAMP(3),updated_at=UTC_TIMESTAMP(3) WHERE id=?`,
          [delivery.tokenId],
        );
      }
      await databasePool.execute(
        `UPDATE client_notification_push_deliveries
         SET status='FAILED',receipt_checked_at=UTC_TIMESTAMP(3),last_error_code=?
         WHERE id=? AND status='ACCEPTED'`,
        [code, delivery.id],
      );
    }
    checked += 1;
  }
  return checked;
}

async function claimEmailDeliveries(): Promise<EmailDelivery[]> {
  return withTransaction(async connection => {
    await connection.execute(
      `UPDATE client_notification_email_deliveries d
       JOIN client_notifications n ON n.id=d.notification_id
       JOIN users u ON u.id=n.owner_id
       SET d.status='FAILED',d.last_error_code='RECIPIENT_UNAVAILABLE',d.lease_expires_at=NULL
       WHERE d.status IN ('PENDING','SENDING') AND (u.is_active<>1 OR u.email_verified_at IS NULL)`,
    );
    const [deliveries] = await connection.execute<EmailDelivery[]>(
      `SELECT CAST(d.id AS CHAR) AS id,u.email,n.title,n.body,d.attempts
       FROM client_notification_email_deliveries d
       JOIN client_notifications n ON n.id=d.notification_id
       JOIN users u ON u.id=n.owner_id
       WHERE u.is_active=1 AND u.email_verified_at IS NOT NULL
         AND ((d.status='PENDING' AND d.next_attempt_at<=UTC_TIMESTAMP(3))
           OR (d.status='SENDING' AND d.lease_expires_at<=UTC_TIMESTAMP(3)))
       ORDER BY d.id LIMIT 5 FOR UPDATE SKIP LOCKED`,
    );
    for (const delivery of deliveries) {
      await connection.execute(
        `UPDATE client_notification_email_deliveries
         SET status='SENDING',attempts=attempts+1,lease_expires_at=TIMESTAMPADD(MINUTE,4,UTC_TIMESTAMP(3))
         WHERE id=?`,
        [delivery.id],
      );
      delivery.attempts += 1;
    }
    return deliveries;
  });
}

async function sendEmailBatch(deliveries: EmailDelivery[]): Promise<number> {
  const results = await Promise.all(deliveries.map(async delivery => {
    try {
      await sendClientNotificationEmail(String(delivery.email), String(delivery.title), String(delivery.body));
    } catch (error) {
      const code = error instanceof AppError ? error.code : 'DELIVERY_FAILED';
      await databasePool.execute(
        `UPDATE client_notification_email_deliveries
         SET status=?,last_error_code=?,next_attempt_at=TIMESTAMPADD(SECOND,?,UTC_TIMESTAMP(3)),lease_expires_at=NULL
         WHERE id=? AND status='SENDING'`,
        [delivery.attempts >= MAX_PUSH_ATTEMPTS ? 'FAILED' : 'PENDING', code, retryDelaySeconds(delivery.attempts), delivery.id],
      );
      return false;
    }
    await databasePool.execute(
      `UPDATE client_notification_email_deliveries
       SET status='SENT',lease_expires_at=NULL,last_error_code=NULL
       WHERE id=? AND status='SENDING'`,
      [delivery.id],
    );
    return true;
  }));
  return results.filter(Boolean).length;
}

export async function processNotificationJobs(): Promise<{ remindersCreated: number; pushesAccepted: number; receiptsChecked: number; emailsSent: number }> {
  const remindersCreated = await createDueAppointmentReminders();
  const receiptsChecked = await checkPushReceipts();
  const pushesAccepted = await sendPushBatch(await claimPushDeliveries());
  const emailsSent = await sendEmailBatch(await claimEmailDeliveries());
  return { remindersCreated, pushesAccepted, receiptsChecked, emailsSent };
}
