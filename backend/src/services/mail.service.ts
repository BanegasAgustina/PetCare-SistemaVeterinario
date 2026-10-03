/** Envía códigos reales mediante SMTP; nunca imprime código, token ni credenciales. */
import nodemailer from 'nodemailer';
import { getMailConfiguration } from '../config/mail';
import { AppError } from '../utils/app-error';
import { registerDiagnosticFailure } from '../utils/register-diagnostics';

export async function sendInvitationEmail(email: string, url: string): Promise<void> {
  const { from, ...configuration } = getMailConfiguration();
  const transport = nodemailer.createTransport({ ...configuration, connectionTimeout: 5000, greetingTimeout: 5000,
    socketTimeout: 5000, dnsTimeout: 5000, logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true });
  try {
    const result = await transport.sendMail({ from: { name: 'PetCare', address: from }, to: email,
      subject: 'Configurá tu cuenta de PetCare',
      text: `Abrí este enlace para configurar tu contraseña y verificar tu correo:\n${url}\n\nVence en 24 horas y puede usarse una sola vez. No lo compartas. Si no esperabas este correo, ignoralo.` });
    if (!result.accepted.length) throw new Error('Destinatario no aceptado');
  } catch { throw new AppError('EMAIL_DELIVERY_FAILED',503,'No pudimos enviar la invitación.'); }
  finally { transport.close(); }
}

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
