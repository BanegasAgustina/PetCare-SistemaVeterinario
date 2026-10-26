import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
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

type EmailDelivery = RowDataPacket & {
  id: string;
  email: string;
  title: string;
  body: string;
  attempts: number;
};

const MAX_DELIVERY_ATTEMPTS = 8;

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

export function retryDelaySeconds(attempts: number): number {
  return Math.min(60 * (2 ** Math.max(0, attempts - 1)), 1800);
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
        [delivery.attempts >= MAX_DELIVERY_ATTEMPTS ? 'FAILED' : 'PENDING', code, retryDelaySeconds(delivery.attempts), delivery.id],
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

export type NotificationJobTasks = {
  createDueAppointmentReminders: () => Promise<number>;
  claimEmailDeliveries: () => Promise<EmailDelivery[]>;
  sendEmailBatch: (deliveries: EmailDelivery[]) => Promise<number>;
};

export async function runNotificationJobTasks(tasks: NotificationJobTasks): Promise<{ remindersCreated: number; emailsSent: number }> {
  const remindersCreated = await tasks.createDueAppointmentReminders();
  const emailsSent = await tasks.sendEmailBatch(await tasks.claimEmailDeliveries());
  return { remindersCreated, emailsSent };
}

export async function processNotificationJobs(): Promise<{ remindersCreated: number; emailsSent: number }> {
  return runNotificationJobTasks({
    createDueAppointmentReminders,
    claimEmailDeliveries,
    sendEmailBatch,
  });
}
