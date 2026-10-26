import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getMailConfiguration } from '../config/mail';
import { AppError } from '../utils/app-error';

export type ClientNotificationInput = {
  ownerId: string;
  title: string;
  body: string;
  eventType: string;
  eventKey?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
};

/** Persist an in-app notice as the source of truth and queue configured email delivery. */
export async function createClientNotification(connection: PoolConnection, notification: ClientNotificationInput): Promise<boolean> {
  let inserted: ResultSetHeader;
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO client_notifications(owner_id,title,body,event_type,reference_type,reference_id,event_key)
       VALUES (?,?,?,?,?,?,?)`,
      [notification.ownerId, notification.title, notification.body, notification.eventType,
        notification.referenceType ?? null, notification.referenceId ?? null, notification.eventKey ?? null],
    );
    inserted = result;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') return false;
    throw error;
  }
  if (inserted.affectedRows === 0) return false;

  const [idRows] = await connection.execute<Array<RowDataPacket & { id: string }>>(
    'SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id',
  );
  const notificationId = idRows[0]?.id;
  if (!notificationId) throw new Error('No se pudo recuperar la notificación recién creada.');
  if (['APPOINTMENT_CONFIRMED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_CANCELLED',
    'CLINICAL_UPDATE', 'RESERVATION_APPROVED', 'RESERVATION_REJECTED'].includes(notification.eventType)) {
    try {
      getMailConfiguration();
      await connection.execute(
        `INSERT INTO client_notification_email_deliveries(notification_id)
         SELECT ? FROM users WHERE id=? AND is_active=1 AND email_verified_at IS NOT NULL`,
        [notificationId, notification.ownerId],
      );
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== 'EMAIL_UNAVAILABLE') throw error;
      console.error(JSON.stringify({ event: 'notification_email_not_configured' }));
    }
  }
  return true;
}
