/**
 * ARCHIVO: mail.service.ts
 * UBICACIÓN: backend/src/services/mail.service.ts
 * FUNCIÓN: Envío SMTP de invitaciones, verificación, recuperación de contraseña y notificaciones.
 * RESPONSABILIDAD: Obtiene configuración segura, crea transporte con límites de tiempo, construye contenido de texto/HTML, verifica aceptación y traduce fallos a errores controlados.
 * CONEXIONES: Importa: backend/src/config/mail.ts, backend/src/utils/app-error.ts, backend/src/utils/register-diagnostics.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/notifications.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: Servicios de invitación, verificación, recuperación y notificaciones → mail.service → config/mail.ts y Nodemailer/SMTP.
 * IMPORTANCIA: Aísla el transporte de correo y evita que los servicios de dominio dependan directamente de Nodemailer.
 */
/** Envía códigos reales mediante SMTP; nunca imprime código, token ni credenciales. */
import nodemailer from 'nodemailer';
import { getMailConfiguration } from '../config/mail';
import { AppError } from '../utils/app-error';
import { registerDiagnosticFailure } from '../utils/register-diagnostics';

/** Envía el enlace de un uso ya preparado por el servicio; aceptación SMTP no asegura entrega en Inbox. */
/** Envía el enlace de invitación con texto y HTML escapado; cierra transporte y normaliza fallos SMTP. */
export async function sendInvitationEmail(email: string, url: string, context?: { firstName: string; petName?: string }): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const greeting=context?.firstName?`Hola, ${escapeHtml(context.firstName)}`:'Te damos la bienvenida';
    const subject=context?.petName?'Invitación a PetCare — Tu mascota ya fue registrada':'Invitación para formar parte de PetCare';
    const text=context?.petName
      ?`Hola, ${context.firstName}:\n\nDesde nuestra veterinaria registramos a tu mascota ${context.petName} en PetCare.\n\nTe invitamos a crear tu cuenta para consultar sus datos, gestionar turnos y acceder a las funcionalidades disponibles para clientes.\n\nPara completar tu registro, ingresá desde el siguiente enlace:\n${url}\n\nUna vez que completes el registro, tu mascota aparecerá automáticamente en la sección "Mis mascotas".\n\n¡Te esperamos en PetCare!\n\nEl enlace vence en 24 horas y puede usarse una sola vez.`
      :`Te damos la bienvenida a PetCare.\n\nAbrí este enlace para configurar tu contraseña y verificar tu correo:\n${url}\n\nEl enlace vence en 24 horas y puede usarse una sola vez. No lo compartas. Si no esperabas esta invitación, ignorá este correo.`;
    const paragraph=context?.petName
      ?`Desde nuestra veterinaria registramos a tu mascota <strong>${escapeHtml(context.petName)}</strong> en PetCare. Te invitamos a crear tu cuenta para consultar sus datos, gestionar turnos y acceder a las funcionalidades disponibles para clientes. Una vez que completes el registro, tu mascota aparecerá automáticamente en la sección “Mis mascotas”.`
      :'Recibiste una invitación para formar parte de PetCare. Configurá tu contraseña para verificar el correo y activar tu cuenta.';
    const result = await transport.sendMail({ from: { name: 'PetCare', address: from }, to: email, subject, text,
      html: `<div style="margin:0;background:#f3f7f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18382d"><div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dce8e2;border-radius:20px;overflow:hidden"><div style="background:#176b52;padding:22px 28px;color:#ffffff;font-size:22px;font-weight:700">PetCare</div><div style="padding:28px"><p style="font-size:18px;font-weight:700;margin:0 0 12px">${greeting}</p><p style="line-height:1.6;margin:0 0 22px">${paragraph}</p><p style="margin:0 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#176b52;color:#ffffff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:12px">Crear mi cuenta</a></p><p style="font-size:13px;line-height:1.6;color:#5b7067;margin:0">El enlace vence en 24 horas y puede usarse una sola vez. No lo compartas. Si no esperabas esta invitación, ignorá este correo.</p></div></div></div>` });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch { throw new AppError('EMAIL_DELIVERY_FAILED',503,'No pudimos enviar la invitación.'); }
  finally { transport.close(); }
}

/** Escapa caracteres HTML especiales para insertar nombres y enlaces como texto seguro en el mensaje. */
function escapeHtml(value:string):string{return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));}

/** Envía un código real sin logs ni acceso a archivos/URLs externos; los límites viven en verificación. */
/** Envía el código de verificación sin exponerlo en logs y registra diagnóstico sanitizado si SMTP falla. */
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
/** Envía el enlace de recuperación de un solo uso y presenta errores SMTP con un mensaje controlado. */
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

/** Envía únicamente el título y el cuerpo ya sanitizados que se guardaron con la notificación. */
/** Envía por correo el título y cuerpo de notificación ya persistidos; el proceso de reintentos pertenece a notifications.service. */
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
