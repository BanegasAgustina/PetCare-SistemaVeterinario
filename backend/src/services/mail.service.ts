/** Envía códigos reales mediante SMTP; nunca imprime código, token ni credenciales. */
import nodemailer from 'nodemailer';
import { getMailConfiguration } from '../config/mail';
import { AppError } from '../utils/app-error';
import { registerDiagnosticFailure } from '../utils/register-diagnostics';

/** Envía el enlace de un uso ya preparado por el servicio; aceptación SMTP no asegura entrega en Inbox. */
export async function sendInvitationEmail(email: string, url: string): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const result = await transport.sendMail({ from: { name: 'PetCare', address: from }, to: email,
      subject: 'Invitación para formar parte de PetCare',
      text: `Te damos la bienvenida a PetCare.\n\nAbrí este enlace para configurar tu contraseña y verificar tu correo:\n${url}\n\nEl enlace vence en 24 horas y puede usarse una sola vez. No lo compartas. Si no esperabas esta invitación, ignorá este correo.`,
      html: `<div style="margin:0;background:#f3f7f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18382d"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce8e2;border-radius:20px;overflow:hidden"><div style="background:#176b52;padding:22px 28px;color:#ffffff;font-size:22px;font-weight:700">PetCare</div><div style="padding:28px"><p style="font-size:18px;font-weight:700;margin:0 0 12px">Te damos la bienvenida</p><p style="line-height:1.6;margin:0 0 22px">Recibiste una invitación para formar parte de PetCare. Configurá tu contraseña para verificar el correo y activar tu cuenta.</p><p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#176b52;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:12px">Activar mi cuenta</a></p><p style="font-size:13px;line-height:1.6;color:#5b7067;margin:0">El enlace vence en 24 horas y puede usarse una sola vez. No lo compartas. Si no esperabas esta invitación, ignorá este correo.</p></div></div></div>` });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch { throw new AppError('EMAIL_DELIVERY_FAILED',503,'No pudimos enviar la invitación.'); }
  finally { transport.close(); }
}

/** Envía un código real sin logs ni acceso a archivos/URLs externos; los límites viven en verificación. */
export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const result = await transport.sendMail({ from: { name: 'PetCare', address: from }, to: email,
      subject: 'Verificá tu correo en PetCare',
      text: `Tu código de verificación de PetCare es: ${code}\n\nVence en 10 minutos y solo puede usarse una vez. No lo compartas. Si no solicitaste una cuenta, ignorá este correo.` });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch (error) {
    registerDiagnosticFailure(error);
    throw new AppError('EMAIL_DELIVERY_FAILED', 503, 'No pudimos enviar el código. Intentá reenviarlo.');
  } finally { transport.close(); }
}

/** Envía enlace de recuperación; el token solo viaja en el enlace y no se registra. */
export async function sendPasswordResetEmail(email: string, url: string): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const result = await transport.sendMail({ from: { name: 'PetCare', address: from }, to: email,
      subject: 'Restablecé tu contraseña de PetCare',
      text: `Abrí este enlace para elegir una contraseña nueva:\n${url}\n\nVence en 30 minutos y puede usarse una sola vez. Si no solicitaste este cambio, ignorá este correo.` });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch { throw new AppError('EMAIL_DELIVERY_FAILED', 503, 'No pudimos enviar el correo. Intentá nuevamente más tarde.'); }
  finally { transport.close(); }
}

/** Sends only the already-sanitized title/body persisted with a client notification. */
export async function sendClientNotificationEmail(email: string, title: string, body: string): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const result = await transport.sendMail({
      from: { name: 'PetCare', address: from },
      to: email,
      subject: `PetCare: ${title}`,
      text: `${body}\n\nIngresá a PetCare para consultar tus notificaciones.`,
    });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch {
    throw new AppError('EMAIL_DELIVERY_FAILED', 503, 'No pudimos enviar la notificación por correo.');
  } finally { transport.close(); }
}
